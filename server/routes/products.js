const express = require("express");
const router = express.Router();
const multer = require("multer");
const Product = require("../models/Product");
const { requireAdmin } = require("../middleware/auth");
const { validateProduct } = require("../middleware/validateProduct");
const { validateImage } = require("../utils/imageValidator");
const imageStore = require("../services/imageStore");

// Configure multer for memory storage (5 MiB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

/**
 * Build a payload from the request body for create/update.
 * Does NOT touch isArchived/archivedAt — those are handled by dedicated endpoints.
 */
function productPayload(body) {
  const payload = {};
  const stringFields = ["name", "description", "category", "type", "image"];

  for (const field of stringFields) {
    if (body[field] !== undefined)
      payload[field] = String(body[field] || "").trim();
  }

  if (body.price !== undefined) payload.price = Number(body.price) || 0;
  if (body.meta !== undefined)
    payload.meta = body.meta && typeof body.meta === "object" ? body.meta : {};
  if (body.isFeatured !== undefined) payload.isFeatured = !!body.isFeatured;
  if (body.featuredOrder !== undefined)
    payload.featuredOrder = Number(body.featuredOrder) || 999;

  payload.updatedAt = new Date();
  return payload;
}

/**
 * Serialize a product record for API response.
 * Returns null for absent fields, null for absent meta numeric values,
 * empty string for absent ingredients.
 */
function serialize(doc) {
  const meta = doc.meta || {};
  return {
    productId: doc.productId ?? null,
    productCode: doc.productCode ?? null,
    name: doc.name ?? null,
    description: doc.description ?? null,
    category: doc.category ?? null,
    type: doc.type ?? null,
    price: doc.price ?? null,
    image: doc.image ?? null,
    featuredImage: doc.featuredImage ?? null,
    meta: {
      calories: meta.calories ?? null,
      protein: meta.protein ?? null,
      carbs: meta.carbs ?? null,
      fat: meta.fat ?? null,
      fiber: meta.fiber ?? null,
      sugar: meta.sugar ?? null,
      ingredients: meta.ingredients ?? "",
    },
    isFeatured: doc.isFeatured ?? null,
    featuredOrder: doc.featuredOrder ?? null,
    isArchived: doc.isArchived ?? null,
    isOutOfStock: doc.isOutOfStock ?? false,
    archivedAt: doc.archivedAt ?? null,
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,
  };
}

// ─── GET /api/products ──────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const isAdmin = req.user && req.user.role === "admin";
    const includeArchived =
      String(req.query.includeArchived || "").toLowerCase() === "true";
    const featuredOnly =
      String(req.query.featured || "").toLowerCase() === "true";

    const query = {};
    // includeArchived=true only effective for admin role
    if (!includeArchived || !isAdmin) {
      query.isArchived = { $ne: true };
    }
    if (featuredOnly) query.isFeatured = true;

    let productsQuery = Product.find(query);

    if (featuredOnly) {
      productsQuery = productsQuery.sort({ featuredOrder: 1, name: 1 });
    } else {
      productsQuery = productsQuery.sort({ category: 1, name: 1 });
    }

    // Enforce 1000-record response cap
    productsQuery = productsQuery.limit(1000);

    const products = await productsQuery.lean();
    res.json(products.map(serialize));
  } catch (err) {
    console.error("GET /api/products error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── GET /api/products/images/gallery ────────────────────────────────────────────
router.get("/images/gallery", requireAdmin, async (req, res) => {
  try {
    const ProductImage = require("../models/ProductImage");
    const images = await ProductImage.find({}).select("-data").lean();
    const productIds = images.map((img) => img.productId);
    const products = await Product.find({
      productId: { $in: productIds },
    }).lean();
    const productMap = {};
    products.forEach((p) => {
      productMap[p.productId] = {
        name: p.name,
        category: p.category || "",
        type: p.type || "Vegetarian",
      };
    });

    const gallery = images.map((img) => ({
      productId: img.productId,
      productName:
        img.productName ||
        (productMap[img.productId] && productMap[img.productId].name) ||
        "Unknown",
      category:
        (productMap[img.productId] && productMap[img.productId].category) || "",
      type:
        (productMap[img.productId] && productMap[img.productId].type) ||
        "Vegetarian",
      contentType: img.contentType,
      size: img.size,
      checksum: img.checksum,
      createdAt: img.createdAt,
      updatedAt: img.updatedAt,
      imageUrl: `/api/products/${img.productId}/image`,
    }));

    res.json(gallery);
  } catch (err) {
    console.error("GET /api/products/images/gallery error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── POST /api/products ─────────────────────────────────────────────────────────
router.post(
  "/",
  requireAdmin,
  upload.single("image"),
  validateProduct,
  async (req, res) => {
    try {
      const body = req.body;
      const file = req.file;

      // Reject if both URL and file supplied
      if (file && body.image && String(body.image).trim().length > 0) {
        return res.status(400).json({
          error: "Provide either an image URL or an uploaded file, not both",
        });
      }

      // Build payload from body (excluding image for now if file is present)
      const payload = productPayload(body);

      // If file uploaded, validate and defer storing until we have productId
      if (file) {
        const validation = validateImage(file.buffer, file.mimetype);
        if (!validation.valid) {
          return res
            .status(validation.statusCode)
            .json({ error: validation.error });
        }
        // Remove any image field from payload since we'll set it after saving
        delete payload.image;
      }

      // Create product first to get the generated productId
      const product = await Product.create({
        category: "",
        type: "Vegetarian",
        featuredOrder: 999,
        isFeatured: false,
        isArchived: false,
        archivedAt: null,
        ...payload,
        createdAt: new Date(),
        _createdBy: req.user
          ? {
              adminId: req.user.adminId || req.user.id,
              name: req.user.name || "",
              at: new Date().toISOString(),
            }
          : undefined,
      });

      // If file was uploaded, save image using the generated productId then update the record
      if (file) {
        const { imageRef } = await imageStore.save(
          product.productId,
          file.buffer,
          file.mimetype,
        );
        product.image = imageRef;
        await product.save();
      }

      res.status(201).json(serialize(product.toObject()));
    } catch (err) {
      console.error("POST /api/products error:", err.message);
      if (err && err.code === 11000)
        return res.status(409).json({ error: "Product already exists" });
      res.status(500).json({ error: "Server error" });
    }
  },
);

// ─── PUT /api/products/:productId ───────────────────────────────────────────────
router.put(
  "/:productId",
  requireAdmin,
  upload.single("image"),
  validateProduct,
  async (req, res) => {
    try {
      const product = await Product.findOne({
        productId: String(req.params.productId),
      });
      if (!product) return res.status(404).json({ error: "Product not found" });

      const body = req.body;
      const file = req.file;

      // Reject if both URL and file supplied
      if (file && body.image && String(body.image).trim().length > 0) {
        return res.status(400).json({
          error: "Provide either an image URL or an uploaded file, not both",
        });
      }

      // Handle removeImage flag
      const removeImage =
        String(body.removeImage || "").toLowerCase() === "true";

      if (removeImage) {
        await imageStore.remove(product.productId);
        product.image = "";
      } else if (file) {
        // File replacement: validate new file, store it, delete old stored image
        const validation = validateImage(file.buffer, file.mimetype);
        if (!validation.valid) {
          return res
            .status(validation.statusCode)
            .json({ error: validation.error });
        }
        // Remove old stored image
        await imageStore.remove(product.productId);
        // Store new image
        const { imageRef } = await imageStore.save(
          product.productId,
          file.buffer,
          file.mimetype,
        );
        product.image = imageRef;
      } else if (
        body.image !== undefined &&
        String(body.image).trim().length > 0
      ) {
        // URL replacement: if product had stored image, delete it
        const currentImage = product.image || "";
        if (
          currentImage.includes(`/api/products/${product.productId}/image`) ||
          product.imageStoragePath
        ) {
          await imageStore.remove(product.productId);
        }
        // URL will be set by productPayload below
      }

      // Build the update payload; skip image field if handled above
      const payload = productPayload(body);

      // Don't overwrite image if it was handled by file upload or removeImage
      if (file || removeImage) {
        delete payload.image;
      }

      // Preserve immutable fields
      delete payload.productId;
      delete payload.productCode;
      delete payload.createdAt;
      delete payload.isArchived;
      delete payload.archivedAt;

      Object.assign(product, payload);
      await product.save();
      res.json(serialize(product.toObject()));
    } catch (err) {
      console.error("PUT /api/products/:productId error:", err.message);
      if (err && err.code === 11000)
        return res.status(409).json({ error: "Product already exists" });
      res.status(500).json({ error: "Server error" });
    }
  },
);

// ─── PUT /api/products/:productId/archive ───────────────────────────────────────
router.put("/:productId/archive", requireAdmin, async (req, res) => {
  try {
    const product = await Product.findOne({
      productId: String(req.params.productId),
    });
    if (!product) return res.status(404).json({ error: "Product not found" });

    // Set isArchived=true; only set archivedAt if not already archived
    if (!product.isArchived) {
      product.archivedAt = new Date();
    }
    product.isArchived = true;
    product.updatedAt = new Date();
    await product.save();

    res.json(serialize(product.toObject()));
  } catch (err) {
    console.error("PUT /api/products/:productId/archive error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── PUT /api/products/:productId/restore ───────────────────────────────────────
router.put("/:productId/restore", requireAdmin, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { productId: String(req.params.productId) },
      { $set: { isArchived: false, archivedAt: null, updatedAt: new Date() } },
      { new: true },
    ).lean();
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(serialize(product));
  } catch (err) {
    console.error("PUT /api/products/:productId/restore error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── PUT /api/products/:productId/stock ─────────────────────────────────────────
router.put("/:productId/stock", requireAdmin, async (req, res) => {
  try {
    const product = await Product.findOne({
      productId: String(req.params.productId),
    });
    if (!product) return res.status(404).json({ error: "Product not found" });
    product.isOutOfStock = !product.isOutOfStock;
    product.updatedAt = new Date();
    await product.save();
    res.json(serialize(product.toObject()));
  } catch (err) {
    console.error("PUT /api/products/:productId/stock error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── GET /api/products/:productId/image ─────────────────────────────────────────
router.get("/:productId/image", async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId format: exactly 12 digits
    if (!/^\d{12}$/.test(productId)) {
      return res
        .status(400)
        .json({ error: "productId must be exactly 12 digits" });
    }

    // Check If-None-Match for conditional GET
    const ifNoneMatch = req.headers["if-none-match"];

    // Get metadata first to check ETag for conditional request
    const metadata = await imageStore.getMetadata(productId);
    if (!metadata) {
      return res.status(404).json({ error: "Image not found" });
    }

    const etag = `"${metadata.etag}"`;

    if (ifNoneMatch && ifNoneMatch === etag) {
      return res.status(304).end();
    }

    // Fetch full image data
    const imageData = await imageStore.get(productId);
    if (!imageData) {
      return res.status(404).json({ error: "Image not found" });
    }

    res.set("Content-Type", imageData.contentType);
    res.set("Content-Length", String(imageData.size));
    res.set("ETag", etag);
    res.set("Cache-Control", "max-age=86400");
    res.status(200).send(imageData.buffer);
  } catch (err) {
    console.error("GET /api/products/:productId/image error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── HEAD /api/products/:productId/image ────────────────────────────────────────
router.head("/:productId/image", async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId format: exactly 12 digits
    if (!/^\d{12}$/.test(productId)) {
      return res.status(400).end();
    }

    const metadata = await imageStore.getMetadata(productId);
    if (!metadata) {
      return res.status(404).end();
    }

    const etag = `"${metadata.etag}"`;

    res.set("Content-Type", metadata.contentType);
    res.set("Content-Length", String(metadata.size));
    res.set("ETag", etag);
    res.set("Cache-Control", "max-age=86400");
    res.status(200).end();
  } catch (err) {
    console.error("HEAD /api/products/:productId/image error:", err.message);
    res.status(500).end();
  }
});

// ─── DELETE /api/products/:productId/image ───────────────────────────────────────
router.delete("/:productId/image", requireAdmin, async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId format: exactly 12 digits
    if (!/^\d{12}$/.test(productId)) {
      return res
        .status(400)
        .json({ error: "productId must be exactly 12 digits" });
    }

    const product = await Product.findOne({ productId });
    if (!product) return res.status(404).json({ error: "Product not found" });

    await imageStore.remove(productId);
    product.image = "";
    product.updatedAt = new Date();
    await product.save();

    res.json({ message: "Image removed" });
  } catch (err) {
    console.error("DELETE /api/products/:productId/image error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── DELETE /api/products/:productId/permanent ──────────────────────────────────
router.delete("/:productId/permanent", requireAdmin, async (req, res) => {
  try {
    const product = await Product.findOne({
      productId: String(req.params.productId),
    });
    if (!product) return res.status(404).json({ error: "Product not found" });

    // Delete image from ProductImage collection
    await imageStore.remove(product.productId);

    // Delete the product
    await Product.deleteOne({ productId: product.productId });

    res.json({ message: "Product deleted permanently" });
  } catch (err) {
    console.error(
      "DELETE /api/products/:productId/permanent error:",
      err.message,
    );
    res.status(500).json({ error: "Server error" });
  }
});

// ─── DELETE /api/products/:productId (archive via DELETE — legacy compat) ────────
router.delete("/:productId", requireAdmin, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { productId: String(req.params.productId) },
      {
        $set: {
          isArchived: true,
          archivedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { new: true },
    ).lean();
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(serialize(product));
  } catch (err) {
    console.error("DELETE /api/products/:productId error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

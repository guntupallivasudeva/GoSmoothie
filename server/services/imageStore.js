"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const ProductImage = require("../models/ProductImage");
const Product = require("../models/Product");

const UPLOADS_DIR = path.join(__dirname, "..", "images", "uploads");

const CONTENT_TYPE_TO_EXT = {
  "image/jpeg": ".jpeg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

/**
 * Ensure the uploads directory exists.
 */
function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

/**
 * Compute SHA-256 hex digest of a buffer.
 */
function computeChecksum(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Generate a unique filename in the uploads directory, handling collisions
 * with an incrementing numeric suffix.
 */
function getUniqueFilename(productId, contentType) {
  const ext = CONTENT_TYPE_TO_EXT[contentType] || ".bin";
  const timestamp = Date.now();
  let filename = `${productId}-${timestamp}${ext}`;
  let filePath = path.join(UPLOADS_DIR, filename);
  let suffix = 1;

  while (fs.existsSync(filePath)) {
    filename = `${productId}-${timestamp}-${suffix}${ext}`;
    filePath = path.join(UPLOADS_DIR, filename);
    suffix++;
  }

  return { filename, filePath };
}

/**
 * Save image data for a product.
 * Stores in ProductImage collection (MongoDB).
 * On DB failure, falls back to writing to disk.
 *
 * @param {string} productId
 * @param {Buffer} buffer
 * @param {string} contentType
 * @returns {{ imageRef: string, storagePath: string, fallback: boolean }}
 */
async function save(productId, buffer, contentType) {
  const checksum = computeChecksum(buffer);
  const size = buffer.length;

  try {
    // Get product name for the image record
    const product = await Product.findOne({ productId }).select("name").lean();
    const productName = product ? product.name : null;

    // Upsert to ProductImage collection (unique by productId replaces existing)
    await ProductImage.findOneAndUpdate(
      { productId },
      {
        productId,
        productName,
        data: buffer,
        contentType,
        size,
        checksum,
        updatedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const imageRef = `/api/products/${productId}/image`;

    // Update product image field to use the API endpoint
    await Product.updateOne(
      { productId },
      {
        $set: {
          image: `/api/products/${productId}/image`,
          imageStoragePath: null,
          imageContentType: null,
          imageSize: null,
        },
      },
    );

    return { imageRef, storagePath: "database", fallback: false };
  } catch (dbError) {
    // Fallback: write to disk
    ensureUploadsDir();
    const { filename, filePath } = getUniqueFilename(productId, contentType);

    fs.writeFileSync(filePath, buffer);

    const storagePath = `/server/images/uploads/${filename}`;
    const imageRef = storagePath;

    // Update product with disk fallback metadata
    await Product.updateOne(
      { productId },
      {
        $set: {
          imageStoragePath: storagePath,
          imageContentType: contentType,
          imageSize: size,
        },
      },
    );

    console.error(
      `[ImageStore] DB write failed for product ${productId}, fell back to disk: ${dbError.message}`,
    );

    return { imageRef, storagePath, fallback: true };
  }
}

/**
 * Remove image data for a product.
 * Deletes from ProductImage collection AND any corresponding disk file.
 *
 * @param {string} productId
 */
async function remove(productId) {
  // Delete from ProductImage collection
  await ProductImage.deleteOne({ productId });

  // Check Product record for disk file path and delete if present
  const product = await Product.findOne({ productId }).lean();
  if (product && product.imageStoragePath) {
    const diskPath = path.join(__dirname, "..", "..", product.imageStoragePath);
    if (fs.existsSync(diskPath)) {
      fs.unlinkSync(diskPath);
    }
  }

  // Clear disk metadata on product
  await Product.updateOne(
    { productId },
    {
      $set: {
        imageStoragePath: null,
        imageContentType: null,
        imageSize: null,
      },
    },
  );
}

/**
 * Get image data for a product.
 * Fetches from ProductImage collection first; if not found,
 * checks Product record for imageStoragePath and reads from disk.
 * Verifies checksum on read; returns null on mismatch.
 *
 * @param {string} productId
 * @returns {{ buffer: Buffer, contentType: string, size: number, checksum: string, etag: string } | null}
 */
async function get(productId) {
  // Try ProductImage collection first
  const imageDoc = await ProductImage.findOne({ productId });
  if (imageDoc) {
    const storedChecksum = imageDoc.checksum;
    const recomputedChecksum = computeChecksum(imageDoc.data);

    if (recomputedChecksum !== storedChecksum) {
      console.error(
        `[ImageStore] Checksum mismatch for product ${productId} in database`,
      );
      return null;
    }

    return {
      buffer: imageDoc.data,
      contentType: imageDoc.contentType,
      size: imageDoc.size,
      checksum: storedChecksum,
      etag: storedChecksum,
    };
  }

  // Fall back to disk file via Product record
  const product = await Product.findOne({ productId }).lean();
  if (!product || !product.imageStoragePath) {
    return null;
  }

  const diskPath = path.join(__dirname, "..", "..", product.imageStoragePath);
  if (!fs.existsSync(diskPath)) {
    return null;
  }

  const buffer = fs.readFileSync(diskPath);
  const checksum = computeChecksum(buffer);
  const contentType = product.imageContentType || "application/octet-stream";
  const size = buffer.length;

  return {
    buffer,
    contentType,
    size,
    checksum,
    etag: checksum,
  };
}

/**
 * Get image metadata without loading the bytes.
 *
 * @param {string} productId
 * @returns {{ contentType: string, size: number, checksum: string, etag: string } | null}
 */
async function getMetadata(productId) {
  // Try ProductImage collection first
  const imageDoc = await ProductImage.findOne({ productId })
    .select("-data")
    .lean();
  if (imageDoc) {
    return {
      contentType: imageDoc.contentType,
      size: imageDoc.size,
      checksum: imageDoc.checksum,
      etag: imageDoc.checksum,
    };
  }

  // Fall back to disk file via Product record
  const product = await Product.findOne({ productId }).lean();
  if (!product || !product.imageStoragePath) {
    return null;
  }

  const diskPath = path.join(__dirname, "..", "..", product.imageStoragePath);
  if (!fs.existsSync(diskPath)) {
    return null;
  }

  const stats = fs.statSync(diskPath);
  const buffer = fs.readFileSync(diskPath);
  const checksum = computeChecksum(buffer);

  return {
    contentType: product.imageContentType || "application/octet-stream",
    size: stats.size,
    checksum,
    etag: checksum,
  };
}

/**
 * Get image data for a product WITHOUT checksum verification.
 * Much faster than get() since it skips SHA-256 recomputation.
 * Use when serving images to end users (ETag handles cache invalidation).
 *
 * @param {string} productId
 * @returns {{ buffer: Buffer, contentType: string, size: number } | null}
 */
async function getFast(productId) {
  // Try ProductImage collection first
  const imageDoc = await ProductImage.findOne({ productId });
  if (imageDoc) {
    return {
      buffer: imageDoc.data,
      contentType: imageDoc.contentType,
      size: imageDoc.size,
    };
  }

  // Fall back to disk file via Product record
  const product = await Product.findOne({ productId }).lean();
  if (!product || !product.imageStoragePath) {
    return null;
  }

  const diskPath = path.join(__dirname, "..", "..", product.imageStoragePath);
  if (!fs.existsSync(diskPath)) {
    return null;
  }

  const buffer = fs.readFileSync(diskPath);
  const contentType = product.imageContentType || "application/octet-stream";

  return {
    buffer,
    contentType,
    size: buffer.length,
  };
}

module.exports = {
  save,
  remove,
  get,
  getFast,
  getMetadata,
};

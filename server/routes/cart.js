const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Cart = require("../models/Cart");
const {
  generateUniqueNumericId,
  isExactNumericId,
} = require("../utils/idGenerator");

async function resolveUserForClient(req, providedClientId) {
  if (req.user && req.user.id) {
    return await User.findOne({ userId: String(req.user.id) });
  }
  if (providedClientId && providedClientId.startsWith("u_")) {
    return await User.findOne({ userId: providedClientId.slice(2) });
  }
  if (providedClientId) {
    let anon = await User.findOne({ clientToken: providedClientId });
    if (anon) return anon;
    return await User.create({
      name: "Anonymous",
      email: `anon+${Date.now()}@local`,
      passwordHash: "ANON",
      isAnonymous: true,
      clientToken: providedClientId,
    });
  }
  return null;
}

// Locates an existing line for the same product.
//
// The naive form of this check was:
//   (c.productId || "") === (productId || "") || (c.productName || "") === (productName || "")
// Clients add items by name only, so productId is empty on both sides and
// "" === "" matched the FIRST line in the cart -- every distinct product
// collapsed into one line. Only compare ids when both are actually present,
// and otherwise fall back to a name comparison.
function findCartLineIndex(carts, { productId, productName }) {
  const incomingId = String(productId || "").trim();
  const incomingName = String(productName || "")
    .trim()
    .toLowerCase();

  return carts.findIndex((c) => {
    const existingId = String(c.productId || "").trim();
    if (incomingId && existingId) return existingId === incomingId;
    if (!incomingName) return false;
    return (
      String(c.productName || "")
        .trim()
        .toLowerCase() === incomingName
    );
  });
}

function serializeCartItem(item) {
  return {
    cartId: item.cartId,
    id: item.cartId,
    productId: item.productId,
    productName: item.productName,
    name: item.productName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    price: item.unitPrice,
    subtotal: item.subtotal,
    imageUrl: item.imageUrl,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    userId: item.userId,
  };
}

router.get("/", async (req, res) => {
  try {
    const user = await resolveUserForClient(req, req.query.clientId);
    if (!user)
      return res
        .status(400)
        .json({ error: "clientId or authentication required" });
    const doc = await Cart.findOne({ userId: user.userId }).lean();
    const items = doc && Array.isArray(doc.carts) ? doc.carts : [];
    res.json({ carts: items, items: items.map(serializeCartItem) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const user = await resolveUserForClient(
      req,
      req.body.clientId || req.query.clientId,
    );
    if (!user)
      return res
        .status(400)
        .json({ error: "clientId or authentication required" });
    const {
      productId,
      productName: rawProductName,
      unitPrice: rawUnitPrice,
      quantity,
      imageUrl: rawImageUrl,
      name,
      price,
      image,
    } = req.body;
    const productName = rawProductName || name || "";
    const unitPrice = rawUnitPrice ?? price;
    const imageUrl = rawImageUrl || image || "";
    if (!productId && !productName)
      return res.status(400).json({ error: "product info required" });
    const doc = await Cart.findOne({ userId: user.userId });
    const unit = parseFloat(unitPrice) || 0;
    if (!doc) {
      const cartId = await generateUniqueNumericId(Cart, "carts.cartId", 12);
      await Cart.create({
        userId: user.userId,
        carts: [
          {
            cartId,
            productId: productId || "",
            productName: productName || "",
            quantity: parseInt(quantity, 10) || 1,
            unitPrice: unit,
            subtotal: unit * (parseInt(quantity, 10) || 1),
            imageUrl: imageUrl || "",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      });
    } else {
      const idx = findCartLineIndex(doc.carts, { productId, productName });
      if (idx >= 0) {
        doc.carts[idx].quantity =
          (doc.carts[idx].quantity || 1) + (parseInt(quantity, 10) || 1);
        doc.carts[idx].subtotal =
          (doc.carts[idx].unitPrice || 0) * doc.carts[idx].quantity;
        doc.carts[idx].updatedAt = Date.now();
      } else {
        const cartId = await generateUniqueNumericId(Cart, "carts.cartId", 12);
        doc.carts.push({
          cartId,
          productId: productId || "",
          productName: productName || "",
          quantity: parseInt(quantity, 10) || 1,
          unitPrice: unit,
          subtotal: unit * (parseInt(quantity, 10) || 1),
          imageUrl: imageUrl || "",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
      doc.updatedAt = Date.now();
      await doc.save();
    }
    const final = await Cart.findOne({ userId: user.userId }).lean();
    const items = final && final.carts ? final.carts : [];
    res.json({ carts: items, items: items.map(serializeCartItem) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:cartId", async (req, res) => {
  try {
    const user = await resolveUserForClient(req, req.query.clientId);
    if (!user)
      return res
        .status(400)
        .json({ error: "clientId or authentication required" });
    const doc = await Cart.findOne({ userId: user.userId });
    if (!doc) return res.status(404).json({ error: "Item not found" });
    const idx = doc.carts.findIndex(
      (c) => c.cartId === String(req.params.cartId),
    );
    if (idx < 0) return res.status(404).json({ error: "Item not found" });
    doc.carts[idx].quantity = Math.max(1, parseInt(req.body.quantity, 10) || 1);
    doc.carts[idx].subtotal =
      (doc.carts[idx].unitPrice || 0) * doc.carts[idx].quantity;
    doc.carts[idx].updatedAt = Date.now();
    doc.updatedAt = Date.now();
    await doc.save();
    const items = doc.carts;
    res.json({ carts: items, items: items.map(serializeCartItem) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:cartId", async (req, res) => {
  try {
    const user = await resolveUserForClient(req, req.query.clientId);
    if (!user)
      return res
        .status(400)
        .json({ error: "clientId or authentication required" });
    const doc = await Cart.findOne({ userId: user.userId });
    if (doc) {
      doc.carts = doc.carts.filter(
        (c) => c.cartId !== String(req.params.cartId),
      );
      doc.updatedAt = Date.now();
      if (doc.carts.length === 0) {
        await Cart.deleteOne({ userId: user.userId });
      } else {
        await doc.save();
      }
    }
    const final = await Cart.findOne({ userId: user.userId }).lean();
    const items = final && final.carts ? final.carts : [];
    res.json({ carts: items, items: items.map(serializeCartItem) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/", async (req, res) => {
  try {
    const user = await resolveUserForClient(req, req.query.clientId);
    if (!user)
      return res
        .status(400)
        .json({ error: "clientId or authentication required" });
    await Cart.deleteOne({ userId: user.userId });
    res.json({ carts: [], items: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/merge", async (req, res) => {
  if (!req.user || !req.user.id)
    return res.status(401).json({ error: "Authentication required" });
  const { clientId } = req.body;
  if (!clientId) return res.status(400).json({ error: "clientId required" });
  try {
    const anon = await resolveUserForClient(req, clientId);
    const user = await User.findOne({ userId: String(req.user.id) });
    if (!anon || !user)
      return res.status(404).json({ error: "User not found" });
    const anonDoc = await Cart.findOne({ userId: anon.userId });
    if (anonDoc) {
      const userDoc = await Cart.findOne({ userId: user.userId });
      if (!userDoc) {
        anonDoc.userId = user.userId;
        await Cart.create({ userId: user.userId, carts: anonDoc.carts });
      } else {
        for (const item of anonDoc.carts) {
          const idx = findCartLineIndex(userDoc.carts, {
            productId: item.productId,
            productName: item.productName,
          });
          if (idx >= 0) {
            userDoc.carts[idx].quantity =
              (userDoc.carts[idx].quantity || 0) + (item.quantity || 1);
            userDoc.carts[idx].subtotal =
              (userDoc.carts[idx].unitPrice || 0) * userDoc.carts[idx].quantity;
            userDoc.carts[idx].updatedAt = Date.now();
          } else {
            userDoc.carts.push(item);
          }
        }
        userDoc.updatedAt = Date.now();
        await userDoc.save();
      }
      await Cart.deleteOne({ userId: anon.userId });
    }
    await User.findOneAndDelete({ userId: anon.userId });
    const mergedDoc = await Cart.findOne({ userId: user.userId }).lean();
    const items =
      mergedDoc && Array.isArray(mergedDoc.carts) ? mergedDoc.carts : [];
    res.json({ carts: items, items: items.map(serializeCartItem) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

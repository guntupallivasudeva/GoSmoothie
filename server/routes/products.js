const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { requireAdmin } = require('../middleware/auth');
const { ensureSnapshotProducts } = require('../utils/productCatalog');

const sugarByProductName = {
  'Green Goddess Smoothie': 18,
  'Berry Blast Smoothie': 24,
  'Tropical Paradise Smoothie': 32,
  'Carrot Sunrise Smoothie': 22,
  'Protein Power Smoothie': 20,
  'Green Detox Smoothie': 14,
  'Green Goddess': 18,
  'Berry Blast': 26,
  'Tropical Paradise': 34,
  'Carrot Sunrise': 22,
  'Protein Power': 20,
  'Green Detox': 14
};

function withSugar(product) {
  const sugar = product?.meta?.sugar ?? sugarByProductName[product.name] ?? 0;
  const plain = { ...product };
  delete plain._id;
  delete plain.__v;
  return {
    ...plain,
    image: product.image || '',
    meta: {
      ...(product.meta || {}),
      sugar
    }
  };
}

function productPayload(body) {
  const payload = {};
  const fields = ['name', 'description', 'category', 'type', 'image'];

  for (const field of fields) {
    if (body[field] !== undefined) payload[field] = String(body[field] || '').trim();
  }

  if (body.price !== undefined) payload.price = Number(body.price) || 0;
  if (body.meta !== undefined) payload.meta = body.meta && typeof body.meta === 'object' ? body.meta : {};
  if (body.isFeatured !== undefined) payload.isFeatured = !!body.isFeatured;
  if (body.featuredOrder !== undefined) payload.featuredOrder = Number(body.featuredOrder) || 999;
  if (body.isArchived !== undefined) {
    payload.isArchived = !!body.isArchived;
    payload.archivedAt = payload.isArchived ? new Date() : null;
  }

  payload.updatedAt = new Date();
  return payload;
}

// GET /api/products
router.get('/', async (req, res) => {
  try {
    // Seeding must never block reads: if reconciling the snapshot fails we
    // still serve whatever is already in the catalog.
    try {
      await ensureSnapshotProducts();
    } catch (seedErr) {
      console.error('Product snapshot sync failed, serving existing catalog:', seedErr.message);
    }

    const includeArchived = String(req.query.includeArchived || '').toLowerCase() === 'true';
    const featuredOnly = String(req.query.featured || '').toLowerCase() === 'true';
    const limit = Math.max(0, Math.min(100, parseInt(req.query.limit, 10) || 0));
    const query = {};

    if (!includeArchived) query.isArchived = { $ne: true };
    if (featuredOnly) query.isFeatured = true;

    let productsQuery = Product.find(query);
    if (featuredOnly) {
      productsQuery = productsQuery.sort({ featuredOrder: 1, createdAt: 1, name: 1 });
    } else {
      productsQuery = productsQuery.sort({ category: 1, featuredOrder: 1, createdAt: 1, name: 1 });
    }
    if (limit) productsQuery = productsQuery.limit(limit);

    const products = await productsQuery.lean();
    res.json(products.map(withSugar));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const payload = productPayload(req.body);
    if (!payload.name) return res.status(400).json({ error: 'Product name required' });
    if (!payload.price) return res.status(400).json({ error: 'Product price required' });

    const product = await Product.create({
      category: '',
      type: 'Vegetarian',
      featuredOrder: 999,
      isFeatured: false,
      ...payload,
      createdAt: new Date()
    });

    res.status(201).json(withSugar(product.toObject()));
  } catch (err) {
    console.error(err);
    if (err && err.code === 11000) return res.status(409).json({ error: 'Product already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:productId', requireAdmin, async (req, res) => {
  try {
    const product = await Product.findOne({ productId: String(req.params.productId) });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    Object.assign(product, productPayload(req.body));
    await product.save();
    res.json(withSugar(product.toObject()));
  } catch (err) {
    console.error(err);
    if (err && err.code === 11000) return res.status(409).json({ error: 'Product already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:productId', requireAdmin, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { productId: String(req.params.productId) },
      { $set: { isArchived: true, archivedAt: new Date(), updatedAt: new Date() } },
      { new: true }
    ).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(withSugar(product));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:productId/restore', requireAdmin, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { productId: String(req.params.productId) },
      { $set: { isArchived: false, archivedAt: null, updatedAt: new Date() } },
      { new: true }
    ).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(withSugar(product));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const MONGO = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gosmoothie';
mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');

    // One-time: import any remaining local images into ProductImage collection
    const Product = require('./server/models/Product');
    const ProductImage = require('./server/models/ProductImage');
    const fs = require('fs');
    const crypto = require('crypto');

    Product.find({ image: /^\/assets\/images\/generated-menu\// }).lean().then(async (localProducts) => {
      if (localProducts.length === 0) return;
      const IMAGES_DIR = path.join(__dirname, 'assets', 'images', 'generated-menu');
      let imported = 0;
      for (const p of localProducts) {
        // Extract filename from the path
        const filename = p.image.split('/').pop();
        const filePath = path.join(IMAGES_DIR, filename);
        if (!fs.existsSync(filePath)) continue;
        const buffer = fs.readFileSync(filePath);
        const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
        await ProductImage.findOneAndUpdate(
          { productId: p.productId },
          { productId: p.productId, data: buffer, contentType: 'image/jpeg', size: buffer.length, checksum, updatedAt: new Date() },
          { upsert: true, setDefaultsOnInsert: true }
        );
        await Product.updateOne({ productId: p.productId }, { $set: { image: `/api/products/${p.productId}/image` } });
        imported++;
      }
      if (imported > 0) console.log(`Imported ${imported} product image(s) into MongoDB`);
    }).catch(err => console.error('Image import error:', err.message));

    // Set featuredImage URLs for Popular Blend products (from DB, not hardcoded in frontend)
    const popularBlendUrls = {
      "Green Goddess Smoothie": "https://readdy.ai/api/search-image?query=A%20professional%20product%20shot%20of%20a%20vibrant%20green%20smoothie%20in%20a%20clear%20glass.%20The%20smoothie%20has%20a%20creamy%20texture%20with%20visible%20green%20ingredients%20like%20spinach%2C%20kale%2C%20and%20avocado.%20The%20background%20is%20clean%20white%20with%20some%20fresh%20green%20ingredients%20artistically%20arranged%20nearby.%20The%20lighting%20is%20bright%20and%20natural%2C%20highlighting%20the%20freshness%20of%20the%20drink.&width=600&height=400&seq=2&orientation=landscape",
      "Berry Blast Smoothie": "https://readdy.ai/api/search-image?query=A%20professional%20product%20shot%20of%20a%20vibrant%20berry%20smoothie%20in%20a%20clear%20glass.%20The%20smoothie%20has%20a%20rich%20purple-red%20color%20with%20a%20creamy%20texture.%20Some%20fresh%20berries%20like%20strawberries%2C%20blueberries%2C%20and%20raspberries%20are%20visible%20on%20top%20and%20arranged%20artistically%20around%20the%20glass.%20The%20background%20is%20clean%20white%2C%20and%20the%20lighting%20is%20bright%20and%20natural%2C%20highlighting%20the%20vivid%20color%20of%20the%20drink.&width=600&height=400&seq=3&orientation=landscape",
      "Tropical Paradise Smoothie": "https://readdy.ai/api/search-image?query=A%20professional%20product%20shot%20of%20a%20tropical%20mango%20smoothie%20in%20a%20clear%20glass.%20The%20smoothie%20has%20a%20vibrant%20orange-yellow%20color%20with%20a%20creamy%20texture.%20Fresh%20mango%20slices%20and%20pineapple%20chunks%20are%20visible%20on%20top%20and%20arranged%20artistically%20around%20the%20glass.%20The%20background%20is%20clean%20white%2C%20and%20the%20lighting%20is%20bright%20and%20natural%2C%20highlighting%20the%20sunny%20color%20of%20the%20drink.&width=600&height=400&seq=4&orientation=landscape",
      "Carrot Sunrise Smoothie": "https://readdy.ai/api/search-image?query=A%20professional%20product%20shot%20of%20a%20vibrant%20orange%20carrot%20juice%20in%20a%20clear%20glass.%20The%20juice%20has%20a%20bright%20orange%20color%20with%20a%20smooth%20texture.%20Fresh%20carrots%20and%20orange%20slices%20are%20visible%20around%20the%20glass.%20The%20background%20is%20clean%20white%2C%20and%20the%20lighting%20is%20bright%20and%20natural%2C%20highlighting%20the%20vivid%20color%20of%20the%20juice.&width=600&height=400&seq=5&orientation=landscape",
      "Protein Power Smoothie": "https://readdy.ai/api/search-image?query=A%20professional%20product%20shot%20of%20a%20chocolate%20protein%20smoothie%20in%20a%20clear%20glass.%20The%20smoothie%20has%20a%20rich%20brown%20color%20with%20a%20thick%2C%20creamy%20texture.%20Some%20cacao%20nibs%20and%20banana%20slices%20are%20visible%20on%20top%20and%20arranged%20artistically%20around%20the%20glass.%20The%20background%20is%20clean%20white%2C%20and%20the%20lighting%20is%20bright%20and%20natural%2C%20highlighting%20the%20indulgent%20appearance%20of%20the%20drink.&width=600&height=400&seq=6&orientation=landscape",
      "Green Detox Smoothie": "https://readdy.ai/api/search-image?query=A%20professional%20product%20shot%20of%20a%20vibrant%20green%20detox%20juice%20in%20a%20clear%20glass.%20The%20juice%20has%20a%20bright%20green%20color%20with%20a%20smooth%20texture.%20Fresh%20celery%2C%20cucumber%2C%20apple%20slices%2C%20and%20mint%20leaves%20are%20visible%20around%20the%20glass.%20The%20background%20is%20clean%20white%2C%20and%20the%20lighting%20is%20bright%20and%20natural%2C%20highlighting%20the%20fresh%20appearance%20of%20the%20juice.&width=600&height=400&seq=7&orientation=landscape"
    };
    Promise.all(
      Object.entries(popularBlendUrls).map(([name, url]) =>
        Product.updateOne({ name, isFeatured: true }, { $set: { featuredImage: url } })
      )
    ).then(results => {
      const updated = results.filter(r => r.modifiedCount > 0).length;
      if (updated > 0) console.log(`Set ${updated} Popular Blend featuredImage URL(s)`);
    }).catch(err => console.error('featuredImage update error:', err.message));

    // Ensure featured products use the DB image endpoint (not external URLs) for the image field
    // The featuredImage field holds the external URL, but image must point to the stored binary
    Product.find({ isFeatured: true }).lean().then(async (featuredProducts) => {
      for (const p of featuredProducts) {
        const hasStoredImage = await ProductImage.findOne({ productId: p.productId }).select('_id').lean();
        if (hasStoredImage && p.image !== `/api/products/${p.productId}/image`) {
          await Product.updateOne({ productId: p.productId }, { $set: { image: `/api/products/${p.productId}/image` } });
        }
      }
    }).catch(err => console.error('Featured image field fix error:', err.message));
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Auth middleware
const { authMiddleware } = require('./server/middleware/auth');
app.use(authMiddleware);

// Routes
app.use('/api/auth', require('./server/routes/auth'));
app.use('/api/products', require('./server/routes/products'));
app.use('/api/cart', require('./server/routes/cart'));
app.use('/api/orders', require('./server/routes/orders'));
app.use('/api/addresses', require('./server/routes/addresses'));
app.use('/api/users', require('./server/routes/users'));
app.use('/api/payments', require('./server/routes/payments'));
app.use('/api/admins', require('./server/routes/admins'));

// Serve static assets (images, brands, etc.)
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Serve static frontend files (project root)
app.use(express.static(path.join(__dirname)));

// The application entry page is main.html, not index.html.
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'main.html')));

// Browsers auto-request /favicon.ico; return 204 when no icon file exists.
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Global fallback error handler
app.use((err, req, res, next) => {
  console.error(`${req.method} ${req.path} error:`, err.message);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

require('dotenv').config();

const mongoose = require('mongoose');
const Product = require('../models/Product');
const productSnapshot = require('../data/productSnapshot');

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/gosmoothie';
  await mongoose.connect(uri);

  for (const item of productSnapshot) {
    await Product.updateOne(
      { name: item.name },
      {
        $set: {
          image: item.image,
          category: item.category,
          type: item.type || 'Vegetarian',
          isFeatured: !!item.isFeatured,
          featuredOrder: item.featuredOrder || 999,
          updatedAt: new Date()
        }
      }
    );
  }

  console.log(`Repaired product images for ${productSnapshot.length} products.`);
  await mongoose.disconnect();
}

main().catch(async err => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});

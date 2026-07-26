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
      { $set: { isFeatured: !!item.isFeatured, featuredOrder: item.featuredOrder || 999 } }
    );
  }

  console.log('Featured product defaults repaired from productSnapshot.');
  await mongoose.disconnect();
}

main().catch(async err => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});

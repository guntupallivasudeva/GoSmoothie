const mongoose = require('mongoose');

const ProductImageSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true, index: true },
  productName: { type: String, default: null },
  data: { type: Buffer, required: true },
  contentType: { type: String, required: true },
  size: { type: Number, required: true },
  checksum: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  versionKey: false
});

module.exports = mongoose.model('ProductImage', ProductImageSchema);

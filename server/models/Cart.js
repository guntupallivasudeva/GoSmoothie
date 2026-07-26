const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  cartId: { type: String, required: true },
  productId: { type: String, default: '' },
  productName: { type: String, default: '' },
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, default: 0 },
  subtotal: { type: Number, default: 0 },
  imageUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

const CartSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  carts: { type: [CartItemSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  versionKey: false,
  toJSON: { transform: (_doc, ret) => { delete ret._id; delete ret.__v; return ret; } },
  toObject: { transform: (_doc, ret) => { delete ret._id; delete ret.__v; return ret; } }
});

module.exports = mongoose.model('Cart', CartSchema);

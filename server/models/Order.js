const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, default: "" },
    productName: { type: String, default: "" },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
  },
  { _id: false },
);

const OrderSubSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },
    paymentId: { type: String, default: "" },
    items: { type: [OrderItemSchema], default: [] },
    addressSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    orderStatus: { type: String, default: "confirmed" },
    paymentStatus: { type: String, default: "unpaid" },
    // Method chosen in the checkout payment modal, e.g. "UPI QR" or
    // "Netbanking · HDFC Bank". No card or UPI credentials are ever stored.
    paymentMethod: { type: String, default: "" },
    // "online" | "cod" — kept alongside the label so cash orders can be
    // filtered without parsing display text.
    paymentMode: { type: String, default: "online" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    orders: { type: [OrderSubSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

module.exports = mongoose.model("Order", OrderSchema);

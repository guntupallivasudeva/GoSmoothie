const mongoose = require("mongoose");

const PaymentSubSchema = new mongoose.Schema(
  {
    paymentId: { type: String, required: true },
    userName: { type: String },
    userEmail: { type: String },
    userPhone: { type: String },
    paymentMethod: { type: String },
    amountPaid: { type: Number, default: 0 },
    transactionId: { type: String },
    paymentStatus: { type: String, default: "pending" },
    orderId: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const PaymentSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    payments: { type: [PaymentSubSchema], default: [] },
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

module.exports = mongoose.model("Payment", PaymentSchema);

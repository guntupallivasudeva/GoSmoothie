const mongoose = require("mongoose");

const PaymentSubSchema = new mongoose.Schema(
  {
    paymentId: { type: String, required: true },
    paymentMethod: { type: String, default: "unknown" },
    amountPaid: { type: Number, default: 0 },
    transactionId: { type: String, default: "" },
    paymentStatus: { type: String, default: "pending" },
    orderId: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const UserPaymentSchema = new mongoose.Schema(
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

module.exports = mongoose.model("UserPayment", UserPaymentSchema);

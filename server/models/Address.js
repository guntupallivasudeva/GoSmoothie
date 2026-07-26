const mongoose = require("mongoose");
const {
  generateUniqueNumericId,
  isExactNumericId,
} = require("../utils/idGenerator");

const AddressSubSchema = new mongoose.Schema(
  {
    addressId: { type: String, required: true },
    fullName: { type: String, default: "" },
    phoneNumber: { type: String, default: "" },
    addressLine1: { type: String, default: "" },
    addressLine2: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "" },
    pincode: { type: String, default: "" },
    landmark: { type: String, default: "" },
    addressType: { type: String, default: "home" },
    isDefault: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const AddressSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    addresses: { type: [AddressSubSchema], default: [] },
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

module.exports = mongoose.model("Address", AddressSchema);

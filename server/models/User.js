const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { randomNumeric } = require("../utils/idGenerator");

const AddressSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () =>
        `addr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    },
    label: { type: String, default: "Home" },
    street: { type: String, default: "" },
    city: { type: String, default: "" },
    zip: { type: String, default: "" },
    notes: { type: String, default: "" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false },
);

const UserSchema = new mongoose.Schema({
  userId: { type: String, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  phoneNumber: { type: String, default: "" },
  phone: { type: String, default: "" },
  passwordHash: { type: String, required: true },
  isAnonymous: { type: Boolean, default: false },
  clientToken: { type: String, default: "", index: true },
  isActive: { type: Boolean, default: true },
  addresses: { type: [AddressSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

UserSchema.pre("validate", async function ensureUserId(next) {
  if (this.userId) return next();
  const UserModel = this.constructor;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const candidate = randomNumeric(8);
    const existing = await UserModel.findOne({ userId: candidate }).lean();
    if (!existing) {
      this.userId = candidate;
      return next();
    }
  }
  return next(new Error("Unable to generate unique userId"));
});

UserSchema.methods.verifyPassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model("User", UserSchema);

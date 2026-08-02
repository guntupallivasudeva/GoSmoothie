const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const {
  generateUniqueNumericId,
  isExactNumericId,
} = require("../utils/idGenerator");

const AdminSchema = new mongoose.Schema(
  {
    adminId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    phoneNumber: { type: String, default: "" },
    role: { type: String, default: "admin" },
    isActive: { type: Boolean, default: true },
    _createdBy: { type: mongoose.Schema.Types.Mixed, default: null },
    _lastUpdatedBy: { type: mongoose.Schema.Types.Mixed, default: null },
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

AdminSchema.methods.verifyPassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

AdminSchema.pre("validate", async function (next) {
  try {
    if (!isExactNumericId(this.adminId, 12)) {
      this.adminId = await generateUniqueNumericId(
        this.constructor,
        "adminId",
        12,
      );
    } else {
      const collision = await this.constructor
        .findOne({ adminId: this.adminId, _id: { $ne: this._id } })
        .lean();
      if (collision)
        this.adminId = await generateUniqueNumericId(
          this.constructor,
          "adminId",
          12,
        );
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Admin", AdminSchema);

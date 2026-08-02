const mongoose = require("mongoose");
const {
  generateUniqueNumericId,
  generateNextProductCode,
  isExactNumericId,
} = require("../utils/idGenerator");

const ProductSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, unique: true },
    productCode: { type: String, unique: true },
    name: { type: String, required: true },
    description: String,
    category: { type: String, default: "" },
    type: { type: String, default: "Vegetarian" },
    price: { type: Number, required: true },
    image: String,
    meta: Object,
    featuredImage: { type: String, default: null },
    isFeatured: { type: Boolean, default: false },
    featuredOrder: { type: Number, default: 999 },
    isArchived: { type: Boolean, default: false },
    isOutOfStock: { type: Boolean, default: false },
    archivedAt: { type: Date, default: null },
    imageStoragePath: { type: String, default: null },
    imageContentType: { type: String, default: null },
    imageSize: { type: Number, default: null },
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

ProductSchema.pre("validate", async function (next) {
  try {
    if (!isExactNumericId(this.productId, 12)) {
      this.productId = await generateUniqueNumericId(
        this.model("Product"),
        "productId",
        12,
      );
    } else {
      const collision = await this.model("Product")
        .findOne({ productId: this.productId, _id: { $ne: this._id } })
        .lean();
      if (collision)
        this.productId = await generateUniqueNumericId(
          this.model("Product"),
          "productId",
          12,
        );
    }

    if (!this.productCode)
      this.productCode = await generateNextProductCode(this.model("Product"));
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Product", ProductSchema);

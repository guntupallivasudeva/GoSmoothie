const Product = require("../models/Product");
const productSnapshot = require("../data/productSnapshot");

const legacyAliases = {
  "Green Goddess": "Green Goddess Smoothie",
  "Berry Blast": "Berry Blast Smoothie",
  "Tropical Paradise": "Tropical Paradise Smoothie",
  "Carrot Sunrise": "Carrot Sunrise Smoothie",
  "Protein Power": "Protein Power Smoothie",
  "Green Detox": "Green Detox Smoothie",
};

async function ensureSnapshotProducts() {
  for (const item of productSnapshot) {
    const aliases = Object.entries(legacyAliases)
      .filter(([, canonical]) => canonical === item.name)
      .map(([legacy]) => legacy);
    const existing = await Product.findOne({
      name: { $in: [item.name, ...aliases] },
    });

    if (!existing) {
      await Product.create(item);
      continue;
    }

    const updates = {};
    const isLegacyProduct = aliases.includes(existing.name);
    const storedImage = String(existing.image || "").trim();
    // Images the catalog owns and may refresh: the earlier locally rendered
    // JPGs and the third-party hosts used before generated artwork existed.
    // Anything else (an admin upload or a custom URL) is left untouched.
    const isCatalogManagedImage =
      /^https?:\/\/(images\.unsplash\.com|loremflickr\.com)\//i.test(
        storedImage,
      ) || /^\/server\/images\/generated-menu\//i.test(storedImage);
    if (isLegacyProduct) {
      updates.name = item.name;
      updates.description = item.description;
      updates.price = item.price;
      updates.meta = item.meta;
      updates.isFeatured = !!item.isFeatured;
      updates.featuredOrder = item.featuredOrder || 999;
    }
    if (!existing.category) updates.category = item.category;
    if (!existing.type) updates.type = item.type || "Vegetarian";
    if (!storedImage || isCatalogManagedImage) updates.image = item.image;
    if (existing.isFeatured === undefined)
      updates.isFeatured = !!item.isFeatured;
    if (existing.featuredOrder === undefined || existing.featuredOrder === null)
      updates.featuredOrder = item.featuredOrder || 999;

    if (Object.keys(updates).length) {
      updates.updatedAt = new Date();
      await Product.updateOne({ _id: existing._id }, { $set: updates });
    }
  }
}

module.exports = { ensureSnapshotProducts };

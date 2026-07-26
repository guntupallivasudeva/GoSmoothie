const express = require("express");
const router = express.Router();
const Address = require("../models/Address");
const User = require("../models/User");
const {
  generateUniqueNumericId,
  isExactNumericId,
} = require("../utils/idGenerator");

async function resolveUser(req, clientId) {
  if (req.user && req.user.id)
    return await User.findOne({ userId: String(req.user.id) });
  if (clientId && clientId.startsWith("u_"))
    return await User.findOne({ userId: clientId.slice(2) });
  if (clientId) return await User.findOne({ clientToken: clientId });
  return null;
}

router.get("/", async (req, res) => {
  try {
    const {
      userId,
      search = "",
      addressType,
      isDefault,
      page = "1",
      limit = "20",
    } = req.query;
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    if (userId) {
      const doc = await Address.findOne({ userId: String(userId) }).lean();
      const items = doc && Array.isArray(doc.addresses) ? doc.addresses : [];
      // basic search/filter in-memory for simplicity
      let filtered = items;
      if (addressType)
        filtered = filtered.filter(
          (a) => String(a.addressType) === String(addressType),
        );
      if (isDefault !== undefined)
        filtered = filtered.filter(
          (a) => !!a.isDefault === (isDefault === "true"),
        );
      if (search)
        filtered = filtered.filter((a) =>
          `${a.fullName} ${a.addressLine1} ${a.city} ${a.state} ${a.pincode}`
            .toLowerCase()
            .includes(String(search).toLowerCase()),
        );
      const paged = filtered.slice(
        (pageNumber - 1) * pageSize,
        (pageNumber - 1) * pageSize + pageSize,
      );
      return res.json({
        items: paged,
        total: filtered.length,
        page: pageNumber,
        limit: pageSize,
      });
    }
    // admin view: return per-user address documents
    const [items, total] = await Promise.all([
      Address.find({})
        .sort({ createdAt: 1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Address.countDocuments({}),
    ]);
    res.json({ items, total, page: pageNumber, limit: pageSize });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:addressId", async (req, res) => {
  try {
    const doc = await Address.findOne(
      { "addresses.addressId": String(req.params.addressId) },
      { "addresses.$": 1, userId: 1 },
    ).lean();
    if (!doc || !doc.addresses || !doc.addresses.length)
      return res.status(404).json({ error: "Address not found" });
    res.json({ userId: doc.userId, address: doc.addresses[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const user = await resolveUser(
      req,
      req.body.clientId || req.query.clientId,
    );
    if (!user)
      return res
        .status(400)
        .json({ error: "clientId or authentication required" });
    // generate addressId unique across all users
    const addressId = await generateUniqueNumericId(
      Address,
      "addresses.addressId",
      12,
    );
    const addr = {
      addressId,
      fullName: req.body.fullName || user.name,
      phoneNumber: req.body.phoneNumber || "",
      addressLine1: req.body.addressLine1 || "",
      addressLine2: req.body.addressLine2 || "",
      city: req.body.city || "",
      state: req.body.state || "",
      country: req.body.country || "",
      pincode: req.body.pincode || "",
      landmark: req.body.landmark || "",
      addressType: req.body.addressType || "home",
      isDefault: !!req.body.isDefault,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await Address.findOneAndUpdate(
      { userId: user.userId },
      { $push: { addresses: addr }, $set: { updatedAt: Date.now() } },
      { upsert: true },
    );
    if (addr.isDefault) {
      await Address.updateOne(
        { userId: user.userId },
        { $set: { "addresses.$[elem].isDefault": false } },
        { arrayFilters: [{ "elem.addressId": { $ne: addr.addressId } }] },
      );
    }
    res.status(201).json(addr);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:addressId", async (req, res) => {
  try {
    const doc = await Address.findOne({
      "addresses.addressId": String(req.params.addressId),
    });
    if (!doc) return res.status(404).json({ error: "Address not found" });
    const idx = doc.addresses.findIndex(
      (a) => a.addressId === String(req.params.addressId),
    );
    if (idx < 0) return res.status(404).json({ error: "Address not found" });
    Object.assign(doc.addresses[idx], req.body);
    doc.addresses[idx].updatedAt = Date.now();
    doc.updatedAt = Date.now();
    await doc.save();
    if (doc.addresses[idx].isDefault) {
      await Address.updateOne(
        { userId: doc.userId },
        { $set: { "addresses.$[elem].isDefault": false } },
        {
          arrayFilters: [
            { "elem.addressId": { $ne: doc.addresses[idx].addressId } },
          ],
        },
      );
    }
    res.json(doc.addresses[idx]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:addressId", async (req, res) => {
  try {
    const doc = await Address.findOne({
      "addresses.addressId": String(req.params.addressId),
    });
    if (!doc) return res.status(404).json({ error: "Address not found" });

    doc.addresses = doc.addresses.filter(
      (address) => address.addressId !== String(req.params.addressId),
    );
    doc.updatedAt = Date.now();
    if (doc.addresses.length === 0) {
      await Address.deleteOne({ userId: doc.userId });
    } else {
      await doc.save();
    }
    res.json({ message: "Address deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

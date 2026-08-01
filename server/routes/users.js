const express = require("express");
const router = express.Router();
const User = require("../models/User");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const {
  resolveTokenUser,
  sendSessionInvalid,
} = require("../utils/requestUser");

// Resolves the account behind a verified token. Shared with the cart, order,
// address and payment routes so every endpoint agrees on who the caller is.
function resolveAuthUser(authId, authEmail) {
  return resolveTokenUser({ user: { id: authId, email: authEmail } });
}

// GET /api/users/me
router.get("/me", async (req, res) => {
  if (!req.user || !req.user.id)
    return res.status(401).json({ error: "Authentication required" });
  try {
    const user = await resolveAuthUser(req.user.id, req.user.email);
    // A verified token with no matching account means the session is dead.
    if (!user) return sendSessionInvalid(res);
    const safeUser = user.toObject ? user.toObject() : user;
    delete safeUser.passwordHash;
    res.json(safeUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/users/me  { name, email }
router.put("/me", async (req, res) => {
  if (!req.user || !req.user.id)
    return res.status(401).json({ error: "Authentication required" });
  const { name, email, phone, addresses } = req.body;
  try {
    console.log("[PUT /api/users/me] incoming", {
      userId: req.user.id,
      hasName: typeof name === "string" && name.trim().length > 0,
      hasEmail: typeof email === "string" && email.trim().length > 0,
      hasPhone: typeof phone === "string" && phone.trim().length > 0,
      addressCount: Array.isArray(addresses) ? addresses.length : 0,
    });
    const user = await resolveAuthUser(req.user.id, req.user.email);
    // A verified token with no matching account means the session is dead.
    if (!user) return sendSessionInvalid(res);
    if (name) user.name = name;
    if (email) user.email = email;
    if (typeof phone === "string") user.phone = phone.trim();
    if (Array.isArray(addresses)) {
      user.addresses = addresses
        .map((addr) => {
          const item = {
            label: (addr.label || "Home").trim(),
            street: (addr.street || "").trim(),
            city: (addr.city || "").trim(),
            zip: (addr.zip || "").trim(),
            notes: (addr.notes || "").trim(),
            isDefault: !!addr.isDefault,
          };
          // Only set _id if it's a valid ObjectId string - otherwise let mongoose generate one.
          if (
            addr &&
            addr._id &&
            mongoose.Types.ObjectId.isValid(String(addr._id))
          ) {
            item._id = addr._id;
          }
          return item;
        })
        .filter((addr) => addr.street || addr.city || addr.zip || addr.label);
      // Do not auto-assign a default address here; honor explicit isDefault only.
    }
    await user.save();
    console.log("[PUT /api/users/me] saved", {
      userId: user._id.toString(),
      phone: user.phone || "",
      addressCount: Array.isArray(user.addresses) ? user.addresses.length : 0,
      defaultAddressId: Array.isArray(user.addresses)
        ? user.addresses.find((a) => a.isDefault)?._id || null
        : null,
    });
    res.json({
      id: user.userId,
      userId: user.userId,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      addresses: user.addresses,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/users/change-password { oldPassword, newPassword }
router.post("/change-password", async (req, res) => {
  if (!req.user || !req.user.id)
    return res.status(401).json({ error: "Authentication required" });
  const { oldPassword, currentPassword, newPassword } = req.body;
  const passwordToCheck = oldPassword || currentPassword;
  if (!passwordToCheck || !newPassword)
    return res
      .status(400)
      .json({ error: "oldPassword and newPassword required" });
  try {
    const user = await resolveAuthUser(req.user.id, req.user.email);
    // A verified token with no matching account means the session is dead.
    if (!user) return sendSessionInvalid(res);
    const ok = await user.verifyPassword(passwordToCheck);
    if (!ok) return res.status(400).json({ error: "Old password incorrect" });
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password changed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/users/me - Delete user account and all associated data
router.delete("/me", async (req, res) => {
  if (!req.user || !req.user.id)
    return res.status(401).json({ error: "Authentication required" });
  try {
    const user = await resolveAuthUser(req.user.id, req.user.email);
    // A verified token with no matching account means the session is dead.
    if (!user) return sendSessionInvalid(res);
    const userId = user.userId;
    const Cart = require("../models/Cart");
    const Order = require("../models/Order");

    // Delete user's cart
    await Cart.deleteMany({ userId });

    // Delete user's orders
    await Order.deleteMany({ userId });

    // Delete user account
    await User.deleteOne({ userId });

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

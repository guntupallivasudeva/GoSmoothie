const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { secret } = require("../middleware/auth");

// Escape a value so it can be used inside a RegExp literal safely.
function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Look up a user by email. The stored email keeps the exact casing the user
// typed at registration, so an exact match is tried first and a
// case-insensitive match is used only as a fallback for sign-in convenience.
async function findUserByEmail(email) {
  const exact = await User.findOne({ email });
  if (exact) return exact;
  return User.findOne({
    email: { $regex: `^${escapeRegex(email)}$`, $options: "i" },
  });
}

// POST /api/auth/register { name, email, password }
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "name,email,password required" });
  // Store the name and email exactly as provided (only surrounding whitespace
  // is dropped) so the database mirrors what the user typed.
  const exactName = String(name).trim();
  const exactEmail = String(email).trim();
  if (!exactName || !exactEmail)
    return res.status(400).json({ error: "name,email,password required" });
  try {
    const existing = await findUserByEmail(exactEmail);
    if (existing)
      return res.status(400).json({ error: "Email already registered" });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: exactName,
      email: exactEmail,
      passwordHash: hash,
    });
    const token = jwt.sign(
      {
        id: user.userId,
        userId: user.userId,
        name: user.name,
        email: user.email,
      },
      secret,
      { expiresIn: "7d" },
    );
    res.json({
      token,
      user: {
        id: user.userId,
        userId: user.userId,
        name: user.name,
        email: user.email,
        phone: user.phone || user.phoneNumber || "",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/login { email, password }
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "email,password required" });
  try {
    // Accounts are read from the database only; there are no built-in users.
    const user = await findUserByEmail(String(email).trim());
    if (!user) return res.status(400).json({ error: "Invalid credentials" });
    const ok = await user.verifyPassword(password);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });
    const token = jwt.sign(
      {
        id: user.userId,
        userId: user.userId,
        name: user.name,
        email: user.email,
      },
      secret,
      { expiresIn: "7d" },
    );
    res.json({
      token,
      user: {
        id: user.userId,
        userId: user.userId,
        name: user.name,
        email: user.email,
        phone: user.phone || user.phoneNumber || "",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

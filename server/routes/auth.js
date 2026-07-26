const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { secret } = require("../middleware/auth");
const { ensureLocalAccounts, LOCAL_USER } = require("../utils/localAccounts");

// POST /api/auth/register { name, email, password }
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "name,email,password required" });
  try {
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ error: "Email already registered" });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash: hash });
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
    let user = await User.findOne({ email });
    // The local seed command resets users. Restore the requested local account
    // on demand so an existing development session cannot become unusable.
    if (!user && String(email).toLowerCase() === LOCAL_USER.email) {
      await ensureLocalAccounts();
      user = await User.findOne({ email: LOCAL_USER.email });
    }
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

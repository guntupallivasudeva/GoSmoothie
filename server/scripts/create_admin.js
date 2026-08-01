/**
 * Creates (or updates) the single administrator account used to sign in to the
 * admin dashboard. Nothing is hardcoded inside the application routes: the
 * admin lives in MongoDB like any other record.
 *
 * Usage:
 *   npm run create-admin
 *   node server/scripts/create_admin.js
 *
 * Optional overrides via environment variables:
 *   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Admin = require("../models/Admin");

const MONGO = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/gosmoothie";

const ADMIN_NAME = process.env.ADMIN_NAME || "Admin";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";

/**
 * Ensures the admin document exists with the expected name, email and
 * password. Safe to call repeatedly; an existing record is updated in place so
 * the adminId stays stable.
 */
async function ensureAdmin({
  name = ADMIN_NAME,
  email = ADMIN_EMAIL,
  password = ADMIN_PASSWORD,
} = {}) {
  let admin = await Admin.findOne({ email });
  if (!admin) admin = new Admin({ email });
  // Name and email are stored exactly as configured, without case changes.
  admin.name = name;
  admin.email = email;
  admin.passwordHash = await bcrypt.hash(password, 10);
  admin.role = "admin";
  admin.isActive = true;
  admin.updatedAt = new Date();
  await admin.save();
  return admin;
}

async function main() {
  await mongoose.connect(MONGO);
  const admin = await ensureAdmin();
  console.log("Admin account ready");
  console.log(`   adminId : ${admin.adminId}`);
  console.log(`   name    : ${admin.name}`);
  console.log(`   email   : ${admin.email}`);
  console.log(`   password: ${ADMIN_PASSWORD}`);
  await mongoose.disconnect();
}

if (require.main === module) {
  main().catch(async (err) => {
    console.error("Failed to create admin:", err.message);
    try {
      await mongoose.disconnect();
    } catch (_) {
      /* connection already closed */
    }
    process.exit(1);
  });
}

module.exports = { ensureAdmin, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD };

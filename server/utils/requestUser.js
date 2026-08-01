const mongoose = require("mongoose");
const User = require("../models/User");

// Escape a value so it can be used inside a RegExp literal safely.
function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Resolves the account referenced by a verified JWT.
 *
 * A token stays cryptographically valid for seven days, so a browser can hold
 * a token for an account that has since been removed from the database. Every
 * route needs to tell that case apart from "no token at all", otherwise the
 * request fails with a misleading error (the cart, for example, used to answer
 * "clientId or authentication required" for a logged-in visitor).
 */
async function resolveTokenUser(req) {
  if (!req.user || !req.user.id) return null;
  const byUserId = await User.findOne({ userId: String(req.user.id) });
  if (byUserId) return byUserId;
  // Legacy tokens carried a Mongo _id instead of the numeric userId.
  if (mongoose.Types.ObjectId.isValid(String(req.user.id))) {
    const byObjectId = await User.findById(String(req.user.id));
    if (byObjectId) return byObjectId;
  }
  // The signed email is trustworthy and survives a regenerated userId.
  if (req.user.email) {
    const email = String(req.user.email);
    const exact = await User.findOne({ email });
    if (exact) return exact;
    return User.findOne({
      email: { $regex: `^${escapeRegex(email)}$`, $options: "i" },
    });
  }
  return null;
}

// True when the request carried a token that no longer maps to any account.
function hasStaleSession(req, resolvedUser) {
  return !!(req.user && req.user.id && !resolvedUser);
}

/**
 * Single response shape for an unusable session. The browser watches for
 * `code: "SESSION_INVALID"` to drop the stored token instead of leaving the
 * visitor stuck with a session that can never succeed.
 */
function sendSessionInvalid(res) {
  return res.status(401).json({
    error: "Your session is no longer valid. Please sign in again.",
    code: "SESSION_INVALID",
  });
}

module.exports = {
  resolveTokenUser,
  hasStaleSession,
  sendSessionInvalid,
  escapeRegex,
};

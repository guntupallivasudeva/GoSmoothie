const express = require("express");
const router = express.Router();
require("dotenv").config();
const stripeKey = process.env.STRIPE_SECRET;
let stripe = null;
function isLikelyValidStripeKey(key) {
  return (
    typeof key === "string" &&
    /^sk_(test|live)_[A-Za-z0-9]+$/.test(key) &&
    !key.includes("*")
  );
}

if (isLikelyValidStripeKey(stripeKey)) {
  try {
    stripe = require("stripe")(stripeKey);
  } catch (err) {
    console.warn("Stripe disabled: invalid secret key configuration");
    stripe = null;
  }
} else if (stripeKey) {
  console.warn("Stripe disabled: invalid secret key configuration");
}
const Cart = require("../models/Cart");
const User = require("../models/User");

async function resolveUser(req) {
  if (req.user && req.user.id) {
    return User.findOne({ userId: String(req.user.id) });
  }
  const clientId = req.body.clientId;
  if (!clientId) return null;
  if (clientId.startsWith("u_")) {
    return User.findOne({ userId: clientId.slice(2) });
  }
  return User.findOne({ clientToken: clientId });
}

// POST /api/payments/create-session { returnUrlSuccess, returnUrlCancel }
router.post("/create-session", async (req, res) => {
  try {
    const user = await resolveUser(req);
    if (!user)
      return res
        .status(400)
        .json({ error: "clientId or authentication required" });

    const cart = await Cart.findOne({ userId: user.userId }).lean();
    const items = cart && Array.isArray(cart.carts) ? cart.carts : [];
    if (!items.length) return res.status(400).json({ error: "Cart is empty" });

    const total = items.reduce((s, i) => s + (i.subtotal || 0), 0);
    if (!stripe)
      return res.json({ skip: true, total, stripeConfigured: false });

    const line_items = items.map((i) => ({
      price_data: {
        currency: "inr",
        product_data: { name: i.productName || "Smoothie" },
        unit_amount: Math.round((i.unitPrice || 0) * 100),
      },
      quantity: i.quantity || 1,
    }));
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url:
        req.body.successUrl ||
        req.headers.origin +
          "/order-confirmation.html?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: req.body.cancelUrl || req.headers.origin + "/payment.html",
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

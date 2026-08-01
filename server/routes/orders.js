const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Address = require("../models/Address");
const Payment = require("../models/Payment");
const { generateOrderId } = require("../utils/idGenerator");
const { codConfig } = require("../config/payments");
const {
  resolveTokenUser,
  hasStaleSession,
  sendSessionInvalid,
} = require("../utils/requestUser");

async function resolveUser(req, clientId) {
  if (req.user && req.user.id) {
    const tokenUser = await resolveTokenUser(req);
    if (tokenUser) return tokenUser;
    // The token's account no longer exists; only an explicit clientId can
    // identify the shopper now.
    if (!clientId) return null;
  }
  if (clientId && clientId.startsWith("u_"))
    return await User.findOne({ userId: clientId.slice(2) });
  if (clientId) return await User.findOne({ clientToken: clientId });
  return null;
}

router.get("/", async (req, res) => {
  try {
    const { userId, search = "", status, page = "1", limit = "20" } = req.query;
    const query = {};
    if (userId) query.userId = String(userId);
    if (status) query.orderStatus = String(status);
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { paymentId: { $regex: search, $options: "i" } },
      ];
    }
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    // when querying across all users, return per-user order documents (admin view)
    const [items, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Order.countDocuments(query),
    ]);
    res.json({ items, total, page: pageNumber, limit: pageSize });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:orderId", async (req, res) => {
  try {
    const doc = await Order.findOne(
      { "orders.orderId": String(req.params.orderId) },
      { "orders.$": 1, userId: 1 },
    ).lean();
    if (!doc || !doc.orders || !doc.orders.length)
      return res.status(404).json({ error: "Order not found" });
    res.json({ userId: doc.userId, order: doc.orders[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req, res) => {
  const { clientId, addressId } = req.body;
  try {
    const user = await resolveUser(req, clientId);
    if (hasStaleSession(req, user)) return sendSessionInvalid(res);
    if (!user)
      return res
        .status(400)
        .json({ error: "clientId or authentication required" });
    const cartDoc = await Cart.findOne({ userId: user.userId }).lean();
    const carts = cartDoc && Array.isArray(cartDoc.carts) ? cartDoc.carts : [];
    if (!carts.length) return res.status(400).json({ error: "Cart is empty" });
    const items = carts.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      subtotal: i.subtotal,
    }));
    const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const tax = Math.round(subtotal * 0.1);
    const deliveryOption = req.body?.fulfillment?.deliveryOption || "standard";
    const deliveryFee =
      req.body?.mode === "delivery" && deliveryOption === "express" ? 20 : 0;
    const totalAmount = subtotal + tax + deliveryFee;
    // The browser proposes a mode; the server decides what is allowed and what
    // payment status follows from it.
    const paymentMode = req.body?.paymentMode === "cod" ? "cod" : "online";
    if (paymentMode === "cod") {
      const cod = codConfig();
      if (!cod.enabled)
        return res
          .status(400)
          .json({ error: "Cash on Delivery is currently unavailable" });
      if (totalAmount > cod.maxOrderTotal)
        return res.status(400).json({
          error: `Cash on Delivery is available on orders up to ₹${cod.maxOrderTotal}. Please choose an online payment method.`,
        });
    }
    const existingDoc = await Order.findOne({ userId: user.userId }).lean();
    const existingOrderIds =
      existingDoc && Array.isArray(existingDoc.orders)
        ? existingDoc.orders.map((o) => o.orderId)
        : [];
    const orderId = await generateOrderId(user.userId, existingOrderIds);
    const addressDoc = await Address.findOne({ userId: user.userId }).lean();
    const addressList =
      addressDoc && Array.isArray(addressDoc.addresses)
        ? addressDoc.addresses
        : [];
    const address = addressId
      ? addressList.find((a) => a.addressId === String(addressId))
      : addressList.find((a) => a.isDefault) || {};
    // Only the label of the selected method is kept; the checkout modal never
    // sends card numbers, CVVs or UPI credentials.
    const paymentMethod = String(req.body?.paymentMethod || "").slice(0, 60);
    const orderObj = {
      orderId,
      paymentId: "",
      items,
      addressSnapshot: address || {},
      subtotal,
      tax,
      deliveryFee,
      totalAmount,
      orderStatus: "confirmed",
      paymentStatus: paymentMode === "cod" ? "cash due" : "paid",
      paymentMethod,
      paymentMode,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await Order.findOneAndUpdate(
      { userId: user.userId },
      { $push: { orders: orderObj }, $set: { updatedAt: Date.now() } },
      { upsert: true },
    );
    await Cart.deleteOne({ userId: user.userId });

    // Record payment in the Payment collection for the ledger
    const paymentId = "PAY-" + orderId;
    const paymentRecord = {
      paymentId,
      userName: user.name || "",
      userEmail: user.email || "",
      userPhone: user.phoneNumber || "",
      paymentMethod: paymentMethod || "Unknown",
      amountPaid: totalAmount,
      transactionId: "",
      paymentStatus: paymentMode === "cod" ? "cash due" : "paid",
      orderId,
      createdAt: new Date(),
    };

    await Payment.findOneAndUpdate(
      { userId: user.userId },
      {
        $push: { payments: paymentRecord },
        $set: { updatedAt: new Date() },
      },
      { upsert: true },
    );

    // Also update the order's paymentId
    await Order.updateOne(
      { "orders.orderId": orderId },
      { $set: { "orders.$.paymentId": paymentId } },
    );

    res.json({
      orderId,
      total: totalAmount,
      order: { ...orderObj, paymentId },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:orderId", async (req, res) => {
  try {
    const { orderStatus, paymentStatus, paymentId } = req.body;
    const update = {};
    if (orderStatus !== undefined) update["orders.$.orderStatus"] = orderStatus;
    if (paymentStatus !== undefined)
      update["orders.$.paymentStatus"] = paymentStatus;
    if (paymentId !== undefined) update["orders.$.paymentId"] = paymentId;
    if (Object.keys(update).length === 0) return res.json({});
    update["orders.$.updatedAt"] = Date.now();
    await Order.updateOne(
      { "orders.orderId": String(req.params.orderId) },
      { $set: update },
    );
    const doc = await Order.findOne(
      { "orders.orderId": String(req.params.orderId) },
      { "orders.$": 1, userId: 1 },
    ).lean();
    res.json({ userId: doc.userId, order: doc.orders[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:orderId", async (req, res) => {
  try {
    const resu = await Order.updateOne(
      { "orders.orderId": String(req.params.orderId) },
      {
        $pull: { orders: { orderId: String(req.params.orderId) } },
        $set: { updatedAt: Date.now() },
      },
    );
    if (!resu.matchedCount && !resu.modifiedCount)
      return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

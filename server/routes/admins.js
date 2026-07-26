const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const Admin = require("../models/Admin");
const User = require("../models/User");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Product = require("../models/Product");
const Address = require("../models/Address");
const Cart = require("../models/Cart");
const UserPayment = require("../models/UserPayment");
const { buildToken, requireAdmin } = require("../middleware/auth");
const { ensureSnapshotProducts } = require("../utils/productCatalog");

async function flattenOrders() {
  const [orders, users] = await Promise.all([
    Order.find({}).lean(),
    User.find({}).select("userId name email phoneNumber createdAt").lean(),
  ]);

  const userMap = new Map(users.map((user) => [String(user.userId), user]));
  const rows = [];

  for (const doc of orders) {
    const user = userMap.get(String(doc.userId)) || {};
    for (const order of doc.orders || []) {
      rows.push({
        userId: doc.userId,
        customerName: user.name || "Unknown user",
        customerEmail: user.email || "",
        customerPhone: user.phoneNumber || "",
        orderId: order.orderId,
        paymentId: order.paymentId || "",
        orderStatus: order.orderStatus || "pending",
        paymentStatus: order.paymentStatus || "unpaid",
        subtotal: order.subtotal || 0,
        totalAmount: order.totalAmount || 0,
        itemCount: Array.isArray(order.items)
          ? order.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
          : 0,
        items: order.items || [],
        addressSnapshot: order.addressSnapshot || {},
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      });
    }
  }

  rows.sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
  return rows;
}

async function flattenPayments() {
  const [payments, users] = await Promise.all([
    Payment.find({}).lean(),
    User.find({}).select("userId name email phoneNumber createdAt").lean(),
  ]);

  const userMap = new Map(users.map((user) => [String(user.userId), user]));
  const rows = [];

  for (const doc of payments) {
    const user = userMap.get(String(doc.userId)) || {};
    for (const payment of doc.payments || []) {
      rows.push({
        userId: doc.userId,
        customerName: payment.userName || user.name || "Unknown user",
        customerEmail: payment.userEmail || user.email || "",
        customerPhone: payment.userPhone || user.phoneNumber || "",
        paymentId: payment.paymentId,
        orderId: payment.orderId || "",
        paymentMethod: payment.paymentMethod || "",
        amountPaid: payment.amountPaid || 0,
        transactionId: payment.transactionId || "",
        paymentStatus: payment.paymentStatus || "pending",
        createdAt: payment.createdAt,
      });
    }
  }

  rows.sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
  return rows;
}

async function buildDashboard() {
  await ensureSnapshotProducts();
  const [
    orders,
    payments,
    products,
    users,
    admins,
    addressesCount,
    cartsCount,
    userPaymentsCount,
    dbStats,
  ] = await Promise.all([
    flattenOrders(),
    flattenPayments(),
    Product.find({}).sort({ createdAt: -1 }).lean(),
    User.find({}).select("userId name email isActive createdAt").lean(),
    Admin.find({}).select("adminId name email isActive createdAt").lean(),
    Address.countDocuments({}),
    Cart.countDocuments({}),
    UserPayment.countDocuments({}),
    mongoose.connection.db.stats(),
  ]);

  const activeProducts = products.filter((product) => !product.isArchived);
  const archivedProducts = products.filter((product) => product.isArchived);
  const totalSales = orders.reduce(
    (sum, order) => sum + (order.totalAmount || 0),
    0,
  );
  const totalEarnings = payments.reduce(
    (sum, payment) =>
      sum +
      (String(payment.paymentStatus).toLowerCase() === "paid"
        ? payment.amountPaid || 0
        : 0),
    0,
  );
  const orderStatusCounts = orders.reduce((acc, order) => {
    const key = String(order.orderStatus || "unknown");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const paymentStatusCounts = payments.reduce((acc, payment) => {
    const key = String(payment.paymentStatus || "unknown");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const productSales = new Map();

  orders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const key = item.productName || item.productId || "Unknown item";
      const current = productSales.get(key) || {
        productName: key,
        quantity: 0,
        revenue: 0,
      };
      current.quantity += Number(item.quantity) || 0;
      current.revenue += Number(item.subtotal) || 0;
      productSales.set(key, current);
    });
  });

  return {
    totals: {
      users: users.length,
      orders: orders.length,
      payments: payments.length,
      paidPayments: paymentStatusCounts.paid || 0,
      pendingPayments: paymentStatusCounts.pending || 0,
      totalSales,
      totalEarnings,
      activeProducts: activeProducts.length,
      archivedProducts: archivedProducts.length,
      orderStatusCounts,
      paymentStatusCounts,
    },
    topProducts: Array.from(productSales.values())
      .sort((left, right) => right.revenue - left.revenue)
      .slice(0, 8),
    orders,
    payments,
    recentOrders: orders.slice(0, 25),
    recentPayments: payments.slice(0, 25),
    products: { active: activeProducts, archived: archivedProducts },
    database: {
      name: mongoose.connection.db.databaseName,
      host: mongoose.connection.host || "",
      port: mongoose.connection.port || "",
      stateCode: mongoose.connection.readyState,
      status:
        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      serverTime: new Date().toISOString(),
      collections: dbStats.collections,
      objects: dbStats.objects,
      dataSize: dbStats.dataSize,
      storageSize: dbStats.storageSize,
      indexes: dbStats.indexes,
      avgObjSize: dbStats.avgObjSize,
      collectionCounts: {
        users: users.length,
        admins: admins.length,
        products: products.length,
        addresses: addressesCount,
        carts: cartsCount,
        orders: orders.length,
        payments: payments.length,
        userPayments: userPaymentsCount,
      },
    },
  };
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "email,password required" });
    const admin = await Admin.findOne({ email });
    if (!admin || !admin.isActive)
      return res.status(400).json({ error: "Invalid admin credentials" });
    const ok = await admin.verifyPassword(password);
    if (!ok)
      return res.status(400).json({ error: "Invalid admin credentials" });
    const token = buildToken({
      id: admin.adminId,
      adminId: admin.adminId,
      name: admin.name,
      email: admin.email,
      role: "admin",
    });
    res.json({
      token,
      admin: {
        adminId: admin.adminId,
        name: admin.name,
        email: admin.email,
        phoneNumber: admin.phoneNumber || "",
        role: admin.role || "admin",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.use(requireAdmin);

router.get("/dashboard", async (req, res) => {
  try {
    res.json(await buildDashboard());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { search = "", role, isActive, page = "1", limit = "20" } = req.query;
    const query = {};
    if (role) query.role = String(role);
    if (isActive !== undefined) query.isActive = isActive === "true";
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { adminId: { $regex: search, $options: "i" } },
      ];
    }
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const [items, total] = await Promise.all([
      Admin.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .select("-passwordHash")
        .lean(),
      Admin.countDocuments(query),
    ]);
    res.json({ items, total, page: pageNumber, limit: pageSize });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:adminId", async (req, res) => {
  try {
    const admin = await Admin.findOne({ adminId: String(req.params.adminId) })
      .select("-passwordHash")
      .lean();
    if (!admin) return res.status(404).json({ error: "Admin not found" });
    res.json(admin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, email, password, phoneNumber, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "name,email,password required" });
    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await Admin.create({
      name,
      email,
      passwordHash,
      phoneNumber,
      role,
    });
    res.status(201).json(admin.toJSON());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:adminId", async (req, res) => {
  try {
    const admin = await Admin.findOne({ adminId: String(req.params.adminId) });
    if (!admin) return res.status(404).json({ error: "Admin not found" });
    const { name, email, phoneNumber, role, isActive, password } = req.body;
    if (name !== undefined) admin.name = name;
    if (email !== undefined) admin.email = email;
    if (phoneNumber !== undefined) admin.phoneNumber = phoneNumber;
    if (role !== undefined) admin.role = role;
    if (isActive !== undefined) admin.isActive = !!isActive;
    if (password) admin.passwordHash = await bcrypt.hash(password, 10);
    await admin.save();
    res.json(admin.toJSON());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:adminId", async (req, res) => {
  try {
    const admin = await Admin.findOneAndDelete({
      adminId: String(req.params.adminId),
    });
    if (!admin) return res.status(404).json({ error: "Admin not found" });
    res.json({ message: "Admin deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

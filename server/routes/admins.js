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

// Escape a value so it can be used inside a RegExp literal safely.
function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Admin records keep the exact email casing they were created with, so match
// exactly first and fall back to a case-insensitive lookup for sign-in.
async function findAdminByEmail(email) {
  const exact = await Admin.findOne({ email });
  if (exact) return exact;
  return Admin.findOne({
    email: { $regex: `^${escapeRegex(email)}$`, $options: "i" },
  });
}

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
        paymentMethod: order.paymentMethod || "",
        paymentMode: order.paymentMode || "online",
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
    // Admin accounts come from the database only; nothing is hardcoded here.
    const admin = await findAdminByEmail(String(email).trim());
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

// Detailed database information for admin modal views
router.get("/database/details", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collectionsInfo = await db.listCollections().toArray();

    // Parallelize all collection stats
    const [collectionDetails, users, admins, dbStats] = await Promise.all([
      Promise.all(
        collectionsInfo.map(async (col) => {
          const stats = await db.collection(col.name).stats();
          return {
            name: col.name,
            type: col.type,
            documents: stats.count || 0,
            storageSize: stats.storageSize || 0,
            avgDocSize: stats.avgObjSize || 0,
            indexes: stats.nindexes || 0,
            totalIndexSize: stats.totalIndexSize || 0,
          };
        }),
      ),
      User.find({})
        .select("userId name email phone phoneNumber isActive createdAt")
        .sort({ createdAt: -1 })
        .lean(),
      Admin.find({}).select("-passwordHash").sort({ createdAt: -1 }).lean(),
      db.stats(),
    ]);

    // Parallelize document fetching (limit 30 per collection for speed)
    const docResults = await Promise.all(
      collectionsInfo.map(async (col) => {
        const docs = await db
          .collection(col.name)
          .find({})
          .sort({ _id: -1 })
          .toArray();
        return [
          col.name,
          docs.map((doc) => ({
            _id: String(doc._id),
            ...Object.fromEntries(
              Object.entries(doc)
                .filter(
                  ([key]) =>
                    key !== "_id" && key !== "passwordHash" && key !== "data",
                )
                .map(([key, val]) => {
                  if (typeof val === "string" && val.length > 300)
                    return [key, val.slice(0, 300) + "..."];
                  if (Buffer.isBuffer(val))
                    return [key, `[Binary: ${val.length} bytes]`];
                  return [key, val];
                }),
            ),
          })),
        ];
      }),
    );
    const documentsByCollection = Object.fromEntries(docResults);

    const storageBreakdown = collectionDetails.map((c) => ({
      name: c.name,
      storageSize: c.storageSize,
      documents: c.documents,
      indexSize: c.totalIndexSize,
    }));

    res.json({
      collections: collectionDetails,
      users,
      admins,
      documentsByCollection,
      storageBreakdown,
      totals: {
        collections: collectionsInfo.length,
        documents: dbStats.objects || 0,
        storageSize: dbStats.storageSize || 0,
        dataSize: dbStats.dataSize || 0,
        indexSize: dbStats.indexSize || 0,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load database details" });
  }
});

// Generate real unique IDs for a collection (preview before save)
const {
  generateUniqueNumericId: genId,
  peekNextProductCode,
  resetProductCodeState,
} = require("../utils/idGenerator");

router.get("/database/generate-id/:collection", async (req, res) => {
  try {
    const col = req.params.collection.toLowerCase();
    const result = {};

    if (col === "products") {
      result.productId = await genId(Product, "productId", 12);
      result.productCode = await peekNextProductCode(Product);
    } else if (col === "admins") {
      result.adminId = await genId(Admin, "adminId", 12);
    } else if (col === "users") {
      const { randomNumeric } = require("../utils/idGenerator");
      for (let i = 0; i < 1000; i++) {
        const candidate = randomNumeric(8);
        const exists = await User.findOne({ userId: candidate }).lean();
        if (!exists) {
          result.userId = candidate;
          break;
        }
      }
      if (!result.userId) {
        const { randomNumeric: rn } = require("../utils/idGenerator");
        result.userId = rn(8);
      }
    } else if (col === "addresses") {
      result.addressId = `addr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    } else if (col === "orders") {
      result.orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
    } else if (col === "payments") {
      result.paymentId = `PAY-${Date.now()}${Math.floor(Math.random() * 1000)}`;
    } else if (col === "carts") {
      result.cartId = `cart_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ID generation failed" });
  }
});

// Return model schemas for form generation
router.get("/database/schemas", (req, res) => {
  const schemas = {};
  const models = mongoose.modelNames();
  const EXCLUDE = [
    "__v",
    "_id",
    "_createdBy",
    "_lastUpdatedBy",
    "passwordHash",
    "data",
    "checksum",
  ];
  models.forEach((name) => {
    const model = mongoose.model(name);
    const paths = model.schema.paths;
    const fields = {};
    Object.entries(paths).forEach(([key, schema]) => {
      if (EXCLUDE.includes(key)) return;
      fields[key] = {
        type: schema.instance || "String",
        required: !!schema.isRequired,
        default: schema.defaultValue !== undefined ? schema.defaultValue : null,
      };
    });
    schemas[model.collection.collectionName] = { modelName: name, fields };
  });
  res.json(schemas);
});

// CRUD: Update a document in any collection
router.put("/database/document/:collection/:docId", async (req, res) => {
  try {
    const { collection, docId } = req.params;
    const db = mongoose.connection.db;
    const { ObjectId } = require("mongoose").Types;
    const update = req.body;
    delete update._id; // never overwrite _id
    // Track who performed this update
    update._lastUpdatedBy = {
      adminId: req.user.adminId || req.user.id,
      name: req.user.name || "",
      at: new Date().toISOString(),
    };
    const result = await db
      .collection(collection)
      .updateOne({ _id: new ObjectId(docId) }, { $set: update });
    if (result.matchedCount === 0)
      return res.status(404).json({ error: "Document not found" });
    res.json({
      message: "Document updated",
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Update failed" });
  }
});

// CRUD: Delete a document from any collection
router.delete("/database/document/:collection/:docId", async (req, res) => {
  try {
    const { collection, docId } = req.params;
    const db = mongoose.connection.db;
    const { ObjectId } = require("mongoose").Types;
    const result = await db
      .collection(collection)
      .deleteOne({ _id: new ObjectId(docId) });
    if (result.deletedCount === 0)
      return res.status(404).json({ error: "Document not found" });
    res.json({ message: "Document deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Delete failed" });
  }
});

// CRUD: Create a document in any collection
router.post("/database/document/:collection", async (req, res) => {
  try {
    const { collection } = req.params;
    const db = mongoose.connection.db;
    const doc = req.body;
    delete doc._id; // let MongoDB generate _id
    // Track who created this document
    doc._createdBy = {
      adminId: req.user.adminId || req.user.id,
      name: req.user.name || "",
      at: new Date().toISOString(),
    };
    const result = await db.collection(collection).insertOne(doc);
    res
      .status(201)
      .json({ message: "Document created", insertedId: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Create failed" });
  }
});

// CRUD: Drop a collection
router.delete("/database/collection/:collection", async (req, res) => {
  try {
    const { collection } = req.params;
    const db = mongoose.connection.db;
    await db.collection(collection).drop();
    res.json({ message: `Collection '${collection}' dropped` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Drop failed" });
  }
});

// CRUD: Delete user by userId
router.delete("/database/user/:userId", async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ userId: req.params.userId });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Delete failed" });
  }
});

// CRUD: Update user by userId
router.put("/database/user/:userId", async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    if (!user) return res.status(404).json({ error: "User not found" });
    const { name, email, phone, isActive } = req.body;
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (isActive !== undefined) user.isActive = !!isActive;
    await user.save();
    res.json({ message: "User updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Update failed" });
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
      _createdBy: req.user
        ? {
            adminId: req.user.adminId || req.user.id,
            name: req.user.name || "",
            at: new Date().toISOString(),
          }
        : null,
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
    admin._lastUpdatedBy = req.user
      ? {
          adminId: req.user.adminId || req.user.id,
          name: req.user.name || "",
          at: new Date().toISOString(),
        }
      : null;
    admin.updatedAt = new Date();
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

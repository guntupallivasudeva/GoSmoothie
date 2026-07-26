const mongoose = require("mongoose");
require("dotenv").config();
const User = require("../models/User");
const Product = require("../models/Product");
const Address = require("../models/Address");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const UserPayment = require("../models/UserPayment");
const Admin = require("../models/Admin");
const bcrypt = require("bcrypt");
const { generateOrderId } = require("../utils/idGenerator");

const MONGO =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/gosmoothie_test";

async function createProducts(count = 10) {
  const products = [];
  for (let i = 0; i < count; i++) {
    const p = await Product.create({
      name: `Generated Product ${i + 1} ${Date.now()}`,
      description: "Auto-generated",
      price: 100 + i * 10,
      image: "",
      meta: { calories: 100 + i },
    });
    products.push(p);
  }
  return products;
}

async function createUsers(count = 5) {
  const users = [];
  for (let i = 0; i < count; i++) {
    const hash = await bcrypt.hash("Password1!", 10);
    const u = await User.create({
      name: `TestUser${i + 1}-${Date.now()}`,
      email: `genuser${i + 1}-${Date.now()}@example.com`,
      passwordHash: hash,
      phoneNumber: "9000000000",
    });
    users.push(u);
  }
  return users;
}

async function createAdmins(count = 2) {
  const admins = [];
  for (let i = 0; i < count; i++) {
    const hash = await bcrypt.hash("AdminPass1!", 10);
    const a = await Admin.create({
      name: `Admin${i + 1}-${Date.now()}`,
      email: `genadmin${i + 1}-${Date.now()}@example.com`,
      passwordHash: hash,
    });
    admins.push(a);
  }
  return admins;
}

async function populateForUser(user) {
  // addresses
  const addresses = [];
  for (let j = 0; j < 3; j++) {
    const addrId = await require("../utils/idGenerator").generate12DigitId();
    const aObj = {
      addressId: addrId,
      fullName: user.name,
      addressLine1: `Addr ${j + 1} for ${user.userId}`,
      city: "City",
      state: "ST",
      country: "US",
      pincode: "000000",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await Address.findOneAndUpdate(
      { userId: user.userId },
      { $push: { addresses: aObj }, $set: { updatedAt: Date.now() } },
      { upsert: true },
    );
    addresses.push(aObj);
  }
  // carts
  const carts = [];
  for (let k = 0; k < 5; k++) {
    const cartId = await require("../utils/idGenerator").generate12DigitId();
    const cObj = {
      cartId,
      productName: `CartItem ${k + 1}`,
      productId: "000000000000",
      quantity: k + 1,
      unitPrice: 50 + k * 10,
      subtotal: (k + 1) * (50 + k * 10),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await Cart.findOneAndUpdate(
      { userId: user.userId },
      { $push: { carts: cObj }, $set: { updatedAt: Date.now() } },
      { upsert: true },
    );
    carts.push(cObj);
  }
  // orders
  const orders = [];
  for (let o = 0; o < 3; o++) {
    const existingDoc = await Order.findOne({ userId: user.userId }).lean();
    const existingOrderIds =
      existingDoc && Array.isArray(existingDoc.orders)
        ? existingDoc.orders.map((x) => x.orderId)
        : [];
    const orderId = await generateOrderId(user.userId, existingOrderIds);
    const ordObj = {
      orderId,
      items: carts
        .slice(0, 2)
        .map((ci) => ({
          productId: ci.productId,
          productName: ci.productName,
          quantity: ci.quantity,
          unitPrice: ci.unitPrice,
          subtotal: ci.subtotal,
        })),
      subtotal: 100,
      totalAmount: 100,
      orderStatus: "confirmed",
      paymentStatus: "unpaid",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await Order.findOneAndUpdate(
      { userId: user.userId },
      { $push: { orders: ordObj }, $set: { updatedAt: Date.now() } },
      { upsert: true },
    );
    orders.push(ordObj);
  }
  // payments
  const payments = [];
  for (let p = 0; p < 3; p++) {
    const paymentId = await require("../utils/idGenerator").generate12DigitId();
    const payObj = {
      paymentId,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phoneNumber,
      paymentMethod: "card",
      amountPaid: 100,
      transactionId: `txn-${Date.now()}-${p}`,
      paymentStatus: "paid",
      orderId: orders[p % orders.length].orderId,
      createdAt: Date.now(),
    };
    await Payment.findOneAndUpdate(
      { userId: user.userId },
      { $push: { payments: payObj }, $set: { updatedAt: Date.now() } },
      { upsert: true },
    );
    await UserPayment.findOneAndUpdate(
      { userId: user.userId },
      {
        $push: {
          payments: {
            paymentId: paymentId,
            paymentMethod: payObj.paymentMethod,
            amountPaid: payObj.amountPaid,
            transactionId: payObj.transactionId,
            paymentStatus: payObj.paymentStatus,
            orderId: payObj.orderId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        },
        $set: { updatedAt: Date.now() },
      },
      { upsert: true },
    );
    payments.push(payObj);
  }
  return { addresses, carts, orders, payments };
}

async function main() {
  await mongoose.connect(MONGO, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Connected to", MONGO);
  // cleanup test DB
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Address.deleteMany({}),
    Cart.deleteMany({}),
    Order.deleteMany({}),
    Payment.deleteMany({}),
    UserPayment.deleteMany({}),
    Admin.deleteMany({}),
  ]);
  const products = await createProducts(10);
  const users = await createUsers(5);
  const admins = await createAdmins(2);
  const summary = {
    users: [],
    products: products.map((p) => ({ productId: p.productId, name: p.name })),
    admins: admins.map((a) => ({ adminId: a.adminId, email: a.email })),
  };
  for (const u of users) {
    const s = await populateForUser(u);
    summary.users.push({
      userId: u.userId,
      addresses: s.addresses.map((a) => a.addressId),
      carts: s.carts.map((c) => c.cartId),
      orders: s.orders.map((o) => o.orderId),
      payments: s.payments.map((p) => p.paymentId),
    });
  }
  console.log(JSON.stringify(summary, null, 2));
  await mongoose.connection.close();
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

const mongoose = require("mongoose");
require("dotenv").config();
const User = require("../models/User");
const Address = require("../models/Address");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const UserPayment = require("../models/UserPayment");

const MONGO =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/gosmoothie_test";

function is8(str) {
  return typeof str === "string" && /^\d{8}$/.test(str);
}
function is12(str) {
  return typeof str === "string" && /^\d{12}$/.test(str);
}

async function main() {
  await mongoose.connect(MONGO, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Connected to DB");
  const users = await User.find().lean();
  if (!users.length) {
    console.log("No users");
    process.exit(1);
  }
  let errors = [];
  for (const u of users) {
    if (!is8(u.userId))
      errors.push(`User ${u.email || u.name} has invalid userId ${u.userId}`);
    const [addressesDoc, cartsDoc, ordersDoc, paymentsDoc, userPaymentDoc] =
      await Promise.all([
        Address.findOne({ userId: u.userId }).lean(),
        Cart.findOne({ userId: u.userId }).lean(),
        Order.findOne({ userId: u.userId }).lean(),
        Payment.findOne({ userId: u.userId }).lean(),
        UserPayment.findOne({ userId: u.userId }).lean(),
      ]);
    const addresses =
      addressesDoc && Array.isArray(addressesDoc.addresses)
        ? addressesDoc.addresses
        : [];
    const carts =
      cartsDoc && Array.isArray(cartsDoc.carts) ? cartsDoc.carts : [];
    const orders =
      ordersDoc && Array.isArray(ordersDoc.orders) ? ordersDoc.orders : [];
    const payments =
      paymentsDoc && Array.isArray(paymentsDoc.payments)
        ? paymentsDoc.payments
        : [];
    addresses.forEach((a) => {
      if (!is12(a.addressId))
        errors.push(`Address ${a.addressId} for user ${u.userId} invalid`);
    });
    carts.forEach((c) => {
      if (!is12(c.cartId))
        errors.push(`Cart ${c.cartId} for user ${u.userId} invalid`);
    });
    orders.forEach((o) => {
      if (!is12(o.orderId))
        errors.push(`Order ${o.orderId} for user ${u.userId} invalid`);
      if (!o.orderId.startsWith(u.userId))
        errors.push(
          `Order ${o.orderId} does not start with userId ${u.userId}`,
        );
    });
    payments.forEach((p) => {
      if (!is12(p.paymentId))
        errors.push(`Payment ${p.paymentId} for user ${u.userId} invalid`);
    });
    const userPayments =
      userPaymentDoc && Array.isArray(userPaymentDoc.payments)
        ? userPaymentDoc.payments
        : [];
    userPayments.forEach((up) => {
      if (!is12(up.paymentId))
        errors.push(`UserPayment ${up.paymentId} for user ${u.userId} invalid`);
    });
    // Check toJSON does not expose _id
    const uDoc = await User.findOne({ userId: u.userId });
    const userJson = uDoc.toJSON();
    if (Object.prototype.hasOwnProperty.call(userJson, "_id"))
      errors.push(`User ${u.userId} JSON exposes _id`);
    // sample child: check parent docs don't expose _id
    if (addressesDoc) {
      if (Object.prototype.hasOwnProperty.call(addressesDoc, "_id"))
        errors.push(`Address document for ${u.userId} exposes _id`);
    }
    if (cartsDoc) {
      if (Object.prototype.hasOwnProperty.call(cartsDoc, "_id"))
        errors.push(`Cart document for ${u.userId} exposes _id`);
    }
    if (ordersDoc) {
      if (Object.prototype.hasOwnProperty.call(ordersDoc, "_id"))
        errors.push(`Order document for ${u.userId} exposes _id`);
    }
  }
  const admins = await require("../models/Admin").find().lean();
  admins.forEach((a) => {
    if (!is12(a.adminId)) errors.push(`Admin ${a.email} adminId invalid`);
  });
  const products = await require("../models/Product").find().lean();
  products.forEach((p) => {
    if (!is12(p.productId)) errors.push(`Product ${p.name} productId invalid`);
  });

  if (errors.length) {
    console.log("Validation FAILED:");
    errors.forEach((e) => console.log(" -", e));
    process.exit(2);
  }
  console.log("All validations passed.");
  await mongoose.connection.close();
}

if (require.main === module)
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });

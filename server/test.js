/**
 * GoSmoothie Basic Test Suite
 * Run with: npm test
 */

require("dotenv").config();
const mongoose = require("mongoose");
const assert = require("assert");

const User = require("./models/User");
const Product = require("./models/Product");
const Cart = require("./models/Cart");
const Order = require("./models/Order");

const MONGO =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/gosmoothie_test";

// Test suite
const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

// Helper to generate test data
function generateTestUser() {
  return {
    name: "Test User " + Date.now(),
    email: "test" + Date.now() + "@example.com",
  };
}

// ============= TESTS =============

test("should connect to MongoDB", async () => {
  await mongoose.connect(MONGO, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  assert(mongoose.connection.readyState === 1, "Not connected to MongoDB");
});

test("should create a user with password hash", async () => {
  const bcrypt = require("bcrypt");
  const data = generateTestUser();
  const hash = await bcrypt.hash("testpass123", 10);
  const user = await User.create({ ...data, passwordHash: hash });
  assert(user._id, "User ID not generated");
  assert(user.passwordHash, "Password hash not set");
});

test("should verify user password correctly", async () => {
  const bcrypt = require("bcrypt");
  const data = generateTestUser();
  const pwd = "testpass123";
  const hash = await bcrypt.hash(pwd, 10);
  const user = await User.create({ ...data, passwordHash: hash });

  const isValid = await user.verifyPassword(pwd);
  assert(isValid === true, "Valid password not verified");

  const isInvalid = await user.verifyPassword("wrongpass");
  assert(isInvalid === false, "Invalid password verified");
});

test("should create a product with metadata", async () => {
  const product = await Product.create({
    name: "Test Smoothie",
    description: "A test smoothie",
    price: 300,
    image: "https://example.com/image.jpg",
    meta: {
      calories: 250,
      protein: 10,
      carbs: 40,
      fat: 5,
      fiber: 3,
    },
  });
  assert(product._id, "Product ID not generated");
  assert.strictEqual(product.meta.calories, 250, "Metadata not saved");
});

test("should add item to cart", async () => {
  const user = await User.create({
    ...generateTestUser(),
    passwordHash: await require("bcrypt").hash("testpass123", 10),
  });
  const cartId = `test_cart_${Date.now()}`;
  const cart = await Cart.create({
    userId: user.userId,
    carts: [
      {
        cartId,
        productId: "prod_test",
        productName: "Berry Blast",
        quantity: 2,
        unitPrice: 300,
        subtotal: 600,
      },
    ],
  });
  assert.strictEqual(cart.carts.length, 1, "Item not added");
  assert.strictEqual(cart.carts[0].quantity, 2, "Quantity not set");
});

test("should update cart item quantity", async () => {
  const user = await User.create({
    ...generateTestUser(),
    passwordHash: await require("bcrypt").hash("testpass123", 10),
  });
  const cartId = `test_cart_${Date.now()}`;
  const cart = await Cart.create({
    userId: user.userId,
    carts: [
      {
        cartId,
        productId: "prod_test",
        productName: "Berry Blast",
        quantity: 1,
        unitPrice: 300,
        subtotal: 300,
      },
    ],
  });

  // Update quantity
  cart.carts[0].quantity = 5;
  cart.carts[0].subtotal = cart.carts[0].unitPrice * 5;
  await cart.save();

  const updated = await Cart.findById(cart._id);
  assert.strictEqual(updated.carts[0].quantity, 5, "Quantity not updated");
});

test("should create an order from cart items", async () => {
  const user = await User.create({
    ...generateTestUser(),
    passwordHash: await require("bcrypt").hash("testpass123", 10),
  });
  const items = [
    {
      productId: "prod_1",
      productName: "Green Goddess",
      unitPrice: 250,
      quantity: 1,
      subtotal: 250,
    },
    {
      productId: "prod_2",
      productName: "Berry Blast",
      unitPrice: 300,
      quantity: 2,
      subtotal: 600,
    },
  ];

  const order = await Order.create({
    userId: user.userId,
    orders: [
      {
        orderId: `${user.userId}0001`,
        items,
        subtotal: 850,
        tax: 0,
        deliveryFee: 0,
        totalAmount: 850,
        orderStatus: "confirmed",
        paymentStatus: "unpaid",
      },
    ],
  });

  assert.strictEqual(order.orders.length, 1, "Order entry not created");
  assert.strictEqual(order.orders[0].items.length, 2, "Items not set");
  assert.strictEqual(order.orders[0].totalAmount, 850, "Total not calculated");
  assert.strictEqual(
    order.orders[0].orderStatus,
    "confirmed",
    "Status not set",
  );
});

test("should find order by clientId", async () => {
  const user = await User.create({
    ...generateTestUser(),
    passwordHash: await require("bcrypt").hash("testpass123", 10),
  });
  const orderId = `${user.userId}0002`;
  const order = await Order.create({
    userId: user.userId,
    orders: [
      {
        orderId,
        items: [
          {
            productId: "prod_3",
            productName: "Test",
            unitPrice: 100,
            quantity: 1,
            subtotal: 100,
          },
        ],
        subtotal: 100,
        tax: 0,
        deliveryFee: 0,
        totalAmount: 100,
        orderStatus: "completed",
        paymentStatus: "paid",
      },
    ],
  });

  const found = await Order.findOne({ "orders.orderId": orderId });
  assert(found._id.equals(order._id), "Order not found");
});

test("should cleanup test data", async () => {
  // Delete test products
  const delProducts = await Product.deleteMany({ name: "Test Smoothie" });
  assert(delProducts.deletedCount >= 0, "Failed to delete test products");

  // Delete test carts
  const testUsers = await User.find({
    email: { $regex: /^test.*@example\.com$/ },
  }).select("userId");
  const testUserIds = testUsers.map((u) => u.userId).filter(Boolean);

  const delCarts = await Cart.deleteMany({ userId: { $in: testUserIds } });
  assert(delCarts.deletedCount >= 0, "Failed to delete test carts");

  // Delete test orders
  const delOrders = await Order.deleteMany({ userId: { $in: testUserIds } });
  assert(delOrders.deletedCount >= 0, "Failed to delete test orders");

  // Delete test users
  const delUsers = await User.deleteMany({
    email: { $regex: /^test.*@example\.com$/ },
  });
  assert(delUsers.deletedCount >= 0, "Failed to delete test users");
});

// ============= RUN TESTS =============

async function runTests() {
  console.log("\n🧪 Running GoSmoothie Tests...\n");

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    try {
      await t.fn();
      console.log(`✅ ${t.name}`);
      passed++;
    } catch (err) {
      console.log(`❌ ${t.name}`);
      console.log(`   Error: ${err.message}\n`);
      failed++;
    }
  }

  // Cleanup
  try {
    await mongoose.connection.close();
  } catch (e) {}

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

// Run if this file is executed directly
if (require.main === module) {
  runTests().catch((err) => {
    console.error("❌ Test suite error:", err.message);
    process.exit(1);
  });
}

module.exports = { test, runTests };

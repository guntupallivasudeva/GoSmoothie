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

async function main() {
  await mongoose.connect(MONGO, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Connected to DB");
  const user = await User.findOne().lean();
  if (!user) {
    console.log("No users found");
    process.exit(1);
  }
  console.log("Deleting userId", user.userId);
  await User.findOneAndDelete({ userId: user.userId });
  await Promise.all([
    Address.deleteMany({ userId: user.userId }),
    Cart.deleteMany({ userId: user.userId }),
    Order.deleteMany({ userId: user.userId }),
    UserPayment.deleteMany({ userId: user.userId }),
    Payment.deleteMany({ userId: user.userId }),
  ]);
  const remaining = await Promise.all([
    Address.countDocuments({ userId: user.userId }),
    Cart.countDocuments({ userId: user.userId }),
    Order.countDocuments({ userId: user.userId }),
    Payment.countDocuments({ userId: user.userId }),
    UserPayment.countDocuments({ userId: user.userId }),
    User.countDocuments({ userId: user.userId }),
  ]);
  console.log(
    "Remaining counts [addresses,carts,orders,payments,userPayments,users]:",
    remaining,
  );
  await mongoose.connection.close();
}

if (require.main === module)
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });

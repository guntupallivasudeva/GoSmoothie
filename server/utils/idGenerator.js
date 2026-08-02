function randomNumeric(length) {
  let s = "";
  for (let i = 0; i < length; i += 1)
    s += Math.floor(Math.random() * 10).toString();
  return s;
}

function isExactNumericId(value, length) {
  return (
    typeof value === "string" && new RegExp(`^\\d{${length}}$`).test(value)
  );
}

async function generateUniqueNumericId(model, field, length, options = {}) {
  const maxAttempts = options.maxAttempts || 1000;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = randomNumeric(length);
    const query = {};
    query[field] = candidate;
    const existing = await model
      .findOne(query)
      .lean()
      .exec()
      .catch(() => null);
    if (!existing) return candidate;
  }
  throw new Error(`Unable to generate unique ${length}-digit id for ${field}`);
}

async function generateOrderId(userId, existingIds = []) {
  if (!isExactNumericId(userId, 8)) {
    throw new Error("userId must be an 8-digit numeric string");
  }
  const used = new Set(
    Array.isArray(existingIds) ? existingIds.map(String) : [],
  );
  for (let attempt = 0; attempt < 10000; attempt += 1) {
    const candidate = `${userId}${randomNumeric(4)}`;
    if (!used.has(candidate)) return candidate;
  }
  throw new Error("Unable to generate unique orderId");
}

let productCodeState = null;

async function generateNextProductCode(ProductModel) {
  if (productCodeState === null) {
    const existing = await ProductModel.find({ productCode: /^PROD\d+$/ })
      .select("productCode")
      .lean();
    let max = 0;
    for (const item of existing) {
      const match = String(item.productCode || "").match(/^PROD(\d+)$/);
      if (match) max = Math.max(max, parseInt(match[1], 10) || 0);
    }
    productCodeState = max;
  }
  productCodeState += 1;
  return `PROD${productCodeState}`;
}

// Preview the next product code without incrementing permanently
async function peekNextProductCode(ProductModel) {
  if (productCodeState === null) {
    const existing = await ProductModel.find({ productCode: /^PROD\d+$/ })
      .select("productCode")
      .lean();
    let max = 0;
    for (const item of existing) {
      const match = String(item.productCode || "").match(/^PROD(\d+)$/);
      if (match) max = Math.max(max, parseInt(match[1], 10) || 0);
    }
    productCodeState = max;
  }
  return `PROD${productCodeState + 1}`;
}

// Reset state so it re-scans from DB (call after product save or abandon)
function resetProductCodeState() {
  productCodeState = null;
}

function generate8DigitId() {
  return randomNumeric(8);
}

function generate12DigitId() {
  return randomNumeric(12);
}

module.exports = {
  generate8DigitId,
  generate12DigitId,
  randomNumeric,
  isExactNumericId,
  generateUniqueNumericId,
  generateOrderId,
  generateNextProductCode,
  peekNextProductCode,
  resetProductCodeState,
};

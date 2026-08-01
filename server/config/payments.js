const COD_ENABLED_DEFAULT = true;
const COD_MAX_TOTAL_DEFAULT = 2000;

// Env variables arrive as strings, so anything that is not recognisably falsey
// counts as enabled.
function readBoolean(raw, fallback) {
  if (raw === undefined || raw === null || String(raw).trim() === "")
    return fallback;
  const value = String(raw).trim().toLowerCase();
  if (["false", "0", "no", "off"].includes(value)) return false;
  if (["true", "1", "yes", "on"].includes(value)) return true;
  return fallback;
}

function readPositiveNumber(raw, fallback) {
  if (raw === undefined || raw === null || String(raw).trim() === "")
    return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return value;
}

// Cash on Delivery settings, resolved on every call so a restart is not needed
// to pick up an env change.
function codConfig() {
  return {
    enabled: readBoolean(process.env.COD_ENABLED, COD_ENABLED_DEFAULT),
    maxOrderTotal: readPositiveNumber(
      process.env.COD_MAX_TOTAL,
      COD_MAX_TOTAL_DEFAULT,
    ),
    currency: "INR",
  };
}

module.exports = { codConfig };

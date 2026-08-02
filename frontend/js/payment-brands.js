/**
 * GoSmoothie — payment brand registry.
 *
 * One place that maps a brand slug to its vendored artwork, its lettered-chip
 * fallback and the markup used by the payment modal. Artwork lives in
 * `assets/brands/` and is served from this project's own origin, so the modal
 * makes no third-party requests.
 *
 * `file: null` means no usable official SVG could be obtained for that brand;
 * `mark()` then returns the lettered chip that the modal used before, which is
 * the specified fallback rather than a failure.
 *
 * Provenance for every shipped file is recorded in assets/brands/SOURCES.md.
 */
(function initPaymentBrands(global) {
  "use strict";

  const BASE = "/assets/brands/";

  // slug -> { name, file, short, color }
  const BRANDS = {
    /* ---------- UPI apps ---------- */
    "google-pay": {
      name: "Google Pay",
      file: "google-pay.svg",
      short: "GP",
      color: "#4285f4",
    },
    phonepe: {
      name: "PhonePe",
      file: "phonepe.svg",
      short: "Pe",
      color: "#5f259f",
    },
    paytm: { name: "Paytm", file: "paytm.svg", short: "Pt", color: "#00baf2" },
    bhim: { name: "BHIM UPI", file: "bhim.svg", short: "BH", color: "#ef4444" },

    /* ---------- card networks ---------- */
    visa: { name: "Visa", file: "visa.svg", short: "VI", color: "#1a1f71" },
    mastercard: {
      name: "Mastercard",
      file: "mastercard.svg",
      short: "MC",
      color: "#eb001b",
    },
    rupay: { name: "RuPay", file: "rupay.svg", short: "RU", color: "#0f766e" },
    amex: {
      name: "American Express",
      file: "amex.svg",
      short: "AE",
      color: "#2563eb",
    },

    /* ---------- wallets ---------- */
    "amazon-pay": {
      name: "Amazon Pay",
      file: "amazon-pay.svg",
      short: "az",
      color: "#232f3e",
    },
    mobikwik: { name: "Mobikwik", file: null, short: "Mw", color: "#2563eb" },
    "ola-money": { name: "Ola Money", file: null, short: "Ol", color: "#166534" },

    /* ---------- banks ---------- */
    sbi: {
      name: "State Bank of India",
      file: "sbi.svg",
      short: "SB",
      color: "#22409a",
    },
    hdfc: { name: "HDFC Bank", file: "hdfc.svg", short: "HD", color: "#e11d2e" },
    icici: {
      name: "ICICI Bank",
      file: "icici.svg",
      short: "IC",
      color: "#f58220",
    },
    kotak: {
      name: "Kotak Mahindra Bank",
      file: null,
      short: "KO",
      color: "#ed1c24",
    },
    axis: { name: "Axis Bank", file: "axis.svg", short: "AX", color: "#97144d" },
    "airtel-payments-bank": {
      name: "Airtel Payments Bank",
      file: "airtel-payments-bank.svg",
      short: "AI",
      color: "#e40000",
    },
    "indian-bank": { name: "Indian Bank", file: null, short: "IN", color: "#1d4ed8" },
    "bank-of-baroda": {
      name: "Bank of Baroda",
      file: null,
      short: "BB",
      color: "#f97316",
    },
    canara: {
      name: "Canara Bank",
      file: "canara.svg",
      short: "CA",
      color: "#0e7490",
    },
    pnb: {
      name: "Punjab National Bank",
      file: "pnb.svg",
      short: "PN",
      color: "#a16207",
    },
    "union-bank": {
      name: "Union Bank of India",
      file: "union-bank.svg",
      short: "UN",
      color: "#b91c1c",
    },
    "idfc-first": {
      name: "IDFC FIRST Bank",
      file: "idfc-first.svg",
      short: "ID",
      color: "#7c3aed",
    },
    "yes-bank": {
      name: "Yes Bank",
      file: "yes-bank.svg",
      short: "YE",
      color: "#1e3a8a",
    },
    indusind: {
      name: "IndusInd Bank",
      file: "indusind.svg",
      short: "IU",
      color: "#be123c",
    },
    "federal-bank": {
      name: "Federal Bank",
      file: "federal-bank.svg",
      short: "FE",
      color: "#047857",
    },

    /* ---------- this shop ---------- */
    gosmoothie: {
      name: "GoSmoothie Pay",
      file: null,
      short: "Gs",
      color: "#16a34a",
    },
  };

  const SIZES = { sm: true, md: true, lg: true };

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Only a plain hex colour ever reaches a style attribute.
  function safeColor(value) {
    return /^#[0-9a-f]{3,8}$/i.test(String(value || "")) ? String(value) : "#334155";
  }

  /**
   * The lettered chip: the pre-existing placeholder, kept as the fallback for
   * brands without artwork and for an image that fails to load.
   */
  function chip(slug, options) {
    const opts = options || {};
    const brand = BRANDS[slug] || { name: slug, short: "?", color: "#334155" };
    const naming = opts.decorative
      ? ' aria-hidden="true"'
      : ' role="img" aria-label="' + escapeHtml(brand.name) + '"';
    return (
      '<span class="pay-chip shrink-0" style="background:' +
      safeColor(brand.color) +
      '" data-brand="' +
      escapeHtml(slug) +
      '"' +
      naming +
      ">" +
      escapeHtml(brand.short) +
      "</span>"
    );
  }

  /**
   * One brand mark as an HTML string: an <img> inside a fixed-size box so a
   * logo of any aspect ratio lands in the same footprint and nothing shifts
   * while it loads.
   *
   * options.size       "sm" (method rail) | "md" (bank/wallet rows) | "lg" (QR strip)
   * options.decorative true where adjacent text already names the brand
   */
  function mark(slug, options) {
    const opts = options || {};
    const brand = BRANDS[slug];
    if (!brand || !brand.file) return chip(slug, opts);

    const size = SIZES[opts.size] ? opts.size : "sm";
    const naming = opts.decorative
      ? 'alt="" aria-hidden="true"'
      : 'alt="' + escapeHtml(brand.name) + '"';

    return (
      '<span class="pay-logo-box pay-logo-box--' +
      size +
      '"><img class="pay-logo" src="' +
      escapeHtml(BASE + brand.file) +
      '" ' +
      naming +
      ' data-brand="' +
      escapeHtml(slug) +
      '" loading="lazy" decoding="async"></span>'
    );
  }

  global.GoSmoothieBrands = { BRANDS, mark, chip };
})(window);

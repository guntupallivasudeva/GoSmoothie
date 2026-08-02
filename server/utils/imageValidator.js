"use strict";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/avif",
  "image/svg+xml",
  "image/tiff",
  "image/bmp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

const MAX_SIZE = 52_428_800; // 50 MiB (to support video files)

// Magic byte signatures
const MAGIC = {
  "image/jpeg": Buffer.from([0xff, 0xd8, 0xff]),
  "image/png": Buffer.from([0x89, 0x50, 0x4e, 0x47]),
  "image/webp": {
    riff: Buffer.from([0x52, 0x49, 0x46, 0x46]), // "RIFF"
    webp: Buffer.from([0x57, 0x45, 0x42, 0x50]), // "WEBP"
  },
  "image/gif": Buffer.from([0x47, 0x49, 0x46]), // "GIF"
};

// Types that skip magic byte verification (trust declared content type)
const SKIP_MAGIC_CHECK = [
  "image/heic",
  "image/heif",
  "image/avif",
  "image/svg+xml",
  "image/tiff",
  "image/bmp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

/**
 * Validates an image/video buffer against declared content type, magic bytes, and size constraints.
 * @param {Buffer} buffer - The file bytes
 * @param {string} declaredContentType - The MIME type declared by the client
 * @returns {{ valid: boolean, error?: string, statusCode?: number }}
 */
function validateImage(buffer, declaredContentType) {
  // Check zero bytes
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: "File is empty", statusCode: 400 };
  }

  // Check size limit
  if (buffer.length > MAX_SIZE) {
    return {
      valid: false,
      error: "File must be 50 MB or smaller",
      statusCode: 413,
    };
  }

  // Check declared content type is allowed
  if (!ALLOWED_TYPES.includes(declaredContentType)) {
    return {
      valid: false,
      error:
        "Accepted types: JPEG, PNG, WebP, GIF, HEIC, HEIF, AVIF, SVG, TIFF, BMP, MP4, MOV, WebM",
      statusCode: 415,
    };
  }

  // Skip magic byte check for types where it's impractical
  if (!SKIP_MAGIC_CHECK.includes(declaredContentType)) {
    if (!matchesMagicBytes(buffer, declaredContentType)) {
      return {
        valid: false,
        error: "File content does not match declared type",
        statusCode: 415,
      };
    }
  }

  return { valid: true };
}

/**
 * Checks whether the buffer's leading bytes match the expected magic signature for the given type.
 */
function matchesMagicBytes(buffer, contentType) {
  if (contentType === "image/webp") {
    // WebP: starts with "RIFF" at offset 0 and "WEBP" at offset 8
    if (buffer.length < 12) return false;
    const hasRiff = buffer.slice(0, 4).equals(MAGIC["image/webp"].riff);
    const hasWebp = buffer.slice(8, 12).equals(MAGIC["image/webp"].webp);
    return hasRiff && hasWebp;
  }

  const expected = MAGIC[contentType];
  if (!expected || buffer.length < expected.length) return false;
  return buffer.slice(0, expected.length).equals(expected);
}

module.exports = { validateImage };

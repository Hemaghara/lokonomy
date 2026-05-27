const sharp = require("sharp");
const getStorageProvider = require("../services/storage/getStorageProvider");
const crypto = require("crypto");
const logger = require("./logger");

const generateUniqueId = () => crypto.randomBytes(8).toString("hex");

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf"
];

const getMimeType = (base64) => {
  if (base64.startsWith("data:")) {
    const match = base64.match(/^data:([^;]+);/);
    return match ? match[1] : null;
  }
  return null;
};

const getMimeTypeFromBuffer = (buffer) => {
  if (buffer.length < 4) return null;
  const hex = buffer.slice(0, 4).toString("hex").toUpperCase();
  if (hex.startsWith("FFD8FF")) return "image/jpeg";
  if (hex === "89504E47") return "image/png";
  if (hex.startsWith("474946")) return "image/gif";
  if (hex === "25504446") return "application/pdf";
  if (buffer.length >= 12) {
    const riff = buffer.slice(0, 4).toString("ascii");
    const webp = buffer.slice(8, 12).toString("ascii");
    if (riff === "RIFF" && webp === "WEBP") return "image/webp";
  }
  return null;
};

const parseBase64ToBuffer = (base64) => {
  if (base64.startsWith("data:")) {
    const parts = base64.split(",");
    return Buffer.from(parts[1], "base64");
  }
  return Buffer.from(base64, "base64");
};

/**
 * Global function for resizing and uploading media
 * @param {string} fileBase64 - The raw image arriving from frontend
 * @param {string} folder - Destination folder on cloud (e.g., 'market', 'profiles')
 * @param {object} options - Options containing realWidth and thumbWidth
 * @returns {object|string} - Object with thumb and real urls, or standard url
 */
const uploadMedia = async (fileBase64, folder = "general", options = {}) => {
  if (!fileBase64) return null;

  if (fileBase64.startsWith("http")) return fileBase64;

  const fileBuffer = parseBase64ToBuffer(fileBase64);
  let mimeType = getMimeType(fileBase64);
  if (!mimeType) {
    mimeType = getMimeTypeFromBuffer(fileBuffer);
  }

  if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error("Invalid file type. Allowed types are: JPEG, PNG, WEBP, GIF, PDF.");
  }

  const storage = getStorageProvider();
  const customId = generateUniqueId();
  const prefix = `lokonomy/${folder}`;

  // Check if it's an image
  const isImage = fileBase64.startsWith("data:image/") || (mimeType && mimeType.startsWith("image/"));

  try {
    if (!isImage) {
      // For non-images (like PDFs), upload directly without processing
      const hasExtension = fileBase64.includes("application/pdf")
        ? "pdf"
        : "bin";
      const result = await storage.upload(
        fileBuffer,
        `${prefix}/${customId}.${hasExtension}`,
      );
      return {
        mediaId: customId,
        secure_url: result,
        realUrl: result,
        thumbUrl: result,
      };
    }

    const realWidth = options.realWidth || undefined;
    const thumbWidth = options.thumbWidth || 300;

    const realBuffer = await sharp(fileBuffer)
      .resize({ width: realWidth, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const thumbBuffer = await sharp(fileBuffer)
      .resize({ width: thumbWidth, height: thumbWidth, fit: "cover" })
      .webp({ quality: 70 })
      .toBuffer();

    const [realResult, thumbResult] = await Promise.all([
      storage.upload(realBuffer, `${prefix}/${customId}-real.webp`),
      storage.upload(thumbBuffer, `${prefix}/${customId}-thumb.webp`),
    ]);

    return {
      mediaId: customId,
      secure_url: realResult,
      realUrl: realResult,
      thumbUrl: thumbResult,
    };
  } catch (err) {
    logger.error({ err }, "Global Media Upload Error"); // Bug #34: Use logger.error
    throw err;
  }
};

module.exports = { uploadMedia };

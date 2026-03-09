const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a base64 string or file path to Cloudinary
 * @param {string} file - Base64 string or file path
 * @param {string} folder - Folder name in Cloudinary
 * @returns {Promise<object>} - Upload result
 */
const uploadToCloudinary = async (file, folder) => {
  try {
    if (!file) return null;

    const options = {
      folder: `lokonomy/${folder}`,
      resource_type: "auto", 
    };

    const result = await cloudinary.uploader.upload(file, options);
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload to Cloudinary");
  }
};

module.exports = { cloudinary, uploadToCloudinary };

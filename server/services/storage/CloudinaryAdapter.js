const cloudinary = require('cloudinary').v2;

class CloudinaryAdapter {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async upload(buffer, path) {
    return new Promise((resolve, reject) => {
      const folderPath = path.split('/').slice(0, -1).join('/');
      const fileName = path.split('/').pop().split('.')[0];      

      const stream = cloudinary.uploader.upload_stream(
        { folder: folderPath, public_id: fileName, resource_type: "auto" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url); 
        }
      );
      stream.end(buffer);
    });
  }

  async list(folder) {
    const result = await cloudinary.search.expression(`folder:${folder}/*`).execute();
    return result.resources.map(res => res.secure_url);
  }
}

module.exports = CloudinaryAdapter;

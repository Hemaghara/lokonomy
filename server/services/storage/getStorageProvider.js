const CloudinaryAdapter = require('./CloudinaryAdapter');
const S3Adapter = require('./S3Adapter');


const getStorageProvider = () => {
    const provider = process.env.STORAGE_PROVIDER || 'CLOUDINARY';
    
    if (provider === 'S3') {
        return new S3Adapter();
    }
    
    return new CloudinaryAdapter();
};

module.exports = getStorageProvider;

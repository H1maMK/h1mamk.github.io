const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary-v2');


const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
const apiKey = process.env.CLOUDINARY_API_KEY || '';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '';

cloudinary.config({
  cloud_name: cloudName || 'demo',
  api_key: apiKey || 'demo',
  api_secret: apiSecret || 'demo'
});

const isCloudinaryConfigured = () =>
  Boolean(
    cloudName &&
    apiKey &&
    apiSecret &&
    cloudName !== 'demo' &&
    apiKey !== 'demo' &&
    apiSecret !== 'demo'
  );


const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'devicemaster/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 800, height: 800, crop: 'limit' },
      { quality: 'auto' }
    ]
  }
});


const articleStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'devicemaster/articles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1200, height: 600, crop: 'limit' },
      { quality: 'auto' }
    ]
  }
});


const categoryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'devicemaster/categories',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
    transformation: [
      { width: 1200, height: 1200, crop: 'limit' },
      { quality: 'auto' }
    ]
  }
});


const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'devicemaster/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [
      { width: 200, height: 200, crop: 'fill', gravity: 'face' },
      { quality: 'auto' }
    ]
  }
});

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  productStorage,
  articleStorage,
  categoryStorage,
  avatarStorage
};

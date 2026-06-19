const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');
const { isDataImageUrl } = require('./imageData');

const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');

const MIME_TO_EXTENSION = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg'
};

const CLOUDINARY_FOLDER_MAP = {
  products: 'devicemaster/products',
  articles: 'devicemaster/articles',
  categories: 'devicemaster/categories',
  avatars: 'devicemaster/avatars'
};

const getExtensionForImage = (mimeType = '', originalName = '') => {
  const originalExtension = path.extname(originalName).replace('.', '').toLowerCase();
  if (originalExtension) {
    return originalExtension;
  }

  return MIME_TO_EXTENSION[mimeType] || 'png';
};

const ensureUploadDirectory = async (folderName) => {
  await fs.mkdir(path.join(UPLOADS_ROOT, folderName), { recursive: true });
};

const buildStoredUploadPath = (folderName, fileName) => `/uploads/${folderName}/${fileName}`;

const uploadBufferToCloudinary = async (buffer, folderName, mimeType = 'image/jpeg') => {
  const folder = CLOUDINARY_FOLDER_MAP[folderName] || `devicemaster/${folderName}`;
  const extension = getExtensionForImage(mimeType);
  const uploadOptions = {
    folder,
    resource_type: 'image'
  };

  if (extension !== 'svg') {
    uploadOptions.format = extension === 'png' || extension === 'webp' ? extension : 'jpg';
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result.secure_url);
    });

    uploadStream.end(buffer);
  });
};

const writeImageBuffer = async (buffer, extension, folderName) => {
  const hash = crypto.createHash('sha1').update(buffer).digest('hex');
  const fileName = `${hash}.${extension}`;
  const targetDirectory = path.join(UPLOADS_ROOT, folderName);
  const targetPath = path.join(targetDirectory, fileName);

  await ensureUploadDirectory(folderName);

  try {
    await fs.access(targetPath);
  } catch {
    await fs.writeFile(targetPath, buffer);
  }

  return buildStoredUploadPath(folderName, fileName);
};

const persistImageBuffer = async (buffer, mimeType, folderName, originalName = '') => {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    return '';
  }

  if (isCloudinaryConfigured()) {
    try {
      return await uploadBufferToCloudinary(buffer, folderName, mimeType);
    } catch (error) {
      console.error(`Cloudinary upload failed for ${folderName}:`, error.message);
    }
  }

  if (process.env.NODE_ENV === 'production') {
    const safeMimeType = mimeType || `image/${getExtensionForImage(mimeType, originalName)}`;
    return `data:${safeMimeType};base64,${buffer.toString('base64')}`;
  }

  const extension = getExtensionForImage(mimeType, originalName);
  return writeImageBuffer(buffer, extension, folderName);
};

const saveUploadedImageFile = async (file, folderName = 'products') => {
  if (!file?.buffer || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    return '';
  }

  return persistImageBuffer(file.buffer, file.mimetype, folderName, file.originalname);
};

const persistDataImageUrl = async (dataUrl, folderName = 'products') => {
  if (!dataUrl) {
    return '';
  }

  if (!isDataImageUrl(dataUrl)) {
    if (/^https?:\/\//i.test(dataUrl)) {
      return dataUrl;
    }

    return dataUrl;
  }

  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    return '';
  }

  const mimeType = match[1];
  const buffer = Buffer.from(match[2], 'base64');

  return persistImageBuffer(buffer, mimeType, folderName);
};

module.exports = {
  isCloudinaryConfigured,
  saveUploadedImageFile,
  persistDataImageUrl,
  persistImageBuffer
};

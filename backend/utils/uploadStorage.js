const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { isDataImageUrl } = require('./imageData');

const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');

const MIME_TO_EXTENSION = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg'
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

const saveUploadedImageFile = async (file, folderName = 'products') => {
  if (!file?.buffer || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    return '';
  }

  const extension = getExtensionForImage(file.mimetype, file.originalname);
  return writeImageBuffer(file.buffer, extension, folderName);
};

const persistDataImageUrl = async (dataUrl, folderName = 'products') => {
  if (!isDataImageUrl(dataUrl)) {
    return dataUrl;
  }

  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    return '';
  }

  const mimeType = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  const extension = getExtensionForImage(mimeType);

  return writeImageBuffer(buffer, extension, folderName);
};

module.exports = {
  saveUploadedImageFile,
  persistDataImageUrl
};

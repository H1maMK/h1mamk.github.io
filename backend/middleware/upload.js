const multer = require('multer');
const path = require('path');

const MAX_IMAGE_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024;
const MAX_ARTICLE_FIELD_SIZE = parseInt(process.env.MAX_ARTICLE_FIELD_SIZE, 10) || 20 * 1024 * 1024;

const memoryStorage = multer.memoryStorage();


const buildImageFileFilter = ({ allowedMimeTypes, allowedExtensions, errorMessage }) => (req, file, cb) => {
  const extname = allowedExtensions.includes(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }

  cb(new Error(errorMessage));
};

const defaultImageFileFilter = buildImageFileFilter({
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedExtensions: ['.jpeg', '.jpg', '.png', '.webp'],
  errorMessage: 'Разрешены только изображения (JPEG, JPG, PNG, WebP)'
});

const categoryImageFileFilter = buildImageFileFilter({
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
  allowedExtensions: ['.jpeg', '.jpg', '.png', '.webp', '.gif', '.svg'],
  errorMessage: 'Разрешены только изображения (JPEG, JPG, PNG, WebP, GIF, SVG)'
});


const getStorage = () => memoryStorage;


const uploadProduct = multer({
  storage: getStorage('product'),
  limits: {
    fileSize: MAX_IMAGE_FILE_SIZE
  },
  fileFilter: defaultImageFileFilter
});

const uploadArticle = multer({
  storage: getStorage('article'),
  limits: {
    fileSize: MAX_IMAGE_FILE_SIZE,
    fieldSize: MAX_ARTICLE_FIELD_SIZE
  },
  fileFilter: defaultImageFileFilter
});

const uploadAvatar = multer({
  storage: getStorage('avatar'),
  limits: {
    fileSize: MAX_IMAGE_FILE_SIZE
  },
  fileFilter: defaultImageFileFilter
});

const uploadCategory = multer({
  storage: getStorage('category'),
  limits: {
    fileSize: MAX_IMAGE_FILE_SIZE
  },
  fileFilter: categoryImageFileFilter
});

const ensurePersistentUploadStorage = (req, res, next) => {
  next();
};

module.exports = {
  ensurePersistentUploadStorage,
  MAX_IMAGE_FILE_SIZE,
  uploadProduct,
  uploadArticle,
  uploadCategory,
  uploadAvatar
};

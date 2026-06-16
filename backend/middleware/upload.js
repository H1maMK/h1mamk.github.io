const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { productStorage, articleStorage, categoryStorage, avatarStorage } = require('../config/cloudinary');

const backendUploadsRoot = path.join(__dirname, '..', 'uploads');
const MAX_IMAGE_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024;
const MAX_ARTICLE_FIELD_SIZE = parseInt(process.env.MAX_ARTICLE_FIELD_SIZE, 10) || 20 * 1024 * 1024;

const hasPersistentUploadStorage = () => Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'demo'
);


const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = backendUploadsRoot;
    

    if (req.route.path.includes('products')) {
      uploadPath = path.join(uploadPath, 'products');
    } else if (req.route.path.includes('articles')) {
      uploadPath = path.join(uploadPath, 'articles');
    } else if (req.route.path.includes('categories')) {
      uploadPath = path.join(uploadPath, 'categories');
    } else if (req.route.path.includes('avatar')) {
      uploadPath = path.join(uploadPath, 'avatars');
    }
    

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});


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


const getStorage = (type) => {
  const useCloudinary = hasPersistentUploadStorage();

  if (useCloudinary) {
    switch (type) {
      case 'product':
        return productStorage;
      case 'article':
        return articleStorage;
      case 'category':
        return categoryStorage;
      case 'avatar':
        return avatarStorage;
      default:
        return productStorage;
    }
  }
  
  return localStorage;
};


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
  if (process.env.NODE_ENV === 'production' && !hasPersistentUploadStorage()) {
    res.set('X-Upload-Storage-Warning', 'local-ephemeral-storage');
    console.warn('Persistent upload storage is not configured. Falling back to local uploads directory in production.');
  }

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

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { productStorage, articleStorage, categoryStorage, avatarStorage } = require('../config/cloudinary');

const backendUploadsRoot = path.join(__dirname, '..', 'uploads');

const hasPersistentUploadStorage = () => Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'demo'
);

// Локальное хранилище (fallback)
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = backendUploadsRoot;
    
    // Определяем папку по типу файла
    if (req.route.path.includes('products')) {
      uploadPath = path.join(uploadPath, 'products');
    } else if (req.route.path.includes('articles')) {
      uploadPath = path.join(uploadPath, 'articles');
    } else if (req.route.path.includes('categories')) {
      uploadPath = path.join(uploadPath, 'categories');
    } else if (req.route.path.includes('avatar')) {
      uploadPath = path.join(uploadPath, 'avatars');
    }
    
    // Создаем папку если не существует
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

// Фильтр файлов
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

// Функция для выбора хранилища
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

// Создаем multer instances
const uploadProduct = multer({
  storage: getStorage('product'),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  },
  fileFilter: defaultImageFileFilter
});

const uploadArticle = multer({
  storage: getStorage('article'),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024
  },
  fileFilter: defaultImageFileFilter
});

const uploadAvatar = multer({
  storage: getStorage('avatar'),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024
  },
  fileFilter: defaultImageFileFilter
});

const uploadCategory = multer({
  storage: getStorage('category'),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024
  },
  fileFilter: categoryImageFileFilter
});

const ensurePersistentUploadStorage = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !hasPersistentUploadStorage()) {
    return res.status(503).json({
      success: false,
      message: 'Загрузка изображений в production отключена: не настроено постоянное хранилище Cloudinary. После деплоя локальные файлы на сервере Render удаляются.'
    });
  }

  next();
};

module.exports = {
  ensurePersistentUploadStorage,
  uploadProduct,
  uploadArticle,
  uploadCategory,
  uploadAvatar
};

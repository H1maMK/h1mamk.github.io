const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { productStorage, articleStorage, avatarStorage } = require('../config/cloudinary');

const backendUploadsRoot = path.join(__dirname, '..', 'uploads');

// Локальное хранилище (fallback)
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = backendUploadsRoot;
    
    // Определяем папку по типу файла
    if (req.route.path.includes('products')) {
      uploadPath = path.join(uploadPath, 'products');
    } else if (req.route.path.includes('articles')) {
      uploadPath = path.join(uploadPath, 'articles');
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
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedExtensions = ['.jpeg', '.jpg', '.png', '.webp'];
  const extname = allowedExtensions.includes(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Разрешены только изображения (JPEG, JPG, PNG, WebP)'));
  }
};

// Функция для выбора хранилища
const getStorage = (type) => {
  const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && 
                       process.env.CLOUDINARY_API_KEY && 
                       process.env.CLOUDINARY_API_SECRET &&
                       process.env.CLOUDINARY_CLOUD_NAME !== 'demo';

  if (useCloudinary) {
    switch (type) {
      case 'product':
        return productStorage;
      case 'article':
        return articleStorage;
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
  fileFilter: fileFilter
});

const uploadArticle = multer({
  storage: getStorage('article'),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024
  },
  fileFilter: fileFilter
});

const uploadAvatar = multer({
  storage: getStorage('avatar'),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024
  },
  fileFilter: fileFilter
});

module.exports = {
  uploadProduct,
  uploadArticle,
  uploadAvatar
};

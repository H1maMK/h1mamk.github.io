const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const backendUploadsRoot = path.join(__dirname, '..', 'uploads');

// Import controllers
const {
  getProductsForAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductVisibility,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllUsers,
  updateUser,
  updateUserAvatar,
  deleteUser,
  toggleUserBlock
} = require('../controllers/adminController');

const {
  createArticle,
  updateArticle,
  deleteArticle,
  getArticleForAdmin
} = require('../controllers/articleController');

const {
  getPendingReviews,
  getAllReviewsForAdmin,
  moderateReview,
  getAllProductReviewsForAdmin
} = require('../controllers/reviewController');

// Import middleware
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');
const { body } = require('express-validator');
const {
  uploadAvatar: uploadAvatarMiddleware,
  uploadProduct: uploadProductMiddleware
} = require('../middleware/upload');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(backendUploadsRoot, 'products');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedExtensions = ['.jpeg', '.jpg', '.png', '.webp', '.gif'];
    const extname = allowedExtensions.includes(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimeTypes.includes(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Разрешена загрузка только изображений'));
    }
  }
});

// Validation middleware for products
const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Название товара должно быть от 1 до 200 символов'),
    
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Цена должна быть положительным числом'),
    
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Количество товара не может быть отрицательным'),
    
  body('category')
    .isMongoId()
    .withMessage('Выберите корректную категорию'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Описание не должно превышать 2000 символов'),
    
  body('specifications')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
          return true;
        } catch (e) {
          throw new Error('Характеристики должны быть корректным JSON');
        }
      }
      return true;
    })
];

// Validation middleware for categories
const validateCategory = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Название категории должно быть от 1 до 100 символов'),
    
  body('deviceType')
    .isIn(['Игровое', 'Офисное'])
    .withMessage('Тип устройства должен быть "Игровое" или "Офисное"'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Описание не должно превышать 500 символов')
];

// === PRODUCT MANAGEMENT ROUTES ===

// @route   GET /api/admin/products
// @desc    Get all products including hidden
// @access  Private (Admin only)
router.get('/products',
  authenticateToken,
  requireAdmin,
  getProductsForAdmin
);

// @route   POST /api/admin/products
// @desc    Create a new product
// @access  Private (Admin only)
router.post('/products', 
  authenticateToken,
  requireAdmin,
  uploadProductMiddleware.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 }
  ]),
  validateProduct,
  createProduct
);

// @route   PUT /api/admin/products/:id
// @desc    Update a product
// @access  Private (Admin only)
router.put('/products/:id',
  authenticateToken,
  requireAdmin,
  validateObjectId,
  uploadProductMiddleware.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 }
  ]),
  validateProduct,
  updateProduct
);

// @route   PATCH /api/admin/products/:id/visibility
// @desc    Hide or show a product
// @access  Private (Admin only)
router.patch('/products/:id/visibility',
  authenticateToken,
  requireAdmin,
  validateObjectId,
  toggleProductVisibility
);

// @route   DELETE /api/admin/products/:id
// @desc    Delete a product
// @access  Private (Admin only)
router.delete('/products/:id',
  authenticateToken,
  requireAdmin,
  validateObjectId,
  deleteProduct
);

// === CATEGORY MANAGEMENT ROUTES ===

// Configure multer for category images
const categoryStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(backendUploadsRoot, 'categories');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'category-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const categoryUpload = multer({
  storage: categoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    const allowedExtensions = ['.jpeg', '.jpg', '.png', '.webp', '.gif', '.svg'];
    const extname = allowedExtensions.includes(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimeTypes.includes(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Разрешена загрузка только изображений'));
  }
});

// @route   POST /api/admin/categories
// @desc    Create a new category
// @access  Private (Admin only)
router.post('/categories',
  authenticateToken,
  requireAdmin,
  categoryUpload.single('image'),
  validateCategory,
  createCategory
);

// @route   PUT /api/admin/categories/:id
// @desc    Update a category
// @access  Private (Admin only)
router.put('/categories/:id',
  authenticateToken,
  requireAdmin,
  validateObjectId,
  categoryUpload.single('image'),
  validateCategory,
  updateCategory
);

// @route   DELETE /api/admin/categories/:id
// @desc    Delete a category
// @access  Private (Admin only)
router.delete('/categories/:id',
  authenticateToken,
  requireAdmin,
  validateObjectId,
  deleteCategory
);

// === USER MANAGEMENT ROUTES ===

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/users',
  authenticateToken,
  requireAdmin,
  getAllUsers
);

// @route   PUT /api/admin/users/:id
// @desc    Update a user
// @access  Private (Admin only)
router.put('/users/:id',
  authenticateToken,
  requireAdmin,
  validateObjectId,
  updateUser
);

// @route   POST /api/admin/users/:id/avatar
// @desc    Upload user avatar (admin only)
// @access  Private (Admin only)
router.post('/users/:id/avatar',
  authenticateToken,
  requireAdmin,
  validateObjectId,
  uploadAvatarMiddleware.single('avatar'),
  updateUserAvatar
);

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
// @access  Private (Admin only)
router.delete('/users/:id',
  authenticateToken,
  requireAdmin,
  validateObjectId,
  deleteUser
);

// @route   PATCH /api/admin/users/:id/block
// @desc    Block/unblock a user
// @access  Private (Admin only)
router.patch('/users/:id/block',
  authenticateToken,
  requireAdmin,
  validateObjectId,
  toggleUserBlock
);

// === ARTICLE MANAGEMENT ROUTES ===

// Configure multer for article images
const articleStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(backendUploadsRoot, 'articles');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'article-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const articleUpload = multer({
  storage: articleStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedExtensions = ['.jpeg', '.jpg', '.png', '.webp'];
    const extname = allowedExtensions.includes(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimeTypes.includes(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Разрешена загрузка только изображений'));
  }
});

// @route   POST /api/admin/articles
// @desc    Create a new article
// @access  Private (Admin only)
router.post('/articles',
  authenticateToken,
  requireAdmin,
  articleUpload.single('image'),
  createArticle
);

// @route   GET /api/admin/articles/:id
// @desc    Get an article for admin editing
// @access  Private (Admin only)
router.get('/articles/:id',
  authenticateToken,
  requireAdmin,
  validateObjectId,
  getArticleForAdmin
);

// @route   PUT /api/admin/articles/:id
// @desc    Update an article
// @access  Private (Admin only)
router.put('/articles/:id',
  authenticateToken,
  requireAdmin,
  validateObjectId,
  articleUpload.single('image'),
  updateArticle
);

// @route   DELETE /api/admin/articles/:id
// @desc    Delete an article
// @access  Private (Admin only)
router.delete('/articles/:id',
  authenticateToken,
  requireAdmin,
  validateObjectId,
  deleteArticle
);

// === REVIEW MODERATION ROUTES ===

// @route   GET /api/admin/reviews/pending
// @desc    Get all pending reviews
// @access  Private (Admin only)
router.get('/reviews/pending',
  authenticateToken,
  requireAdmin,
  getPendingReviews
);

// @route   GET /api/admin/reviews
// @desc    Get all reviews across the site
// @access  Private (Admin only)
router.get('/reviews',
  authenticateToken,
  requireAdmin,
  getAllReviewsForAdmin
);

// @route   POST /api/admin/reviews/:reviewId/moderate
// @desc    Approve or reject a review
// @access  Private (Admin only)
router.post('/reviews/:reviewId/moderate',
  authenticateToken,
  requireAdmin,
  validateObjectId,
  moderateReview
);

// @route   GET /api/admin/products/:id/reviews/all
// @desc    Get all reviews for a product (including pending and rejected) - for admin
// @access  Private (Admin only)
router.get('/products/:id/reviews/all',
  authenticateToken,
  requireAdmin,
  validateObjectId,
  getAllProductReviewsForAdmin
);

module.exports = router;

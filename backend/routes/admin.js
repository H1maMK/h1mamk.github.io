const express = require('express');
const router = express.Router();


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


const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');
const { body } = require('express-validator');
const {
  ensurePersistentUploadStorage,
  uploadArticle: uploadArticleMiddleware,
  uploadCategory: uploadCategoryMiddleware,
  uploadAvatar: uploadAvatarMiddleware,
  uploadProduct: uploadProductMiddleware
} = require('../middleware/upload');

const withUploadErrorHandling = (uploadMiddleware) => (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      req.uploadError = err;
    }
    next();
  });
};


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




router.get('/products',
  authenticateToken,
  requireAdmin,
  getProductsForAdmin
);


router.post('/products', 
  authenticateToken,
  requireAdmin,
  ensurePersistentUploadStorage,
  withUploadErrorHandling(uploadProductMiddleware.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 }
  ])),
  validateProduct,
  createProduct
);


router.put('/products/:id',
  authenticateToken,
  requireAdmin,
  validateObjectId,
  ensurePersistentUploadStorage,
  withUploadErrorHandling(uploadProductMiddleware.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 }
  ])),
  validateProduct,
  updateProduct
);


router.patch('/products/:id/visibility',
  authenticateToken,
  requireAdmin,
  validateObjectId,
  toggleProductVisibility
);


router.delete('/products/:id',
  authenticateToken,
  requireAdmin,
  validateObjectId,
  deleteProduct
);




router.post('/categories',
  authenticateToken,
  requireAdmin,
  ensurePersistentUploadStorage,
  withUploadErrorHandling(uploadCategoryMiddleware.single('image')),
  validateCategory,
  createCategory
);


router.put('/categories/:id',
  authenticateToken,
  requireAdmin,
  validateObjectId,
  ensurePersistentUploadStorage,
  withUploadErrorHandling(uploadCategoryMiddleware.single('image')),
  validateCategory,
  updateCategory
);


router.delete('/categories/:id',
  authenticateToken,
  requireAdmin,
  validateObjectId,
  deleteCategory
);




router.get('/users',
  authenticateToken,
  requireAdmin,
  getAllUsers
);


router.put('/users/:id',
  authenticateToken,
  requireAdmin,
  validateObjectId,
  updateUser
);


router.post('/users/:id/avatar',
  authenticateToken,
  requireAdmin,
  validateObjectId,
  withUploadErrorHandling(uploadAvatarMiddleware.single('avatar')),
  updateUserAvatar
);


router.delete('/users/:id',
  authenticateToken,
  requireAdmin,
  validateObjectId,
  deleteUser
);


router.patch('/users/:id/block',
  authenticateToken,
  requireAdmin,
  validateObjectId,
  toggleUserBlock
);




router.post('/articles',
  authenticateToken,
  requireAdmin,
  ensurePersistentUploadStorage,
  withUploadErrorHandling(uploadArticleMiddleware.single('image')),
  createArticle
);


router.get('/articles/:id',
  authenticateToken,
  requireAdmin,
  validateObjectId,
  getArticleForAdmin
);


router.put('/articles/:id',
  authenticateToken,
  requireAdmin,
  validateObjectId,
  ensurePersistentUploadStorage,
  withUploadErrorHandling(uploadArticleMiddleware.single('image')),
  updateArticle
);


router.delete('/articles/:id',
  authenticateToken,
  requireAdmin,
  validateObjectId,
  deleteArticle
);




router.get('/reviews/pending',
  authenticateToken,
  requireAdmin,
  getPendingReviews
);


router.get('/reviews',
  authenticateToken,
  requireAdmin,
  getAllReviewsForAdmin
);


router.post('/reviews/:reviewId/moderate',
  authenticateToken,
  requireAdmin,
  validateObjectId,
  moderateReview
);


router.get('/products/:id/reviews/all',
  authenticateToken,
  requireAdmin,
  validateObjectId,
  getAllProductReviewsForAdmin
);

module.exports = router;

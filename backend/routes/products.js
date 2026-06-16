const express = require('express');
const router = express.Router();


const {
  getProducts,
  getProduct,
  getProductsByCategory,
  searchProducts,
  getCategories,
  getPopularProducts,
  getNewProducts,
  validateProducts
} = require('../controllers/productController');

const {
  getProductReviews,
  addProductReview,
  updateProductReview,
  deleteProductReview,
  getProductReviewStats,
  getPendingReviews,
  moderateReview,
  getAllProductReviewsForAdmin
} = require('../controllers/reviewController');


const { optionalAuth, authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateObjectId, validateSearchParams, validateReview } = require('../middleware/validation');
const { body } = require('express-validator');


const validateProductSearch = [
  body('query')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
    
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category must be less than 50 characters'),
    
  body('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
    
  body('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
    
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  body('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
    
  body('sortBy')
    .optional()
    .isIn(['relevance', 'price_asc', 'price_desc', 'name', 'newest'])
    .withMessage('Invalid sort option')
];


router.get('/', optionalAuth, validateSearchParams, getProducts);


router.get('/categories', getCategories);


router.get('/popular', optionalAuth, getPopularProducts);


router.get('/new', optionalAuth, getNewProducts);


router.post('/search', optionalAuth, validateProductSearch, searchProducts);


router.post('/validate', validateProducts);


router.get('/category/:category', optionalAuth, validateSearchParams, getProductsByCategory);


router.get('/:id', optionalAuth, validateObjectId, getProduct);




router.get('/:id/reviews', validateObjectId, getProductReviews);


router.post('/:id/reviews', authenticateToken, validateObjectId, addProductReview);


router.put('/:id/reviews/:reviewId', authenticateToken, validateObjectId, validateReview, updateProductReview);


router.delete('/:id/reviews/:reviewId', authenticateToken, validateObjectId, deleteProductReview);


router.get('/:id/reviews/stats', validateObjectId, getProductReviewStats);

module.exports = router;
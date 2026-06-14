const express = require('express');
const router = express.Router();

// Import controllers
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

// Import middleware
const { optionalAuth, authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateObjectId, validateSearchParams, validateReview } = require('../middleware/validation');
const { body } = require('express-validator');

// Валидация для поиска товаров
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

// @route   GET /api/products
// @desc    Get all products with filtering and pagination
// @access  Public (with optional auth for favorites)
router.get('/', optionalAuth, validateSearchParams, getProducts);

// @route   GET /api/products/categories
// @desc    Get all product categories
// @access  Public
router.get('/categories', getCategories);

// @route   GET /api/products/popular
// @desc    Get popular products
// @access  Public (with optional auth for favorites)
router.get('/popular', optionalAuth, getPopularProducts);

// @route   GET /api/products/new
// @desc    Get new products
// @access  Public (with optional auth for favorites)
router.get('/new', optionalAuth, getNewProducts);

// @route   POST /api/products/search
// @desc    Search products
// @access  Public (with optional auth for favorites)
router.post('/search', optionalAuth, validateProductSearch, searchProducts);

// @route   POST /api/products/validate
// @desc    Validate products (check if they exist and are available)
// @access  Public
router.post('/validate', validateProducts);

// @route   GET /api/products/category/:category
// @desc    Get products by category
// @access  Public (with optional auth for favorites)
router.get('/category/:category', optionalAuth, validateSearchParams, getProductsByCategory);

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public (with optional auth for favorites)
router.get('/:id', optionalAuth, validateObjectId, getProduct);

// === REVIEW ROUTES ===

// @route   GET /api/products/:id/reviews
// @desc    Get reviews for a product
// @access  Public
router.get('/:id/reviews', validateObjectId, getProductReviews);

// @route   POST /api/products/:id/reviews
// @desc    Add a review to a product
// @access  Private
router.post('/:id/reviews', authenticateToken, validateObjectId, addProductReview);

// @route   PUT /api/products/:id/reviews/:reviewId
// @desc    Update a review
// @access  Private (own review only)
router.put('/:id/reviews/:reviewId', authenticateToken, validateObjectId, validateReview, updateProductReview);

// @route   DELETE /api/products/:id/reviews/:reviewId
// @desc    Delete a review
// @access  Private (own review only or admin)
router.delete('/:id/reviews/:reviewId', authenticateToken, validateObjectId, deleteProductReview);

// @route   GET /api/products/:id/reviews/stats
// @desc    Get review statistics for a product
// @access  Public
router.get('/:id/reviews/stats', validateObjectId, getProductReviewStats);

module.exports = router;
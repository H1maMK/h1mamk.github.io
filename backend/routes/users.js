const express = require('express');
const router = express.Router();

// Import controllers
const {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  getUserStats
} = require('../controllers/userController');

const {
  getUserReviews
} = require('../controllers/reviewController');

// Import middleware
const { authenticateToken } = require('../middleware/auth');
const { validateProfileUpdate, validateObjectId } = require('../middleware/validation');
const { uploadAvatar: uploadAvatarMiddleware } = require('../middleware/upload');

// Middleware для обработки ошибок загрузки
const handleUploadError = (err, req, res, next) => {
  console.log('Upload error:', err);
  if (err) {
    return res.status(400).json({
      success: false,
      error: {
        message: err.message || 'File upload error'
      }
    });
  }
  next();
};

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticateToken, getProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, validateProfileUpdate, updateProfile);

// @route   POST /api/users/avatar
// @desc    Upload user avatar
// @access  Private
router.post('/avatar', 
  authenticateToken,
  (req, res, next) => {
    console.log('Before multer middleware');
    next();
  },
  uploadAvatarMiddleware.single('avatar'),
  (req, res, next) => {
    console.log('After multer middleware, file:', req.file);
    next();
  },
  uploadAvatar
);

// @route   DELETE /api/users/avatar
// @desc    Delete user avatar
// @access  Private
router.delete('/avatar', authenticateToken, deleteAvatar);

// @route   GET /api/users/favorites
// @desc    Get user's favorite products
// @access  Private
router.get('/favorites', authenticateToken, getFavorites);

// @route   POST /api/users/favorites/:productId
// @desc    Add product to favorites
// @access  Private
router.post('/favorites/:productId', authenticateToken, validateObjectId, addToFavorites);

// @route   DELETE /api/users/favorites/:productId
// @desc    Remove product from favorites
// @access  Private
router.delete('/favorites/:productId', authenticateToken, validateObjectId, removeFromFavorites);

// @route   GET /api/users/stats
// @desc    Get user statistics (orders, reviews, etc.)
// @access  Private
router.get('/stats', authenticateToken, getUserStats);

// @route   GET /api/users/reviews
// @desc    Get user's reviews
// @access  Private
router.get('/reviews', authenticateToken, getUserReviews);

module.exports = router;
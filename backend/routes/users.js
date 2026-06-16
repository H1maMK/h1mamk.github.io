const express = require('express');
const router = express.Router();


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


const { authenticateToken } = require('../middleware/auth');
const { validateProfileUpdate, validateObjectId } = require('../middleware/validation');
const { uploadAvatar: uploadAvatarMiddleware } = require('../middleware/upload');

const withUploadErrorHandling = (uploadMiddleware) => (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      req.uploadError = err;
    }
    next();
  });
};


router.get('/profile', authenticateToken, getProfile);


router.put('/profile', authenticateToken, validateProfileUpdate, updateProfile);


router.post('/avatar', 
  authenticateToken,
  withUploadErrorHandling(uploadAvatarMiddleware.single('avatar')),
  uploadAvatar
);


router.delete('/avatar', authenticateToken, deleteAvatar);


router.get('/favorites', authenticateToken, getFavorites);


router.post('/favorites/:productId', authenticateToken, validateObjectId, addToFavorites);


router.delete('/favorites/:productId', authenticateToken, validateObjectId, removeFromFavorites);


router.get('/stats', authenticateToken, getUserStats);


router.get('/reviews', authenticateToken, getUserReviews);

module.exports = router;

const express = require('express');
const router = express.Router();

// Import controllers
const {
  register,
  login,
  getMe,
  logout,
  verifyTokenEndpoint,
  refreshToken,
  changePassword
} = require('../controllers/authController');

// Import middleware
const { authenticateToken } = require('../middleware/auth');
const {
  validateUserRegistration,
  validateUserLogin,
  handleValidationErrors
} = require('../middleware/validation');
const { body } = require('express-validator');

// Валидация для смены пароля
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Введите текущий пароль'),
    
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Новый пароль должен быть минимум 8 символов')
    .bail()
    .matches(/[A-Z]/)
    .withMessage('Новый пароль должен содержать минимум одну заглавную букву'),
    
  handleValidationErrors
];

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateUserRegistration, register);

// @route   POST /api/auth/login
// @desc    Login user and return JWT token
// @access  Public
router.post('/login', validateUserLogin, login);

// @route   GET /api/auth/me
// @desc    Get current user data
// @access  Private
router.get('/me', authenticateToken, getMe);

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticateToken, logout);

// @route   POST /api/auth/verify
// @desc    Verify JWT token
// @access  Public
router.post('/verify', verifyTokenEndpoint);

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Public
router.post('/refresh', refreshToken);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authenticateToken, validatePasswordChange, changePassword);

module.exports = router;

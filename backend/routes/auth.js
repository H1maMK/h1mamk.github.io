const express = require('express');
const router = express.Router();


const {
  register,
  login,
  getMe,
  logout,
  verifyTokenEndpoint,
  refreshToken,
  changePassword
} = require('../controllers/authController');


const { authenticateToken } = require('../middleware/auth');
const {
  validateUserRegistration,
  validateUserLogin,
  handleValidationErrors
} = require('../middleware/validation');
const { body } = require('express-validator');


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


router.post('/register', validateUserRegistration, register);


router.post('/login', validateUserLogin, login);


router.get('/me', authenticateToken, getMe);


router.post('/logout', authenticateToken, logout);


router.post('/verify', verifyTokenEndpoint);


router.post('/refresh', refreshToken);


router.put('/change-password', authenticateToken, validatePasswordChange, changePassword);

module.exports = router;

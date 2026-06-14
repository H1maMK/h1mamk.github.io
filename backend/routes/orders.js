const express = require('express');
const router = express.Router();
const { validationResult } = require('express-validator');

// Import controllers
const {
  createOrder,
  getUserOrders,
  getOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderStats,
  deleteOrder
} = require('../controllers/orderController');

// Import middleware
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { body } = require('express-validator');

// Middleware для обработки ошибок валидации
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Валидация для создания заказа
const ASTRAKHAN_ADDRESS_REGEX = /^\s*(г\.?\s*)?(город\s*)?астрахан(?:[ьи])?(?=\s|,|$)/i;

const validateCreateOrder = [
  body('items')
    .isArray({ min: 1, max: 100 })
    .withMessage('Order must contain from 1 to 100 items'),
    
  body('items.*.product')
    .isMongoId()
    .withMessage('Product ID must be valid'),
    
  body('items.*.quantity')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Quantity must be between 1 and 1000'),
    
  body('shippingAddress')
    .trim()
    .isLength({ min: 15, max: 300 })
    .withMessage('Shipping address must be between 15 and 300 characters')
    .custom((value) => {
      const normalizedAddress = typeof value === 'string' ? value.trim() : '';

      if (!ASTRAKHAN_ADDRESS_REGEX.test(normalizedAddress)) {
        throw new Error('Delivery is available only in Astrakhan. Address must start with "Астрахань,"');
      }

      const addressDetails = normalizedAddress
        .replace(ASTRAKHAN_ADDRESS_REGEX, '')
        .replace(/^\s*,\s*/, '')
        .trim();

      if (addressDetails.length < 5) {
        throw new Error('Specify street, building and apartment/office after "Астрахань,"');
      }

      return true;
    }),
     
  body('paymentMethod')
    .isIn(['card'])
    .withMessage('Payment method must be card'),
    
  body('deliveryMethod')
    .isIn(['courier'])
    .withMessage('Delivery method must be courier'),

  // Критичные поля рассчитываются только сервером
  body('deliveryPrice')
    .custom((value) => value === undefined)
    .withMessage('deliveryPrice is calculated by server'),

  body('totalPrice')
    .custom((value) => value === undefined)
    .withMessage('totalPrice is calculated by server')
];

// Валидация для обновления статуса заказа
const validateOrderStatus = [
  body('status')
    .isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Status must be pending, confirmed, shipped, delivered, or cancelled')
];

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private
router.post('/', authenticateToken, validateCreateOrder, handleValidationErrors, createOrder);

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
router.get('/', authenticateToken, getUserOrders);

// @route   GET /api/orders/stats
// @desc    Get order statistics (admin only)
// @access  Private (Admin)
router.get('/stats', authenticateToken, requireAdmin, getOrderStats);

// @route   GET /api/orders/all
// @desc    Get all orders (admin only)
// @access  Private (Admin)
router.get('/all', authenticateToken, requireAdmin, getAllOrders);

// @route   DELETE /api/orders/:id
// @desc    Delete an order (admin only)
// @access  Private (Admin)
router.delete('/:id', authenticateToken, requireAdmin, deleteOrder);

// @route   GET /api/orders/:id
// @desc    Get specific order
// @access  Private
router.get('/:id', authenticateToken, getOrder);

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel an order
// @access  Private
router.put('/:id/cancel', authenticateToken, cancelOrder);

// @route   PUT /api/orders/:id/status
// @desc    Update order status (admin only)
// @access  Private (Admin)
router.put('/:id/status', authenticateToken, requireAdmin, validateOrderStatus, handleValidationErrors, updateOrderStatus);

module.exports = router;

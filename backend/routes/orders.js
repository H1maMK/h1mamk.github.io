const express = require('express');
const router = express.Router();
const { validationResult } = require('express-validator');


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


const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { body } = require('express-validator');


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


  body('deliveryPrice')
    .custom((value) => value === undefined)
    .withMessage('deliveryPrice is calculated by server'),

  body('totalPrice')
    .custom((value) => value === undefined)
    .withMessage('totalPrice is calculated by server')
];


const validateOrderStatus = [
  body('status')
    .isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Status must be pending, confirmed, shipped, delivered, or cancelled')
];


router.post('/', authenticateToken, validateCreateOrder, handleValidationErrors, createOrder);


router.get('/', authenticateToken, getUserOrders);


router.get('/stats', authenticateToken, requireAdmin, getOrderStats);


router.get('/all', authenticateToken, requireAdmin, getAllOrders);


router.delete('/:id', authenticateToken, requireAdmin, deleteOrder);


router.get('/:id', authenticateToken, getOrder);


router.put('/:id/cancel', authenticateToken, cancelOrder);


router.put('/:id/status', authenticateToken, requireAdmin, validateOrderStatus, handleValidationErrors, updateOrderStatus);

module.exports = router;

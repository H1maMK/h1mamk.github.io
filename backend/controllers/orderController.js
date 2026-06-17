const Order = require('../models/Order');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const { success, error, notFound, validationError, unauthorized, forbidden } = require('../utils/response');

const ASTRAKHAN_ADDRESS_REGEX = /^\s*(г\.?\s*)?(город\s*)?астрахан(?:[ьи])?(?=\s|,|$)/i;

const getAstrakhanAddressValidationMessage = (address) => {
  const normalizedAddress = typeof address === 'string' ? address.trim() : '';

  if (!normalizedAddress) {
    return 'Shipping address is required';
  }

  if (normalizedAddress.length > 300) {
    return 'Shipping address must not exceed 300 characters';
  }

  if (!ASTRAKHAN_ADDRESS_REGEX.test(normalizedAddress)) {
    return 'Delivery is available only in Astrakhan. Address must start with "Астрахань,"';
  }

  const addressDetails = normalizedAddress
    .replace(ASTRAKHAN_ADDRESS_REGEX, '')
    .replace(/^\s*,\s*/, '')
    .trim();

  if (addressDetails.length < 5 || normalizedAddress.length < 15) {
    return 'Specify street, building and apartment/office after "Астрахань,"';
  }

  return '';
};


const createOrder = async (req, res) => {
  try {
    console.log('Creating order with data:', JSON.stringify(req.body, null, 2));

    if (!req.user) {
      return unauthorized(res, 'Authentication required to create order');
    }

    if (req.user.role === 'admin') {
      return forbidden(res, 'Administrators cannot create orders');
    }

    console.log('User:', req.user.username);
    
    const { items, shippingAddress, paymentMethod, deliveryMethod } = req.body;
    const userId = req.user._id;
    const normalizedAddress = typeof shippingAddress === 'string' ? shippingAddress.trim() : '';
    

    if (!items || !Array.isArray(items) || items.length === 0) {
      return validationError(res, [{ 
        field: 'items', 
        message: 'Items array is required and must not be empty' 
      }]);
    }

    if (items.length > 100) {
      return validationError(res, [{
        field: 'items',
        message: 'Order cannot contain more than 100 items'
      }]);
    }
    
    const addressValidationMessage = getAstrakhanAddressValidationMessage(normalizedAddress);
    if (addressValidationMessage) {
      return validationError(res, [{ 
        field: 'shippingAddress', 
        message: addressValidationMessage 
      }]);
    }
    
    if (paymentMethod !== 'card') {
      return validationError(res, [{ 
        field: 'paymentMethod', 
        message: 'Payment method must be card' 
      }]);
    }

    if (deliveryMethod !== 'courier') {
      return validationError(res, [{
        field: 'deliveryMethod',
        message: 'Delivery method must be courier'
      }]);
    }



    let calculatedTotal = 0;
    const orderItems = [];
    const session = await mongoose.startSession();
    let savedOrder = null;

    try {
      await session.withTransaction(async () => {
        for (const item of items) {
          console.log('Checking item:', item);

          if (!mongoose.Types.ObjectId.isValid(item.product)) {
            throw new Error(`INVALID_PRODUCT_ID:${item.product}`);
          }

          const requestedQuantity = Number(item.quantity);
          if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
            throw new Error(`INVALID_QUANTITY:${item.product}`);
          }

          const product = await Product.findById(item.product).session(session);

          if (!product) {
            throw new Error(`PRODUCT_NOT_FOUND:${item.product}`);
          }

          if (product.isActive === false) {
            throw new Error(`PRODUCT_INACTIVE:${product.name}`);
          }

          if (Number(product.stock) < 1) {
            throw new Error(`OUT_OF_STOCK:${product.name}`);
          }


          const stockUpdate = await Product.updateOne(
            {
              _id: product._id,
              isActive: true,
              stock: { $gte: requestedQuantity }
            },
            {
              $inc: { stock: -requestedQuantity }
            },
            { session }
          );

          if (stockUpdate.modifiedCount !== 1) {
            throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
          }

          const itemTotal = product.price * requestedQuantity;
          calculatedTotal += itemTotal;

          orderItems.push({
            product: product._id,
            quantity: requestedQuantity,
            price: product.price
          });
        }

        const finalDeliveryPrice = 500;
        const finalTotal = calculatedTotal + finalDeliveryPrice;

        const createdOrders = await Order.create([
          {
            user: userId,
            items: orderItems,
            totalAmount: finalTotal,
            shippingAddress: normalizedAddress,
            paymentMethod,
            deliveryMethod: 'courier',
            deliveryPrice: finalDeliveryPrice,
            status: 'pending'
          }
        ], { session });

        savedOrder = createdOrders[0];
      });
    } catch (transactionError) {
      if (transactionError.message.startsWith('INVALID_PRODUCT_ID:')) {
        const productId = transactionError.message.replace('INVALID_PRODUCT_ID:', '');
        return validationError(res, [{
          field: 'items',
          message: `Invalid product ID: ${productId}`
        }]);
      }

      if (transactionError.message.startsWith('INVALID_QUANTITY:')) {
        const productId = transactionError.message.replace('INVALID_QUANTITY:', '');
        return validationError(res, [{
          field: 'items',
          message: `Invalid quantity for product ${productId}. Quantity must be an integer >= 1`
        }]);
      }

      if (transactionError.message.startsWith('PRODUCT_NOT_FOUND:')) {
        const productId = transactionError.message.replace('PRODUCT_NOT_FOUND:', '');
        return validationError(res, [{
          field: 'items',
          message: `Product with ID ${productId} not found`
        }]);
      }

      if (transactionError.message.startsWith('PRODUCT_INACTIVE:')) {
        const productName = transactionError.message.replace('PRODUCT_INACTIVE:', '');
        return validationError(res, [{
          field: 'items',
          message: `Product ${productName} is unavailable`
        }]);
      }

      if (transactionError.message.startsWith('OUT_OF_STOCK:')) {
        const productName = transactionError.message.replace('OUT_OF_STOCK:', '');
        return validationError(res, [{
          field: 'items',
          message: `Product ${productName} is out of stock`
        }]);
      }

      if (transactionError.message.startsWith('INSUFFICIENT_STOCK:')) {
        const productName = transactionError.message.replace('INSUFFICIENT_STOCK:', '');
        return validationError(res, [{
          field: 'items',
          message: `Insufficient stock for product ${productName}`
        }]);
      }

      throw transactionError;
    } finally {
      await session.endSession();
    }

    if (!savedOrder) {
      return error(res, 'Failed to create order', 500);
    }


    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('user', 'username email')
      .populate('items.product', 'name price images');

    return success(res, { order: populatedOrder }, 'Order created successfully', 201);

  } catch (err) {
    console.error('Create order error:', err);
    return error(res, 'Failed to create order', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};


const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    const filter = { user: userId };
    if (status) {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [orders, totalCount] = await Promise.all([
      Order.find(filter)
        .populate('items.product', 'name price images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter)
    ]);

    const pagination = {
      page: pageNum,
      limit: limitNum,
      total: totalCount,
      pages: Math.ceil(totalCount / limitNum),
      hasNext: pageNum < Math.ceil(totalCount / limitNum),
      hasPrev: pageNum > 1
    };

    return success(res, orders, 'Orders retrieved successfully');

  } catch (err) {
    console.error('Get user orders error:', err);
    return error(res, 'Failed to get orders', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};


const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const order = await Order.findOne({ _id: id, user: userId })
      .populate('user', 'username email')
      .populate('items.product', 'name price images')
      .lean();

    if (!order) {
      return notFound(res, 'Order not found');
    }

    return success(res, { order }, 'Order retrieved successfully');

  } catch (err) {
    console.error('Get order error:', err);
    
    if (err.name === 'CastError') {
      return notFound(res, 'Order not found');
    }
    
    return error(res, 'Failed to get order', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};


const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const order = await Order.findOne({ _id: id, user: userId });

    if (!order) {
      return notFound(res, 'Order not found');
    }

    if (order.status !== 'pending') {
      return validationError(res, [{ 
        field: 'status', 
        message: 'Only pending orders can be canceled' 
      }]);
    }


    order.status = 'cancelled';
    await order.save();


    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } }
      );
    }

    const updatedOrder = await Order.findById(order._id)
      .populate('user', 'username email')
      .populate('items.product', 'name price images');

    return success(res, { order: updatedOrder }, 'Order canceled successfully');

  } catch (err) {
    console.error('Cancel order error:', err);
    
    if (err.name === 'CastError') {
      return notFound(res, 'Order not found');
    }
    
    return error(res, 'Failed to cancel order', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};


const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, userId } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.user = userId;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [orders, totalCount] = await Promise.all([
      Order.find(filter)
        .populate('user', 'username email')
        .populate('items.product', 'name price images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter)
    ]);

    const pagination = {
      page: pageNum,
      limit: limitNum,
      total: totalCount,
      pages: Math.ceil(totalCount / limitNum),
      hasNext: pageNum < Math.ceil(totalCount / limitNum),
      hasPrev: pageNum > 1
    };

    return success(res, { orders, pagination }, 'All orders retrieved successfully');

  } catch (err) {
    console.error('Get all orders error:', err);
    return error(res, 'Failed to get orders', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};


const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return validationError(res, [{ 
        field: 'status', 
        message: 'Invalid status. Must be one of: pending, confirmed, shipped, delivered, cancelled' 
      }]);
    }

    const order = await Order.findById(id);

    if (!order) {
      return notFound(res, 'Order not found');
    }

    const oldStatus = order.status;
    order.status = status;
    await order.save();


    if (status === 'cancelled' && oldStatus !== 'cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } }
        );
      }
    }

    const updatedOrder = await Order.findById(order._id)
      .populate('user', 'username email')
      .populate('items.product', 'name price images');

    return success(res, { order: updatedOrder }, 'Order status updated successfully');

  } catch (err) {
    console.error('Update order status error:', err);
    
    if (err.name === 'CastError') {
      return notFound(res, 'Order not found');
    }
    
    return error(res, 'Failed to update order status', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};


const getOrderStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    return success(res, {
      stats,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0
    }, 'Order statistics retrieved successfully');

  } catch (err) {
    console.error('Get order stats error:', err);
    return error(res, 'Failed to get order statistics', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};


const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return notFound(res, 'Order not found');
    }


    if (order.status !== 'cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } }
        );
      }
    }


    await Order.findByIdAndDelete(id);

    return success(res, null, 'Order deleted successfully');

  } catch (err) {
    console.error('Delete order error:', err);
    
    if (err.name === 'CastError') {
      return notFound(res, 'Order not found');
    }
    
    return error(res, 'Failed to delete order', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderStats,
  deleteOrder
};

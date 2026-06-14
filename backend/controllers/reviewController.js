const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');
const { success, error, notFound, validationError, unauthorized, forbidden } = require('../utils/response');

// Получение отзывов для конкретного товара (только одобренные для обычных пользователей)
const getProductReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'desc',
      rating
    } = req.query;

    // Проверяем, существует ли товар
    const product = await Product.findById(id);
    if (!product) {
      return notFound(res, 'Product not found');
    }

    // Построение фильтра для отзывов - только одобренные.
    // После $unwind поля отзыва лежат в reviews.*, поэтому фильтровать нужно по reviews.status.
    let reviewMatchFilter = { 'reviews.status': 'approved' };
    if (rating) {
      const ratingNum = parseInt(rating);
      if (ratingNum >= 1 && ratingNum <= 5) {
        reviewMatchFilter['reviews.rating'] = ratingNum;
      }
    }

    // Настройка сортировки
    const sortOptions = {};
    const validSortFields = ['created_at', 'rating'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? 1 : -1;
    sortOptions[`reviews.${sortField}`] = order;

    // Пагинация
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Агрегация для получения отзывов с пагинацией
    const pipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      { $unwind: '$reviews' },
      ...(Object.keys(reviewMatchFilter).length > 0 ? [{ $match: reviewMatchFilter }] : []),
      { $sort: sortOptions },
      {
        $lookup: {
          from: 'users',
          localField: 'reviews.user',
          foreignField: '_id',
          as: 'reviewUser'
        }
      },
      {
        $facet: {
          reviews: [
            { $skip: skip },
            { $limit: limitNum },
            {
              $project: {
                _id: '$reviews._id',
                user: { $arrayElemAt: ['$reviewUser', 0] },
                rating: '$reviews.rating',
                comment: '$reviews.comment',
                createdAt: '$reviews.createdAt'
              }
            }
          ],
          totalCount: [{ $count: 'count' }]
        }
      }
    ];

    const result = await Product.aggregate(pipeline);
    const reviews = result[0]?.reviews || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;

    // Статистика отзывов (только одобренные)
    const statsResult = await Product.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      { $unwind: '$reviews' },
      { $match: { 'reviews.status': 'approved' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$reviews.rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$reviews.rating'
          }
        }
      }
    ]);

    let stats = {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    if (statsResult.length > 0) {
      const stat = statsResult[0];
      stats.averageRating = Math.round(stat.averageRating * 10) / 10;
      stats.totalReviews = stat.totalReviews;
      
      // Подсчет распределения рейтингов
      stat.ratingDistribution.forEach(rating => {
        stats.ratingDistribution[rating]++;
      });
    }

    const pagination = {
      page: pageNum,
      limit: limitNum,
      total: totalCount,
      pages: Math.ceil(totalCount / limitNum),
      hasNext: pageNum < Math.ceil(totalCount / limitNum),
      hasPrev: pageNum > 1
    };

    return res.status(200).json({
      success: true,
      message: 'Reviews retrieved successfully',
      data: {
        reviews,
        stats,
        productId: id
      },
      pagination,
      filters: {
        rating,
        sortBy: sortField,
        sortOrder
      },
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Get product reviews error:', err);
    
    if (err.name === 'CastError') {
      return notFound(res, 'Product not found');
    }
    
    return error(res, 'Failed to get reviews', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};

// Добавление отзыва к товару
const addProductReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;
    const username = req.user.username;

    console.log('Adding review - Full request:', {
      id, 
      rating, 
      comment, 
      userId, 
      username,
      body: req.body,
      params: req.params
    });

    // Проверяем, существует ли товар
    const product = await Product.findById(id);
    if (!product) {
      console.log('Product not found:', id);
      return notFound(res, 'Product not found');
    }

    console.log('Product found:', product.name, 'Reviews count:', product.reviews.length);

    // Проверяем, не оставлял ли пользователь уже отзыв на этот товар (независимо от статуса)
    const existingReview = product.reviews.find(review => 
      review.user.toString() === userId.toString()
    );

    if (existingReview) {
      console.log('User already has review:', existingReview);
      return error(res, 'Вы уже оставили отзыв на этот товар', 409);
    }

    // Создаем новый отзыв со статусом "pending"
    const newReview = {
      user: userId,
      rating: parseInt(rating),
      comment: comment.trim(),
      status: 'pending' // По умолчанию ожидает модерации
    };

    console.log('Creating new review:', newReview);

    // Добавляем отзыв к товару
    product.reviews.push(newReview);
    
    console.log('Saving product with new review...');
    await product.save();
    console.log('Product saved successfully');

    // Возвращаем информацию о созданном отзыве
    return success(res, {
      review: newReview,
      productId: id,
      totalReviews: product.reviews.length,
      message: 'Ваш отзыв отправлен на модерацию и будет опубликован после проверки администратором'
    }, 'Review submitted for moderation', 201);

  } catch (err) {
    console.error('Add product review error:', err);
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      errors: err.errors,
      stack: err.stack
    });
    
    if (err.name === 'CastError') {
      return notFound(res, 'Product not found');
    }
    
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message,
        value: e.value
      }));
      console.log('Validation errors:', validationErrors);
      return validationError(res, validationErrors);
    }
    
    return error(res, 'Failed to add review', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};

// Обновление отзыва пользователя
const updateProductReview = async (req, res) => {
  try {
    const { id, reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    // Валидация входных данных
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return validationError(res, [{ field: 'rating', message: 'Rating must be between 1 and 5' }]);
    }

    if (comment !== undefined && comment.trim().length === 0) {
      return validationError(res, [{ field: 'comment', message: 'Comment cannot be empty' }]);
    }

    if (comment !== undefined && comment.trim().length > 1000) {
      return validationError(res, [{ field: 'comment', message: 'Comment must be less than 1000 characters' }]);
    }

    // Находим товар
    const product = await Product.findById(id);
    if (!product) {
      return notFound(res, 'Product not found');
    }

    // Находим отзыв
    const review = product.reviews.id(reviewId);
    if (!review) {
      return notFound(res, 'Review not found');
    }

    // Проверяем, что пользователь является автором отзыва
    if (review.user.toString() !== userId.toString()) {
      return forbidden(res, 'You can only edit your own reviews');
    }

    // Обновляем отзыв
    if (rating !== undefined) {
      review.rating = parseInt(rating);
    }
    if (comment !== undefined) {
      review.comment = comment.trim();
    }

    await product.save();

    return success(res, {
      review: review,
      productId: id
    }, 'Review updated successfully');

  } catch (err) {
    console.error('Update product review error:', err);
    
    if (err.name === 'CastError') {
      return notFound(res, 'Product or review not found');
    }
    
    if (err.name === 'ValidationError') {
      return validationError(res, Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      })));
    }
    
    return error(res, 'Failed to update review', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};

// Удаление отзыва пользователя
const deleteProductReview = async (req, res) => {
  try {
    const { id, reviewId } = req.params;
    const userId = req.user._id;

    // Находим товар
    const product = await Product.findById(id);
    if (!product) {
      return notFound(res, 'Product not found');
    }

    // Находим отзыв
    const review = product.reviews.id(reviewId);
    if (!review) {
      return notFound(res, 'Review not found');
    }

    // Проверяем, что пользователь является автором отзыва или администратором
    if (review.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return forbidden(res, 'You can only delete your own reviews');
    }

    // Удаляем отзыв
    product.reviews.pull(reviewId);
    await product.save();

    return success(res, {
      productId: id,
      reviewId: reviewId,
      totalReviews: product.reviews.length
    }, 'Review deleted successfully');

  } catch (err) {
    console.error('Delete product review error:', err);
    
    if (err.name === 'CastError') {
      return notFound(res, 'Product or review not found');
    }
    
    return error(res, 'Failed to delete review', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};

// Получение отзывов пользователя
const getUserReviews = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    // Настройка сортировки
    const sortOptions = {};
    const validSortFields = ['created_at', 'rating'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? 1 : -1;
    sortOptions[`reviews.${sortField}`] = order;

    // Пагинация
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Агрегация для получения отзывов пользователя
    const pipeline = [
      { $unwind: '$reviews' },
      { $match: { 'reviews.user': new mongoose.Types.ObjectId(userId) } },
      { $sort: sortOptions },
      {
        $facet: {
          reviews: [
            { $skip: skip },
            { $limit: limitNum },
            {
              $project: {
                _id: '$reviews._id',
                productId: '$_id',
                productName: '$name',
                productImage: { $arrayElemAt: ['$images', 0] },
                rating: '$reviews.rating',
                comment: '$reviews.comment',
                createdAt: '$reviews.createdAt'
              }
            }
          ],
          totalCount: [{ $count: 'count' }]
        }
      }
    ];

    const result = await Product.aggregate(pipeline);
    const reviews = result[0]?.reviews || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;

    const pagination = {
      page: pageNum,
      limit: limitNum,
      total: totalCount,
      pages: Math.ceil(totalCount / limitNum),
      hasNext: pageNum < Math.ceil(totalCount / limitNum),
      hasPrev: pageNum > 1
    };

    return res.status(200).json({
      success: true,
      message: 'User reviews retrieved successfully',
      data: {
        reviews,
        userId: userId
      },
      pagination,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Get user reviews error:', err);
    return error(res, 'Failed to get user reviews', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};

// Получение статистики отзывов для товара
const getProductReviewStats = async (req, res) => {
  try {
    const { id } = req.params;

    // Проверяем, существует ли товар
    const product = await Product.findById(id);
    if (!product) {
      return notFound(res, 'Product not found');
    }

    // Получаем статистику отзывов (только одобренные)
    const statsResult = await Product.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      { $unwind: '$reviews' },
      { $match: { 'reviews.status': 'approved' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$reviews.rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$reviews.rating'
          },
          recentReviews: {
            $push: {
              rating: '$reviews.rating',
              created_at: '$reviews.created_at'
            }
          }
        }
      }
    ]);

    let stats = {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      recommendationPercentage: 0
    };

    if (statsResult.length > 0) {
      const stat = statsResult[0];
      stats.averageRating = Math.round(stat.averageRating * 10) / 10;
      stats.totalReviews = stat.totalReviews;
      
      // Подсчет распределения рейтингов
      stat.ratingDistribution.forEach(rating => {
        stats.ratingDistribution[rating]++;
      });

      // Процент рекомендаций (рейтинг 4 и 5)
      const positiveReviews = stats.ratingDistribution[4] + stats.ratingDistribution[5];
      stats.recommendationPercentage = Math.round((positiveReviews / stats.totalReviews) * 100);
    }

    return success(res, {
      stats,
      productId: id
    }, 'Review statistics retrieved successfully');

  } catch (err) {
    console.error('Get product review stats error:', err);
    
    if (err.name === 'CastError') {
      return notFound(res, 'Product not found');
    }
    
    return error(res, 'Failed to get review statistics', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};

// Получение всех ожидающих отзывов (для админа)
const getPendingReviews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    // Настройка сортировки
    const sortOptions = {};
    const validSortFields = ['created_at', 'rating'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? 1 : -1;
    sortOptions[`reviews.${sortField}`] = order;

    // Пагинация
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Агрегация для получения ожидающих отзывов
    const pipeline = [
      { $unwind: '$reviews' },
      { $match: { 'reviews.status': 'pending' } },
      { $sort: sortOptions },
      {
        $lookup: {
          from: 'users',
          localField: 'reviews.user',
          foreignField: '_id',
          as: 'reviewUser'
        }
      },
      {
        $facet: {
          reviews: [
            { $skip: skip },
            { $limit: limitNum },
            {
              $project: {
                _id: '$reviews._id',
                productId: '$_id',
                productName: '$name',
                productImage: { $arrayElemAt: ['$images', 0] },
                user: { $arrayElemAt: ['$reviewUser', 0] },
                rating: '$reviews.rating',
                comment: '$reviews.comment',
                status: '$reviews.status',
                createdAt: '$reviews.createdAt'
              }
            }
          ],
          totalCount: [{ $count: 'count' }]
        }
      }
    ];

    const result = await Product.aggregate(pipeline);
    const reviews = result[0]?.reviews || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;

    const pagination = {
      page: pageNum,
      limit: limitNum,
      total: totalCount,
      pages: Math.ceil(totalCount / limitNum),
      hasNext: pageNum < Math.ceil(totalCount / limitNum),
      hasPrev: pageNum > 1
    };

    return res.status(200).json({
      success: true,
      message: 'Pending reviews retrieved successfully',
      data: {
        reviews,
        count: reviews.length,
        totalPending: totalCount
      },
      pagination,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Get pending reviews error:', err);
    return error(res, 'Failed to get pending reviews', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};

// Получение всех отзывов сайта для администратора
const getAllReviewsForAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;
    const order = sortOrder === 'asc' ? 1 : -1;
    const sortField = ['createdAt', 'rating', 'status'].includes(sortBy) ? sortBy : 'createdAt';

    const reviewMatchFilter = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      reviewMatchFilter['reviews.status'] = status;
    }

    const pipeline = [
      { $unwind: '$reviews' },
      ...(Object.keys(reviewMatchFilter).length > 0 ? [{ $match: reviewMatchFilter }] : []),
      {
        $lookup: {
          from: 'users',
          localField: 'reviews.user',
          foreignField: '_id',
          as: 'reviewUser'
        }
      },
      {
        $facet: {
          reviews: [
            { $sort: { [`reviews.${sortField}`]: order } },
            { $skip: skip },
            { $limit: limitNum },
            {
              $project: {
                _id: '$reviews._id',
                productId: '$_id',
                productName: '$name',
                productImage: { $arrayElemAt: ['$images', 0] },
                user: { $arrayElemAt: ['$reviewUser', 0] },
                rating: '$reviews.rating',
                comment: '$reviews.comment',
                status: '$reviews.status',
                rejectedReason: '$reviews.rejectedReason',
                createdAt: '$reviews.createdAt'
              }
            }
          ],
          totalCount: [{ $count: 'count' }],
          statusStats: [
            {
              $group: {
                _id: '$reviews.status',
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ];

    const result = await Product.aggregate(pipeline);
    const reviews = result[0]?.reviews || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;
    const rawStatusStats = result[0]?.statusStats || [];

    const stats = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    };

    rawStatusStats.forEach((item) => {
      if (item?._id && Object.prototype.hasOwnProperty.call(stats, item._id)) {
        stats[item._id] = item.count;
        stats.total += item.count;
      }
    });

    return res.status(200).json({
      success: true,
      message: 'All reviews retrieved successfully',
      data: {
        reviews,
        stats
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
        hasNext: pageNum < Math.ceil(totalCount / limitNum),
        hasPrev: pageNum > 1
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Get all reviews for admin error:', err);
    return error(res, 'Failed to get all reviews', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};

// Одобрение или отклонение отзыва (для админа)
const moderateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { action, reason } = req.body; // action: 'approve' или 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return validationError(res, [{ field: 'action', message: 'Action must be "approve" or "reject"' }]);
    }

    if (action === 'reject' && (!reason || reason.trim().length === 0)) {
      return validationError(res, [{ field: 'reason', message: 'Reason is required when rejecting a review' }]);
    }

    // Находим товар с этим отзывом
    const product = await Product.findOne({ 'reviews._id': reviewId });
    
    if (!product) {
      return notFound(res, 'Review not found');
    }

    // Находим отзыв
    const review = product.reviews.id(reviewId);
    if (!review) {
      return notFound(res, 'Review not found');
    }

    // Обновляем статус отзыва
    if (action === 'approve') {
      review.status = 'approved';
      review.rejectedReason = null;
    } else {
      review.status = 'rejected';
      review.rejectedReason = reason.trim();
    }

    await product.save();

    return success(res, {
      reviewId: reviewId,
      productId: product._id,
      newStatus: review.status,
      comment: review.comment,
      rating: review.rating
    }, action === 'approve' ? 'Review approved successfully' : 'Review rejected successfully');

  } catch (err) {
    console.error('Moderate review error:', err);
    
    if (err.name === 'CastError') {
      return notFound(res, 'Review not found');
    }
    
    return error(res, 'Failed to moderate review', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};

// Получение всех отзывов товара для админа (включая.pending и rejected)
const getAllProductReviewsForAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'desc',
      status // фильтр по статусу: pending, approved, rejected
    } = req.query;

    // Проверяем, существует ли товар
    const product = await Product.findById(id);
    if (!product) {
      return notFound(res, 'Product not found');
    }

    // Построение фильтра для отзывов
    let reviewMatchFilter = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      reviewMatchFilter['reviews.status'] = status;
    }

    // Настройка сортировки
    const sortOptions = {};
    const validSortFields = ['created_at', 'rating'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? 1 : -1;
    sortOptions[`reviews.${sortField}`] = order;

    // Пагинация
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Агрегация для получения всех отзывов с пагинацией
    const pipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      { $unwind: '$reviews' },
      ...(Object.keys(reviewMatchFilter).length > 0 ? [{ $match: reviewMatchFilter }] : []),
      { $sort: sortOptions },
      {
        $lookup: {
          from: 'users',
          localField: 'reviews.user',
          foreignField: '_id',
          as: 'reviewUser'
        }
      },
      {
        $facet: {
          reviews: [
            { $skip: skip },
            { $limit: limitNum },
            {
              $project: {
                _id: '$reviews._id',
                user: { $arrayElemAt: ['$reviewUser', 0] },
                rating: '$reviews.rating',
                comment: '$reviews.comment',
                status: '$reviews.status',
                rejectedReason: '$reviews.rejectedReason',
                createdAt: '$reviews.createdAt'
              }
            }
          ],
          totalCount: [{ $count: 'count' }]
        }
      }
    ];

    const result = await Product.aggregate(pipeline);
    const reviews = result[0]?.reviews || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;

    const pagination = {
      page: pageNum,
      limit: limitNum,
      total: totalCount,
      pages: Math.ceil(totalCount / limitNum),
      hasNext: pageNum < Math.ceil(totalCount / limitNum),
      hasPrev: pageNum > 1
    };

    return res.status(200).json({
      success: true,
      message: 'All product reviews retrieved successfully (including pending and rejected)',
      data: {
        reviews,
        stats: {
          total: product.reviews.length,
          pending: product.reviews.filter(r => r.status === 'pending').length,
          approved: product.reviews.filter(r => r.status === 'approved').length,
          rejected: product.reviews.filter(r => r.status === 'rejected').length
        },
        productId: id
      },
      pagination,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Get all product reviews for admin error:', err);
    
    if (err.name === 'CastError') {
      return notFound(res, 'Product not found');
    }
    
    return error(res, 'Failed to get all reviews', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};

module.exports = {
  getProductReviews,
  addProductReview,
  updateProductReview,
  deleteProductReview,
  getUserReviews,
  getProductReviewStats,
  getPendingReviews,
  getAllReviewsForAdmin,
  moderateReview,
  getAllProductReviewsForAdmin
};

const Product = require('../models/Product');
const Category = require('../models/Category');
const { success, error, notFound, validationError } = require('../utils/response');

const getApprovedReviewStats = (reviews = []) => {
  const approvedReviews = Array.isArray(reviews)
    ? reviews.filter(review => review.status === 'approved')
    : [];

  if (approvedReviews.length === 0) {
    return {
      averageRating: 0,
      reviewCount: 0
    };
  }

  const ratingSum = approvedReviews.reduce((total, review) => total + Number(review.rating || 0), 0);

  return {
    averageRating: Math.round((ratingSum / approvedReviews.length) * 10) / 10,
    reviewCount: approvedReviews.length
  };
};

// Получение списка товаров с фильтрацией и пагинацией
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      minPrice,
      maxPrice,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      availability = 'all'
    } = req.query;

    // Построение фильтра
    const filter = { isActive: { $ne: false } };

    // Фильтр по категории
    if (category) {
      // Определяем фильтр по названию товара
      const categoryLower = category.toLowerCase();
      if (categoryLower.includes('мыш')) {
        filter.$or = [
          { name: { $regex: 'мыш', $options: 'i' } }
        ];
      } else if (categoryLower.includes('клавиатур')) {
        filter.$or = [
          { name: { $regex: 'клавиатур', $options: 'i' } }
        ];
      } else if (categoryLower.includes('наушник')) {
        filter.$or = [
          { name: { $regex: 'наушник', $options: 'i' } }
        ];
      } else if (categoryLower.includes('монитор')) {
        filter.$or = [
          { name: { $regex: 'монитор', $options: 'i' } }
        ];
      } else if (categoryLower.includes('микрофон')) {
        filter.$or = [
          { name: { $regex: 'микрофон', $options: 'i' } }
        ];
      } else if (categoryLower.includes('веб-камер') || categoryLower.includes('камер')) {
        filter.$or = [
          { name: { $regex: 'веб-камер|камер', $options: 'i' } }
        ];
      }
    }
      
    // Фильтр по цене
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Фильтр по доступности
    if (availability === 'available') {
      filter.stock = { $gt: 0 };
    } else if (availability === 'unavailable') {
      filter.stock = { $lte: 0 };
    }

    // Поиск только по названию
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // Настройка сортировки
    const sortOptions = {};
    const validSortFields = ['name', 'price', 'createdAt', 'stock'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const order = sortOrder === 'asc' ? 1 : -1;
    sortOptions[sortField] = order;

    // Пагинация
    const pageNum = Math.max(1, parseInt(page));
    const requestedLimit = parseInt(limit, 10);
    const limitNum = requestedLimit === 0 ? 0 : Math.min(500, Math.max(1, requestedLimit));
    const skip = (pageNum - 1) * limitNum;

    // Выполнение запроса с оптимизацией
    const productsQuery = Product.find(filter)
      .populate('category', 'name deviceType') // Только нужные поля
      .sort(sortOptions)
      .select('-__v')
      .lean() // Возвращаем plain JS объекты для скорости
      .maxTimeMS(5000);

    if (limitNum > 0) {
      productsQuery.skip(skip).limit(limitNum);
    }

    const [products, totalCount] = await Promise.all([
      productsQuery,
      Product.countDocuments(filter).maxTimeMS(2000) // Максимум 2 секунды на подсчет
    ]);

    // Добавляем информацию об избранном для аутентифицированных пользователей
    if (req.user) {
      const userFavorites = req.user.favorites || [];
      products.forEach(product => {
        product.isFavorite = userFavorites.includes(product._id.toString());
      });
    }

    // Обрабатываем изображения для всех товаров
    const BASE_IMAGE_URL = process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : `${req.protocol}://${req.get('host')}`;

    const processedProducts = products.map(product => {
      let processedImages = [];
      if (product.images && product.images.length > 0) {
        processedImages = product.images.map(img => {
          if (img.startsWith('http')) {
            return img; // Уже полный URL (Cloudinary)
          } else {
            return `${BASE_IMAGE_URL}${img.startsWith('/') ? img : '/' + img}`;
          }
        });
      } else {
        processedImages = [`${BASE_IMAGE_URL}/uploads/default-product.png`];
      }

      return {
        ...product,
        ...getApprovedReviewStats(product.reviews),
        reviews: undefined,
        images: processedImages
      };
    });

    const pagination = {
      page: pageNum,
      limit: limitNum || totalCount,
      total: totalCount,
      pages: limitNum > 0 ? Math.ceil(totalCount / limitNum) : 1,
      hasNext: limitNum > 0 && pageNum < Math.ceil(totalCount / limitNum),
      hasPrev: limitNum > 0 && pageNum > 1
    };

    return res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: processedProducts,
      pagination,
      filters: {
        category,
        minPrice,
        maxPrice,
        search,
        availability,
        sortBy: sortField,
        sortOrder
      },
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Get products error:', err);
    
    // Если MongoDB недоступна, возвращаем пустой массив вместо ошибки
    if (err.name === 'MongooseError' || err.message.includes('buffering timed out')) {
      return res.status(200).json({
        success: true,
        message: 'Database unavailable, returning empty result',
        data: [],
        pagination: {
          page: 1,
          limit: 12,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false
        },
        timestamp: new Date().toISOString()
      });
    }
    
    return error(res, 'Failed to get products', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};

// Получение конкретного товара по ID
const getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).lean();

    if (!product || (product.isActive === false && req.user?.role !== 'admin')) {
      return notFound(res, 'Product not found');
    }

    // Добавляем информацию об избранном для аутентифицированных пользователей
    if (req.user) {
      const userFavorites = req.user.favorites || [];
      product.isFavorite = userFavorites.includes(product._id.toString());
    }

    // Обрабатываем изображения
    const BASE_IMAGE_URL = process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : `${req.protocol}://${req.get('host')}`;

    let processedImages = [];
    if (product.images && product.images.length > 0) {
      processedImages = product.images.map(img => {
        if (img.startsWith('http')) {
          return img; // Уже полный URL (Cloudinary)
        } else {
          return `${BASE_IMAGE_URL}${img.startsWith('/') ? img : '/' + img}`;
        }
      });
    } else {
      processedImages = [`${BASE_IMAGE_URL}/uploads/default-product.png`];
    }

    const processedProduct = {
      ...product,
      ...getApprovedReviewStats(product.reviews),
      images: processedImages
    };

    // Увеличиваем счетчик просмотров (если поле существует)
    await Product.findByIdAndUpdate(id, { $inc: { view_count: 1 } });

    return success(res, { product: processedProduct }, 'Product retrieved successfully');

  } catch (err) {
    console.error('Get product error:', err);
    
    if (err.name === 'CastError') {
      return notFound(res, 'Product not found');
    }
    
    return error(res, 'Failed to get product', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};

// Получение товаров по категории
const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const {
      page = 1,
      limit = 12,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Построение фильтра по категории
    const filter = { isActive: { $ne: false } };
    
    // Проверяем, является ли category числом (ID) или строкой (название)
    if (!isNaN(category)) {
      filter['category.id'] = parseInt(category);
    } else {
      filter['category.name'] = category;
    }

    // Фильтр по цене
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Только доступные товары
    filter.availability = { $gt: 0 };

    // Настройка сортировки
    const sortOptions = {};
    const validSortFields = ['product_name', 'price', 'createdAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const order = sortOrder === 'asc' ? 1 : -1;
    sortOptions[sortField] = order;

    // Пагинация
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Выполнение запроса
    const [products, totalCount] = await Promise.all([
      Product.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .select('-reviews')
        .lean(),
      Product.countDocuments(filter)
    ]);

    if (products.length === 0) {
      return success(res, [], 'No products found in this category');
    }

    // Добавляем информацию об избранном
    if (req.user) {
      const userFavorites = req.user.favorites || [];
      products.forEach(product => {
        product.isFavorite = userFavorites.includes(product._id.toString());
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
      message: 'Products retrieved successfully',
      data: products,
      pagination,
      category: {
        identifier: category,
        type: !isNaN(category) ? 'id' : 'name'
      },
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Get products by category error:', err);
    return error(res, 'Failed to get products by category', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};

// Поиск товаров
const searchProducts = async (req, res) => {
  try {
    const {
      query: searchQuery,
      category,
      minPrice,
      maxPrice,
      page = 1,
      limit = 12,
      sortBy = 'relevance'
    } = req.body;

    if (!searchQuery || searchQuery.trim().length === 0) {
      return validationError(res, [{ field: 'query', message: 'Search query is required' }]);
    }

    // Построение фильтра поиска
    const filter = {
      isActive: { $ne: false },
      $or: [
        { product_name: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { properties: { $regex: searchQuery, $options: 'i' } }
      ]
    };

    // Дополнительные фильтры
    if (category) {
      if (!isNaN(category)) {
        filter['category.id'] = parseInt(category);
      } else {
        filter['category.name'] = category;
      }
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Только доступные товары
    filter.availability = { $gt: 0 };

    // Настройка сортировки
    let sortOptions = {};
    if (sortBy === 'price_asc') {
      sortOptions.price = 1;
    } else if (sortBy === 'price_desc') {
      sortOptions.price = -1;
    } else if (sortBy === 'name') {
      sortOptions.product_name = 1;
    } else if (sortBy === 'newest') {
      sortOptions.createdAt = -1;
    } else {
      // Сортировка по релевантности (по умолчанию)
      sortOptions = { score: { $meta: 'textScore' } };
      
      // Добавляем текстовый поиск для лучшей релевантности
      filter.$text = { $search: searchQuery };
    }

    // Пагинация
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Выполнение запроса
    let query = Product.find(filter);
    
    if (sortBy === 'relevance') {
      query = query.select({ score: { $meta: 'textScore' } });
    }
    
    const [products, totalCount] = await Promise.all([
      query
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .select('-reviews')
        .lean(),
      Product.countDocuments(filter)
    ]);

    // Добавляем информацию об избранном
    if (req.user) {
      const userFavorites = req.user.favorites || [];
      products.forEach(product => {
        product.isFavorite = userFavorites.includes(product._id.toString());
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
      message: `Found ${totalCount} products`,
      data: products,
      pagination,
      searchQuery,
      filters: {
        category,
        minPrice,
        maxPrice,
        sortBy
      },
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Search products error:', err);
    return error(res, 'Failed to search products', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};

// Получение категорий товаров
const getCategories = async (req, res) => {
  try {
    // Получаем реальные категории из базы данных
    const categories = await Category.find({ isActive: true }).lean();
    
    // Получаем количество товаров для каждой категории
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const [totalProducts, availableProducts] = await Promise.all([
          Product.countDocuments({ category: category._id, isActive: { $ne: false } }),
          Product.countDocuments({ category: category._id, isActive: { $ne: false }, stock: { $gt: 0 } })
        ]);
        
        return {
          _id: category._id,
          id: category._id,
          name: category.name,
          deviceType: category.deviceType,
          device_type: category.deviceType,
          description: category.description,
          image: category.image,
          totalProducts,
          availableProducts
        };
      })
    );

    return success(res, { categories: categoriesWithCounts }, 'Categories retrieved successfully');

  } catch (err) {
    console.error('Get categories error:', err);
    
    if (err.name === 'MongooseError' || err.message.includes('buffering timed out')) {
      return res.status(200).json({
        success: true,
        message: 'Database unavailable, returning empty result',
        data: { categories: [] },
        timestamp: new Date().toISOString()
      });
    }
    
    return error(res, 'Failed to get categories', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};

// Получение популярных товаров
const getPopularProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    const limitNum = Math.min(20, Math.max(1, parseInt(limit)));

    // Получаем популярные товары (по количеству просмотров или отзывов)
    const products = await Product.aggregate([
      {
        $match: {
          isActive: { $ne: false },
          stock: { $gt: 0 }
        }
      },
      {
        $addFields: {
          reviewCount: { $size: '$reviews' },
          avgRating: { $avg: '$reviews.rating' },
          popularity: {
            $add: [
              { $ifNull: ['$view_count', 0] },
              { $multiply: [{ $size: '$reviews' }, 2] } // Отзывы весят больше
            ]
          }
        }
      },
      {
        $sort: { popularity: -1, createdAt: -1 }
      },
      {
        $limit: limitNum
      },
      {
        $project: {
          reviews: 0 // Исключаем отзывы
        }
      }
    ]);

    // Добавляем информацию об избранном
    if (req.user) {
      const userFavorites = req.user.favorites || [];
      products.forEach(product => {
        product.isFavorite = userFavorites.includes(product._id.toString());
      });
    }

    return success(res, { products }, 'Popular products retrieved successfully');

  } catch (err) {
    console.error('Get popular products error:', err);
    return error(res, 'Failed to get popular products', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};

// Получение новых товаров
const getNewProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    const limitNum = Math.min(20, Math.max(1, parseInt(limit)));

    const products = await Product.find({
      isActive: { $ne: false },
      stock: { $gt: 0 }
    })
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .select('-reviews')
      .lean();

    // Добавляем информацию об избранном
    if (req.user) {
      const userFavorites = req.user.favorites || [];
      products.forEach(product => {
        product.isFavorite = userFavorites.includes(product._id.toString());
      });
    }

    return success(res, { products }, 'New products retrieved successfully');

  } catch (err) {
    console.error('Get new products error:', err);
    return error(res, 'Failed to get new products', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};

// Валидация товаров (проверка существования и доступности)
const validateProducts = async (req, res) => {
  try {
    const { productIds } = req.body;
    
    if (!productIds || !Array.isArray(productIds)) {
      return validationError(res, [{ 
        field: 'productIds', 
        message: 'Product IDs array is required' 
      }]);
    }

    // Находим существующие товары
    const existingProducts = await Product.find({
      _id: { $in: productIds },
      isActive: { $ne: false }
    }).select('_id name price stock').lean();

    const existingIds = existingProducts.map(p => p._id.toString());
    const invalidIds = productIds.filter(id => !existingIds.includes(id));

    return success(res, {
      valid: existingProducts,
      invalid: invalidIds
    }, 'Products validated successfully');

  } catch (err) {
    console.error('Validate products error:', err);
    return error(res, 'Failed to validate products', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};

module.exports = {
  getProducts,
  getProduct,
  getProductsByCategory,
  searchProducts,
  getCategories,
  getPopularProducts,
  getNewProducts,
  validateProducts
};

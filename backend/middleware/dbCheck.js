const mongoose = require('mongoose');

// Middleware для проверки подключения к БД
const checkDbConnection = (req, res, next) => {
  // Пропускаем проверку для auth endpoints (логин/регистрация)
  if (req.path.includes('/auth/')) {
    return next();
  }
  
  // Если БД не подключена, возвращаем пустой результат вместо ошибки
  if (mongoose.connection.readyState !== 1) {
    console.log('⚠️ Request received but DB not ready yet, returning empty result');
    
    // Для запросов списков возвращаем пустой массив
    if (req.path.includes('/products') && req.method === 'GET') {
      return res.status(200).json({
        success: true,
        message: 'Database connecting, please wait...',
        data: [],
        pagination: {
          page: 1,
          limit: 12,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false
        }
      });
    }
    
    if (req.path.includes('/categories') && req.method === 'GET') {
      return res.status(200).json({
        success: true,
        message: 'Database connecting, please wait...',
        data: { categories: [] }
      });
    }
    
    // Для остальных запросов возвращаем ошибку сервиса недоступен
    return res.status(503).json({
      success: false,
      message: 'Database is connecting, please try again in a moment'
    });
  }
  
  next();
};

module.exports = { checkDbConnection };

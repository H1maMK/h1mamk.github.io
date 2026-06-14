const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const { unauthorized, error } = require('../utils/response');
const tokenService = require('../services/tokenService');

// Middleware для проверки аутентификации
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return unauthorized(res, 'Access token is required');
    }

    // Проверяем, не находится ли токен в blacklist
    if (tokenService.isTokenBlacklisted(token)) {
      return unauthorized(res, 'Token has been invalidated');
    }

    // Проверяем токен
    const decoded = verifyToken(token);
    
    // Получаем пользователя
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return unauthorized(res, 'User not found');
    }

    if (user.isBlocked) {
      return unauthorized(res, 'Account is blocked');
    }

    // Постоянная инвалидация токенов через БД (после logout/change-password)
    if (user.tokenInvalidBefore && decoded.iat) {
      const tokenIssuedAtMs = decoded.iat * 1000;
      const invalidBeforeMs = new Date(user.tokenInvalidBefore).getTime();
      if (tokenIssuedAtMs <= invalidBeforeMs) {
        return unauthorized(res, 'Token has been invalidated');
      }
    }

    // Добавляем пользователя в request
    req.user = user;
    req.token = token;
    
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return unauthorized(res, 'Token expired');
    }
    
    if (err.name === 'JsonWebTokenError') {
      return unauthorized(res, 'Invalid token');
    }

    console.error('Authentication error:', err);
    return error(res, 'Authentication failed', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};

// Middleware для опциональной аутентификации (не требует токен)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token && !tokenService.isTokenBlacklisted(token)) {
      try {
        const decoded = verifyToken(token);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user && !user.isBlocked) {
          if (user.tokenInvalidBefore && decoded.iat) {
            const tokenIssuedAtMs = decoded.iat * 1000;
            const invalidBeforeMs = new Date(user.tokenInvalidBefore).getTime();
            if (tokenIssuedAtMs <= invalidBeforeMs) {
              return next();
            }
          }

          req.user = user;
          req.token = token;
        }
      } catch (err) {
        // Игнорируем ошибки для опциональной аутентификации
        console.log('Optional auth failed:', err.message);
      }
    }
    
    next();
  } catch (err) {
    // Игнорируем ошибки для опциональной аутентификации
    next();
  }
};

// Middleware для проверки роли администратора
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return unauthorized(res, 'Authentication required');
  }

  if (req.user.role !== 'admin') {
    return unauthorized(res, 'Admin access required');
  }

  next();
};

// Middleware для проверки роли модератора или администратора
const requireModerator = (req, res, next) => {
  if (!req.user) {
    return unauthorized(res, 'Authentication required');
  }

  const allowedRoles = ['admin', 'moderator'];
  if (!allowedRoles.includes(req.user.role)) {
    return unauthorized(res, 'Moderator or admin access required');
  }

  next();
};

// Middleware для проверки владельца ресурса или администратора
const requireOwnerOrAdmin = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorized(res, 'Authentication required');
    }

    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    const isOwner = resourceUserId && resourceUserId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return unauthorized(res, 'Access denied: you can only access your own resources');
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  requireModerator,
  requireOwnerOrAdmin
};

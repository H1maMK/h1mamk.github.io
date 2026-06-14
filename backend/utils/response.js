// Стандартные ответы API для консистентности

// Успешный ответ
const success = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return res.status(statusCode).json(response);
};

// Ответ с данными и пагинацией
const successWithPagination = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: Math.ceil(pagination.total / pagination.limit),
      hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrev: pagination.page > 1
    },
    timestamp: new Date().toISOString()
  });
};

// Ответ об ошибке
const error = (res, message = 'An error occurred', statusCode = 500, details = null) => {
  const response = {
    success: false,
    error: {
      message,
      code: statusCode
    },
    timestamp: new Date().toISOString()
  };
  
  if (details) {
    response.error.details = details;
  }
  
  return res.status(statusCode).json(response);
};

// Ошибка валидации
const validationError = (res, errors, message = 'Validation failed') => {
  return res.status(400).json({
    success: false,
    error: {
      message,
      code: 400,
      type: 'ValidationError',
      details: errors
    },
    timestamp: new Date().toISOString()
  });
};

// Ошибка аутентификации
const unauthorized = (res, message = 'Unauthorized access') => {
  return res.status(401).json({
    success: false,
    error: {
      message,
      code: 401,
      type: 'UnauthorizedError'
    },
    timestamp: new Date().toISOString()
  });
};

// Ошибка доступа
const forbidden = (res, message = 'Access forbidden') => {
  return res.status(403).json({
    success: false,
    error: {
      message,
      code: 403,
      type: 'ForbiddenError'
    },
    timestamp: new Date().toISOString()
  });
};

// Ресурс не найден
const notFound = (res, message = 'Resource not found') => {
  return res.status(404).json({
    success: false,
    error: {
      message,
      code: 404,
      type: 'NotFoundError'
    },
    timestamp: new Date().toISOString()
  });
};

// Конфликт (например, дублирование)
const conflict = (res, message = 'Resource already exists') => {
  return res.status(409).json({
    success: false,
    error: {
      message,
      code: 409,
      type: 'ConflictError'
    },
    timestamp: new Date().toISOString()
  });
};

// Слишком много запросов
const tooManyRequests = (res, message = 'Too many requests', retryAfter = null) => {
  const response = {
    success: false,
    error: {
      message,
      code: 429,
      type: 'RateLimitError'
    },
    timestamp: new Date().toISOString()
  };
  
  if (retryAfter) {
    response.error.retryAfter = retryAfter;
  }
  
  return res.status(429).json(response);
};

// Внутренняя ошибка сервера
const internalError = (res, message = 'Internal server error', details = null) => {
  const response = {
    success: false,
    error: {
      message,
      code: 500,
      type: 'InternalServerError'
    },
    timestamp: new Date().toISOString()
  };
  
  // В production не показываем детали ошибок
  if (process.env.NODE_ENV !== 'production' && details) {
    response.error.details = details;
  }
  
  return res.status(500).json(response);
};

// Создано успешно
const created = (res, data, message = 'Resource created successfully') => {
  return success(res, data, message, 201);
};

// Обновлено успешно
const updated = (res, data, message = 'Resource updated successfully') => {
  return success(res, data, message, 200);
};

// Удалено успешно
const deleted = (res, message = 'Resource deleted successfully') => {
  return success(res, null, message, 200);
};

// Нет контента
const noContent = (res) => {
  return res.status(204).send();
};

module.exports = {
  success,
  successWithPagination,
  error,
  validationError,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  tooManyRequests,
  internalError,
  created,
  updated,
  deleted,
  noContent
};
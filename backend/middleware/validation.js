const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { validationError } = require('../utils/response');


const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    return validationError(res, formattedErrors);
  }
  
  next();
};


const validateUserRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Имя пользователя должно быть от 3 до 30 символов'),
    
  body('email')
    .isEmail()
    .withMessage('Введите корректный email')
    .normalizeEmail(),
    
  body('password')
    .isLength({ min: 8 })
    .withMessage('Пароль должен быть минимум 8 символов')
    .bail()
    .matches(/[A-Z]/)
    .withMessage('Пароль должен содержать минимум одну заглавную букву'),
    
  body('yearbirth')
    .optional()
    .isISO8601()
    .withMessage('Введите корректную дату рождения'),
    
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', ''])
    .withMessage('Пол должен быть male, female, other или пустым'),
    
  handleValidationErrors
];


const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Введите корректный email')
    .normalizeEmail(),

  body('password').notEmpty().withMessage('Введите пароль'),

  handleValidationErrors,
];


const validateProfileUpdate = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Имя пользователя должно быть от 3 до 30 символов'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Введите корректный email')
    .normalizeEmail(),

  body('yearbirth')
    .optional()
    .isISO8601()
    .withMessage('Введите корректную дату рождения'),

  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', ''])
    .withMessage('Пол должен быть male, female, other или пустым'),

  handleValidationErrors,
];


const validateSearchParams = (req, res, next) => {
  const { page, limit, minPrice, maxPrice } = req.query;
  
  if (page && (!Number.isInteger(+page) || +page < 1)) {
    return validationError(res, [{ 
      field: 'page', 
      message: 'Номер страницы должен быть положительным целым числом' 
    }]);
  }
  
  if (limit && (!Number.isInteger(+limit) || +limit < 0 || +limit > 500)) {
    return validationError(res, [{ 
      field: 'limit', 
      message: 'Лимит должен быть от 0 до 500' 
    }]);
  }
  
  if (minPrice && (+minPrice < 0 || isNaN(+minPrice))) {
    return validationError(res, [{ 
      field: 'minPrice', 
      message: 'Минимальная цена должна быть положительным числом' 
    }]);
  }
  
  if (maxPrice && (+maxPrice < 0 || isNaN(+maxPrice))) {
    return validationError(res, [{ 
      field: 'maxPrice', 
      message: 'Максимальная цена должна быть положительным числом' 
    }]);
  }
  
  if (minPrice && maxPrice && +minPrice > +maxPrice) {
    return validationError(res, [{ 
      field: 'price', 
      message: 'Минимальная цена не может быть больше максимальной' 
    }]);
  }
  
  next();
};


const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Название товара должно быть от 3 до 200 символов'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Описание не должно превышать 2000 символов'),
    
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Цена должна быть положительным числом'),
    
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Количество товара не может быть отрицательным'),
    
  body('category')
    .optional()
    .isMongoId()
    .withMessage('Категория должна быть корректным идентификатором'),
    
  handleValidationErrors
];


const validateReview = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Оценка должна быть от 1 до 5'),
    
  body('comment')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Комментарий должен быть от 10 до 1000 символов')
    .notEmpty()
    .withMessage('Введите комментарий'),
    
  handleValidationErrors
];


const validateOrder = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Заказ должен содержать минимум один товар'),
    
  body('items.*.product')
    .isMongoId()
    .withMessage('Идентификатор товара некорректен'),
    
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Количество товара должно быть не меньше 1'),
    
  body('shippingAddress')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Адрес доставки должен быть от 10 до 500 символов'),
    
  body('paymentMethod')
    .isIn(['card', 'cash', 'bank_transfer'])
    .withMessage('Способ оплаты должен быть card, cash или bank_transfer'),
    
  handleValidationErrors
];


const validateArticle = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Заголовок статьи должен быть от 5 до 200 символов'),
    
  body('content')
    .trim()
    .isLength({ min: 50 })
    .withMessage('Содержание статьи должно быть минимум 50 символов'),
    
  body('excerpt')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Краткое описание не должно превышать 500 символов'),
    
  body('tags')
    .optional()
    .isArray()
    .withMessage('Теги должны быть массивом'),
    
  handleValidationErrors
];


const validateMongoId = (paramName = 'id') => [
  body(paramName)
    .isMongoId()
    .withMessage(`${paramName} должен быть корректным идентификатором MongoDB`),
    
  handleValidationErrors
];


const validateObjectId = (req, res, next) => {
  const { id, productId, reviewId } = req.params;
  const idToValidate = id || productId || reviewId;
  
  if (idToValidate && !mongoose.Types.ObjectId.isValid(idToValidate)) {
    return validationError(res, [{ 
      field: 'id', 
      message: `Некорректный формат ID: ${idToValidate}. Ожидается корректный идентификатор MongoDB.` 
    }]);
  }
  
  next();
};

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateProfileUpdate,
  validateSearchParams,
  validateProduct,
  validateReview,
  validateOrder,
  validateArticle,
  validateMongoId,
  validateObjectId
};

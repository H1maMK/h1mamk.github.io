# Express.js Server Setup Documentation

## Обзор

Express.js сервер для DeviceMaster настроен с современной архитектурой и всеми необходимыми middleware для безопасной и производительной работы.

## Архитектура сервера

### Основные компоненты

1. **Express Application** - основное приложение
2. **Middleware Stack** - стек промежуточного ПО
3. **Route Handlers** - обработчики маршрутов
4. **Error Handlers** - обработчики ошибок
5. **Database Connection** - подключение к MongoDB

### Middleware Stack (в порядке выполнения)

1. **Helmet** - защита HTTP заголовков
2. **Compression** - сжатие ответов
3. **Rate Limiting** - ограничение частоты запросов
4. **CORS** - настройка Cross-Origin Resource Sharing
5. **Body Parsing** - парсинг JSON и URL-encoded данных
6. **Custom Logging** - кастомное логирование
7. **Static Files** - обслуживание статических файлов
8. **API Routes** - маршруты API (будут добавлены в следующих задачах)
9. **404 Handler** - обработчик несуществующих маршрутов
10. **Error Handler** - глобальный обработчик ошибок

## Конфигурация безопасности

### Helmet Configuration
```javascript
app.use(helmet());
```
Автоматически настраивает:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (в production)

### CORS Configuration
```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:3000',
  credentials: true,
}));
```

### Rate Limiting
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests', ... },
  standardHeaders: true,
  legacyHeaders: false,
});
```

## Middleware компоненты

### Authentication Middleware (`middleware/auth.js`)

#### `authenticateToken`
- Проверяет JWT токен в заголовке Authorization
- Извлекает пользователя из базы данных
- Добавляет `req.user` для последующих middleware

#### `requireAdmin`
- Проверяет, что пользователь имеет роль администратора
- Должен использоваться после `authenticateToken`

#### `optionalAuth`
- Опциональная аутентификация
- Не требует токен, но если он есть - проверяет его

### Validation Middleware (`middleware/validation.js`)

Использует `express-validator` для валидации:
- `validateUserRegistration` - валидация регистрации
- `validateUserLogin` - валидация входа
- `validateProductCreation` - валидация создания товара
- `validateOrderCreation` - валидация создания заказа
- И другие...

### Upload Middleware (`middleware/upload.js`)

Использует `multer` для загрузки файлов:
- `uploadAvatar` - загрузка аватара (1 файл)
- `uploadProductImages` - загрузка изображений товара (до 3 файлов)
- `uploadArticleImage` - загрузка изображения статьи (1 файл)

Конфигурация:
- Максимальный размер файла: 5MB
- Разрешенные типы: jpeg, jpg, png, gif, webp
- Автоматическое создание папок для загрузки

### Logger Middleware (`middleware/logger.js`)

Кастомное логирование с использованием `morgan`:
- `consoleLogger` - логирование в консоль (development)
- `fileLogger` - логирование в файл (production)
- `errorLogger` - логирование ошибок
- `slowRequestLogger` - логирование медленных запросов (>1s)
- `authLogger` - логирование попыток входа

## Утилиты

### JWT Utils (`utils/jwt.js`)
- `generateToken(userId)` - генерация JWT токена
- `verifyToken(token)` - проверка токена
- `isTokenExpired(token)` - проверка истечения токена
- `refreshTokenIfNeeded(token)` - обновление токена при необходимости

### Password Utils (`utils/password.js`)
- `hashPassword(password)` - хеширование пароля с bcrypt
- `comparePassword(password, hash)` - сравнение пароля с хешем
- `validatePasswordStrength(password)` - проверка силы пароля
- `generateRandomPassword(length)` - генерация случайного пароля

### Response Utils (`utils/response.js`)
Стандартизированные ответы API:
- `success(res, data, message, statusCode)` - успешный ответ
- `error(res, message, statusCode, details)` - ответ с ошибкой
- `validationError(res, errors, message)` - ошибка валидации
- `unauthorized(res, message)` - ошибка аутентификации
- `forbidden(res, message)` - ошибка доступа
- `notFound(res, message)` - ресурс не найден
- И другие...

## Обработка ошибок

### Глобальный обработчик ошибок

```javascript
app.use((err, req, res, next) => {
  // Логирование ошибки
  console.error(err.stack);
  
  // Специфичные типы ошибок
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.message
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }
  
  // ... другие типы ошибок
  
  // Общая ошибка сервера
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : err.message
  });
});
```

### Типы обрабатываемых ошибок

1. **ValidationError** - ошибки валидации Mongoose
2. **UnauthorizedError** - ошибки JWT аутентификации
3. **CastError** - ошибки преобразования типов MongoDB
4. **MongoError (code: 11000)** - ошибки дублирования в MongoDB
5. **MulterError** - ошибки загрузки файлов
6. **Generic Error** - общие ошибки сервера

## Логирование

### Структура логов

Логи сохраняются в папке `logs/`:
- `access.log` - все HTTP запросы
- `error.log` - ошибки приложения
- `slow.log` - медленные запросы (>1s)
- `auth.log` - попытки входа в систему

### Формат логов

#### Development (консоль)
```
GET /api/products 200 45ms - 1234 - john_doe
```

#### Production (файл)
```
192.168.1.1 - john_doe [25/Dec/2023:10:30:45 +0000] "GET /api/products HTTP/1.1" 200 1234 "http://localhost:3000" "Mozilla/5.0..." 45ms
```

#### Error Log (JSON)
```json
{
  "timestamp": "2023-12-25T10:30:45.123Z",
  "user": "john_doe",
  "method": "POST",
  "url": "/api/products",
  "error": {
    "name": "ValidationError",
    "message": "Product name is required",
    "stack": "..."
  },
  "body": { "price": 100 },
  "params": {},
  "query": {}
}
```

## Health Check Endpoints

### `/health`
Простая проверка работоспособности сервера:
```json
{
  "status": "OK",
  "timestamp": "2023-12-25T10:30:45.123Z",
  "uptime": 3600.5,
  "environment": "development",
  "database": "MongoDB"
}
```

### `/api/status`
Детальная информация о состоянии сервера:
```json
{
  "database": {
    "status": "connected",
    "name": "devicemaster_react",
    "host": "localhost",
    "port": 27017
  },
  "server": {
    "status": "running",
    "uptime": 3600.5,
    "memory": {
      "rss": 50331648,
      "heapTotal": 20971520,
      "heapUsed": 15728640,
      "external": 1048576
    },
    "version": "v18.17.0"
  }
}
```

## Производительность

### Оптимизации

1. **Compression** - сжатие ответов gzip/deflate
2. **Static File Caching** - кеширование статических файлов
3. **Request Body Limits** - ограничение размера запросов (10MB)
4. **Connection Pooling** - пул соединений MongoDB
5. **Graceful Shutdown** - корректное завершение работы

### Мониторинг

1. **Slow Request Logging** - логирование медленных запросов
2. **Memory Usage Tracking** - отслеживание использования памяти
3. **Database Connection Monitoring** - мониторинг подключения к БД
4. **Rate Limiting Metrics** - метрики ограничения запросов

## Тестирование

### Структура тестов

```
tests/
├── server.test.js          # Тесты основного сервера
├── middleware/             # Тесты middleware
│   ├── auth.test.js
│   ├── validation.test.js
│   └── upload.test.js
├── utils/                  # Тесты утилит
│   ├── jwt.test.js
│   ├── password.test.js
│   └── response.test.js
└── integration/            # Интеграционные тесты
    └── api.test.js
```

### Запуск тестов

```bash
# Все тесты
npm test

# Конкретный файл
npm test -- server.test.js

# Watch режим
npm run test:watch

# С покрытием кода
npm test -- --coverage
```

## Развертывание

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker (будет добавлено позже)
```bash
docker build -t devicemaster-backend .
docker run -p 5000:5000 devicemaster-backend
```

## Переменные окружения

Все переменные окружения документированы в `.env.example`:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/devicemaster_react

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Следующие шаги

После завершения настройки Express сервера, следующие задачи:

1. **Создание JWT аутентификации** (задача 3.3)
2. **Создание API маршрутов для аутентификации** (задача 4.1)
3. **Создание API маршрутов для товаров** (задача 5.1)
4. **Создание API маршрутов для заказов** (задача 6.1)
5. **Создание административных API маршрутов** (задача 7.1)

## Заключение

Express.js сервер полностью настроен и готов к добавлению API маршрутов. Все middleware компоненты созданы и протестированы. Сервер включает в себя:

✅ Безопасность (Helmet, CORS, Rate Limiting)
✅ Логирование (консоль, файлы, ошибки)
✅ Аутентификация (JWT middleware)
✅ Валидация (express-validator)
✅ Загрузка файлов (multer)
✅ Обработка ошибок (глобальный handler)
✅ Утилиты (JWT, пароли, ответы)
✅ Тестирование (Jest, Supertest)
✅ Документация (README, setup guides)

Сервер готов к интеграции с MongoDB и созданию API endpoints.
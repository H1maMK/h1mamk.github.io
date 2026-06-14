# JWT Authentication System Documentation

## Обзор

Система JWT аутентификации для DeviceMaster обеспечивает безопасную аутентификацию и авторизацию пользователей с использованием JSON Web Tokens.

## Архитектура аутентификации

### Компоненты системы

1. **AuthController** - контроллер для обработки запросов аутентификации
2. **Auth Middleware** - middleware для проверки JWT токенов
3. **Token Service** - сервис для управления blacklist токенов
4. **JWT Utils** - утилиты для работы с JWT токенами
5. **Password Utils** - утилиты для работы с паролями

### Поток аутентификации

```
1. Регистрация/Вход → 2. Генерация JWT → 3. Отправка токена клиенту
                                              ↓
4. Клиент сохраняет токен ← 5. Использование токена в запросах
                                              ↓
6. Middleware проверяет токен → 7. Доступ к защищенным ресурсам
```

## API Endpoints

### Публичные endpoints (не требуют аутентификации)

#### POST /api/auth/register
Регистрация нового пользователя.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "yearbirth": "1990",
  "gender": "male"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "username": "john_doe",
      "email": "john@example.com",
      "yearbirth": "1990",
      "gender": "male",
      "img": null,
      "role": {
        "id": 1,
        "name": "user"
      },
      "createdAt": "2023-12-25T10:30:45.123Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  },
  "timestamp": "2023-12-25T10:30:45.123Z"
}
```

#### POST /api/auth/login
Вход пользователя в систему.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "username": "john_doe",
      "email": "john@example.com",
      "yearbirth": "1990",
      "gender": "male",
      "img": null,
      "role": {
        "id": 1,
        "name": "user"
      },
      "favorites": [],
      "last_login": "2023-12-25T10:30:45.123Z",
      "createdAt": "2023-12-25T10:30:45.123Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  },
  "timestamp": "2023-12-25T10:30:45.123Z"
}
```

#### POST /api/auth/verify
Проверка валидности JWT токена.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "valid": true,
    "user": { /* user object */ },
    "expiresAt": "2023-12-32T10:30:45.123Z"
  },
  "timestamp": "2023-12-25T10:30:45.123Z"
}
```

#### POST /api/auth/refresh
Обновление JWT токена.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "user": { /* user object */ },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  },
  "timestamp": "2023-12-25T10:30:45.123Z"
}
```

### Защищенные endpoints (требуют аутентификации)

#### GET /api/auth/me
Получение данных текущего пользователя.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "User data retrieved successfully",
  "data": {
    "user": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "username": "john_doe",
      "email": "john@example.com",
      "yearbirth": "1990",
      "gender": "male",
      "img": null,
      "role": {
        "id": 1,
        "name": "user"
      },
      "favorites": [],
      "last_login": "2023-12-25T10:30:45.123Z",
      "createdAt": "2023-12-25T10:30:45.123Z"
    }
  },
  "timestamp": "2023-12-25T10:30:45.123Z"
}
```

#### POST /api/auth/logout
Выход из системы (инвалидация токена).

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful - token invalidated",
  "data": null,
  "timestamp": "2023-12-25T10:30:45.123Z"
}
```

#### PUT /api/auth/change-password
Смена пароля пользователя.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewSecurePassword456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": null,
  "timestamp": "2023-12-25T10:30:45.123Z"
}
```

## Middleware аутентификации

### authenticateToken
Основной middleware для проверки JWT токенов.

```javascript
const { authenticateToken } = require('../middleware/auth');

// Использование в маршрутах
router.get('/protected', authenticateToken, (req, res) => {
  // req.user содержит данные аутентифицированного пользователя
  res.json({ user: req.user });
});
```

### requireAdmin
Middleware для проверки прав администратора.

```javascript
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Использование для админских маршрутов
router.post('/admin/users', authenticateToken, requireAdmin, createUser);
```

### optionalAuth
Middleware для опциональной аутентификации.

```javascript
const { optionalAuth } = require('../middleware/auth');

// Использование для маршрутов, где аутентификация опциональна
router.get('/products', optionalAuth, getProducts);
```

## Token Service

Сервис для управления blacklist токенов (инвалидация при logout).

### Основные методы

```javascript
const tokenService = require('../services/tokenService');

// Добавить токен в blacklist
tokenService.blacklistToken(token);

// Проверить, находится ли токен в blacklist
const isBlacklisted = tokenService.isTokenBlacklisted(token);

// Получить статистику токенов
const stats = tokenService.getTokenStats();

// Очистить blacklist (для тестирования)
tokenService.clearBlacklist();
```

### Автоматическая очистка

Сервис автоматически очищает истекшие токены каждый час для экономии памяти.

## JWT Utilities

### Генерация токена
```javascript
const { generateToken } = require('../utils/jwt');

const token = generateToken(userId);
```

### Проверка токена
```javascript
const { verifyToken } = require('../utils/jwt');

try {
  const decoded = verifyToken(token);
  console.log('User ID:', decoded.userId);
} catch (error) {
  console.error('Invalid token:', error.message);
}
```

### Дополнительные утилиты
```javascript
const { 
  isTokenExpired, 
  getTokenExpiration, 
  refreshTokenIfNeeded 
} = require('../utils/jwt');

// Проверка истечения токена
if (isTokenExpired(token)) {
  console.log('Token expired');
}

// Получение времени истечения
const expiration = getTokenExpiration(token);

// Обновление токена при необходимости
const newToken = refreshTokenIfNeeded(token);
```

## Password Utilities

### Хеширование пароля
```javascript
const { hashPassword } = require('../utils/password');

const hashedPassword = await hashPassword('userPassword123');
```

### Проверка пароля
```javascript
const { comparePassword } = require('../utils/password');

const isValid = await comparePassword('userPassword123', hashedPassword);
```

### Валидация силы пароля
```javascript
const { validatePasswordStrength } = require('../utils/password');

const validation = validatePasswordStrength('userPassword123');
console.log('Is valid:', validation.isValid);
console.log('Errors:', validation.errors);
console.log('Strength:', validation.strength); // 0-100
```

## Валидация

### Валидация регистрации
- Username: 3-30 символов, только буквы, цифры и подчеркивания
- Email: валидный email адрес
- Password: минимум 6 символов, должен содержать строчные, заглавные буквы и цифры
- Year of birth: опционально, год от 1900 до текущего
- Gender: опционально, 'male', 'female' или 'other'

### Валидация входа
- Email: валидный email адрес
- Password: обязательное поле

### Валидация смены пароля
- Current password: обязательное поле
- New password: те же требования, что и при регистрации

## Обработка ошибок

### Типы ошибок аутентификации

#### 400 - Validation Error
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "type": "ValidationError",
    "code": 400,
    "details": [
      {
        "field": "password",
        "message": "Password must be at least 6 characters long",
        "value": "123"
      }
    ]
  },
  "timestamp": "2023-12-25T10:30:45.123Z"
}
```

#### 401 - Unauthorized
```json
{
  "success": false,
  "error": {
    "message": "Invalid email or password",
    "code": 401,
    "type": "UnauthorizedError"
  },
  "timestamp": "2023-12-25T10:30:45.123Z"
}
```

#### 409 - Conflict (дублирование)
```json
{
  "success": false,
  "error": {
    "message": "User with this email already exists",
    "code": 409,
    "type": "ConflictError"
  },
  "timestamp": "2023-12-25T10:30:45.123Z"
}
```

## Безопасность

### Защитные меры

1. **Хеширование паролей**: Используется bcrypt с salt rounds = 12
2. **JWT подписи**: Токены подписываются секретным ключом
3. **Token blacklist**: Инвалидированные токены хранятся в blacklist
4. **Валидация входных данных**: Все входные данные валидируются
5. **Rate limiting**: Ограничение частоты запросов
6. **CORS**: Настроен для разрешенных доменов

### Рекомендации по безопасности

1. **JWT_SECRET**: Используйте криптографически стойкий секретный ключ
2. **HTTPS**: В production всегда используйте HTTPS
3. **Token storage**: Храните токены в httpOnly cookies или secure storage
4. **Token expiration**: Используйте разумное время жизни токенов
5. **Refresh tokens**: Реализуйте refresh токены для длительных сессий

## Конфигурация

### Переменные окружения

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Password hashing
BCRYPT_SALT_ROUNDS=12
```

### Настройка JWT

```javascript
// utils/jwt.js
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRE || '7d',
      issuer: 'devicemaster-api',
      audience: 'devicemaster-client'
    }
  );
};
```

## Тестирование

### Запуск тестов аутентификации

```bash
# Все тесты аутентификации
npm test -- --testPathPattern=auth

# Простые тесты
npm test -- --testPathPattern=auth-simple

# Конкретный тест
npm test -- --testNamePattern="Should register user"
```

### Структура тестов

```
tests/
├── auth.test.js          # Полные тесты аутентификации
├── auth-simple.test.js   # Упрощенные тесты
└── middleware/
    └── auth.test.js      # Тесты middleware
```

### Тестовые данные

```javascript
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'TestPassword123',
  yearbirth: '1990',
  gender: 'male'
};
```

## Интеграция с Frontend

### Сохранение токена (React)

```javascript
// После успешного входа
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const data = await loginResponse.json();
if (data.success) {
  // Сохраняем токен
  localStorage.setItem('authToken', data.data.token);
  localStorage.setItem('user', JSON.stringify(data.data.user));
}
```

### Использование токена в запросах

```javascript
// Добавляем токен к каждому запросу
const token = localStorage.getItem('authToken');

const response = await fetch('/api/protected-endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Обработка истечения токена

```javascript
// Interceptor для автоматического обновления токена
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Пытаемся обновить токен
      try {
        const refreshResponse = await axios.post('/api/auth/refresh');
        const newToken = refreshResponse.data.data.token;
        
        localStorage.setItem('authToken', newToken);
        
        // Повторяем оригинальный запрос
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return axios.request(error.config);
      } catch (refreshError) {
        // Перенаправляем на страницу входа
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);
```

## Мониторинг и логирование

### Логирование аутентификации

Все попытки входа логируются в `logs/auth.log`:

```json
{
  "timestamp": "2023-12-25T10:30:45.123Z",
  "email": "john@example.com",
  "success": true,
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0..."
}
```

### Метрики токенов

```javascript
// Получение статистики токенов
const stats = tokenService.getTokenStats();
console.log('Active tokens in blacklist:', stats.active);
console.log('Expired tokens in blacklist:', stats.expired);
console.log('Total tokens in blacklist:', stats.total);
```

## Заключение

Система JWT аутентификации полностью настроена и готова к использованию. Она обеспечивает:

✅ Безопасную регистрацию и вход пользователей
✅ JWT токены с подписью и временем жизни
✅ Middleware для защиты маршрутов
✅ Blacklist для инвалидации токенов
✅ Валидацию всех входных данных
✅ Хеширование паролей с bcrypt
✅ Обработку ошибок и логирование
✅ Полное покрытие тестами
✅ Документацию и примеры использования

Система готова к интеграции с React frontend и созданию защищенных API endpoints.
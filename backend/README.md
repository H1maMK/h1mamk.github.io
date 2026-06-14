# DeviceMaster Backend API

Express.js REST API для интернет-магазина DeviceMaster с MongoDB базой данных.

## 🚀 Быстрый старт

### Предварительные требования

- Node.js >= 16.0.0
- MongoDB >= 5.0
- npm или yarn

### Установка

1. Установите зависимости:
```bash
npm install
```

2. Создайте файл `.env` на основе `.env.example`:
```bash
cp .env.example .env
```

3. Настройте переменные окружения в `.env`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/devicemaster_react
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

4. Убедитесь, что MongoDB запущен:
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

5. Проверьте подключение к базе данных:
```bash
npm run db:check
```

6. Инициализируйте базу данных:
```bash
npm run db:init
```

### Запуск сервера

#### Development режим (с hot reload):
```bash
npm run dev
```

#### Production режим:
```bash
npm start
```

Сервер будет доступен по адресу: `http://localhost:5000`

## 📁 Структура проекта

```
backend/
├── config/           # Конфигурация (database, etc.)
├── controllers/      # Контроллеры для обработки запросов
├── middleware/       # Middleware (auth, validation, upload, logger)
├── models/          # Mongoose модели
├── routes/          # API маршруты
├── utils/           # Утилиты (jwt, password, response)
├── uploads/         # Загруженные файлы
├── logs/            # Логи приложения
├── tests/           # Тесты
├── scripts/         # Скрипты для работы с БД
├── .env             # Переменные окружения
└── server.js        # Точка входа
```

## 🔌 API Endpoints

### Health Check
- `GET /health` - Проверка работоспособности сервера
- `GET /api/status` - Статус сервера и базы данных

### Authentication (будут добавлены в следующих задачах)
- `POST /api/auth/register` - Регистрация пользователя
- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/logout` - Выход из системы
- `GET /api/auth/me` - Получение текущего пользователя

### Users
- `GET /api/users/profile` - Получение профиля
- `PUT /api/users/profile` - Обновление профиля
- `POST /api/users/avatar` - Загрузка аватара
- `GET /api/users/favorites` - Получение избранных товаров
- `POST /api/users/favorites/:productId` - Добавление в избранное
- `DELETE /api/users/favorites/:productId` - Удаление из избранного

### Products
- `GET /api/products` - Получение списка товаров
- `GET /api/products/:id` - Получение конкретного товара
- `GET /api/products/category/:category` - Товары по категории
- `POST /api/products/search` - Поиск товаров
- `POST /api/products/:id/reviews` - Добавление отзыва
- `GET /api/products/:id/reviews` - Получение отзывов

### Orders
- `GET /api/orders` - Получение заказов пользователя
- `POST /api/orders` - Создание нового заказа
- `GET /api/orders/:id` - Получение конкретного заказа

### Articles
- `GET /api/articles` - Получение всех статей
- `GET /api/articles/:id` - Получение конкретной статьи

### Admin (требуется роль администратора)
- `POST /api/admin/products` - Создание товара
- `PUT /api/admin/products/:id` - Редактирование товара
- `DELETE /api/admin/products/:id` - Удаление товара
- `GET /api/admin/users` - Получение всех пользователей
- `PUT /api/admin/users/:id` - Редактирование пользователя
- `DELETE /api/admin/users/:id` - Удаление пользователя
- `GET /api/admin/orders` - Получение всех заказов
- `PUT /api/admin/orders/:id/status` - Изменение статуса заказа

## 🔐 Аутентификация

API использует JWT (JSON Web Tokens) для аутентификации.

### Получение токена
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Использование токена
```bash
GET /api/users/profile
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🛡️ Middleware

### Authentication Middleware
- `authenticateToken` - Проверка JWT токена
- `requireAdmin` - Проверка прав администратора
- `optionalAuth` - Опциональная аутентификация

### Validation Middleware
- `validateUserRegistration` - Валидация регистрации
- `validateUserLogin` - Валидация входа
- `validateProductCreation` - Валидация создания товара
- `validateOrderCreation` - Валидация создания заказа
- И другие...

### Upload Middleware
- `uploadAvatar` - Загрузка аватара (1 файл)
- `uploadProductImages` - Загрузка изображений товара (до 3 файлов)
- `uploadArticleImage` - Загрузка изображения статьи (1 файл)

### Logger Middleware
- `consoleLogger` - Логирование в консоль (development)
- `fileLogger` - Логирование в файл (production)
- `errorLogger` - Логирование ошибок
- `slowRequestLogger` - Логирование медленных запросов
- `authLogger` - Логирование попыток входа

## 🧪 Тестирование

### Запуск всех тестов:
```bash
npm test
```

### Запуск тестов в watch режиме:
```bash
npm run test:watch
```

### Проверка линтера:
```bash
npm run lint
```

### Автоматическое исправление линтера:
```bash
npm run lint:fix
```

## 📝 Скрипты базы данных

### Проверка подключения:
```bash
npm run db:check
```

### Инициализация базы данных:
```bash
npm run db:init
```

### Сброс базы данных:
```bash
npm run db:reset
```

### Заполнение тестовыми данными:
```bash
npm run db:seed
```

## 🔧 Переменные окружения

| Переменная | Описание | По умолчанию |
|-----------|----------|--------------|
| `NODE_ENV` | Окружение (development/production/test) | development |
| `PORT` | Порт сервера | 5000 |
| `MONGODB_URI` | URI подключения к MongoDB | mongodb://localhost:27017/devicemaster_react |
| `JWT_SECRET` | Секретный ключ для JWT | - |
| `JWT_EXPIRE` | Время жизни JWT токена | 7d |
| `FRONTEND_URL` | URL frontend приложения (для CORS) | http://localhost:3000 |
| `MAX_FILE_SIZE` | Максимальный размер файла (байты) | 5242880 (5MB) |
| `UPLOAD_PATH` | Путь для загрузки файлов | ./uploads |
| `RATE_LIMIT_WINDOW_MS` | Окно для rate limiting (мс) | 900000 (15 мин) |
| `RATE_LIMIT_MAX_REQUESTS` | Максимум запросов в окне | 100 |

## 📊 Логирование

Логи сохраняются в папке `logs/`:
- `access.log` - Логи всех запросов
- `error.log` - Логи ошибок
- `slow.log` - Логи медленных запросов (>1s)
- `auth.log` - Логи попыток входа

## 🔒 Безопасность

- Helmet для защиты HTTP заголовков
- CORS настроен для frontend URL
- Rate limiting для защиты от DDoS
- JWT для аутентификации
- Bcrypt для хеширования паролей
- Валидация всех входных данных
- Защита от SQL/NoSQL инъекций

## 📚 Документация

Подробная документация по настройке MongoDB: [docs/MONGODB_SETUP.md](docs/MONGODB_SETUP.md)

## 🐛 Отладка

### Проверка статуса сервера:
```bash
curl http://localhost:5000/health
```

### Проверка статуса базы данных:
```bash
curl http://localhost:5000/api/status
```

### Просмотр логов:
```bash
# Windows
type logs\access.log
type logs\error.log

# Linux/Mac
tail -f logs/access.log
tail -f logs/error.log
```

## 🤝 Разработка

1. Создайте новую ветку для вашей функции
2. Следуйте стилю кода (ESLint + Prettier)
3. Добавьте тесты для новой функциональности
4. Убедитесь, что все тесты проходят
5. Создайте Pull Request

## 📄 Лицензия

MIT

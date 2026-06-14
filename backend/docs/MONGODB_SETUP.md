# MongoDB Setup Guide for DeviceMaster

## 📋 Требования

- MongoDB 4.4 или выше
- Node.js 16 или выше
- npm или yarn

## 🚀 Установка MongoDB

### Windows

1. Скачайте MongoDB Community Server с [официального сайта](https://www.mongodb.com/try/download/community)
2. Запустите установщик и выберите "Complete" установку
3. Установите MongoDB как Windows Service
4. MongoDB будет доступен по адресу `mongodb://localhost:27017`

### macOS

```bash
# Используя Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Запуск MongoDB как сервиса
brew services start mongodb/brew/mongodb-community
```

### Linux (Ubuntu/Debian)

```bash
# Импорт ключа MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Добавление репозитория
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Установка
sudo apt-get update
sudo apt-get install -y mongodb-org

# Запуск сервиса
sudo systemctl start mongod
sudo systemctl enable mongod
```

## ⚙️ Настройка проекта

### 1. Настройка переменных окружения

Скопируйте `.env.example` в `.env` и настройте параметры:

```bash
cp .env.example .env
```

Отредактируйте `.env`:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/devicemaster_react

# Для продакшена с аутентификацией:
# MONGODB_URI=mongodb://username:password@localhost:27017/devicemaster_react
```

### 2. Проверка подключения

```bash
npm run db:check
```

Эта команда проверит:
- Подключение к MongoDB
- Базовые операции CRUD
- Статистику базы данных

### 3. Инициализация базы данных

```bash
npm run db:init
```

Эта команда создаст:
- Все необходимые коллекции
- Индексы для оптимизации запросов
- Базовые категории товаров

## 🗄️ Структура базы данных

### Коллекции

1. **users** - Пользователи системы
2. **products** - Товары магазина
3. **orders** - Заказы пользователей
4. **articles** - Статьи блога
5. **categories** - Категории товаров

### Индексы

#### Users Collection
- `email` (unique)
- `username` (unique)
- `createdAt` (descending)
- `role.name`

#### Products Collection
- `category.id`
- `category.name`
- `price`
- `availability`
- Text search: `product_name`, `description`, `properties`
- `createdAt` (descending)
- `view_count` (descending)

#### Orders Collection
- `user_id`
- `order_date` (descending)
- `status`
- Compound: `user_id` + `order_date`
- `total_amount`

#### Articles Collection
- Text search: `title`, `content`
- `createdAt` (descending)

#### Categories Collection
- `name` (unique)
- `device_type`
- `id` (unique)

## 🛠 Полезные команды

### Проверка статуса

```bash
# Проверка подключения к MongoDB
npm run db:check

# Проверка статуса сервера
curl http://localhost:5000/api/status
```

### Управление данными

```bash
# Инициализация базы данных
npm run db:init

# Сброс базы данных (будет создан позже)
npm run db:reset

# Заполнение тестовыми данными (будет создан позже)
npm run db:seed
```

### MongoDB Shell

```bash
# Подключение к базе данных
mongosh mongodb://localhost:27017/devicemaster_react

# Основные команды в shell:
show collections          # Показать коллекции
db.users.find()          # Показать всех пользователей
db.products.countDocuments()  # Подсчет товаров
```

## 🔧 Настройка для продакшена

### 1. Аутентификация

Создайте пользователя для приложения:

```javascript
// В MongoDB shell
use admin
db.createUser({
  user: "devicemaster_admin",
  pwd: "secure_password_here",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase"]
})

use devicemaster_react
db.createUser({
  user: "devicemaster_app",
  pwd: "app_password_here",
  roles: ["readWrite"]
})
```

Обновите `.env`:

```env
MONGODB_URI=mongodb://devicemaster_app:app_password_here@localhost:27017/devicemaster_react
```

### 2. Настройки безопасности

В `mongod.conf`:

```yaml
security:
  authorization: enabled

net:
  bindIp: 127.0.0.1
  port: 27017
```

### 3. Резервное копирование

```bash
# Создание резервной копии
mongodump --uri="mongodb://localhost:27017/devicemaster_react" --out=./backup

# Восстановление из резервной копии
mongorestore --uri="mongodb://localhost:27017/devicemaster_react" ./backup/devicemaster_react
```

## 🚨 Устранение неполадок

### Проблема: Не удается подключиться к MongoDB

**Решения:**
1. Убедитесь, что MongoDB запущен: `sudo systemctl status mongod`
2. Проверьте порт: `netstat -tlnp | grep 27017`
3. Проверьте логи: `sudo journalctl -u mongod`

### Проблема: Ошибка аутентификации

**Решения:**
1. Проверьте правильность учетных данных в `.env`
2. Убедитесь, что пользователь создан в правильной базе данных
3. Проверьте права доступа пользователя

### Проблема: Медленные запросы

**Решения:**
1. Проверьте, что индексы созданы: `npm run db:init`
2. Используйте `explain()` для анализа запросов
3. Мониторьте производительность через MongoDB Compass

## 📊 Мониторинг

### MongoDB Compass

Установите [MongoDB Compass](https://www.mongodb.com/products/compass) для графического интерфейса:

```
Connection String: mongodb://localhost:27017/devicemaster_react
```

### Логирование

Включите профилирование медленных запросов:

```javascript
// В MongoDB shell
db.setProfilingLevel(1, { slowms: 100 })
```

## 🔗 Полезные ссылки

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [MongoDB University](https://university.mongodb.com/)
- [MongoDB Best Practices](https://docs.mongodb.com/manual/administration/production-notes/)
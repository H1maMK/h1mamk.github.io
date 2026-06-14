# User Profile Management API Documentation

## Обзор

API для управления профилем пользователя в DeviceMaster включает в себя функции просмотра и редактирования профиля, управления аватаром, работы с избранными товарами и получения статистики пользователя.

## API Endpoints

Все endpoints требуют аутентификации через JWT токен в заголовке `Authorization: Bearer <token>`.

### Управление профилем

#### GET /api/users/profile
Получение данных профиля текущего пользователя.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "username": "john_doe",
      "email": "john@example.com",
      "yearbirth": "1990",
      "gender": "male",
      "img": "http://localhost:5000/uploads/avatars/avatar-123456.jpg",
      "role": {
        "id": 1,
        "name": "user"
      },
      "favorites": ["64f8a1b2c3d4e5f6a7b8c9d1", "64f8a1b2c3d4e5f6a7b8c9d2"],
      "last_login": "2023-12-25T10:30:45.123Z",
      "createdAt": "2023-12-20T10:30:45.123Z",
      "updatedAt": "2023-12-25T10:30:45.123Z"
    }
  },
  "timestamp": "2023-12-25T10:30:45.123Z"
}
```

#### PUT /api/users/profile
Обновление данных профиля пользователя.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "new_username",
  "email": "newemail@example.com",
  "yearbirth": "1995",
  "gender": "female"
}
```

**Validation Rules:**
- `username`: 3-30 символов, только буквы, цифры и подчеркивания (опционально)
- `email`: валидный email адрес (опционально)
- `yearbirth`: год от 1900 до текущего (опционально)
- `gender`: 'male', 'female' или 'other' (опционально)

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "username": "new_username",
      "email": "newemail@example.com",
      "yearbirth": "1995",
      "gender": "female",
      "img": "http://localhost:5000/uploads/avatars/avatar-123456.jpg",
      "role": {
        "id": 1,
        "name": "user"
      },
      "favorites": ["64f8a1b2c3d4e5f6a7b8c9d1"],
      "last_login": "2023-12-25T10:30:45.123Z",
      "createdAt": "2023-12-20T10:30:45.123Z",
      "updatedAt": "2023-12-25T11:15:30.456Z"
    }
  },
  "timestamp": "2023-12-25T11:15:30.456Z"
}
```

**Error Responses:**

**409 - Conflict (email/username уже занят):**
```json
{
  "success": false,
  "error": {
    "message": "Email already taken by another user",
    "code": 409
  },
  "timestamp": "2023-12-25T10:30:45.123Z"
}
```

### Управление аватаром

#### POST /api/users/avatar
Загрузка аватара пользователя.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
avatar: [image file] (jpg, jpeg, png, gif, webp, max 5MB)
```

**Response (200):**
```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "user": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "username": "john_doe",
      "email": "john@example.com",
      "img": "http://localhost:5000/uploads/avatars/avatar-1703505045123-987654321.jpg",
      // ... other user fields
    },
    "avatarUrl": "http://localhost:5000/uploads/avatars/avatar-1703505045123-987654321.jpg"
  },
  "timestamp": "2023-12-25T10:30:45.123Z"
}
```

**Error Responses:**

**400 - No file uploaded:**
```json
{
  "success": false,
  "error": {
    "message": "No file uploaded",
    "code": 400
  },
  "timestamp": "2023-12-25T10:30:45.123Z"
}
```

**400 - Invalid file type:**
```json
{
  "success": false,
  "error": {
    "message": "Only image files are allowed (jpeg, jpg, png, gif, webp)",
    "code": 400,
    "type": "MulterError"
  },
  "timestamp": "2023-12-25T10:30:45.123Z"
}
```

#### DELETE /api/users/avatar
Удаление аватара пользователя.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Avatar deleted successfully",
  "data": {
    "user": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "username": "john_doe",
      "email": "john@example.com",
      "img": null,
      // ... other user fields
    }
  },
  "timestamp": "2023-12-25T10:30:45.123Z"
}
```

**Error Responses:**

**400 - No avatar to delete:**
```json
{
  "success": false,
  "error": {
    "message": "No avatar to delete",
    "code": 400
  },
  "timestamp": "2023-12-25T10:30:45.123Z"
}
```

### Управление избранными товарами

#### GET /api/users/favorites
Получение списка избранных товаров пользователя.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Favorites retrieved successfully",
  "data": {
    "favorites": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "product_name": "Logitech MX Master 3",
        "description": "Advanced wireless mouse",
        "price": 99.99,
        "images": {
          "image1": "/uploads/products/mouse-123.jpg",
          "image2": "/uploads/products/mouse-124.jpg",
          "image3": ""
        },
        "category": {
          "id": 1,
          "name": "Мыши",
          "device_type": "mouse"
        },
        "availability": 15
      }
    ],
    "count": 1
  },
  "timestamp": "2023-12-25T10:30:45.123Z"
}
```

#### POST /api/users/favorites/:productId
Добавление товара в избранное.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**URL Parameters:**
- `productId`: MongoDB ObjectId товара

**Response (200):**
```json
{
  "success": true,
  "message": "Product added to favorites",
  "data": {
    "productId": "64f8a1b2c3d4e5f6a7b8c9d1",
    "favoritesCount": 3
  },
  "timestamp": "2023-12-25T10:30:45.123Z"
}
```

**Error Responses:**

**404 - Product not found:**
```json
{
  "success": false,
  "error": {
    "message": "Product not found",
    "code": 404,
    "type": "NotFoundError"
  },
  "timestamp": "2023-12-25T10:30:45.123Z"
}
```

**409 - Already in favorites:**
```json
{
  "success": false,
  "error": {
    "message": "Product already in favorites",
    "code": 409
  },
  "timestamp": "2023-12-25T10:30:45.123Z"
}
```

#### DELETE /api/users/favorites/:productId
Удаление товара из избранного.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**URL Parameters:**
- `productId`: MongoDB ObjectId товара

**Response (200):**
```json
{
  "success": true,
  "message": "Product removed from favorites",
  "data": {
    "productId": "64f8a1b2c3d4e5f6a7b8c9d1",
    "favoritesCount": 2
  },
  "timestamp": "2023-12-25T10:30:45.123Z"
}
```

**Error Responses:**

**404 - Not in favorites:**
```json
{
  "success": false,
  "error": {
    "message": "Product not in favorites",
    "code": 404
  },
  "timestamp": "2023-12-25T10:30:45.123Z"
}
```

### Статистика пользователя

#### GET /api/users/stats
Получение статистики пользователя (количество заказов, отзывов, избранного).

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "User statistics retrieved successfully",
  "data": {
    "stats": {
      "user": {
        "id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "username": "john_doe",
        "memberSince": "2023-12-20T10:30:45.123Z"
      },
      "orders": 15,
      "reviews": 8,
      "favorites": 3,
      "lastLogin": "2023-12-25T10:30:45.123Z"
    }
  },
  "timestamp": "2023-12-25T10:30:45.123Z"
}
```

## Валидация данных

### Валидация профиля

Все поля опциональны при обновлении профиля:

```javascript
// Валидация username
{
  "field": "username",
  "rules": {
    "minLength": 3,
    "maxLength": 30,
    "pattern": "^[a-zA-Z0-9_]+$",
    "unique": true
  }
}

// Валидация email
{
  "field": "email",
  "rules": {
    "format": "email",
    "unique": true
  }
}

// Валидация yearbirth
{
  "field": "yearbirth",
  "rules": {
    "type": "integer",
    "min": 1900,
    "max": "current year"
  }
}

// Валидация gender
{
  "field": "gender",
  "rules": {
    "enum": ["male", "female", "other"]
  }
}
```

### Валидация файлов

```javascript
// Валидация аватара
{
  "field": "avatar",
  "rules": {
    "fileTypes": ["jpeg", "jpg", "png", "gif", "webp"],
    "maxSize": "5MB",
    "required": false
  }
}
```

## Обработка ошибок

### Стандартные коды ошибок

| Код | Описание | Пример |
|-----|----------|---------|
| 400 | Неверные данные запроса | Невалидные поля, отсутствие файла |
| 401 | Не авторизован | Отсутствие или неверный токен |
| 404 | Ресурс не найден | Пользователь или товар не найден |
| 409 | Конфликт | Email/username уже занят |
| 500 | Внутренняя ошибка сервера | Ошибка базы данных |

### Примеры ошибок валидации

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "type": "ValidationError",
    "code": 400,
    "details": [
      {
        "field": "username",
        "message": "Username must be between 3 and 30 characters",
        "value": "ab"
      },
      {
        "field": "email",
        "message": "Please provide a valid email",
        "value": "invalid-email"
      }
    ]
  },
  "timestamp": "2023-12-25T10:30:45.123Z"
}
```

## Использование в Frontend

### React Hook для управления профилем

```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

const useUserProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Получение профиля
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/users/profile');
      setUser(response.data.data.user);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  // Обновление профиля
  const updateProfile = async (profileData) => {
    setLoading(true);
    try {
      const response = await axios.put('/api/users/profile', profileData);
      setUser(response.data.data.user);
      setError(null);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to update profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка аватара
  const uploadAvatar = async (file) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await axios.post('/api/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setUser(response.data.data.user);
      setError(null);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to upload avatar';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    user,
    loading,
    error,
    updateProfile,
    uploadAvatar,
    refetch: fetchProfile
  };
};

export default useUserProfile;
```

### Компонент редактирования профиля

```jsx
import React, { useState } from 'react';
import useUserProfile from './hooks/useUserProfile';

const ProfileEdit = () => {
  const { user, loading, error, updateProfile } = useUserProfile();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    yearbirth: '',
    gender: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        yearbirth: user.yearbirth || '',
        gender: user.gender || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      alert('Profile updated successfully!');
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Username"
        value={formData.username}
        onChange={(e) => setFormData({...formData, username: e.target.value})}
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
      />
      <input
        type="number"
        placeholder="Year of Birth"
        value={formData.yearbirth}
        onChange={(e) => setFormData({...formData, yearbirth: e.target.value})}
      />
      <select
        value={formData.gender}
        onChange={(e) => setFormData({...formData, gender: e.target.value})}
      >
        <option value="">Select Gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>
      <button type="submit" disabled={loading}>
        {loading ? 'Updating...' : 'Update Profile'}
      </button>
    </form>
  );
};

export default ProfileEdit;
```

### Управление избранными товарами

```javascript
// Добавление в избранное
const addToFavorites = async (productId) => {
  try {
    const response = await axios.post(`/api/users/favorites/${productId}`);
    console.log('Added to favorites:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to add to favorites:', error.response?.data);
    throw error;
  }
};

// Удаление из избранного
const removeFromFavorites = async (productId) => {
  try {
    const response = await axios.delete(`/api/users/favorites/${productId}`);
    console.log('Removed from favorites:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to remove from favorites:', error.response?.data);
    throw error;
  }
};

// Получение избранных товаров
const getFavorites = async () => {
  try {
    const response = await axios.get('/api/users/favorites');
    return response.data.data.favorites;
  } catch (error) {
    console.error('Failed to get favorites:', error.response?.data);
    throw error;
  }
};
```

## Безопасность

### Защитные меры

1. **Аутентификация**: Все endpoints требуют валидный JWT токен
2. **Валидация файлов**: Проверка типа и размера загружаемых файлов
3. **Валидация данных**: Проверка всех входных данных
4. **Уникальность**: Проверка уникальности email и username
5. **Санитизация**: Очистка и нормализация входных данных

### Рекомендации

1. **Файлы**: Храните загруженные файлы вне веб-директории
2. **Валидация**: Всегда валидируйте данные на сервере
3. **Размеры**: Ограничивайте размер загружаемых файлов
4. **Типы файлов**: Разрешайте только безопасные типы файлов
5. **Rate limiting**: Ограничивайте частоту запросов

## Тестирование

### Запуск тестов

```bash
# Все тесты пользователей
npm test -- --testPathPattern=users

# Простые тесты
npm test -- --testPathPattern=users-simple

# Конкретный тест
npm test -- --testNamePattern="Should update user profile"
```

### Тестовые сценарии

1. **Получение профиля**: Проверка получения данных пользователя
2. **Обновление профиля**: Проверка валидации и обновления данных
3. **Загрузка аватара**: Проверка загрузки и валидации файлов
4. **Избранные товары**: Проверка добавления/удаления товаров
5. **Статистика**: Проверка получения статистики пользователя
6. **Авторизация**: Проверка защиты всех endpoints

## Заключение

API управления профилем пользователя полностью реализован и готов к использованию. Он обеспечивает:

✅ Полное управление профилем пользователя
✅ Загрузку и управление аватарами
✅ Систему избранных товаров
✅ Статистику пользователя
✅ Валидацию всех входных данных
✅ Безопасную обработку файлов
✅ Стандартизированные ответы API
✅ Полное покрытие тестами
✅ Подробную документацию

API готов к интеграции с React frontend и обеспечивает все необходимые функции для управления пользовательскими профилями в DeviceMaster.
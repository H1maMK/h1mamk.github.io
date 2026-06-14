const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/password');
const { success, error, validationError, unauthorized, notFound } = require('../utils/response');
const path = require('path');
const fs = require('fs').promises;

// Получение профиля текущего пользователя
const getProfile = async (req, res) => {
  try {
    // req.user уже установлен middleware authenticateToken
    const user = req.user;

    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      profile: user.profile,
      role: user.role,
      favorites: user.favorites,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return success(res, { user: userResponse }, 'Profile retrieved successfully');

  } catch (err) {
    console.error('Get profile error:', err);
    return error(res, 'Failed to get profile', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};

// Обновление профиля пользователя
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { username, email, yearBirth, gender } = req.body;

    // Получаем пользователя
    const user = await User.findById(userId);
    if (!user) {
      return notFound(res, 'User not found');
    }

    // Проверяем, не занят ли новый email другим пользователем
    if (email && email !== user.email) {
      const existingUserByEmail = await User.findOne({ 
        email, 
        _id: { $ne: userId } 
      });
      
      if (existingUserByEmail) {
        return error(res, 'Email already taken by another user', 409);
      }
    }

    // Проверяем, не занят ли новый username другим пользователем
    if (username && username !== user.username) {
      const existingUserByUsername = await User.findOne({ 
        username, 
        _id: { $ne: userId } 
      });
      
      if (existingUserByUsername) {
        return error(res, 'Username already taken by another user', 409);
      }
    }

    // Обновляем поля
    if (username) user.username = username;
    if (email) user.email = email;
    if (yearBirth !== undefined) user.profile.yearBirth = yearBirth;
    if (gender !== undefined) user.profile.gender = gender;
    
    user.updatedAt = new Date();

    // Сохраняем изменения
    const updatedUser = await user.save();

    // Возвращаем обновленные данные без пароля
    const userResponse = {
      id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      profile: updatedUser.profile,
      role: updatedUser.role,
      favorites: updatedUser.favorites,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };

    return success(res, { user: userResponse }, 'Profile updated successfully');

  } catch (err) {
    console.error('Update profile error:', err);
    return error(res, 'Failed to update profile', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};

// Загрузка аватара пользователя
const uploadAvatar = async (req, res) => {
  try {
    console.log('Upload avatar request received');
    
    const userId = req.user._id;

    // Проверяем, что файл был загружен
    if (!req.file) {
      console.log('No file uploaded');
      return error(res, 'No file uploaded', 400);
    }

    console.log('File uploaded successfully:', req.file.filename);

    // Получаем пользователя
    const user = await User.findById(userId);
    if (!user) {
      return notFound(res, 'User not found');
    }

    // Удаляем старый аватар, если он существует
    if (user.profile?.avatar) {
      const oldAvatarPath = path.join('./uploads/avatars', path.basename(user.profile.avatar));
      try {
        await fs.unlink(oldAvatarPath);
      } catch (deleteError) {
        console.warn('Failed to delete old avatar:', deleteError.message);
      }
    }

    // Обновляем путь к аватару
    const avatarUrl = `/api/image/avatars/${req.file.filename}`;
    if (!user.profile) {
      user.profile = {};
    }
    user.profile.avatar = avatarUrl;
    user.updatedAt = new Date();

    await user.save();

    // Возвращаем обновленные данные
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      profile: user.profile,
      role: user.role,
      favorites: user.favorites,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return success(res, { 
      user: userResponse,
      avatarUrl: avatarUrl
    }, 'Avatar uploaded successfully');

  } catch (err) {
    console.error('Upload avatar error:', err);
    
    // Удаляем загруженный файл в случае ошибки
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (deleteError) {
        console.warn('Failed to cleanup uploaded file:', deleteError.message);
      }
    }

    return error(res, 'Failed to upload avatar', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};

// Удаление аватара пользователя
const deleteAvatar = async (req, res) => {
  try {
    const userId = req.user._id;

    // Получаем пользователя
    const user = await User.findById(userId);
    if (!user) {
      return notFound(res, 'User not found');
    }

    // Проверяем, есть ли аватар
    if (!user.profile?.avatar) {
      return error(res, 'No avatar to delete', 400);
    }

    // Удаляем файл аватара
    const avatarPath = path.join('./uploads/avatars', path.basename(user.profile.avatar));
    try {
      await fs.unlink(avatarPath);
    } catch (deleteError) {
      console.warn('Failed to delete avatar file:', deleteError.message);
    }

    // Обновляем пользователя
    user.profile.avatar = null;
    user.updatedAt = new Date();
    await user.save();

    // Возвращаем обновленные данные
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      profile: user.profile,
      role: user.role,
      favorites: user.favorites,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return success(res, { user: userResponse }, 'Avatar deleted successfully');

  } catch (err) {
    console.error('Delete avatar error:', err);
    return error(res, 'Failed to delete avatar', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};

// Получение избранных товаров пользователя
const getFavorites = async (req, res) => {
  try {
    const userId = req.user._id;

    // Получаем пользователя с populate favorites
    const user = await User.findById(userId).populate({
      path: 'favorites',
      populate: { path: 'category' }
    });
    
    if (!user) {
      return notFound(res, 'User not found');
    }

    // Если нет избранных товаров, возвращаем пустой массив
    if (!user.favorites || user.favorites.length === 0) {
      return success(res, { 
        favorites: [],
        count: 0
      }, 'Favorites retrieved successfully');
    }

    // Фильтруем только товары в наличии и обрабатываем изображения
    const favoriteProducts = user.favorites
      .filter(product => product && product.stock > 0)
      .map(product => {
        // Обрабатываем изображения
        let processedImages = [];
        if (product.images && product.images.length > 0) {
          processedImages = product.images.map(img => {
            if (img.startsWith('http')) {
              return img; // Уже полный URL (Cloudinary)
            } else {
              return `${req.protocol}://${req.get('host')}${img.startsWith('/') ? img : '/' + img}`;
            }
          });
        } else {
          processedImages = [`${req.protocol}://${req.get('host')}/uploads/default-product.png`];
        }

        return {
          ...product.toObject(),
          images: processedImages
        };
      });

    return success(res, { 
      favorites: favoriteProducts,
      count: favoriteProducts.length
    }, 'Favorites retrieved successfully');

  } catch (err) {
    console.error('Get favorites error:', err);
    return error(res, 'Failed to get favorites', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};

// Добавление товара в избранное
const addToFavorites = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    // Получаем пользователя
    const user = await User.findById(userId);
    if (!user) {
      return notFound(res, 'User not found');
    }

    // Проверяем, что товар существует
    const Product = require('../models/Product');
    const product = await Product.findById(productId);
    if (!product) {
      return notFound(res, 'Product not found');
    }

    // Проверяем, не добавлен ли товар уже в избранное
    if (user.favorites.includes(productId)) {
      return error(res, 'Product already in favorites', 409);
    }

    // Добавляем товар в избранное
    user.favorites.push(productId);
    user.updated_at = new Date();
    await user.save();

    return success(res, { 
      productId,
      favoritesCount: user.favorites.length
    }, 'Product added to favorites');

  } catch (err) {
    console.error('Add to favorites error:', err);
    return error(res, 'Failed to add to favorites', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};

// Удаление товара из избранного
const removeFromFavorites = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    // Получаем пользователя
    const user = await User.findById(userId);
    if (!user) {
      return notFound(res, 'User not found');
    }

    // Проверяем, есть ли товар в избранном
    const favoriteIndex = user.favorites.indexOf(productId);
    if (favoriteIndex === -1) {
      return error(res, 'Product not in favorites', 404);
    }

    // Удаляем товар из избранного
    user.favorites.splice(favoriteIndex, 1);
    user.updated_at = new Date();
    await user.save();

    return success(res, { 
      productId,
      favoritesCount: user.favorites.length
    }, 'Product removed from favorites');

  } catch (err) {
    console.error('Remove from favorites error:', err);
    return error(res, 'Failed to remove from favorites', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};

// Получение статистики пользователя
const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Получаем количество заказов пользователя
    const Order = require('../models/Order');
    const ordersCount = await Order.countDocuments({ user_id: userId });

    // Получаем количество отзывов пользователя
    const Product = require('../models/Product');
    const reviewsCount = await Product.aggregate([
      { $unwind: '$reviews' },
      { $match: { 'reviews.user_id': userId } },
      { $count: 'total' }
    ]);

    const user = req.user;
    const stats = {
      user: {
        id: user._id,
        username: user.username,
        memberSince: user.createdAt
      },
      orders: ordersCount,
      reviews: reviewsCount.length > 0 ? reviewsCount[0].total : 0,
      favorites: user.favorites.length,
      lastLogin: user.last_login
    };

    return success(res, { stats }, 'User statistics retrieved successfully');

  } catch (err) {
    console.error('Get user stats error:', err);
    return error(res, 'Failed to get user statistics', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  getUserStats
};
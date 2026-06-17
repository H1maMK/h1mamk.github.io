const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/password');
const { success, error, validationError, unauthorized, notFound } = require('../utils/response');
const { fileToDataUrl, isDataImageUrl } = require('../utils/imageData');
const { MAX_IMAGE_FILE_SIZE } = require('../middleware/upload');

const normalizeProductImageForResponse = (image, req) => {
  if (!image) {
    return '';
  }

  if (isDataImageUrl(image) || image.startsWith('http')) {
    return image;
  }

  return `${req.protocol}://${req.get('host')}${image.startsWith('/') ? image : `/${image}`}`;
};


const getProfile = async (req, res) => {
  try {

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


const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { username, email, yearBirth, gender } = req.body;


    const user = await User.findById(userId);
    if (!user) {
      return notFound(res, 'User not found');
    }


    if (email && email !== user.email) {
      const existingUserByEmail = await User.findOne({ 
        email, 
        _id: { $ne: userId } 
      });
      
      if (existingUserByEmail) {
        return error(res, 'Email already taken by another user', 409);
      }
    }


    if (username && username !== user.username) {
      const existingUserByUsername = await User.findOne({ 
        username, 
        _id: { $ne: userId } 
      });
      
      if (existingUserByUsername) {
        return error(res, 'Username already taken by another user', 409);
      }
    }


    if (username) user.username = username;
    if (email) user.email = email;
    if (yearBirth !== undefined) user.profile.yearBirth = yearBirth;
    if (gender !== undefined) user.profile.gender = gender;
    
    user.updatedAt = new Date();


    const updatedUser = await user.save();


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


const uploadAvatar = async (req, res) => {
  try {
    console.log('Upload avatar request received');

    if (req.uploadError) {
      return error(
        res,
        req.uploadError.code === 'LIMIT_FILE_SIZE'
          ? `Размер изображения не должен превышать ${Math.round(MAX_IMAGE_FILE_SIZE / (1024 * 1024))} МБ`
          : (req.uploadError.message || 'Ошибка загрузки аватара'),
        400
      );
    }
    
    const userId = req.user._id;


    if (!req.file) {
      console.log('No file uploaded');
      return error(res, 'No file uploaded', 400);
    }

    console.log('File uploaded successfully:', req.file.filename);


    const user = await User.findById(userId);
    if (!user) {
      return notFound(res, 'User not found');
    }
    const avatarUrl = fileToDataUrl(req.file);
    if (!user.profile) {
      user.profile = {};
    }
    user.profile.avatar = avatarUrl;
    user.updatedAt = new Date();

    await user.save();


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
    

    return error(res, 'Failed to upload avatar', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};


const deleteAvatar = async (req, res) => {
  try {
    const userId = req.user._id;


    const user = await User.findById(userId);
    if (!user) {
      return notFound(res, 'User not found');
    }


    if (!user.profile?.avatar) {
      return error(res, 'No avatar to delete', 400);
    }
    user.profile.avatar = null;
    user.updatedAt = new Date();
    await user.save();


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


const getFavorites = async (req, res) => {
  try {
    const userId = req.user._id;


    const user = await User.findById(userId).populate({
      path: 'favorites',
      populate: { path: 'category' }
    });
    
    if (!user) {
      return notFound(res, 'User not found');
    }


    if (!user.favorites || user.favorites.length === 0) {
      return success(res, { 
        favorites: [],
        count: 0
      }, 'Favorites retrieved successfully');
    }


    const favoriteProducts = user.favorites
      .filter(product => product && product.stock > 0)
      .map(product => {

        let processedImages = [];
        if (product.images && product.images.length > 0) {
          processedImages = product.images.map(img => {
            if (img.startsWith('http') || isDataImageUrl(img)) {
              return img;
            } else {
              return normalizeProductImageForResponse(img, req);
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


const addToFavorites = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;


    const user = await User.findById(userId).select('_id favorites');
    if (!user) {
      return notFound(res, 'User not found');
    }


    const Product = require('../models/Product');
    const product = await Product.findById(productId).select('_id');
    if (!product) {
      return notFound(res, 'Product not found');
    }


    const alreadyInFavorites = user.favorites.some((favoriteId) => String(favoriteId) === String(productId));
    if (alreadyInFavorites) {
      return error(res, 'Product already in favorites', 409);
    }


    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: { favorites: productId },
        $set: { updatedAt: new Date() }
      },
      {
        new: true,
        runValidators: false,
        select: '_id favorites'
      }
    );

    return success(res, {
      productId,
      favoritesCount: updatedUser?.favorites?.length || 0
    }, 'Product added to favorites');

  } catch (err) {
    console.error('Add to favorites error:', err);
    return error(res, 'Failed to add to favorites', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};


const removeFromFavorites = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;


    const user = await User.findById(userId).select('_id favorites');
    if (!user) {
      return notFound(res, 'User not found');
    }


    const isInFavorites = user.favorites.some((favoriteId) => String(favoriteId) === String(productId));
    if (!isInFavorites) {
      return error(res, 'Product not in favorites', 404);
    }


    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $pull: { favorites: productId },
        $set: { updatedAt: new Date() }
      },
      {
        new: true,
        runValidators: false,
        select: '_id favorites'
      }
    );

    return success(res, {
      productId,
      favoritesCount: updatedUser?.favorites?.length || 0
    }, 'Product removed from favorites');

  } catch (err) {
    console.error('Remove from favorites error:', err);
    return error(res, 'Failed to remove from favorites', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};


const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;


    const Order = require('../models/Order');
    const ordersCount = await Order.countDocuments({ user_id: userId });


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

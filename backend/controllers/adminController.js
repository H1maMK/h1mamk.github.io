const { validationResult } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const fs = require('fs').promises;
const path = require('path');
const { fileToDataUrl, isDataImageUrl } = require('../utils/imageData');
const { MAX_IMAGE_FILE_SIZE } = require('../middleware/upload');
const PROTECTED_ADMIN_EMAIL = 'mr.maxim.8806@mail.ru';

const resolveLocalUploadFilePath = (storedPath = '') => {
  if (!storedPath || /^https?:\/\//i.test(storedPath)) {
    return '';
  }

  return path.join(__dirname, '..', storedPath.replace(/^\/+/, ''));
};

const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Ошибка валидации',
      errors: errors.array()
    });
  }
  return null;
};


const deleteUploadedFiles = async () => {};

const isWeeklySpecialRequested = (value) => value === 'true' || value === true;

const resolveStoredImagePath = (file) => {
  if (!file) {
    return '';
  }

  return fileToDataUrl(file);
};

const normalizeProductImagePath = (image) => {
  if (typeof image !== 'string') return image;

  const trimmedValue = image.trim();
  if (!trimmedValue) return '';
  if (isDataImageUrl(trimmedValue)) return trimmedValue;

  const normalizeLegacyFlatFilePath = (value) => {
    if (/^\/[^/]+\.(jpg|jpeg|png|webp|gif|svg)$/i.test(value)) {
      return `/uploads${value}`;
    }

    if (/^uploads\//i.test(value)) {
      return `/${value.replace(/^\/+/, '')}`;
    }

    return value;
  };

  try {
    const imageUrl = new URL(trimmedValue);

    if (/^https?:\/\//i.test(trimmedValue) && !/\/uploads\//i.test(imageUrl.pathname)) {
      return trimmedValue;
    }

    return normalizeLegacyFlatFilePath(imageUrl.pathname);
  } catch {
    return normalizeLegacyFlatFilePath(trimmedValue);
  }
};

const validateWeeklySpecialLimit = async (res, productId, requestedWeeklySpecial) => {
  if (!requestedWeeklySpecial) {
    return false;
  }

  const filter = { isWeeklySpecial: true, isActive: { $ne: false } };
  if (productId) {
    filter._id = { $ne: productId };
  }

  const weeklySpecialCount = await Product.countDocuments(filter);
  if (weeklySpecialCount >= 4) {
    return res.status(400).json({
      success: false,
      message: 'Можно выбрать максимум 4 товара недели. Сначала снимите отметку с другого товара или замените его.'
    });
  }

  return false;
};

const handleUploadControllerError = async (res, req, uploadError, fallbackMessage) => {
  if (!uploadError) {
    return false;
  }

  await deleteUploadedFiles(req.files);

  if (uploadError.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: `Размер изображения не должен превышать ${Math.round(MAX_IMAGE_FILE_SIZE / (1024 * 1024))} МБ`
    });
  }

  return res.status(400).json({
    success: false,
    message: uploadError.message || fallbackMessage
  });
};

// @desc    Get all products for admin, including hidden products
// @route   GET /api/admin/products
// @access  Private (Admin only)
const getProductsForAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100,
      status = 'all'
    } = req.query;

    const filter = {};
    if (status === 'active') {
      filter.isActive = { $ne: false };
    } else if (status === 'hidden') {
      filter.isActive = false;
    } else if (status !== 'all') {
      return res.status(400).json({
        success: false,
        message: 'Статус должен быть active, hidden или all'
      });
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const requestedLimit = parseInt(limit, 10);
    const limitNum = requestedLimit === 0
      ? 0
      : Math.min(500, Math.max(1, requestedLimit || 100));
    const skip = (pageNum - 1) * limitNum;

    const productsQuery = Product.find(filter)
      .populate('category', 'name deviceType')
      .sort({ createdAt: -1 })
      .select('-__v')
      .lean();

    if (limitNum > 0) {
      productsQuery.skip(skip).limit(limitNum);
    }

    const [products, totalCount, activeCount, hiddenCount] = await Promise.all([
      productsQuery,
      Product.countDocuments(filter),
      Product.countDocuments({ isActive: { $ne: false } }),
      Product.countDocuments({ isActive: false })
    ]);

    const pages = limitNum > 0 ? Math.ceil(totalCount / limitNum) : 1;

    res.json({
      success: true,
      message: 'Товары успешно получены',
      data: {
        products,
        counts: {
          all: activeCount + hiddenCount,
          active: activeCount,
          hidden: hiddenCount
        }
      },
      pagination: {
        page: pageNum,
        limit: limitNum || totalCount,
        total: totalCount,
        pages,
        hasNext: limitNum > 0 && pageNum < pages,
        hasPrev: limitNum > 0 && pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при загрузке товаров'
    });
  }
};

// @desc    Create a new product
// @route   POST /api/admin/products
// @access  Private (Admin only)
const createProduct = async (req, res) => {
  try {
    const uploadErrorResponse = await handleUploadControllerError(res, req, req.uploadError, 'Ошибка загрузки изображений товара');
    if (uploadErrorResponse) {
      return;
    }

    // Check for validation errors
    const validationError = handleValidationErrors(req, res);
    if (validationError) {
      await deleteUploadedFiles(req.files);
      return;
    }

    const { name, price, stock, category, description, specifications } = req.body;

    console.log('Creating product with category:', category, 'type:', typeof category);

    const requestedWeeklySpecial = isWeeklySpecialRequested(req.body.isWeeklySpecial);
    const weeklyLimitError = await validateWeeklySpecialLimit(res, null, requestedWeeklySpecial);
    if (weeklyLimitError) {
      await deleteUploadedFiles(req.files);
      return;
    }

    // Validate category is a valid ObjectId
    if (!category || !/^[0-9a-fA-F]{24}$/.test(category)) {
      console.log('Invalid category format:', category);
      await deleteUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        message: 'Выберите корректную категорию'
      });
    }

    // Check if category exists
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      await deleteUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        message: 'Категория не найдена'
      });
    }

    // Process uploaded images
    const images = [];
    if (req.files) {
      ['image1', 'image2', 'image3'].forEach(fieldName => {
        if (req.files[fieldName] && req.files[fieldName][0]) {
          const file = req.files[fieldName][0];
          images.push(resolveStoredImagePath(file, 'products'));
        }
      });
    }

    // Parse specifications if provided
    let parsedSpecs = {};
    if (specifications) {
      try {
        parsedSpecs = typeof specifications === 'string' 
          ? JSON.parse(specifications) 
          : specifications;
      } catch (error) {
        await deleteUploadedFiles(req.files);
        return res.status(400).json({
          success: false,
          message: 'Некорректный формат характеристик'
        });
      }
    }

    if (images.length === 0) {
      await deleteUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        message: 'Загрузите изображения товара'
      });
    }

    // Create new product
    const product = new Product({
      name,
      price: parseFloat(price),
      stock: parseInt(stock),
      category,
      description: description || '',
      specifications: parsedSpecs,
      images,
      isWeeklySpecial: requestedWeeklySpecial
    });

    await product.save();

    // Populate category for response
    await product.populate('category');

    res.status(201).json({
      success: true,
      message: 'Товар успешно создан',
      data: product
    });

  } catch (error) {
    console.error('Error creating product:', error);
    await deleteUploadedFiles(req.files);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Ошибка сервера при создании товара'
      });
    }
  }
};

// @desc    Update a product
// @route   PUT /api/admin/products/:id
// @access  Private (Admin only)
const updateProduct = async (req, res) => {
  try {
    const uploadErrorResponse = await handleUploadControllerError(res, req, req.uploadError, 'Ошибка загрузки изображений товара');
    if (uploadErrorResponse) {
      return;
    }

    // Check for validation errors
    const validationError = handleValidationErrors(req, res);
    if (validationError) {
      await deleteUploadedFiles(req.files);
      return;
    }

    const { name, price, stock, category, description, specifications } = req.body;
    const productId = req.params.id;
    const requestedWeeklySpecial = isWeeklySpecialRequested(req.body.isWeeklySpecial);

    // Find existing product
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      await deleteUploadedFiles(req.files);
      return res.status(404).json({
        success: false,
        message: 'Товар не найден'
      });
    }

    const weeklyLimitError = await validateWeeklySpecialLimit(res, productId, requestedWeeklySpecial);
    if (weeklyLimitError) {
      await deleteUploadedFiles(req.files);
      return;
    }

    // Validate category is a valid ObjectId
    if (!category || !/^[0-9a-fA-F]{24}$/.test(category)) {
      await deleteUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        message: 'Выберите корректную категорию'
      });
    }

    // Check if category exists
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      await deleteUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        message: 'Категория не найдена'
      });
    }

    // Process uploaded images
    const uploadedImagePaths = [];
    const newImages = [...existingProduct.images];
    if (req.files) {
      ['image1', 'image2', 'image3'].forEach((fieldName, index) => {
        if (req.files[fieldName] && req.files[fieldName][0]) {
          const file = req.files[fieldName][0];
          const uploadedImagePath = resolveStoredImagePath(file, 'products');
          
          // Add new image
          newImages[index] = uploadedImagePath;
          uploadedImagePaths.push(uploadedImagePath);
        }
      });
    }

    // Parse specifications if provided
    let parsedSpecs = existingProduct.specifications;
    if (specifications !== undefined) {
      try {
        parsedSpecs = typeof specifications === 'string' 
          ? JSON.parse(specifications) 
          : specifications;
      } catch (error) {
        await deleteUploadedFiles(req.files);
        return res.status(400).json({
          success: false,
          message: 'Некорректный формат характеристик'
        });
      }
    }

    const requestedExistingImages = (() => {
      try {
        const parsedImages = req.body.existingImages ? JSON.parse(req.body.existingImages) : newImages;
        return Array.isArray(parsedImages)
          ? parsedImages.map(normalizeProductImagePath).filter(Boolean)
          : newImages;
      } catch {
        return newImages;
      }
    })();
    const requestedExistingImagesSet = new Set(requestedExistingImages);
    const uploadedImagePathsSet = new Set(uploadedImagePaths);
    let finalImages = newImages
      .map(normalizeProductImagePath)
      .filter(Boolean)
      .filter(image => requestedExistingImagesSet.has(image) || uploadedImagePathsSet.has(image));

    if (finalImages.length === 0 && existingProduct.images?.length > 0 && uploadedImagePaths.length === 0) {
      finalImages = existingProduct.images.map(normalizeProductImagePath).filter(Boolean);
    }

    if (finalImages.length === 0) {
      await deleteUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        message: 'Загрузите изображения товара'
      });
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        name,
        price: parseFloat(price),
        stock: parseInt(stock),
        category,
        description: description || '',
        specifications: parsedSpecs,
        images: finalImages,
        isWeeklySpecial: requestedWeeklySpecial,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('category');

    res.json({
      success: true,
      message: 'Товар успешно обновлён',
      data: updatedProduct
    });

  } catch (error) {
    console.error('Error updating product:', error);
    await deleteUploadedFiles(req.files);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении товара'
    });
  }
};

// @desc    Delete a product
// @route   DELETE /api/admin/products/:id
// @access  Private (Admin only)
const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    // Find and delete product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Товар не найден'
      });
    }

    await Product.findByIdAndDelete(productId);

    res.json({
      success: true,
      message: 'Товар успешно удалён'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении товара'
    });
  }
};

// @desc    Hide or show a product
// @route   PATCH /api/admin/products/:id/visibility
// @access  Private (Admin only)
const toggleProductVisibility = async (req, res) => {
  try {
    const productId = req.params.id;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Статус видимости должен быть булевым значением'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Товар не найден'
      });
    }

    if (isActive && product.isWeeklySpecial) {
      const weeklyLimitError = await validateWeeklySpecialLimit(res, productId, true);
      if (weeklyLimitError) {
        return;
      }
    }

    product.isActive = isActive;
    product.updatedAt = new Date();
    await product.save();
    await product.populate('category');

    res.json({
      success: true,
      message: isActive ? 'Товар возвращён в каталог' : 'Товар скрыт',
      data: product
    });
  } catch (error) {
    console.error('Error toggling product visibility:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при изменении видимости товара'
    });
  }
};

// @desc    Create a new category
// @route   POST /api/admin/categories
// @access  Private (Admin only)
const createCategory = async (req, res) => {
  try {
    if (req.uploadError) {
      return res.status(400).json({
        success: false,
        message: req.uploadError.code === 'LIMIT_FILE_SIZE'
          ? `Размер изображения не должен превышать ${Math.round(MAX_IMAGE_FILE_SIZE / (1024 * 1024))} МБ`
          : req.uploadError.message || 'Ошибка загрузки изображения категории'
      });
    }

    // Check for validation errors
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const { name, deviceType, description } = req.body;

    // Check if category with same name and deviceType already exists
    const existingCategory = await Category.findOne({ name, deviceType });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Категория с таким названием и типом устройства уже существует'
      });
    }

    // Process uploaded image
    const imageUrl = req.file ? resolveStoredImagePath(req.file, 'categories') : '';

    // Create new category
    const category = new Category({
      name,
      deviceType,
      description: description || '',
      image: imageUrl
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Категория успешно создана',
      data: category
    });

  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании категории'
    });
  }
};

// @desc    Update a category
// @route   PUT /api/admin/categories/:id
// @access  Private (Admin only)
const updateCategory = async (req, res) => {
  try {
    if (req.uploadError) {
      return res.status(400).json({
        success: false,
        message: req.uploadError.code === 'LIMIT_FILE_SIZE'
          ? `Размер изображения не должен превышать ${Math.round(MAX_IMAGE_FILE_SIZE / (1024 * 1024))} МБ`
          : req.uploadError.message || 'Ошибка загрузки изображения категории'
      });
    }

    // Check for validation errors
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const { name, deviceType, description } = req.body;
    const categoryId = req.params.id;

    // Check if category exists
    const existingCategory = await Category.findById(categoryId);
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Категория не найдена'
      });
    }

    // Check if another category with same name and deviceType exists
    const duplicateCategory = await Category.findOne({ 
      name, 
      deviceType, 
      _id: { $ne: categoryId } 
    });
    if (duplicateCategory) {
      return res.status(400).json({
        success: false,
        message: 'Категория с таким названием и типом устройства уже существует'
      });
    }

    // Process uploaded image
    let imageUrl = existingCategory.image;
    if (req.file) {
      imageUrl = resolveStoredImagePath(req.file, 'categories');
    }

    // Update category
    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      {
        name,
        deviceType,
        description: description || '',
        image: imageUrl,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Категория успешно обновлена',
      data: updatedCategory
    });

  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении категории'
    });
  }
};

// @desc    Delete a category
// @route   DELETE /api/admin/categories/:id
// @access  Private (Admin only)
const deleteCategory = async (req, res) => {
  try {
    if (req.uploadError) {
      return res.status(400).json({
        success: false,
        message: req.uploadError.code === 'LIMIT_FILE_SIZE'
          ? `Размер изображения не должен превышать ${Math.round(MAX_IMAGE_FILE_SIZE / (1024 * 1024))} МБ`
          : req.uploadError.message || 'Ошибка загрузки изображения категории'
      });
    }

    const categoryId = req.params.id;

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Категория не найдена'
      });
    }

    // Check if any products use this category
    const productsCount = await Product.countDocuments({ category: categoryId });
    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Нельзя удалить категорию: её используют товары (${productsCount} шт.)`
      });
    }

    await Category.findByIdAndDelete(categoryId);

    res.json({
      success: true,
      message: 'Категория успешно удалена'
    });

  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении категории'
    });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Пользователи успешно получены',
      data: users
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при загрузке пользователей'
    });
  }
};

// @desc    Update a user
// @route   PUT /api/admin/users/:id
// @access  Private (Admin only)
const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, email, role } = req.body;

    // Find existing user
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    if (existingUser.email.toLowerCase() === PROTECTED_ADMIN_EMAIL && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Этому администратору нельзя сменить роль'
      });
    }

    if (userId === req.user._id.toString() && existingUser.role === 'admin' && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Нельзя снять роль администратора со своего аккаунта'
      });
    }

    // Check if email is already taken by another user
    if (email !== existingUser.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: userId } });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Этот email уже используется'
        });
      }
    }

    // Check if username is already taken by another user
    if (username !== existingUser.username) {
      const usernameExists = await User.findOne({ username, _id: { $ne: userId } });
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: 'Это имя пользователя уже используется'
        });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        username,
        email,
        role,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Пользователь успешно обновлён',
      data: updatedUser
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении пользователя'
    });
  }
};

// @desc    Update user avatar
// @route   POST /api/admin/users/:id/avatar
// @access  Private (Admin only)
const updateUserAvatar = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Файл не загружен'
      });
    }

    // Find existing user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    // Update avatar path
    const avatarUrl = resolveStoredImagePath(req.file, 'avatars');
    if (!user.profile) {
      user.profile = {};
    }
    user.profile.avatar = avatarUrl;
    user.updatedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: 'Аватар успешно обновлён',
      data: {
        avatar: avatarUrl
      }
    });

  } catch (error) {
    console.error('Error updating user avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении аватара'
    });
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res) => {
  try {
    return res.status(405).json({
      success: false,
      message: 'Удаление пользователей отключено. Пользователя можно только заблокировать или разблокировать.'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении пользователя'
    });
  }
};

// @desc    Block/unblock user
// @route   PATCH /api/admin/users/:id/block
// @access  Private (Admin only)
const toggleUserBlock = async (req, res) => {
  try {
    const userId = req.params.id;
    const { isBlocked } = req.body;

    if (typeof isBlocked !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Статус блокировки должен быть булевым значением'
      });
    }

    // Prevent admin from blocking themselves
    if (isBlocked && userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Нельзя заблокировать свой собственный аккаунт'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    if (isBlocked && user.email.toLowerCase() === PROTECTED_ADMIN_EMAIL) {
      return res.status(400).json({
        success: false,
        message: 'Нельзя заблокировать этот аккаунт администратора'
      });
    }

    user.isBlocked = isBlocked;
    user.blockedAt = isBlocked ? new Date() : null;
    user.updatedAt = new Date();

    await user.save();

    return res.json({
      success: true,
      message: isBlocked ? 'Пользователь заблокирован' : 'Пользователь разблокирован',
      data: {
        _id: user._id,
        isBlocked: user.isBlocked,
        blockedAt: user.blockedAt
      }
    });
  } catch (error) {
    console.error('Error toggling user block status:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при изменении статуса пользователя'
    });
  }
};

module.exports = {
  getProductsForAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductVisibility,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllUsers,
  updateUser,
  updateUserAvatar,
  deleteUser,
  toggleUserBlock
};

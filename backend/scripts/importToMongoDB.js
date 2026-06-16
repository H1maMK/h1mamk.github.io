const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();


const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Article = require('../models/Article');
const Order = require('../models/Order');


const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://maxim:maxim@maxim.cfghlo3.mongodb.net/devicemaster?retryWrites=true&w=majority');
    console.log('✅ Подключение к MongoDB Atlas успешно');
  } catch (error) {
    console.error('❌ Ошибка подключения к MongoDB Atlas:', error.message);
    console.log('💡 Проверьте:');
    console.log('- Правильность строки подключения');
    console.log('- Доступность интернет соединения');
    console.log('- Настройки сетевого доступа в MongoDB Atlas');
    process.exit(1);
  }
};


const clearDatabase = async () => {
  try {
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Article.deleteMany({});
    await Order.deleteMany({});
    console.log('🧹 База данных очищена');
  } catch (error) {
    console.error('❌ Ошибка очистки базы данных:', error);
  }
};


const loadData = async (filename) => {
  try {
    const filePath = path.join(__dirname, '../data', filename);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`❌ Ошибка загрузки ${filename}:`, error.message);
    return [];
  }
};


const importCategories = async () => {
  try {
    console.log('📦 Импортируем категории...');
    
    const categories = await loadData('categories.json');
    const categoryMap = new Map();
    
    for (const categoryData of categories) {
      const category = await Category.create(categoryData);
      categoryMap.set(categoryData.mysqlId, category._id);
      console.log(`✅ Категория "${categoryData.name}" импортирована`);
    }
    
    console.log(`✅ Импортировано ${categories.length} категорий`);
    return categoryMap;
  } catch (error) {
    console.error('❌ Ошибка импорта категорий:', error);
    return new Map();
  }
};


const importUsers = async () => {
  try {
    console.log('👥 Импортируем пользователей...');
    
    const users = await loadData('users.json');
    const userMap = new Map();
    
    for (const userData of users) {

      const hashedPassword = await bcrypt.hash('password', 12);
      userData.password = hashedPassword;
      
      const user = await User.create(userData);
      userMap.set(userData.mysqlId, user._id);
      console.log(`✅ Пользователь "${userData.username}" импортирован`);
    }
    
    console.log(`✅ Импортировано ${users.length} пользователей`);
    return userMap;
  } catch (error) {
    console.error('❌ Ошибка импорта пользователей:', error);
    return new Map();
  }
};


const importProducts = async (categoryMap) => {
  try {
    console.log('🛍️ Импортируем товары...');
    
    const products = await loadData('products.json');
    const productMap = new Map();
    
    for (const productData of products) {

      const categoryId = categoryMap.get(productData.mysqlId);
      

      let category = null;
      for (const [mysqlId, mongoId] of categoryMap.entries()) {


        if (!category) {
          category = mongoId;
          break;
        }
      }
      
      productData.category = category;
      delete productData.categoryId;
      
      const product = await Product.create(productData);
      productMap.set(productData.mysqlId, product._id);
      console.log(`✅ Товар "${productData.name}" импортирован`);
    }
    
    console.log(`✅ Импортировано ${products.length} товаров`);
    return productMap;
  } catch (error) {
    console.error('❌ Ошибка импорта товаров:', error);
    return new Map();
  }
};


const importArticles = async () => {
  try {
    console.log('📰 Импортируем статьи...');
    
    const articles = await loadData('articles.json');
    
    for (const articleData of articles) {
      await Article.create(articleData);
      console.log(`✅ Статья "${articleData.title}" импортирована`);
    }
    
    console.log(`✅ Импортировано ${articles.length} статей`);
  } catch (error) {
    console.error('❌ Ошибка импорта статей:', error);
  }
};


const importOrders = async (userMap, productMap) => {
  try {
    console.log('🛒 Импортируем заказы...');
    
    const orders = await loadData('orders.json');
    
    for (const orderData of orders) {

      const mongoUserId = userMap.get(orderData.userId);
      if (!mongoUserId) {
        console.log(`⚠️ Пользователь с MySQL ID ${orderData.userId} не найден, пропускаем заказ`);
        continue;
      }
      
      orderData.user = mongoUserId;
      delete orderData.userId;
      

      orderData.items = orderData.items.map(item => {
        const mongoProductId = productMap.get(item.productId);
        if (mongoProductId) {
          item.product = mongoProductId;
          delete item.productId;
          return item;
        }
        return null;
      }).filter(item => item !== null);
      
      if (orderData.items.length > 0) {
        await Order.create(orderData);
        console.log(`✅ Заказ #${orderData.mysqlId} импортирован`);
      }
    }
    
    console.log(`✅ Импорт заказов завершен`);
  } catch (error) {
    console.error('❌ Ошибка импорта заказов:', error);
  }
};


const importReviews = async (userMap, productMap) => {
  try {
    console.log('⭐ Импортируем отзывы...');
    
    const reviews = await loadData('reviews.json');
    
    for (const reviewData of reviews) {
      const mongoUserId = userMap.get(reviewData.userId);
      const mongoProductId = productMap.get(reviewData.productId);
      
      if (!mongoUserId || !mongoProductId) {
        console.log(`⚠️ Не найден пользователь или товар для отзыва, пропускаем`);
        continue;
      }
      

      await Product.findByIdAndUpdate(mongoProductId, {
        $push: {
          reviews: {
            user: mongoUserId,
            rating: reviewData.rating,
            comment: reviewData.comment,
            createdAt: reviewData.createdAt
          }
        }
      });
      
      console.log(`✅ Отзыв добавлен к товару`);
    }
    
    console.log(`✅ Импортировано ${reviews.length} отзывов`);
  } catch (error) {
    console.error('❌ Ошибка импорта отзывов:', error);
  }
};


const runImport = async () => {
  console.log('🚀 Начинаем импорт данных в MongoDB...\n');
  
  try {

    await connectMongoDB();
    

    await clearDatabase();
    console.log('');
    

    const categoryMap = await importCategories();
    console.log('');
    
    const userMap = await importUsers();
    console.log('');
    
    const productMap = await importProducts(categoryMap);
    console.log('');
    
    await importArticles();
    console.log('');
    
    await importOrders(userMap, productMap);
    console.log('');
    
    await importReviews(userMap, productMap);
    console.log('');
    
    console.log('🎉 Импорт данных успешно завершен!');
    

    const categoriesCount = await Category.countDocuments();
    const usersCount = await User.countDocuments();
    const productsCount = await Product.countDocuments();
    const articlesCount = await Article.countDocuments();
    const ordersCount = await Order.countDocuments();
    
    console.log('\n📊 Статистика импорта:');
    console.log(`- Категории: ${categoriesCount}`);
    console.log(`- Пользователи: ${usersCount}`);
    console.log(`- Товары: ${productsCount}`);
    console.log(`- Статьи: ${articlesCount}`);
    console.log(`- Заказы: ${ordersCount}`);
    

    console.log('\n🔗 Проверка связей:');
    const productWithCategory = await Product.findOne().populate('category');
    if (productWithCategory && productWithCategory.category) {
      console.log(`✅ Связь товар-категория работает: "${productWithCategory.name}" -> "${productWithCategory.category.name}"`);
    }
    
    const productsWithReviews = await Product.countDocuments({ 'reviews.0': { $exists: true } });
    console.log(`✅ Товары с отзывами: ${productsWithReviews}`);
    
  } catch (error) {
    console.error('❌ Критическая ошибка импорта:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Соединение с MongoDB закрыто');
    process.exit(0);
  }
};


if (require.main === module) {
  runImport();
}

module.exports = { runImport };
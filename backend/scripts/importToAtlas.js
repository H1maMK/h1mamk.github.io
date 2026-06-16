const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');


const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Article = require('../models/Article');
const Order = require('../models/Order');


const connectMongoDB = async () => {
  try {

    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://maxim:<password>@maxim.cfghlo3.mongodb.net/devicemaster?retryWrites=true&w=majority';
    
    console.log('🔗 Подключаемся к MongoDB Atlas...');
    console.log('📍 Кластер: maxim.cfghlo3.mongodb.net');
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Подключение к MongoDB Atlas успешно!');
    console.log(`📊 База данных: ${mongoose.connection.name}`);
    console.log(`🌐 Хост: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('❌ Ошибка подключения к MongoDB Atlas:', error.message);
    
    if (error.message.includes('bad auth')) {
      console.log('\n💡 Проблема с аутентификацией:');
      console.log('1. Проверьте правильность пароля в строке подключения');
      console.log('2. Убедитесь, что пользователь существует в MongoDB Atlas');
      console.log('3. Проверьте права доступа пользователя');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('timeout')) {
      console.log('\n💡 Проблема с сетевым подключением:');
      console.log('1. Проверьте интернет соединение');
      console.log('2. Добавьте ваш IP в Network Access в MongoDB Atlas');
      console.log('3. Проверьте настройки файрвола');
    }
    
    process.exit(1);
  }
};


const clearDatabase = async () => {
  try {
    console.log('🧹 Очищаем базу данных...');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📋 Найдено коллекций: ${collections.length}`);
    
    for (const collection of collections) {
      await mongoose.connection.db.collection(collection.name).deleteMany({});
      console.log(`🗑️ Очищена коллекция: ${collection.name}`);
    }
    
    console.log('✅ База данных очищена');
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
    
    console.log(`🎉 Импортировано ${categories.length} категорий`);
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
    
    console.log(`🎉 Импортировано ${users.length} пользователей`);
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

      let categoryId = null;
      

      const productName = productData.name.toLowerCase();
      if (productName.includes('мыш')) {

        for (const [mysqlId, mongoId] of categoryMap.entries()) {
          const category = await Category.findById(mongoId);
          if (category && category.name.includes('Мыш')) {
            categoryId = mongoId;
            break;
          }
        }
      } else if (productName.includes('клавиатур')) {

        for (const [mysqlId, mongoId] of categoryMap.entries()) {
          const category = await Category.findById(mongoId);
          if (category && category.name.includes('Клавиатур')) {
            categoryId = mongoId;
            break;
          }
        }
      } else if (productName.includes('наушник')) {

        for (const [mysqlId, mongoId] of categoryMap.entries()) {
          const category = await Category.findById(mongoId);
          if (category && category.name.includes('Наушник')) {
            categoryId = mongoId;
            break;
          }
        }
      } else if (productName.includes('монитор')) {

        for (const [mysqlId, mongoId] of categoryMap.entries()) {
          const category = await Category.findById(mongoId);
          if (category && category.name.includes('Монитор')) {
            categoryId = mongoId;
            break;
          }
        }
      } else if (productName.includes('микрофон')) {

        for (const [mysqlId, mongoId] of categoryMap.entries()) {
          const category = await Category.findById(mongoId);
          if (category && category.name.includes('Микрофон')) {
            categoryId = mongoId;
            break;
          }
        }
      } else if (productName.includes('веб-камер') || productName.includes('камер')) {

        for (const [mysqlId, mongoId] of categoryMap.entries()) {
          const category = await Category.findById(mongoId);
          if (category && category.name.includes('Веб-камер')) {
            categoryId = mongoId;
            break;
          }
        }
      }
      

      if (!categoryId) {
        for (const [mysqlId, mongoId] of categoryMap.entries()) {
          categoryId = mongoId;
          break;
        }
      }
      
      productData.category = categoryId;
      delete productData.categoryId;
      
      const product = await Product.create(productData);
      productMap.set(productData.mysqlId, product._id);
      console.log(`✅ Товар "${productData.name}" импортирован`);
    }
    
    console.log(`🎉 Импортировано ${products.length} товаров`);
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
    
    console.log(`🎉 Импортировано ${articles.length} статей`);
  } catch (error) {
    console.error('❌ Ошибка импорта статей:', error);
  }
};


const runImport = async () => {
  console.log('🚀 Начинаем импорт данных в MongoDB Atlas...\n');
  
  try {

    await connectMongoDB();
    console.log('');
    

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
    
    console.log('🎉 Импорт данных в MongoDB Atlas успешно завершен!');
    

    const categoriesCount = await Category.countDocuments();
    const usersCount = await User.countDocuments();
    const productsCount = await Product.countDocuments();
    const articlesCount = await Article.countDocuments();
    
    console.log('\n📊 Статистика импорта в Atlas:');
    console.log(`- Категории: ${categoriesCount}`);
    console.log(`- Пользователи: ${usersCount}`);
    console.log(`- Товары: ${productsCount}`);
    console.log(`- Статьи: ${articlesCount}`);
    

    console.log('\n🔗 Проверка связей:');
    const productWithCategory = await Product.findOne().populate('category');
    if (productWithCategory && productWithCategory.category) {
      console.log(`✅ Связь товар-категория работает: "${productWithCategory.name}" -> "${productWithCategory.category.name}"`);
    }
    
    console.log('\n🌐 Данные успешно загружены в MongoDB Atlas!');
    console.log('🔗 Кластер: maxim.cfghlo3.mongodb.net');
    console.log('📊 База данных: devicemaster');
    
  } catch (error) {
    console.error('❌ Критическая ошибка импорта:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Соединение с MongoDB Atlas закрыто');
    process.exit(0);
  }
};


if (require.main === module) {

  require('dotenv').config();
  runImport();
}

module.exports = { runImport };
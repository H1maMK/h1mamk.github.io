const mysql = require('mysql2/promise');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Импорт моделей MongoDB
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Article = require('../models/Article');
const Order = require('../models/Order');

// Конфигурация MySQL
const mysqlConfig = {
  host: 'localhost',
  user: 'root',
  password: 'strela79', // Пароль из config.php
  database: 'praktik',
  charset: 'utf8mb4'
};

// Подключение к MongoDB
const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/devicemaster');
    console.log('✅ Подключение к MongoDB успешно');
  } catch (error) {
    console.error('❌ Ошибка подключения к MongoDB:', error);
    process.exit(1);
  }
};

// Подключение к MySQL
const connectMySQL = async () => {
  try {
    const connection = await mysql.createConnection(mysqlConfig);
    console.log('✅ Подключение к MySQL успешно');
    return connection;
  } catch (error) {
    console.error('❌ Ошибка подключения к MySQL:', error);
    process.exit(1);
  }
};

// Миграция категорий
const migrateCategories = async (mysqlConnection) => {
  try {
    console.log('📦 Начинаем миграцию категорий...');
    
    const [categories] = await mysqlConnection.execute('SELECT * FROM categories');
    
    for (const category of categories) {
      const existingCategory = await Category.findOne({ name: category.category_name });
      
      if (!existingCategory) {
        await Category.create({
          name: category.category_name,
          deviceType: category.device_type,
          mysqlId: category.id // Сохраняем ID из MySQL для связей
        });
        console.log(`✅ Категория "${category.category_name}" добавлена`);
      } else {
        console.log(`⚠️ Категория "${category.category_name}" уже существует`);
      }
    }
    
    console.log('✅ Миграция категорий завершена');
  } catch (error) {
    console.error('❌ Ошибка миграции категорий:', error);
  }
};

// Миграция пользователей
const migrateUsers = async (mysqlConnection) => {
  try {
    console.log('👥 Начинаем миграцию пользователей...');
    
    const [users] = await mysqlConnection.execute(`
      SELECT u.*, r.role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id
    `);
    
    for (const user of users) {
      const existingUser = await User.findOne({ 
        $or: [
          { username: user.username },
          { email: user.email }
        ]
      });
      
      if (!existingUser) {
        // Хешируем пароль (в данных пароль 'password')
        const hashedPassword = await bcrypt.hash('password', 10);
        
        await User.create({
          username: user.username,
          email: user.email,
          password: hashedPassword,
          role: user.role_name === 'admin' ? 'admin' : 'user',
          profile: {
            yearBirth: user.yearbirth ? parseInt(user.yearbirth) : null,
            gender: user.gender,
            avatar: user.img
          },
          mysqlId: user.id
        });
        console.log(`✅ Пользователь "${user.username}" добавлен`);
      } else {
        console.log(`⚠️ Пользователь "${user.username}" уже существует`);
      }
    }
    
    console.log('✅ Миграция пользователей завершена');
  } catch (error) {
    console.error('❌ Ошибка миграции пользователей:', error);
  }
};

// Миграция товаров
const migrateProducts = async (mysqlConnection) => {
  try {
    console.log('🛍️ Начинаем миграцию товаров...');
    
    const [products] = await mysqlConnection.execute(`
      SELECT p.*, c.category_name, c.device_type 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
    `);
    
    for (const product of products) {
      const existingProduct = await Product.findOne({ name: product.product_name });
      
      if (!existingProduct) {
        // Находим соответствующую категорию в MongoDB
        const category = await Category.findOne({ mysqlId: product.category_id });
        
        // Парсим свойства товара
        let specifications = {};
        if (product.properties) {
          const props = product.properties.split(';');
          props.forEach(prop => {
            const [key, value] = prop.split(':').map(s => s.trim());
            if (key && value) {
              specifications[key] = value;
            }
          });
        }
        
        // Собираем изображения
        const images = [];
        if (product.image_url1) images.push(product.image_url1);
        if (product.image_url2) images.push(product.image_url2);
        if (product.image_url3) images.push(product.image_url3);
        
        await Product.create({
          name: product.product_name,
          description: product.description,
          price: parseFloat(product.price),
          images: images,
          specifications: specifications,
          category: category ? category._id : null,
          stock: product.availability || 0,
          isActive: true,
          mysqlId: product.id
        });
        console.log(`✅ Товар "${product.product_name}" добавлен`);
      } else {
        console.log(`⚠️ Товар "${product.product_name}" уже существует`);
      }
    }
    
    console.log('✅ Миграция товаров завершена');
  } catch (error) {
    console.error('❌ Ошибка миграции товаров:', error);
  }
};

// Миграция статей
const migrateArticles = async (mysqlConnection) => {
  try {
    console.log('📰 Начинаем миграцию статей...');
    
    const [articles] = await mysqlConnection.execute('SELECT * FROM articles');
    
    for (const article of articles) {
      const existingArticle = await Article.findOne({ title: article.title });
      
      if (!existingArticle) {
        await Article.create({
          title: article.title,
          content: article.content,
          imageUrl: article.image_url,
          isPublished: true,
          publishedAt: article.created_at,
          mysqlId: article.id
        });
        console.log(`✅ Статья "${article.title}" добавлена`);
      } else {
        console.log(`⚠️ Статья "${article.title}" уже существует`);
      }
    }
    
    console.log('✅ Миграция статей завершена');
  } catch (error) {
    console.error('❌ Ошибка миграции статей:', error);
  }
};

// Миграция заказов
const migrateOrders = async (mysqlConnection) => {
  try {
    console.log('🛒 Начинаем миграцию заказов...');
    
    const [orders] = await mysqlConnection.execute(`
      SELECT o.*, u.username 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id
    `);
    
    for (const order of orders) {
      const existingOrder = await Order.findOne({ mysqlId: order.id });
      
      if (!existingOrder) {
        // Находим пользователя в MongoDB
        const user = await User.findOne({ mysqlId: order.user_id });
        
        // Получаем товары заказа
        const [orderItems] = await mysqlConnection.execute(`
          SELECT oi.*, p.product_name, p.price 
          FROM order_items oi 
          LEFT JOIN products p ON oi.product_id = p.id 
          WHERE oi.order_id = ?
        `, [order.id]);
        
        const items = [];
        let totalAmount = 0;
        
        for (const item of orderItems) {
          const product = await Product.findOne({ mysqlId: item.product_id });
          if (product) {
            const itemTotal = parseFloat(item.quantity) * parseFloat(item.price || product.price);
            items.push({
              product: product._id,
              quantity: item.quantity,
              price: parseFloat(item.price || product.price)
            });
            totalAmount += itemTotal;
          }
        }
        
        await Order.create({
          user: user ? user._id : null,
          items: items,
          totalAmount: totalAmount,
          status: order.status,
          createdAt: order.order_date,
          mysqlId: order.id
        });
        console.log(`✅ Заказ #${order.id} добавлен`);
      } else {
        console.log(`⚠️ Заказ #${order.id} уже существует`);
      }
    }
    
    console.log('✅ Миграция заказов завершена');
  } catch (error) {
    console.error('❌ Ошибка миграции заказов:', error);
  }
};

// Миграция отзывов
const migrateReviews = async (mysqlConnection) => {
  try {
    console.log('⭐ Начинаем миграцию отзывов...');
    
    const [reviews] = await mysqlConnection.execute(`
      SELECT r.*, u.username, p.product_name 
      FROM reviews r 
      LEFT JOIN users u ON r.user_id = u.id 
      LEFT JOIN products p ON r.product_id = p.id
    `);
    
    for (const review of reviews) {
      // Находим пользователя и товар в MongoDB
      const user = await User.findOne({ mysqlId: review.user_id });
      const product = await Product.findOne({ mysqlId: review.product_id });
      
      if (user && product) {
        // Проверяем, есть ли уже отзыв от этого пользователя на этот товар
        const existingReview = await Product.findOne({
          _id: product._id,
          'reviews.user': user._id
        });
        
        if (!existingReview) {
          // Добавляем отзыв к товару
          await Product.findByIdAndUpdate(product._id, {
            $push: {
              reviews: {
                user: user._id,
                rating: review.rating,
                comment: review.comment,
                createdAt: review.created_at
              }
            }
          });
          console.log(`✅ Отзыв от ${review.username} на товар "${review.product_name}" добавлен`);
        } else {
          console.log(`⚠️ Отзыв от ${review.username} на товар "${review.product_name}" уже существует`);
        }
      }
    }
    
    console.log('✅ Миграция отзывов завершена');
  } catch (error) {
    console.error('❌ Ошибка миграции отзывов:', error);
  }
};

// Основная функция миграции
const runMigration = async () => {
  console.log('🚀 Начинаем миграцию данных из MySQL в MongoDB...\n');
  
  let mysqlConnection;
  
  try {
    // Подключаемся к базам данных
    await connectMongoDB();
    mysqlConnection = await connectMySQL();
    
    // Выполняем миграцию в правильном порядке
    await migrateCategories(mysqlConnection);
    console.log('');
    
    await migrateUsers(mysqlConnection);
    console.log('');
    
    await migrateProducts(mysqlConnection);
    console.log('');
    
    await migrateArticles(mysqlConnection);
    console.log('');
    
    await migrateOrders(mysqlConnection);
    console.log('');
    
    await migrateReviews(mysqlConnection);
    console.log('');
    
    console.log('🎉 Миграция данных успешно завершена!');
    
    // Выводим статистику
    const categoriesCount = await Category.countDocuments();
    const usersCount = await User.countDocuments();
    const productsCount = await Product.countDocuments();
    const articlesCount = await Article.countDocuments();
    const ordersCount = await Order.countDocuments();
    
    console.log('\n📊 Статистика миграции:');
    console.log(`- Категории: ${categoriesCount}`);
    console.log(`- Пользователи: ${usersCount}`);
    console.log(`- Товары: ${productsCount}`);
    console.log(`- Статьи: ${articlesCount}`);
    console.log(`- Заказы: ${ordersCount}`);
    
  } catch (error) {
    console.error('❌ Критическая ошибка миграции:', error);
  } finally {
    // Закрываем соединения
    if (mysqlConnection) {
      await mysqlConnection.end();
      console.log('✅ Соединение с MySQL закрыто');
    }
    
    await mongoose.connection.close();
    console.log('✅ Соединение с MongoDB закрыто');
    
    process.exit(0);
  }
};

// Запускаем миграцию
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
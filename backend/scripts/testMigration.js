const mongoose = require('mongoose');
require('dotenv').config();


const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Article = require('../models/Article');
const Order = require('../models/Order');


const testData = {
  categories: [
    { id: 1, category_name: 'Игровые Микрофоны', device_type: 'Игровое' },
    { id: 2, category_name: 'Игровые Наушники', device_type: 'Игровое' },
    { id: 3, category_name: 'Игровые Мышки', device_type: 'Игровое' },
    { id: 4, category_name: 'Игровые Клавиатуры', device_type: 'Игровое' },
    { id: 5, category_name: 'Игровые Веб-камеры', device_type: 'Игровое' },
    { id: 6, category_name: 'Игровые Мониторы', device_type: 'Игровое' },
    { id: 7, category_name: 'Офисные Микрофоны', device_type: 'Офисное' },
    { id: 8, category_name: 'Офисные Наушники', device_type: 'Офисное' },
    { id: 9, category_name: 'Офисные Мышки', device_type: 'Офисное' },
    { id: 10, category_name: 'Офисные Клавиатуры', device_type: 'Офисное' },
    { id: 11, category_name: 'Офисные Веб-камеры', device_type: 'Офисное' },
    { id: 12, category_name: 'Офисные Мониторы', device_type: 'Офисное' }
  ],
  
  users: [
    {
      id: 1,
      username: 'ivanov',
      password: 'password',
      email: 'ivanov@example.com',
      yearbirth: '1985',
      gender: 'male',
      img: null,
      role_name: 'admin'
    }
  ],
  
  products: [
    {
      id: 1,
      product_name: 'Мышь беспроводная Logitech G PRO X SUPERLIGHT 2 розовый',
      description: 'Беспроводная мышь Logitech G PRO X SUPERLIGHT 2 – это высококачественное игровое устройство...',
      price: 12990,
      availability: 10,
      properties: 'Цвет: розовый; Тип: беспроводная; Варианты подключение: USB; Сенсор: HERO 25K ;DPI: до 25600 ;Вес: 63 г',
      category_id: 3,
      image_url1: 'https://sun9-42.userapi.com/impg/jQ7ZYi1uURONUIst4qnaV6n500ZMLQT_7mLuNg/I0kR5EJcSX8.jpg',
      image_url2: 'https://sun9-58.userapi.com/impg/Abot3YICW5dIzipzlhSMA_qjSHdFwO70r8_PhA/5IoxcsnNKEE.jpg',
      image_url3: 'https://sun9-72.userapi.com/impg/urT-J9TgQYVJ6Jdz1KmCUsluIY3S0E8Bwxn6Fw/EuzD7nPdnM0.jpg'
    },
    {
      id: 2,
      product_name: 'Мышь проводная Logitech M90 [910-001970] черный',
      description: 'Проводная мышь Logitech M90 – это простое и надежное устройство...',
      price: 599,
      availability: 30,
      properties: 'Цвет: черный; Тип: проводная; Подключение: USB; Сенсор: оптический; DPI: до 1000',
      category_id: 9,
      image_url1: 'https://sun9-56.userapi.com/impg/dbTm7iPEy01LzW1lBHHt5D5_s5IpvfR1rF0UJg/sAnK5poJU3w.jpg',
      image_url2: null,
      image_url3: null
    }
  ],
  
  articles: [
    {
      id: 1,
      title: 'Как выбрать игровую мышь для FPS-игр: советы и рекомендации',
      content: 'При выборе игровой мыши для FPS-игр важно учитывать несколько ключевых факторов...',
      image_url: 'https://sun9-55.userapi.com/impg/XRCTDqEyrICBPJUzPSj1nrNtIQckFBw5N7Fm2g/0LJ8DkIZOLU.jpg',
      created_at: new Date('2023-01-01')
    }
  ]
};


const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/devicemaster');
    console.log('✅ Подключение к MongoDB успешно');
  } catch (error) {
    console.error('❌ Ошибка подключения к MongoDB:', error.message);
    console.log('💡 Убедитесь, что MongoDB запущен на порту 27017');
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


const testMigrateCategories = async () => {
  try {
    console.log('📦 Тестируем миграцию категорий...');
    
    for (const category of testData.categories) {
      await Category.create({
        name: category.category_name,
        deviceType: category.device_type,
        mysqlId: category.id
      });
      console.log(`✅ Категория "${category.category_name}" добавлена`);
    }
    
    console.log('✅ Тестовая миграция категорий завершена');
  } catch (error) {
    console.error('❌ Ошибка тестовой миграции категорий:', error);
  }
};


const testMigrateUsers = async () => {
  try {
    console.log('👥 Тестируем миграцию пользователей...');
    
    for (const user of testData.users) {
      await User.create({
        username: user.username,
        email: user.email,
        password: user.password,
        role: user.role_name === 'admin' ? 'admin' : 'user',
        profile: {
          yearBirth: user.yearbirth ? parseInt(user.yearbirth) : null,
          gender: user.gender,
          avatar: user.img
        },
        mysqlId: user.id
      });
      console.log(`✅ Пользователь "${user.username}" добавлен`);
    }
    
    console.log('✅ Тестовая миграция пользователей завершена');
  } catch (error) {
    console.error('❌ Ошибка тестовой миграции пользователей:', error);
  }
};


const testMigrateProducts = async () => {
  try {
    console.log('🛍️ Тестируем миграцию товаров...');
    
    for (const product of testData.products) {

      const category = await Category.findOne({ mysqlId: product.category_id });
      

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
    }
    
    console.log('✅ Тестовая миграция товаров завершена');
  } catch (error) {
    console.error('❌ Ошибка тестовой миграции товаров:', error);
  }
};


const testMigrateArticles = async () => {
  try {
    console.log('📰 Тестируем миграцию статей...');
    
    for (const article of testData.articles) {
      await Article.create({
        title: article.title,
        content: article.content,
        imageUrl: article.image_url,
        isPublished: true,
        publishedAt: article.created_at,
        mysqlId: article.id
      });
      console.log(`✅ Статья "${article.title}" добавлена`);
    }
    
    console.log('✅ Тестовая миграция статей завершена');
  } catch (error) {
    console.error('❌ Ошибка тестовой миграции статей:', error);
  }
};


const runTestMigration = async () => {
  console.log('🧪 Начинаем тестовую миграцию данных...\n');
  
  try {

    await connectMongoDB();
    

    await clearDatabase();
    console.log('');
    

    await testMigrateCategories();
    console.log('');
    
    await testMigrateUsers();
    console.log('');
    
    await testMigrateProducts();
    console.log('');
    
    await testMigrateArticles();
    console.log('');
    
    console.log('🎉 Тестовая миграция успешно завершена!');
    

    const categoriesCount = await Category.countDocuments();
    const usersCount = await User.countDocuments();
    const productsCount = await Product.countDocuments();
    const articlesCount = await Article.countDocuments();
    
    console.log('\n📊 Статистика тестовой миграции:');
    console.log(`- Категории: ${categoriesCount}`);
    console.log(`- Пользователи: ${usersCount}`);
    console.log(`- Товары: ${productsCount}`);
    console.log(`- Статьи: ${articlesCount}`);
    

    console.log('\n🔗 Проверка связей:');
    const productWithCategory = await Product.findOne().populate('category');
    if (productWithCategory && productWithCategory.category) {
      console.log(`✅ Связь товар-категория работает: "${productWithCategory.name}" -> "${productWithCategory.category.name}"`);
    }
    
    const userWithHashedPassword = await User.findOne().select('+password');
    if (userWithHashedPassword && userWithHashedPassword.password.startsWith('$2a$')) {
      console.log(`✅ Пароль пользователя хеширован: ${userWithHashedPassword.password.substring(0, 20)}...`);
    }
    
  } catch (error) {
    console.error('❌ Критическая ошибка тестовой миграции:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Соединение с MongoDB закрыто');
    process.exit(0);
  }
};


if (require.main === module) {
  runTestMigration();
}

module.exports = { runTestMigration };
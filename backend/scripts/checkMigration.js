const mongoose = require('mongoose');
require('dotenv').config();


const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Article = require('../models/Article');
const Order = require('../models/Order');

const checkMigration = async () => {
  try {

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/devicemaster');
    console.log('✅ Подключение к MongoDB успешно\n');


    console.log('📦 КАТЕГОРИИ:');
    const categories = await Category.find().sort({ name: 1 });
    console.log(`Всего категорий: ${categories.length}`);
    categories.forEach(cat => {
      console.log(`- ${cat.name} (${cat.deviceType}) [MySQL ID: ${cat.mysqlId}]`);
    });
    console.log('');


    console.log('👥 ПОЛЬЗОВАТЕЛИ:');
    const users = await User.find().sort({ username: 1 });
    console.log(`Всего пользователей: ${users.length}`);
    users.forEach(user => {
      console.log(`- ${user.username} (${user.email}) - ${user.role} [MySQL ID: ${user.mysqlId}]`);
    });
    console.log('');


    console.log('🛍️ ТОВАРЫ:');
    const products = await Product.find().populate('category').sort({ name: 1 });
    console.log(`Всего товаров: ${products.length}`);
    products.forEach(product => {
      const categoryName = product.category ? product.category.name : 'Без категории';
      const reviewsCount = product.reviews ? product.reviews.length : 0;
      console.log(`- ${product.name}`);
      console.log(`  Цена: ${product.price} руб.`);
      console.log(`  Категория: ${categoryName}`);
      console.log(`  На складе: ${product.stock}`);
      console.log(`  Изображений: ${product.images.length}`);
      console.log(`  Отзывов: ${reviewsCount}`);
      console.log(`  MySQL ID: ${product.mysqlId}`);
      console.log('');
    });


    console.log('📰 СТАТЬИ:');
    const articles = await Article.find().sort({ title: 1 });
    console.log(`Всего статей: ${articles.length}`);
    articles.forEach(article => {
      console.log(`- ${article.title}`);
      console.log(`  Опубликована: ${article.isPublished ? 'Да' : 'Нет'}`);
      console.log(`  Дата: ${article.publishedAt}`);
      console.log(`  MySQL ID: ${article.mysqlId}`);
      console.log('');
    });

    // Проверка заказов
    console.log('🛒 ЗАКАЗЫ:');
    const orders = await Order.find().populate('user').populate('items.product').sort({ createdAt: -1 });
    console.log(`Всего заказов: ${orders.length}`);
    orders.forEach(order => {
      const userName = order.user ? order.user.username : 'Неизвестный пользователь';
      console.log(`- Заказ #${order._id}`);
      console.log(`  Пользователь: ${userName}`);
      console.log(`  Сумма: ${order.totalAmount} руб.`);
      console.log(`  Статус: ${order.status}`);
      console.log(`  Товаров: ${order.items.length}`);
      console.log(`  Дата: ${order.createdAt}`);
      console.log(`  MySQL ID: ${order.mysqlId}`);
      console.log('');
    });

    // Проверка отзывов
    console.log('⭐ ОТЗЫВЫ:');
    const productsWithReviews = await Product.find({ 'reviews.0': { $exists: true } })
      .populate('reviews.user')
      .sort({ name: 1 });
    
    let totalReviews = 0;
    productsWithReviews.forEach(product => {
      console.log(`- ${product.name}:`);
      product.reviews.forEach(review => {
        const userName = review.user ? review.user.username : 'Неизвестный пользователь';
        console.log(`  ${userName}: ${review.rating}/5 - "${review.comment}"`);
        totalReviews++;
      });
      console.log('');
    });
    console.log(`Всего отзывов: ${totalReviews}\n`);

    // Общая статистика
    console.log('📊 ОБЩАЯ СТАТИСТИКА:');
    console.log(`- Категории: ${categories.length}`);
    console.log(`- Пользователи: ${users.length}`);
    console.log(`- Товары: ${products.length}`);
    console.log(`- Статьи: ${articles.length}`);
    console.log(`- Заказы: ${orders.length}`);
    console.log(`- Отзывы: ${totalReviews}`);

    // Проверка связей
    console.log('\n🔗 ПРОВЕРКА СВЯЗЕЙ:');
    
    // Товары без категорий
    const productsWithoutCategory = await Product.countDocuments({ category: null });
    console.log(`- Товары без категории: ${productsWithoutCategory}`);
    
    // Заказы без пользователей
    const ordersWithoutUser = await Order.countDocuments({ user: null });
    console.log(`- Заказы без пользователя: ${ordersWithoutUser}`);
    
    // Товары с отзывами
    const productsWithReviewsCount = await Product.countDocuments({ 'reviews.0': { $exists: true } });
    console.log(`- Товары с отзывами: ${productsWithReviewsCount}`);

    console.log('\n✅ Проверка миграции завершена!');

  } catch (error) {
    console.error('❌ Ошибка при проверке миграции:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Соединение с MongoDB закрыто');
    process.exit(0);
  }
};

// Запуск проверки
if (require.main === module) {
  checkMigration();
}

module.exports = { checkMigration };
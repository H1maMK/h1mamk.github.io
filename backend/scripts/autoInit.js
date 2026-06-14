const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Article = require('../models/Article');
const User = require('../models/User');

/**
 * Автоматическая инициализация базы данных
 * Проверяет наличие данных и загружает их при необходимости
 */
async function autoInitDatabase() {
  try {
    console.log('🔍 Проверка базы данных...');

    // Проверяем количество товаров
    const productCount = await Product.countDocuments();
    const categoryCount = await Category.countDocuments();
    const articleCount = await Article.countDocuments();
    const userCount = await User.countDocuments();

    console.log(`📊 Текущее состояние базы данных:`);
    console.log(`   - Товары: ${productCount}`);
    console.log(`   - Категории: ${categoryCount}`);
    console.log(`   - Статьи: ${articleCount}`);
    console.log(`   - Пользователи: ${userCount}`);

    // Если товаров меньше 10, запускаем миграцию
    if (productCount < 10) {
      console.log('⚠️  Недостаточно товаров в базе данных');
      console.log('🚀 Запуск автоматической миграции данных...');
      
      try {
        // Запускаем миграцию
        const { runMigration } = require('./migrateFromMySQL');
        await runMigration();
        
        console.log('✅ Миграция данных завершена успешно');
      } catch (migrationError) {
        console.error('❌ Ошибка миграции:', migrationError.message);
        console.log('⚠️  Продолжаем работу с текущими данными');
      }
    } else {
      console.log('✅ База данных содержит достаточно данных');
    }

    // Обновляем stock для всех товаров, если он равен 0
    const productsWithoutStock = await Product.countDocuments({ stock: 0 });
    if (productsWithoutStock > 0) {
      console.log(`🔧 Обновление запасов для ${productsWithoutStock} товаров...`);
      await Product.updateMany({ stock: 0 }, { $set: { stock: 10 } });
      console.log('✅ Запасы обновлены');
    }

  } catch (error) {
    console.error('❌ Ошибка автоинициализации:', error.message);
    // Не прерываем запуск сервера
  }
}

module.exports = { autoInitDatabase };

const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
require('dotenv').config();

const assignCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');


    const categories = await Category.find();
    console.log(`Found ${categories.length} categories`);


    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });

    console.log('Categories:', Object.keys(categoryMap));


    const products = await Product.find({ category: null });
    console.log(`Found ${products.length} products without category`);

    let updated = 0;


    for (const product of products) {
      const name = product.name.toLowerCase();
      let assignedCategory = null;


      if (name.includes('мышь') || name.includes('мышка')) {
        if (name.includes('игров')) {
          assignedCategory = categoryMap['Игровые Мышки'];
        } else {
          assignedCategory = categoryMap['Офисные Мышки'];
        }
      } else if (name.includes('клавиатур')) {
        if (name.includes('игров')) {
          assignedCategory = categoryMap['Игровые Клавиатуры'];
        } else {
          assignedCategory = categoryMap['Офисные Клавиатуры'];
        }
      } else if (name.includes('наушник')) {
        if (name.includes('игров')) {
          assignedCategory = categoryMap['Игровые Наушники'];
        } else {
          assignedCategory = categoryMap['Офисные Наушники'];
        }
      } else if (name.includes('монитор')) {
        if (name.includes('игров')) {
          assignedCategory = categoryMap['Игровые Мониторы'];
        } else {
          assignedCategory = categoryMap['Офисные Мониторы'];
        }
      } else if (name.includes('микрофон')) {
        if (name.includes('игров') || name.includes('gaming') || name.includes('ardor')) {
          assignedCategory = categoryMap['Игровые Микрофоны'];
        } else {
          assignedCategory = categoryMap['Офисные Микрофоны'];
        }
      } else if (name.includes('веб-камера') || name.includes('камера')) {
        if (name.includes('игров') || name.includes('gaming') || name.includes('ardor')) {
          assignedCategory = categoryMap['Игровые Веб-камеры'];
        } else {
          assignedCategory = categoryMap['Офисные Веб-камеры'];
        }
      }

      if (assignedCategory) {
        product.category = assignedCategory;
        await product.save();
        updated++;
        console.log(`✓ ${product.name} -> ${Object.keys(categoryMap).find(key => categoryMap[key].toString() === assignedCategory.toString())}`);
      } else {
        console.log(`✗ ${product.name} - не удалось определить категорию`);
      }
    }

    console.log(`\nUpdated ${updated} products`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

assignCategories();

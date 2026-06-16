const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Подключено к MongoDB\n');

    const users = await User.find({});

    console.log(`Найдено пользователей: ${users.length}\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log('');
    });

  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

checkUsers();

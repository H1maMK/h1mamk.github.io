require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Подключено к MongoDB');
    
    const users = await User.find({}).select('username email role');
    console.log('\n📋 Пользователи в базе данных:');
    console.log('================================');
    users.forEach(u => {
      console.log(`Email: ${u.email}`);
      console.log(`Username: ${u.username}`);
      console.log(`Role: ${u.role}`);
      console.log('--------------------------------');
    });
    console.log(`\nВсего пользователей: ${users.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

checkUsers();

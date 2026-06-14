require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Подключено к MongoDB');
    
    const email = 'maximiliansov@gmail.com';
    const newPassword = '123456'; // Простой пароль для теста
    
    console.log(`Ищем пользователя: ${email}`);
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ Пользователь не найден');
      process.exit(1);
    }
    
    console.log(`✅ Пользователь найден: ${user.username} (${user.email})`);
    console.log(`Текущая роль: ${user.role}`);
    
    // Устанавливаем пароль напрямую (модель сама захеширует через pre-save hook)
    user.password = newPassword;
    await user.save();
    
    console.log(`\n✅ Пароль успешно сброшен!`);
    console.log('================================');
    console.log(`Email: ${email}`);
    console.log(`Новый пароль: ${newPassword}`);
    console.log('================================');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

resetPassword();

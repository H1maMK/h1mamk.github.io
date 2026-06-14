const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function deleteAnonymousUser() {
  try {
    console.log('🔍 Подключение к MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('✅ Подключено к MongoDB');
    
    // Ищем пользователя anonymous
    const anonymousUsers = await User.find({
      $or: [
        { username: 'anonymous' },
        { username: 'Anonymous' },
        { username: 'анонимус' },
        { username: 'Анонимус' },
        { email: { $regex: /anonymous/i } }
      ]
    });
    
    console.log(`\n📊 Найдено пользователей "anonymous": ${anonymousUsers.length}`);
    
    if (anonymousUsers.length > 0) {
      anonymousUsers.forEach(user => {
        console.log(`   - ID: ${user._id}, Username: ${user.username}, Email: ${user.email}`);
      });
      
      // Удаляем всех найденных пользователей
      const result = await User.deleteMany({
        $or: [
          { username: 'anonymous' },
          { username: 'Anonymous' },
          { username: 'анонимус' },
          { username: 'Анонимус' },
          { email: { $regex: /anonymous/i } }
        ]
      });
      
      console.log(`\n✅ Удалено пользователей: ${result.deletedCount}`);
    } else {
      console.log('\n✅ Пользователи "anonymous" не найдены');
    }
    
    // Показываем оставшихся пользователей
    const remainingUsers = await User.find({}, 'username email role');
    console.log(`\n📋 Оставшиеся пользователи (${remainingUsers.length}):`);
    remainingUsers.forEach(user => {
      console.log(`   - ${user.username} (${user.email}) - ${user.role}`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Отключено от MongoDB');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

deleteAnonymousUser();

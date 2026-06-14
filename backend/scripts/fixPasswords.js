const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

const userPasswords = {
  'mr.maxim.8806@mail.ru': '123456',
  'max30@mail.ru': '123456',
  'max123asd@mail.ru': '123456',
  'user@zxc.ru': '123456',
  'maxim1234@mail.ru': '123456',
  'maximiliansov@gmail.com': '123456'
};

async function fixPasswords() {
  try {
    console.log('Подключение к MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Подключено');

    for (const [email, password] of Object.entries(userPasswords)) {
      const user = await User.findOne({ email }).select('+password');
      
      if (!user) {
        console.log(`✗ ${email} не найден`);
        continue;
      }

      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      await User.updateOne({ email }, { $set: { password: hashedPassword } });

      console.log(`✓ ${email} | пароль: ${password}`);
    }

    console.log('\n=== Готово ===');

  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

fixPasswords();

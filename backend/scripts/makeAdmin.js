const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const makeAdmin = async () => {
  try {
    // Подключение к MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'admin@test.com';

    // Находим пользователя
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User found:', user.email, 'Current role:', user.role);

    // Делаем администратором
    user.role = 'admin';
    await user.save();

    console.log('User role updated to admin');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

makeAdmin();
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const testLogin = async () => {
  try {

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'mr.maxim.8806@mail.ru';
    const password = 'Kuznetsova051979';


    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User found:');
    console.log('- Email:', user.email);
    console.log('- Role:', user.role);
    console.log('- Has password:', !!user.password);


    const isPasswordValid = await user.comparePassword(password);
    console.log('Password valid:', isPasswordValid);


    const testPasswords = ['123456', 'admin', 'password', 'Kuznetsova051979'];
    
    for (const testPass of testPasswords) {
      const isValid = await user.comparePassword(testPass);
      console.log(`Password "${testPass}": ${isValid}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

testLogin();
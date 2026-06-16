const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const checkUser = async () => {
  try {

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const adminEmail = 'mr.maxim.8806@mail.ru';


    const user = await User.findOne({ email: adminEmail }).select('+password');

    if (user) {
      console.log('User found:');
      console.log('- ID:', user._id);
      console.log('- Username:', user.username);
      console.log('- Email:', user.email);
      console.log('- Role:', user.role);
      console.log('- Has password:', !!user.password);
      console.log('- Password length:', user.password ? user.password.length : 0);
      

      const testPassword = 'Kuznetsova051979';
      const isPasswordCorrect = await user.comparePassword(testPassword);
      console.log('- Password test result:', isPasswordCorrect);
      
    } else {
      console.log('User not found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};


checkUser();
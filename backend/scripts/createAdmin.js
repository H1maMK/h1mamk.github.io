const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const adminEmail = 'mr.maxim.8806@mail.ru';
    const adminPassword = 'Kuznetsova051979';
    const adminUsername = 'admin';


    let existingUser = await User.findOne({ email: adminEmail }).select('+password');

    if (existingUser) {
      console.log('User with this email already exists:', existingUser.email);
      

      if (existingUser.role !== 'admin') {
        existingUser.role = 'admin';
        await existingUser.save();
        console.log('User role updated to admin');
      } else {
        console.log('User is already an admin');
      }
      

      if (existingUser.password) {
        const isPasswordCorrect = await existingUser.comparePassword(adminPassword);
        if (!isPasswordCorrect) {
          console.log('Password is incorrect, updating...');
          existingUser.password = adminPassword;
          await existingUser.save();
          console.log('Password updated');
        } else {
          console.log('Password is correct');
        }
      } else {
        console.log('No password set, setting new password...');
        existingUser.password = adminPassword;
        await existingUser.save();
        console.log('Password set');
      }
      
    } else {

      console.log('Creating new admin user...');
      
      const adminUser = new User({
        username: adminUsername,
        email: adminEmail,
        password: adminPassword,
        role: 'admin'
      });

      await adminUser.save();
      console.log('Admin user created successfully');
    }

    console.log('Admin setup completed');
    
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};


createAdmin();
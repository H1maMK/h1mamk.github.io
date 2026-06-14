const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/database');

// Import models to ensure they are registered
const { User, Product, Order, Article, Category } = require('../models');

const initializeDatabase = async () => {
  try {
    console.log('🚀 Initializing DeviceMaster MongoDB Database...\n');

    // Connect to MongoDB
    await connectDB();

    // Get database instance
    const db = mongoose.connection.db;
    
    console.log('📊 Creating collections and indexes...\n');

    // 1. Users Collection
    console.log('1. Setting up Users collection...');
    await User.createIndexes();
    console.log('   ✓ Users collection indexes created');

    // 2. Products Collection
    console.log('2. Setting up Products collection...');
    await Product.createIndexes();
    console.log('   ✓ Products collection indexes created');

    // 3. Orders Collection
    console.log('3. Setting up Orders collection...');
    await Order.createIndexes();
    console.log('   ✓ Orders collection indexes created');

    // 4. Articles Collection
    console.log('4. Setting up Articles collection...');
    await Article.createIndexes();
    console.log('   ✓ Articles collection indexes created');

    // 5. Categories Collection
    console.log('5. Setting up Categories collection...');
    await Category.createIndexes();
    console.log('   ✓ Categories collection indexes created');

    // Insert default categories if they don't exist
    console.log('\n6. Setting up default categories...');
    await Category.seedDefaults();
    console.log('   ✓ Default categories created');

    // Display collection information
    console.log('\n📋 Database initialization complete!\n');
    console.log('Created collections:');
    
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      const name = collection.name;
      const indexes = await db.collection(name).listIndexes().toArray();
      console.log(`- ${name} (${indexes.length} indexes)`);
    }

    console.log('\n✅ DeviceMaster MongoDB database is ready for use!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run initialization if this script is executed directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
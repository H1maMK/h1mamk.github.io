const mongoose = require('mongoose');
require('dotenv').config();

const checkDatabaseConnection = async () => {
  try {
    console.log('🔍 Checking MongoDB connection...\n');
    
    // Display connection info
    console.log('Connection details:');
    console.log(`- MongoDB URI: ${process.env.MONGODB_URI}`);
    console.log(`- Node Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('');

    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout for Atlas
    });

    console.log('✅ MongoDB connection successful!');
    console.log(`- Host: ${conn.connection.host}`);
    console.log(`- Port: ${conn.connection.port}`);
    console.log(`- Database: ${conn.connection.name}`);
    console.log(`- Ready State: ${conn.connection.readyState}`);
    console.log('');

    // Test database operations
    console.log('🧪 Testing database operations...\n');

    const db = conn.connection.db;
    
    // 1. Test ping
    const pingResult = await db.admin().ping();
    console.log('1. Ping test:', pingResult.ok === 1 ? '✅ Success' : '❌ Failed');

    // 2. List collections
    const collections = await db.listCollections().toArray();
    console.log(`2. Collections count: ${collections.length}`);
    
    if (collections.length > 0) {
      console.log('   Available collections:');
      collections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
    } else {
      console.log('   No collections found (database is empty)');
    }

    // 3. Test write operation
    const testCollection = db.collection('connection_test');
    const testDoc = {
      test: true,
      message: 'MongoDB connection test',
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'development'
    };

    const insertResult = await testCollection.insertOne(testDoc);
    console.log('3. Write test:', insertResult.acknowledged ? '✅ Success' : '❌ Failed');

    // 4. Test read operation
    const foundDoc = await testCollection.findOne({ test: true });
    console.log('4. Read test:', foundDoc ? '✅ Success' : '❌ Failed');

    // 5. Test update operation
    const updateResult = await testCollection.updateOne(
      { test: true },
      { $set: { updated: true, updatedAt: new Date() } }
    );
    console.log('5. Update test:', updateResult.modifiedCount > 0 ? '✅ Success' : '❌ Failed');

    // 6. Test delete operation
    const deleteResult = await testCollection.deleteOne({ test: true });
    console.log('6. Delete test:', deleteResult.deletedCount > 0 ? '✅ Success' : '❌ Failed');

    // Database stats
    console.log('\n📊 Database statistics:');
    const stats = await db.stats();
    console.log(`- Database size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`- Storage size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`- Collections: ${stats.collections}`);
    console.log(`- Objects: ${stats.objects}`);
    console.log(`- Indexes: ${stats.indexes}`);

    console.log('\n🎉 All database tests passed successfully!');
    console.log('MongoDB is ready for DeviceMaster application.');

  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error(`Error: ${error.message}`);
    
    if (error.name === 'MongoServerSelectionError') {
      console.error('\n💡 Possible solutions:');
      console.error('1. Make sure MongoDB is running');
      console.error('2. Check if the connection URI is correct');
      console.error('3. Verify network connectivity');
      console.error('4. Check if MongoDB is listening on the correct port');
    }
    
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run check if this script is executed directly
if (require.main === module) {
  checkDatabaseConnection();
}

module.exports = checkDatabaseConnection;
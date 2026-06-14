const dns = require('dns');
const mongoose = require('mongoose');

// На Windows Node.js может получать 127.0.0.1 как DNS-сервер (VPN/системные настройки),
// из-за чего mongodb+srv не резолвит SRV-записи. Принудительно используем публичные DNS.
const dnsServers = process.env.DNS_SERVERS
  ? process.env.DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean)
  : ['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4'];
dns.setServers(dnsServers);

// Устанавливаем короткий таймаут для буферизации операций
mongoose.set('bufferTimeoutMS', 3000); // 3 секунды вместо 10

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Таймаут подключения 5 секунд
      socketTimeoutMS: 45000, // Таймаут операций 45 секунд
      maxPoolSize: 10, // Максимум 10 подключений в пуле
      minPoolSize: 2, // Минимум 2 подключения всегда открыты
      maxIdleTimeMS: 10000, // Закрывать неактивные подключения через 10 сек
      compressors: 'zlib', // Сжатие данных для ускорения
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    
    // Set up connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Не убиваем процесс, просто выбрасываем ошибку
    throw error;
  }
};

module.exports = connectDB;
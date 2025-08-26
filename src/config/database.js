const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/casino-scores');

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Обработка ошибок подключения
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    
    // Если MongoDB недоступен, выводим предупреждение но не останавливаем приложение
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  MongoDB is not available. Some features may not work properly.');
      console.warn('💡 To install MongoDB:');
      console.warn('   1. Download from https://www.mongodb.com/try/download/community');
      console.warn('   2. Or use Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest');
      console.warn('   3. Or use MongoDB Atlas (cloud): https://www.mongodb.com/atlas');
    } else {
      throw error; // В продакшене останавливаем приложение если нет MongoDB
    }
  }
};

module.exports = connectDB;

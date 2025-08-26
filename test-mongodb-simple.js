require('dotenv').config({ path: './config.env' });
const mongoose = require('mongoose');

async function testMongoDBSimple() {
  console.log('🔍 Testing MongoDB connection (simple)...');
  console.log('MongoDB URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/casino-scores');
  
  try {
    // Подключаемся к MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/casino-scores', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 секунд таймаут
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Проверяем список коллекций
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('📋 Collections:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    if (error.name === 'MongoNetworkError') {
      console.log('\n💡 MongoDB is not running. Please:');
      console.log('   1. Install MongoDB: https://www.mongodb.com/try/download/community');
      console.log('   2. Or use Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest');
      console.log('   3. Or use MongoDB Atlas (cloud): https://www.mongodb.com/atlas');
    } else if (error.message.includes('authentication')) {
      console.log('\n💡 MongoDB requires authentication. Please:');
      console.log('   1. Check your MONGODB_URI in .env file');
      console.log('   2. Or use MongoDB without auth: mongod --noauth');
    }
  } finally {
    // Закрываем соединение
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed');
    }
  }
}

// Запускаем тест
testMongoDBSimple();

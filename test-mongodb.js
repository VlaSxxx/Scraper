require('dotenv').config({ path: './config.env' });
const mongoose = require('mongoose');
const CasinoScore = require('./src/models/CasinoScore');

async function testMongoDB() {
  console.log('🔍 Testing MongoDB connection...');
  
  try {
    // Подключаемся к MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/casino-scores');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Создаем тестовую запись
    const testGame = new CasinoScore({
      name: 'Test Crazy Time',
      url: 'https://test-casino.com/crazy-time',
      type: 'game show',
      description: 'Test game for MongoDB verification',
      stats: {
        multiplier: 100,
        rounds: 50
      },
      isLive: true,
      provider: 'evolution',
      score: 8.5,
      rating: 'Very Good',
      features: ['live', 'game show', 'wheel'],
      bonuses: ['welcome bonus'],
      paymentMethods: ['credit card', 'crypto'],
      licenses: ['MGA'],
      languages: ['English', 'Russian'],
      currencies: ['USD', 'EUR'],
      minDeposit: '$10',
      maxWithdrawal: '$5000',
      withdrawalTime: '24 hours',
      customerSupport: '24/7',
      mobileCompatible: true,
      liveChat: true,
      scrapedAt: new Date()
    });
    
    // Сохраняем тестовую запись
    const savedGame = await testGame.save();
    console.log('✅ Test record saved successfully:');
    console.log(`   ID: ${savedGame._id}`);
    console.log(`   Name: ${savedGame.name}`);
    console.log(`   Type: ${savedGame.type}`);
    console.log(`   Created at: ${savedGame.createdAt}`);
    
    // Проверяем, что запись действительно сохранена
    const foundGame = await CasinoScore.findById(savedGame._id);
    if (foundGame) {
      console.log('✅ Record found in database successfully');
    } else {
      console.log('❌ Record not found in database');
    }
    
    // Получаем общее количество записей
    const totalRecords = await CasinoScore.countDocuments();
    console.log(`📊 Total records in database: ${totalRecords}`);
    
    // Получаем последние 5 записей
    const recentRecords = await CasinoScore.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name type provider createdAt');
    
    console.log('📋 Recent records:');
    recentRecords.forEach((record, index) => {
      console.log(`   ${index + 1}. ${record.name} (${record.type}) - ${record.provider} - ${record.createdAt}`);
    });
    
    // Удаляем тестовую запись
    await CasinoScore.findByIdAndDelete(savedGame._id);
    console.log('🧹 Test record cleaned up');
    
  } catch (error) {
    console.error('❌ MongoDB test failed:', error.message);
    
    if (error.name === 'MongoNetworkError') {
      console.log('\n💡 MongoDB connection failed. Please check:');
      console.log('   1. Is MongoDB running?');
      console.log('   2. Is the connection string correct?');
      console.log('   3. Check your .env file for MONGODB_URI');
    }
  } finally {
    // Закрываем соединение
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Запускаем тест
testMongoDB();

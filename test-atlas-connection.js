require('dotenv').config({ path: './config.env' });
const { connectDB, getConnectionStats } = require('./src/config/database');

async function testAtlasConnection() {
  try {
    console.log('🌍 ТЕСТ ПОДКЛЮЧЕНИЯ К БАЗЕ ДАННЫХ');
    console.log('=' * 40);
    
    const currentUri = process.env.MONGODB_URI;
    console.log(`🔗 Строка подключения: ${currentUri.replace(/\/\/.*@/, '//***:***@')}`);
    
    if (currentUri.includes('localhost') || currentUri.includes('127.0.0.1')) {
      console.log('📍 Тип базы: ЛОКАЛЬНАЯ MongoDB');
    } else if (currentUri.includes('mongodb.net')) {
      console.log('☁️ Тип базы: ОБЛАЧНАЯ MongoDB Atlas');
    } else {
      console.log('❓ Неизвестный тип базы');
    }
    
    console.log('\n🔄 Попытка подключения...');
    
    const startTime = Date.now();
    await connectDB();
    const connectionTime = Date.now() - startTime;
    
    const stats = getConnectionStats();
    
    console.log('\n✅ ПОДКЛЮЧЕНИЕ УСПЕШНО!');
    console.log('-' * 30);
    console.log(`⏱️ Время подключения: ${connectionTime}ms`);
    console.log(`🏠 Хост: ${stats.host}`);
    console.log(`🔌 Порт: ${stats.port}`);
    console.log(`📊 База данных: ${stats.name}`);
    console.log(`🔗 Статус: ${stats.readyState === 1 ? 'Подключено' : 'Отключено'}`);
    
    // Проверим, есть ли данные
    const CasinoScore = require('./src/models/CasinoScore');
    const recordCount = await CasinoScore.countDocuments();
    console.log(`📋 Записей в базе: ${recordCount}`);
    
    if (recordCount > 0) {
      const latest = await CasinoScore.findOne().sort({ createdAt: -1 });
      console.log(`🕐 Последняя запись: ${new Date(latest.createdAt).toLocaleString()}`);
      console.log(`🎮 Игра: ${latest.name}`);
    }
    
    console.log('\n🎉 База данных готова к работе!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ОШИБКА ПОДКЛЮЧЕНИЯ!');
    console.error('-' * 30);
    console.error(`💥 Причина: ${error.message}`);
    
    if (error.message.includes('ENOTFOUND')) {
      console.error('🌐 Проверьте интернет соединение');
    } else if (error.message.includes('authentication')) {
      console.error('🔐 Проверьте логин и пароль в строке подключения');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('🔒 Локальная MongoDB не запущена');
      console.error('💡 Запустите: mongod или используйте Atlas');
    }
    
    console.error('\n🛠️ РЕШЕНИЯ:');
    console.error('1. Для Atlas: получите новую строку подключения');
    console.error('2. Для локальной: установите и запустите MongoDB');
    console.error('3. Проверьте файл config.env');
    
    process.exit(1);
  }
}

console.log('🧪 Запуск теста подключения к базе...\n');
testAtlasConnection();

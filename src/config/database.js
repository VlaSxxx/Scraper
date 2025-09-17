const mongoose = require('mongoose');

let isConnected = false;
let connectionPromise = null;

/**
 * Подключение к MongoDB с оптимизированными настройками
 * @returns {Promise<mongoose.Connection>} Объект подключения
 */
const connectDB = async () => {
  // Если уже подключены, возвращаем существующее подключение
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('MongoDB already connected, reusing connection');
    return mongoose;
  }

  // Если подключение уже в процессе, ждем его завершения
  if (connectionPromise) {
    console.log('MongoDB connection in progress, waiting...');
    return await connectionPromise;
  }

  // Создаем новое подключение
  connectionPromise = _connectDB();
  return await connectionPromise;
};

/**
 * Внутренняя функция подключения с оптимизированными настройками
 * @returns {Promise<mongoose.Connection>} Объект подключения
 */
const _connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/casino-scores', {
      // Оптимизированные настройки пула соединений
      maxPoolSize: 10, // Максимальное количество соединений в пуле
      minPoolSize: 2,  // Минимальное количество соединений в пуле
      
      // Настройки таймаутов
      serverSelectionTimeoutMS: 5000, // Таймаут выбора сервера
      socketTimeoutMS: 45000, // Таймаут сокета
      connectTimeoutMS: 10000, // Таймаут подключения
      
      // Настройки производительности
      bufferCommands: false, // Отключаем буферизацию команд
      
      // Настройки индексов
      autoIndex: process.env.NODE_ENV !== 'production', // Автоиндексы только в разработке
      
      // Настройки безопасности
      family: 4, // Принудительно использовать IPv4 для лучшей совместимости
      
      // Настройки мониторинга
      heartbeatFrequencyMS: 10000, // Частота проверки соединения
      
      // Настройки retry
      retryWrites: true,
      retryReads: true
    });

    isConnected = true;
    connectionPromise = null;
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔗 Ready State: ${conn.connection.readyState}`);
    
    // Обработка ошибок подключения
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
      isConnected = true;
    });

    mongoose.connection.on('connecting', () => {
      console.log('🔄 MongoDB connecting...');
    });

    // Graceful shutdown
    const gracefulShutdown = async () => {
      try {
        await mongoose.connection.close();
        console.log('🔒 MongoDB connection closed through app termination');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);

    return conn;

  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    connectionPromise = null;
    
    // Если MongoDB недоступен, выводим предупреждение но не останавливаем приложение
    console.warn('⚠️  MongoDB is not available. Running in fallback mode without database.');
    console.warn('📊 Scraping will work but data will not be saved.');
    
    if (process.env.NODE_ENV === 'development') {
      console.warn(' no MongoDB:');
    }
    
    // Не останавливаем приложение даже в продакшене - позволяем работать без БД
    return null;
  }
};

/**
 * Проверка состояния подключения
 * @returns {boolean} Статус подключения
 */
const isDBConnected = () => {
  return isConnected && mongoose.connection.readyState === 1;
};

/**
 * Получение текущего подключения
 * @returns {mongoose.Connection} Объект подключения
 */
const getConnection = () => {
  return mongoose.connection;
};

/**
 * Получение статистики подключения
 * @returns {Object} Статистика подключения
 */
const getConnectionStats = () => {
  const conn = mongoose.connection;
  return {
    readyState: conn.readyState,
    host: conn.host,
    port: conn.port,
    name: conn.name,
    isConnected: isConnected
  };
};

module.exports = {
  connectDB,
  isDBConnected,
  getConnection,
  getConnectionStats
};

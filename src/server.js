require('dotenv').config({ path: './config.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { connectDB, getConnectionStats } = require('./config/database');
const apiRoutes = require('./routes/api');
const errorHandler = require('./middleware/errorHandler');
const TaskScheduler = require('./tasks/scheduler');
const taskRoutes = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 3000;

// Инициализация планировщика задач
const taskScheduler = new TaskScheduler();

/**
 * Настройка rate limiting для защиты от DDoS
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Применяем rate limiting ко всем запросам
app.use(limiter);

/**
 * Настройка безопасности с Helmet
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

/**
 * Сжатие ответов для улучшения производительности
 */
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

/**
 * Настройка CORS
 */
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 часа
}));

/**
 * Парсинг JSON с ограничениями
 */
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ error: 'Invalid JSON' });
      throw new Error('Invalid JSON');
    }
  }
}));

/**
 * Парсинг URL-encoded данных
 */
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 1000
}));

/**
 * Middleware для логирования запросов с улучшенной информацией
 */
app.use((req, res, next) => {
  const start = Date.now();
  const { method, url, ip } = req;
  
  console.log(`📥 ${new Date().toISOString()} - ${method} ${url} from ${ip}`);
  
  // Логируем время выполнения запроса
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const statusEmoji = statusCode >= 400 ? '❌' : statusCode >= 300 ? '🔄' : '✅';
    
    console.log(`${statusEmoji} ${method} ${url} - ${statusCode} (${duration}ms)`);
  });
  
  next();
});

/**
 * Middleware для добавления заголовков безопасности
 */
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

/**
 * Health check endpoint с детальной информацией
 */
app.get('/health', async (req, res) => {
  try {
    // Проверяем БД только если она доступна
    let dbStats = { isConnected: false, readyState: 0, host: null, name: null };
    try {
      dbStats = getConnectionStats();
    } catch (dbError) {
      console.log('Database stats not available:', dbError.message);
    }
    
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: Math.floor(uptime),
        formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
      },
      database: {
        connected: dbStats.isConnected,
        readyState: dbStats.readyState,
        host: dbStats.host,
        name: dbStats.name,
        mode: dbStats.isConnected ? 'full' : 'fallback'
      },
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
      },
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * API маршруты с приоритетом
 */
app.use('/api', apiRoutes); // API эндпоинты
app.use('/api/tasks', taskRoutes); // Задачи


/**
 * Корневой маршрут с улучшенной документацией
 */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Casino Scores Scraper API',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      // Casino API
      'GET /api/casinos': 'Get all casinos with pagination and filtering',
      'GET /api/casinos/:id': 'Get specific casino by ID',
      'GET /api/casinos/search/:name': 'Search casinos by name',
      'GET /api/stats': 'Get statistics about casinos',
      'GET /api/top-casinos': 'Get top rated casinos',
      'GET /api/health': 'Check API health',
      
      // Task Management
      'GET /api/tasks': 'Get all scheduled tasks status',
      'POST /api/tasks': 'Create new scheduled task',
      'POST /api/tasks/run': 'Run task once',
      'DELETE /api/tasks/:name': 'Stop specific task',
      'DELETE /api/tasks': 'Stop all tasks',
      'GET /api/tasks/stats': 'Get tasks statistics',
      'GET /api/tasks/:name/executions': 'Get task execution history',
      'GET /api/tasks/scraping-stats': 'Get scraping statistics',
      'POST /api/tasks/cleanup': 'Cleanup old data',
      'GET /api/tasks/health': 'Check tasks system health'
    },
    documentation: 'Check the README.md file for detailed API documentation',
    support: {
      email: process.env.SUPPORT_EMAIL || 'support@example.com',
      github: 'https://github.com/your-repo/casino-scraper'
    }
  });
});

/**
 * Обработка 404 ошибок
 */
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} does not exist`,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /api/casinos',
      'GET /api/casinos/:id',
      'GET /api/casinos/search/:name',
      'GET /api/stats',
      'GET /api/top-casinos',
      'GET /api/health',
      'GET /api/tasks',
      'POST /api/tasks',
      'POST /api/tasks/run',
      'DELETE /api/tasks/:name',
      'DELETE /api/tasks',
      'GET /api/tasks/stats',
      'GET /api/tasks/:name/executions',
      'GET /api/tasks/scraping-stats',
      'POST /api/tasks/cleanup',
      'GET /api/tasks/health'
    ]
  });
});

/**
 * Обработка ошибок (должна быть последней)
 */
app.use(errorHandler);

/**
 * Инициализация сервера с улучшенной обработкой ошибок
 */
const startServer = async () => {
  try {
    // Пытаемся подключиться к базе данных (не критично для запуска)
    console.log('🔗 Attempting to connect to database...');
    try {
      await connectDB();
      console.log('✅ Database connected successfully');
    } catch (dbError) {
      console.warn('⚠️  Database connection failed, continuing without database...');
      console.warn('📊 API will work in read-only mode, scraping data will not be saved');
    }
    
    // Запускаем сервер
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 API available at http://localhost:${PORT}/api`);
      console.log(`🔍 Health check at http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      
      // Автоматически создаем задачу скрейпинга при старте сервера
      if (process.env.NODE_ENV !== 'test') {
        const schedule = process.env.SCRAPING_INTERVAL || '* * * * *'; // Каждую минуту
        taskScheduler.createScrapingJob(schedule, {
          name: 'casino-scraping',
          timezone: 'UTC',
          runOnInit: false
        });
        console.log(`⏰ Scheduled scraping job: ${schedule}`);
      }
    });

    // Обработка ошибок сервера
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
        process.exit(1);
      }
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      
      try {
        // Останавливаем планировщик задач
        taskScheduler.stopAllJobs();
        console.log('⏹️  All scheduled jobs stopped');
        
        // Закрываем сервер
        server.close(() => {
          console.log('🔒 Server closed');
          process.exit(0);
        });
        
        // Принудительно закрываем через 10 секунд
        setTimeout(() => {
          console.error('❌ Forced shutdown after timeout');
          process.exit(1);
        }, 10000);
        
      } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    // Обработка сигналов завершения
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Обработка необработанных ошибок
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Запускаем сервер
startServer();

module.exports = app;

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const connectDB = require('./config/database');
const apiRoutes = require('./routes/api');
const directApiRoutes = require('./routes/direct-api');
const errorHandler = require('./middleware/errorHandler');
const TaskScheduler = require('./tasks/scheduler');
const taskRoutes = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 3000;

// Подключаемся к базе данных
connectDB();

// Инициализируем планировщик задач
const taskScheduler = new TaskScheduler();

// Middleware
app.use(helmet()); // Безопасность
app.use(compression()); // Сжатие ответов
app.use(cors()); // CORS
app.use(express.json({ limit: '10mb' })); // Парсинг JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Парсинг URL-encoded

// Логирование запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// API маршруты
app.use('/api', directApiRoutes); // Новые расширенные эндпоинты (должны быть первыми)
app.use('/api', apiRoutes);
app.use('/api/tasks', taskRoutes);

// Корневой маршрут
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Casino Scores Scraper API',
    version: '1.0.0',
    endpoints: {
      // Базовые эндпоинты
      'GET /api/casinos': 'Get all casinos with pagination and filtering',
      'GET /api/casinos/:id': 'Get specific casino by ID',
      'GET /api/casinos/search/:name': 'Search casinos by name',
      'GET /api/stats': 'Get statistics about casinos',
      'GET /api/top-casinos': 'Get top rated casinos',
      'GET /api/health': 'Check API health',
      
      // Новые расширенные эндпоинты v1
      'GET /api/v1/casinos': 'Advanced casino list with comprehensive filtering',
      'GET /api/v1/casinos/:id': 'Get specific casino by ID (v1)',
      'GET /api/v1/casinos/search/advanced': 'Advanced search across multiple fields',
      'GET /api/v1/casinos/stats/comprehensive': 'Comprehensive casino statistics',
      'GET /api/v1/casinos/top/advanced': 'Advanced top casinos with filters',
      'GET /api/v1/tasks/executions': 'Task execution history with filtering',
      'GET /api/v1/tasks/stats/advanced': 'Advanced task statistics',
      'GET /api/v1/health/detailed': 'Detailed system health check',
      
      // Задачи
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
    documentation: 'Check the README.md file for detailed API documentation'
  });
});

// Обработка 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Обработка ошибок
app.use(errorHandler);

// Запуск сервера
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  console.log(`🔍 Health check at http://localhost:${PORT}/api/health`);
  
  // Автоматически создаем задачу скрейпинга при старте сервера
  if (process.env.NODE_ENV !== 'test') {
    const schedule = process.env.SCRAPING_INTERVAL || '* * * * *';
    taskScheduler.createScrapingJob(schedule, {
      name: 'casino-scraping',
      timezone: 'UTC',
      runOnInit: false
    });
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  taskScheduler.stopAllJobs();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  taskScheduler.stopAllJobs();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;

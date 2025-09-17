// Casino Services
const CasinoScoreService = require('./casino/CasinoScoreService');
const CasinoAnalyticsService = require('./casino/CasinoAnalyticsService');
const CasinoValidationService = require('./casino/CasinoValidationService');

// Task Services
const TaskExecutionService = require('./tasks/TaskExecutionService');
const TaskStatsService = require('./tasks/TaskStatsService');
const TaskCleanupService = require('./tasks/TaskCleanupService');

/**
 * Фабрика для создания экземпляров БИЗНЕС-сервисов
 * Обеспечивает единый интерфейс доступа к сервисам и управление зависимостями
 * 
 * ВНИМАНИЕ: Скрапинг-сервисы теперь находятся в отдельной папке src/scrapers/
 */
class ServiceFactory {
  constructor() {
    // Casino Services
    this._casinoScoreService = null;
    this._casinoAnalyticsService = null;
    this._casinoValidationService = null;
    
    // Task Services
    this._taskExecutionService = null;
    this._taskStatsService = null;
    this._taskCleanupService = null;
  }

  // Casino Services
  getCasinoScoreService() {
    if (!this._casinoScoreService) {
      this._casinoScoreService = new CasinoScoreService();
    }
    return this._casinoScoreService;
  }

  getCasinoAnalyticsService() {
    if (!this._casinoAnalyticsService) {
      this._casinoAnalyticsService = new CasinoAnalyticsService();
    }
    return this._casinoAnalyticsService;
  }

  getCasinoValidationService() {
    if (!this._casinoValidationService) {
      this._casinoValidationService = new CasinoValidationService();
    }
    return this._casinoValidationService;
  }

  // Task Services
  getTaskExecutionService() {
    if (!this._taskExecutionService) {
      this._taskExecutionService = new TaskExecutionService();
    }
    return this._taskExecutionService;
  }

  getTaskStatsService() {
    if (!this._taskStatsService) {
      this._taskStatsService = new TaskStatsService();
    }
    return this._taskStatsService;
  }

  getTaskCleanupService() {
    if (!this._taskCleanupService) {
      this._taskCleanupService = new TaskCleanupService();
    }
    return this._taskCleanupService;
  }

  // Метод для получения всех бизнес-сервисов
  getAllServices() {
    return {
      casino: {
        score: this.getCasinoScoreService(),
        analytics: this.getCasinoAnalyticsService(),
        validation: this.getCasinoValidationService()
      },
      tasks: {
        execution: this.getTaskExecutionService(),
        stats: this.getTaskStatsService(),
        cleanup: this.getTaskCleanupService()
      }
    };
  }
}

// Создаем единственный экземпляр фабрики (Singleton)
const serviceFactory = new ServiceFactory();

module.exports = {
  // Классы сервисов
  CasinoScoreService,
  CasinoAnalyticsService,
  CasinoValidationService,
  TaskExecutionService,
  TaskStatsService,
  TaskCleanupService,
  
  // Фабрика сервисов
  serviceFactory
};
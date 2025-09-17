/**
 * Конфигурация архитектурных слоев приложения
 * Определяет настройки и зависимости между слоями
 */

const { repositoryFactory } = require('../repositories');
const { serviceFactory } = require('../services');
const { controllerFactory } = require('../controllers');
const { dtoFactory } = require('../dto');

/**
 * Конфигурация слоев приложения
 */
class LayersConfig {
  constructor() {
    this.repositories = repositoryFactory;
    this.services = serviceFactory;
    this.controllers = controllerFactory;
    this.dto = dtoFactory;
    
    // Настройки слоев
    this.settings = {
      repositories: {
        caching: {
          enabled: process.env.REPOSITORY_CACHE_ENABLED === 'true',
          ttl: parseInt(process.env.REPOSITORY_CACHE_TTL) || 300 // 5 минут
        },
        logging: {
          enabled: process.env.REPOSITORY_LOGGING_ENABLED !== 'false',
          level: process.env.REPOSITORY_LOG_LEVEL || 'info'
        },
        retries: {
          enabled: process.env.REPOSITORY_RETRIES_ENABLED === 'true',
          attempts: parseInt(process.env.REPOSITORY_RETRY_ATTEMPTS) || 3,
          delay: parseInt(process.env.REPOSITORY_RETRY_DELAY) || 1000
        }
      },
      
      services: {
        validation: {
          strict: process.env.SERVICE_STRICT_VALIDATION === 'true',
          skipWarnings: process.env.SERVICE_SKIP_WARNINGS === 'true'
        },
        caching: {
          enabled: process.env.SERVICE_CACHE_ENABLED === 'true',
          ttl: parseInt(process.env.SERVICE_CACHE_TTL) || 600 // 10 минут
        },
        analytics: {
          enabled: process.env.ANALYTICS_ENABLED !== 'false',
          batchSize: parseInt(process.env.ANALYTICS_BATCH_SIZE) || 1000
        }
      },
      
      controllers: {
        pagination: {
          defaultLimit: parseInt(process.env.DEFAULT_PAGE_LIMIT) || 20,
          maxLimit: parseInt(process.env.MAX_PAGE_LIMIT) || 100
        },
        rateLimit: {
          enabled: process.env.RATE_LIMIT_ENABLED === 'true',
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 минут
          maxRequests: parseInt(process.env.RATE_LIMIT_MAX) || 100
        },
        cors: {
          enabled: process.env.CORS_ENABLED !== 'false',
          origins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*']
        }
      },
      
      dto: {
        formatting: {
          dates: process.env.DATE_FORMAT || 'iso',
          numbers: process.env.NUMBER_FORMAT || 'standard',
          locale: process.env.LOCALE || 'en-US'
        },
        validation: {
          strict: process.env.DTO_STRICT_VALIDATION === 'true',
          coerce: process.env.DTO_COERCE_TYPES === 'true'
        }
      }
    };
  }

  /**
   * Инициализация всех слоев
   * @returns {Promise<void>}
   */
  async initialize() {
    console.log('🚀 Initializing application layers...');
    
    try {
      // Инициализация репозиториев
      await this.initializeRepositories();
      
      // Инициализация сервисов
      await this.initializeServices();
      
      // Инициализация контроллеров
      await this.initializeControllers();
      
      // Инициализация DTO
      await this.initializeDto();
      
      console.log('✅ All layers initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize layers:', error);
      throw error;
    }
  }

  /**
   * Инициализация слоя репозиториев
   * @returns {Promise<void>}
   */
  async initializeRepositories() {
    console.log('📊 Initializing repositories...');
    
    // Настройка кеширования если включено
    if (this.settings.repositories.caching.enabled) {
      console.log('🗄️ Repository caching enabled');
      // Здесь можно добавить настройку Redis или другого кеша
    }
    
    // Настройка логирования
    if (this.settings.repositories.logging.enabled) {
      console.log('📝 Repository logging enabled');
      // Здесь можно настроить логирование запросов к БД
    }
    
    console.log('✅ Repositories initialized');
  }

  /**
   * Инициализация слоя сервисов
   * @returns {Promise<void>}
   */
  async initializeServices() {
    console.log('⚙️ Initializing services...');
    
    // Предварительное создание всех сервисов для проверки зависимостей
    const services = this.services.getAllServices();
    
    console.log('🎯 Available services:', Object.keys(services));
    
    // Настройка аналитики если включена
    if (this.settings.services.analytics.enabled) {
      console.log('📈 Analytics services enabled');
    }
    
    console.log('✅ Services initialized');
  }

  /**
   * Инициализация слоя контроллеров
   * @returns {Promise<void>}
   */
  async initializeControllers() {
    console.log('🎮 Initializing controllers...');
    
    // Предварительное создание контроллеров
    const controllers = this.controllers.getAllControllers();
    
    console.log('🎯 Available controllers:', Object.keys(controllers));
    
    // Настройка CORS если включено
    if (this.settings.controllers.cors.enabled) {
      console.log('🌐 CORS enabled for origins:', this.settings.controllers.cors.origins);
    }
    
    console.log('✅ Controllers initialized');
  }

  /**
   * Инициализация DTO слоя
   * @returns {Promise<void>}
   */
  async initializeDto() {
    console.log('📋 Initializing DTOs...');
    
    // Настройка форматирования
    console.log('🌍 Locale settings:', {
      dates: this.settings.dto.formatting.dates,
      numbers: this.settings.dto.formatting.numbers,
      locale: this.settings.dto.formatting.locale
    });
    
    console.log('✅ DTOs initialized');
  }

  /**
   * Получение конфигурации для конкретного слоя
   * @param {String} layer - Название слоя
   * @returns {Object} Конфигурация слоя
   */
  getLayerConfig(layer) {
    return this.settings[layer] || {};
  }

  /**
   * Обновление конфигурации слоя
   * @param {String} layer - Название слоя
   * @param {Object} config - Новая конфигурация
   */
  updateLayerConfig(layer, config) {
    if (this.settings[layer]) {
      this.settings[layer] = { ...this.settings[layer], ...config };
    }
  }

  /**
   * Получение информации о зависимостях между слоями
   * @returns {Object} Карта зависимостей
   */
  getDependencyMap() {
    return {
      controllers: ['services', 'dto'],
      services: ['repositories', 'dto'],
      repositories: ['models'],
      dto: ['utils'],
      models: ['mongoose']
    };
  }

  /**
   * Проверка корректности архитектуры
   * @returns {Object} Результат проверки
   */
  validateArchitecture() {
    const issues = [];
    const warnings = [];
    
    try {
      // Проверка доступности репозиториев
      const casinoRepo = this.repositories.getCasinoScoreRepository();
      const taskRepo = this.repositories.getTaskExecutionRepository();
      
      if (!casinoRepo || !taskRepo) {
        issues.push('Some repositories are not available');
      }
      
      // Проверка доступности сервисов
      const services = this.services.getAllServices();
      if (!services.casino || !services.tasks) {
        issues.push('Some services are not available');
      }
      
      // Проверка контроллеров
      const controllers = this.controllers.getAllControllers();
      if (!controllers.casino || !controllers.task) {
        issues.push('Some controllers are not available');
      }
      
      // Предупреждения о конфигурации
      if (!this.settings.repositories.caching.enabled) {
        warnings.push('Repository caching is disabled - consider enabling for better performance');
      }
      
      if (!this.settings.controllers.rateLimit.enabled) {
        warnings.push('Rate limiting is disabled - consider enabling for production');
      }
      
    } catch (error) {
      issues.push(`Architecture validation failed: ${error.message}`);
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      warnings
    };
  }

  /**
   * Получение метрик использования слоев
   * @returns {Object} Метрики
   */
  getLayerMetrics() {
    return {
      repositories: {
        casino: this.repositories.getCasinoScoreRepository() ? 'active' : 'inactive',
        task: this.repositories.getTaskExecutionRepository() ? 'active' : 'inactive'
      },
      services: {
        casino: Object.keys(this.services.getAllServices().casino).length,
        tasks: Object.keys(this.services.getAllServices().tasks).length
      },
      controllers: {
        count: Object.keys(this.controllers.getAllControllers()).length
      },
      dto: {
        factory: this.dto ? 'active' : 'inactive'
      }
    };
  }

  /**
   * Экспорт конфигурации для внешнего использования
   * @returns {Object} Экспортируемая конфигурация
   */
  exportConfig() {
    return {
      layers: {
        repositories: this.repositories,
        services: this.services,
        controllers: this.controllers,
        dto: this.dto
      },
      settings: this.settings,
      dependencies: this.getDependencyMap(),
      metrics: this.getLayerMetrics()
    };
  }
}

// Создаем единственный экземпляр конфигурации
const layersConfig = new LayersConfig();

module.exports = {
  LayersConfig,
  layersConfig
};

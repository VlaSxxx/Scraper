const mongoose = require('mongoose');

/**
 * Схема для данных казино с оптимизированными настройками
 */
const casinoScoreSchema = new mongoose.Schema({
  // Основные поля
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters'],
    index: true
  },
  url: {
    type: String,
    required: [true, 'URL is required'],
    trim: true,
    maxlength: [500, 'URL cannot exceed 500 characters'],
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'URL must be a valid HTTP/HTTPS URL'
    }
  },
  
  // Поля для игр
  type: {
    type: String,
    enum: {
      values: ['roulette', 'blackjack', 'baccarat', 'poker', 'slots', 'craps', 'dice', 'wheel', 'game show', 'live', 'stream', 'unknown'],
      message: 'Type must be one of the allowed values'
    },
    default: 'unknown',
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  stats: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isLive: {
    type: Boolean,
    default: false,
    index: true
  },
  provider: {
    type: String,
    trim: true,
    maxlength: [100, 'Provider name cannot exceed 100 characters'],
    index: true
  },
  
  // Рейтинги и оценки
  score: {
    type: Number,
    min: [0, 'Score cannot be negative'],
    max: [10, 'Score cannot exceed 10'],
    validate: {
      validator: function(v) {
        return v === null || (v >= 0 && v <= 10);
      },
      message: 'Score must be between 0 and 10'
    }
  },
  rating: {
    type: String,
    enum: {
      values: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'],
      message: 'Rating must be one of the allowed values'
    },
    default: null, // Разрешаем пустое значение
    required: false,
    index: true
  },
  
  // Особенности и функции
  features: [{
    type: String,
    trim: true,
    maxlength: [50, 'Feature name cannot exceed 50 characters']
  }],
  bonuses: [{
    type: String,
    trim: true,
    maxlength: [200, 'Bonus description cannot exceed 200 characters']
  }],
  
  // Платежные методы
  paymentMethods: [{
    type: String,
    trim: true,
    maxlength: [50, 'Payment method name cannot exceed 50 characters']
  }],
  licenses: [{
    type: String,
    trim: true,
    maxlength: [100, 'License name cannot exceed 100 characters']
  }],
  
  // Локализация
  languages: [{
    type: String,
    trim: true,
    maxlength: [20, 'Language code cannot exceed 20 characters']
  }],
  currencies: [{
    type: String,
    trim: true,
    maxlength: [10, 'Currency code cannot exceed 10 characters']
  }],
  
  // Финансовые лимиты
  minDeposit: {
    type: String,
    trim: true,
    maxlength: [50, 'Min deposit cannot exceed 50 characters']
  },
  maxWithdrawal: {
    type: String,
    trim: true,
    maxlength: [50, 'Max withdrawal cannot exceed 50 characters']
  },
  withdrawalTime: {
    type: String,
    trim: true,
    maxlength: [100, 'Withdrawal time cannot exceed 100 characters']
  },
  
  // Поддержка
  customerSupport: {
    type: String,
    trim: true,
    maxlength: [200, 'Customer support info cannot exceed 200 characters']
  },
  mobileCompatible: {
    type: Boolean,
    default: false,
    index: true
  },
  liveChat: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Метаданные
  lastUpdated: {
    type: Date,
    default: Date.now,
    index: true
  },
  scrapedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true, // Добавляет createdAt и updatedAt
  toJSON: { virtuals: true }, // Включает виртуальные поля в JSON
  toObject: { virtuals: true }
});

// Составные индексы для оптимизации запросов
casinoScoreSchema.index({ score: -1, rating: 1 });
casinoScoreSchema.index({ type: 1, isLive: 1 });
casinoScoreSchema.index({ provider: 1, type: 1 });
casinoScoreSchema.index({ scrapedAt: -1, type: 1 });
casinoScoreSchema.index({ name: 'text', description: 'text' }); // Текстовый поиск

// Виртуальные поля для вычисляемых значений
casinoScoreSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.scrapedAt) / (1000 * 60 * 60 * 24));
});

casinoScoreSchema.virtual('isRecentlyUpdated').get(function() {
  return this.ageInDays <= 7;
});

// Middleware для автоматического обновления lastUpdated
casinoScoreSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

casinoScoreSchema.pre('findOneAndUpdate', function(next) {
  this.set({ lastUpdated: new Date() });
  next();
});

// Статические методы перенесены в CasinoScoreRepository

// Методы экземпляра перенесены в CasinoScoreService

// Базовые валидации схемы оставлены в модели для работы Mongoose
// Сложная валидация бизнес-правил перенесена в CasinoValidationService

// Простые валидации длины массивов (уровень схемы)
casinoScoreSchema.path('features').validate(function(features) {
  return !features || features.length <= 20;
}, 'Cannot have more than 20 features');

casinoScoreSchema.path('paymentMethods').validate(function(methods) {
  return !methods || methods.length <= 50;
}, 'Cannot have more than 50 payment methods');

// Базовая обработка ошибок схемы
casinoScoreSchema.post('save', function(error, doc, next) {
  if (error.name === 'ValidationError') {
    console.error('Schema validation errors:', Object.keys(error.errors));
  }
  next();
});

// Экспорт модели
module.exports = mongoose.model('CasinoScore', casinoScoreSchema);

/**
 * Константы приложения
 * Содержит все константы, используемые в приложении
 */

// Статусы задач
const TASK_STATUSES = {
  RUNNING: 'running',
  SUCCESS: 'success',
  ERROR: 'error',
  CANCELLED: 'cancelled'
};

// Рейтинги казино
const CASINO_RATINGS = {
  EXCELLENT: 'Excellent',
  VERY_GOOD: 'Very Good',
  GOOD: 'Good',
  FAIR: 'Fair',
  POOR: 'Poor'
};

// Типы игр казино
const GAME_TYPES = {
  ROULETTE: 'roulette',
  BLACKJACK: 'blackjack',
  BACCARAT: 'baccarat',
  POKER: 'poker',
  SLOTS: 'slots',
  CRAPS: 'craps',
  DICE: 'dice',
  WHEEL: 'wheel',
  GAME_SHOW: 'game show',
  LIVE: 'live',
  STREAM: 'stream',
  UNKNOWN: 'unknown'
};

// Лимиты для полей
const FIELD_LIMITS = {
  CASINO_NAME_MAX_LENGTH: 200,
  CASINO_URL_MAX_LENGTH: 500,
  CASINO_DESCRIPTION_MAX_LENGTH: 2000,
  CASINO_PROVIDER_MAX_LENGTH: 100,
  CASINO_FEATURE_MAX_LENGTH: 50,
  CASINO_PAYMENT_METHOD_MAX_LENGTH: 50,
  CASINO_LANGUAGE_MAX_LENGTH: 20,
  CASINO_CURRENCY_MAX_LENGTH: 10,
  CASINO_FINANCIAL_LIMIT_MAX_LENGTH: 50,
  CASINO_CUSTOMER_SUPPORT_MAX_LENGTH: 200,
  CASINO_BONUS_MAX_LENGTH: 200,
  CASINO_LICENSE_MAX_LENGTH: 100,
  
  TASK_NAME_MAX_LENGTH: 100,
  TASK_ERROR_MESSAGE_MAX_LENGTH: 1000,
  TASK_ERROR_CODE_MAX_LENGTH: 50,
  TASK_METADATA_MAX_SIZE: 10000, // в байтах
  
  MAX_CASINO_FEATURES: 20,
  MAX_CASINO_PAYMENT_METHODS: 50,
  MAX_CASINO_LANGUAGES: 10,
  MAX_CASINO_CURRENCIES: 10,
  MAX_CASINO_BONUSES: 10,
  MAX_CASINO_LICENSES: 5
};

// Диапазоны оценок
const SCORE_RANGES = {
  MIN_SCORE: 0,
  MAX_SCORE: 10,
  EXCELLENT_MIN: 9,
  VERY_GOOD_MIN: 7.5,
  GOOD_MIN: 6,
  FAIR_MIN: 4,
  POOR_MAX: 4
};

// Коды ошибок
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  TASK_TIMEOUT: 'TASK_TIMEOUT',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  AUTHORIZATION_FAILED: 'AUTHORIZATION_FAILED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  SYSTEM_ERROR: 'SYSTEM_ERROR'
};

// HTTP статус коды
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
};

// Временные константы
const TIME_CONSTANTS = {
  MILLISECONDS_IN_SECOND: 1000,
  SECONDS_IN_MINUTE: 60,
  MINUTES_IN_HOUR: 60,
  HOURS_IN_DAY: 24,
  DAYS_IN_WEEK: 7,
  DAYS_IN_MONTH: 30,
  DAYS_IN_YEAR: 365,
  
  MILLISECONDS_IN_MINUTE: 60 * 1000,
  MILLISECONDS_IN_HOUR: 60 * 60 * 1000,
  MILLISECONDS_IN_DAY: 24 * 60 * 60 * 1000,
  MILLISECONDS_IN_WEEK: 7 * 24 * 60 * 60 * 1000,
  MILLISECONDS_IN_MONTH: 30 * 24 * 60 * 60 * 1000,
  MILLISECONDS_IN_YEAR: 365 * 24 * 60 * 60 * 1000
};

// Настройки пагинации
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1
};

// Настройки очистки данных
const CLEANUP_SETTINGS = {
  DEFAULT_RETENTION_DAYS: 30,
  MAX_RETENTION_DAYS: 365,
  MIN_RETENTION_DAYS: 1,
  DEFAULT_STUCK_TASK_TIMEOUT_MINUTES: 120,
  DEFAULT_CLEANUP_BATCH_SIZE: 1000,
  DEFAULT_ARCHIVE_DAYS: 90
};

// Настройки аналитики
const ANALYTICS_SETTINGS = {
  DEFAULT_ANALYSIS_DAYS: 7,
  MAX_ANALYSIS_DAYS: 365,
  MIN_ANALYSIS_DAYS: 1,
  DEFAULT_TREND_DAYS: 30,
  MAX_COMPARISON_ITEMS: 10,
  MIN_COMPARISON_ITEMS: 2
};

// Настройки производительности
const PERFORMANCE_SETTINGS = {
  LONG_RUNNING_TASK_THRESHOLD_MINUTES: 60,
  VERY_LONG_TASK_THRESHOLD_MINUTES: 240,
  HIGH_ERROR_RATE_THRESHOLD: 20, // процентов
  LOW_SUCCESS_RATE_THRESHOLD: 80, // процентов
  DEFAULT_TIMEOUT_MINUTES: 30,
  MAX_CONCURRENT_TASKS: 10
};

// Цвета для оценок
const SCORE_COLORS = {
  EXCELLENT: '#4CAF50',
  VERY_GOOD: '#8BC34A',
  GOOD: '#2196F3',
  FAIR: '#FF9800',
  POOR: '#F44336',
  UNRATED: '#999999',
  INVALID: '#FF0000'
};

// CSS классы для оценок
const SCORE_CSS_CLASSES = {
  EXCELLENT: 'score-excellent',
  VERY_GOOD: 'score-very-good',
  GOOD: 'score-good',
  FAIR: 'score-fair',
  POOR: 'score-poor',
  UNRATED: 'score-unrated',
  INVALID: 'score-invalid'
};

// Приоритеты рекомендаций
const RECOMMENDATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Типы рекомендаций
const RECOMMENDATION_TYPES = {
  CLEANUP: 'cleanup',
  PERFORMANCE: 'performance',
  DATA_QUALITY: 'data_quality',
  SECURITY: 'security',
  OPTIMIZATION: 'optimization'
};

// Поддерживаемые форматы экспорта
const EXPORT_FORMATS = {
  JSON: 'json',
  CSV: 'csv',
  XML: 'xml',
  EXCEL: 'xlsx'
};

// Поддерживаемые временные зоны
const SUPPORTED_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Seoul',
  'Australia/Sydney',
  'Pacific/Auckland'
];

// Поддерживаемые языки
const SUPPORTED_LANGUAGES = [
  'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'
];

// Поддерживаемые валюты
const SUPPORTED_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'KRW', 'AUD', 'CAD', 'CHF', 'SEK',
  'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RUB', 'BRL', 'MXN', 'INR', 'SGD'
];

// Популярные платежные методы
const COMMON_PAYMENT_METHODS = [
  'Credit Card',
  'Debit Card',
  'PayPal',
  'Skrill',
  'Neteller',
  'Bank Transfer',
  'Bitcoin',
  'Ethereum',
  'Litecoin',
  'Apple Pay',
  'Google Pay',
  'Paysafecard',
  'ecoPayz',
  'Trustly',
  'iDEAL',
  'Sofort',
  'Giropay',
  'Interac',
  'WebMoney',
  'Yandex.Money'
];

// Популярные функции казино
const COMMON_CASINO_FEATURES = [
  'Live Chat',
  'Mobile Compatible',
  'No Deposit Bonus',
  'Welcome Bonus',
  'Free Spins',
  'VIP Program',
  'Fast Withdrawals',
  '24/7 Support',
  'Multi-language',
  'Cryptocurrency',
  'Live Dealer',
  'Sports Betting',
  'Progressive Jackpots',
  'Responsible Gaming',
  'SSL Encryption',
  'Licensed',
  'Fair Play',
  'Random Number Generator',
  'Game History',
  'Demo Mode'
];

// Регулярные выражения для валидации
const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  TASK_NAME: /^[a-zA-Z0-9_-]+$/,
  CURRENCY_CODE: /^[A-Z]{3}$/,
  LANGUAGE_CODE: /^[a-z]{2}$/,
  COLOR_HEX: /^#[0-9A-Fa-f]{6}$/,
  IP_ADDRESS: /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  VERSION: /^\d+\.\d+\.\d+$/
};

// Настройки логирования
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
  TRACE: 'trace'
};

// Настройки кэширования
const CACHE_SETTINGS = {
  DEFAULT_TTL: 300, // 5 минут в секундах
  SHORT_TTL: 60,    // 1 минута
  MEDIUM_TTL: 900,  // 15 минут
  LONG_TTL: 3600,   // 1 час
  VERY_LONG_TTL: 86400 // 1 день
};

// Настройки безопасности
const SECURITY_SETTINGS = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  SESSION_DURATION_HOURS: 24,
  TOKEN_EXPIRY_HOURS: 1
};

module.exports = {
  TASK_STATUSES,
  CASINO_RATINGS,
  GAME_TYPES,
  FIELD_LIMITS,
  SCORE_RANGES,
  ERROR_CODES,
  HTTP_STATUS,
  TIME_CONSTANTS,
  PAGINATION,
  CLEANUP_SETTINGS,
  ANALYTICS_SETTINGS,
  PERFORMANCE_SETTINGS,
  SCORE_COLORS,
  SCORE_CSS_CLASSES,
  RECOMMENDATION_PRIORITIES,
  RECOMMENDATION_TYPES,
  EXPORT_FORMATS,
  SUPPORTED_TIMEZONES,
  SUPPORTED_LANGUAGES,
  SUPPORTED_CURRENCIES,
  COMMON_PAYMENT_METHODS,
  COMMON_CASINO_FEATURES,
  VALIDATION_PATTERNS,
  LOG_LEVELS,
  CACHE_SETTINGS,
  SECURITY_SETTINGS
};

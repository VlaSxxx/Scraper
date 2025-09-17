// Validators
const casinoValidators = require('./validators/casinoValidators');
const taskValidators = require('./validators/taskValidators');

// Formatters
const dateFormatters = require('./formatters/dateFormatters');
const scoreFormatters = require('./formatters/scoreFormatters');

// Calculations
const calculations = require('./calculations');

// Constants
const constants = require('./constants');

/**
 * Утилиты приложения
 * Централизованный экспорт всех утилитарных функций
 */

module.exports = {
  // Validators
  validators: {
    casino: casinoValidators,
    task: taskValidators
  },

  // Formatters
  formatters: {
    date: dateFormatters,
    score: scoreFormatters
  },

  // Calculations
  calculations,

  // Constants
  constants,

  // Быстрый доступ к часто используемым функциям
  
  // Validation helpers
  validateUrl: casinoValidators.validateUrl,
  validateScore: casinoValidators.validateScore,
  validateTaskName: taskValidators.validateTaskName,
  validateTaskStatus: taskValidators.validateTaskStatus,

  // Formatting helpers
  formatDuration: dateFormatters.formatDuration,
  formatToRelative: dateFormatters.formatToRelative,
  formatScoreDisplay: scoreFormatters.formatScoreDisplay,
  formatScoreToRating: scoreFormatters.formatScoreToRating,

  // Calculation helpers
  calculatePercentage: calculations.calculatePercentage,
  calculateAverage: calculations.calculateAverage,
  calculateSuccessRate: calculations.calculateSuccessRate,

  // Constants shortcuts
  TASK_STATUSES: constants.TASK_STATUSES,
  CASINO_RATINGS: constants.CASINO_RATINGS,
  GAME_TYPES: constants.GAME_TYPES,
  HTTP_STATUS: constants.HTTP_STATUS,
  ERROR_CODES: constants.ERROR_CODES
};


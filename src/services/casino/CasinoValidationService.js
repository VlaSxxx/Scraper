const { repositoryFactory } = require('../../repositories');

/**
 * Сервис для валидации бизнес-правил казино
 * Содержит логику проверки и валидации данных казино
 */
class CasinoValidationService {
  constructor() {
    this.repository = repositoryFactory.getCasinoScoreRepository();
  }

  /**
   * Валидация данных казино перед созданием/обновлением
   * @param {Object} casinoData - Данные казино для валидации
   * @param {String} casinoId - ID казино (для обновления)
   * @returns {Promise<Object>} Результат валидации
   */
  async validateCasinoData(casinoData, casinoId = null) {
    const errors = [];
    const warnings = [];

    try {
      // Базовые валидации
      this.validateBasicFields(casinoData, errors);
      
      // Проверка уникальности URL
      await this.validateUrlUniqueness(casinoData.url, casinoId, errors);
      
      // Валидация рейтинга и оценки
      this.validateScoreAndRating(casinoData, errors, warnings);
      
      // Валидация массивов
      this.validateArrayFields(casinoData, errors, warnings);
      
      // Валидация бизнес-логики
      this.validateBusinessRules(casinoData, warnings);
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation error: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Валидация базовых полей
   * @param {Object} data - Данные для валидации
   * @param {Array} errors - Массив ошибок
   */
  validateBasicFields(data, errors) {
    // Проверка обязательных полей
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Name is required and must be a non-empty string');
    }

    if (!data.url || typeof data.url !== 'string' || data.url.trim().length === 0) {
      errors.push('URL is required and must be a non-empty string');
    }

    // Валидация URL формата
    if (data.url && !this.isValidUrl(data.url)) {
      errors.push('URL must be a valid HTTP/HTTPS URL');
    }

    // Валидация длины полей
    if (data.name && data.name.length > 200) {
      errors.push('Name cannot exceed 200 characters');
    }

    if (data.url && data.url.length > 500) {
      errors.push('URL cannot exceed 500 characters');
    }

    if (data.description && data.description.length > 2000) {
      errors.push('Description cannot exceed 2000 characters');
    }

    if (data.provider && data.provider.length > 100) {
      errors.push('Provider name cannot exceed 100 characters');
    }
  }

  /**
   * Проверка уникальности URL
   * @param {String} url - URL для проверки
   * @param {String} casinoId - ID текущего казино (для исключения при обновлении)
   * @param {Array} errors - Массив ошибок
   */
  async validateUrlUniqueness(url, casinoId, errors) {
    if (!url) return;

    const filter = { url };
    if (casinoId) {
      filter._id = { $ne: casinoId };
    }

    const existingCasino = await this.repository.findOne(filter);
    if (existingCasino) {
      errors.push(`Casino with URL "${url}" already exists`);
    }
  }

  /**
   * Валидация оценки и рейтинга
   * @param {Object} data - Данные для валидации
   * @param {Array} errors - Массив ошибок
   * @param {Array} warnings - Массив предупреждений
   */
  validateScoreAndRating(data, errors, warnings) {
    // Валидация оценки
    if (data.score !== undefined && data.score !== null) {
      if (typeof data.score !== 'number') {
        errors.push('Score must be a number');
      } else if (data.score < 0 || data.score > 10) {
        errors.push('Score must be between 0 and 10');
      }
    }

    // Валидация рейтинга
    const validRatings = ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'];
    if (data.rating && !validRatings.includes(data.rating)) {
      errors.push(`Rating must be one of: ${validRatings.join(', ')}`);
    }

    // Проверка соответствия оценки и рейтинга
    if (data.score && data.rating) {
      const expectedRating = this.calculateExpectedRating(data.score);
      if (expectedRating !== data.rating) {
        warnings.push(`Rating "${data.rating}" doesn't match score ${data.score}. Expected: "${expectedRating}"`);
      }
    }

    // Валидация типа игры
    const validTypes = [
      'roulette', 'blackjack', 'baccarat', 'poker', 'slots', 
      'craps', 'dice', 'wheel', 'game show', 'live', 'stream', 'unknown'
    ];
    if (data.type && !validTypes.includes(data.type)) {
      errors.push(`Type must be one of: ${validTypes.join(', ')}`);
    }
  }

  /**
   * Валидация массивов
   * @param {Object} data - Данные для валидации
   * @param {Array} errors - Массив ошибок
   * @param {Array} warnings - Массив предупреждений
   */
  validateArrayFields(data, errors, warnings) {
    // Валидация функций
    if (data.features) {
      if (!Array.isArray(data.features)) {
        errors.push('Features must be an array');
      } else {
        if (data.features.length > 20) {
          errors.push('Cannot have more than 20 features');
        }

        data.features.forEach((feature, index) => {
          if (typeof feature !== 'string' || feature.length > 50) {
            errors.push(`Feature at index ${index} must be a string with max 50 characters`);
          }
        });

        // Проверка дубликатов
        const uniqueFeatures = [...new Set(data.features)];
        if (uniqueFeatures.length !== data.features.length) {
          warnings.push('Duplicate features detected');
        }
      }
    }

    // Валидация платежных методов
    if (data.paymentMethods) {
      if (!Array.isArray(data.paymentMethods)) {
        errors.push('Payment methods must be an array');
      } else {
        if (data.paymentMethods.length > 50) {
          errors.push('Cannot have more than 50 payment methods');
        }

        data.paymentMethods.forEach((method, index) => {
          if (typeof method !== 'string' || method.length > 50) {
            errors.push(`Payment method at index ${index} must be a string with max 50 characters`);
          }
        });
      }
    }

    // Валидация языков
    if (data.languages && Array.isArray(data.languages)) {
      data.languages.forEach((lang, index) => {
        if (typeof lang !== 'string' || lang.length > 20) {
          errors.push(`Language at index ${index} must be a string with max 20 characters`);
        }
      });
    }

    // Валидация валют
    if (data.currencies && Array.isArray(data.currencies)) {
      data.currencies.forEach((currency, index) => {
        if (typeof currency !== 'string' || currency.length > 10) {
          errors.push(`Currency at index ${index} must be a string with max 10 characters`);
        }
      });
    }
  }

  /**
   * Валидация бизнес-правил
   * @param {Object} data - Данные для валидации
   * @param {Array} warnings - Массив предупреждений
   */
  validateBusinessRules(data, warnings) {
    // Проверка живых игр
    if (data.isLive && (!data.provider || data.provider.trim().length === 0)) {
      warnings.push('Live games should have a provider specified');
    }

    // Проверка мобильной совместимости для живых игр
    if (data.isLive && !data.mobileCompatible) {
      warnings.push('Live games are recommended to be mobile compatible');
    }

    // Проверка живого чата для высокорейтинговых казино
    if (data.score >= 8 && !data.liveChat) {
      warnings.push('High-rated casinos should have live chat support');
    }

    // Проверка описания для качественных казино
    if (data.score >= 7 && (!data.description || data.description.trim().length < 50)) {
      warnings.push('High-quality casinos should have detailed descriptions');
    }

    // Проверка функций
    if (data.score >= 8 && (!data.features || data.features.length < 3)) {
      warnings.push('High-rated casinos should have at least 3 features listed');
    }

    // Проверка платежных методов
    if (data.score >= 7 && (!data.paymentMethods || data.paymentMethods.length < 2)) {
      warnings.push('Quality casinos should support multiple payment methods');
    }
  }

  /**
   * Проверка валидности URL
   * @param {String} url - URL для проверки
   * @returns {Boolean} Является ли URL валидным
   */
  isValidUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Расчет ожидаемого рейтинга на основе оценки
   * @param {Number} score - Числовая оценка
   * @returns {String} Ожидаемый рейтинг
   */
  calculateExpectedRating(score) {
    if (score >= 9) return 'Excellent';
    if (score >= 7.5) return 'Very Good';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Poor';
  }

  /**
   * Валидация данных для массового импорта
   * @param {Array} casinosData - Массив данных казино
   * @returns {Promise<Object>} Результат валидации массива
   */
  async validateBulkData(casinosData) {
    if (!Array.isArray(casinosData)) {
      return {
        isValid: false,
        errors: ['Data must be an array'],
        validItems: [],
        invalidItems: []
      };
    }

    const validItems = [];
    const invalidItems = [];
    const allErrors = [];

    for (let i = 0; i < casinosData.length; i++) {
      const validation = await this.validateCasinoData(casinosData[i]);
      
      if (validation.isValid) {
        validItems.push({
          index: i,
          data: casinosData[i],
          warnings: validation.warnings
        });
      } else {
        invalidItems.push({
          index: i,
          data: casinosData[i],
          errors: validation.errors,
          warnings: validation.warnings
        });
        allErrors.push(...validation.errors.map(error => `Item ${i}: ${error}`));
      }
    }

    return {
      isValid: invalidItems.length === 0,
      errors: allErrors,
      validItems,
      invalidItems,
      summary: {
        total: casinosData.length,
        valid: validItems.length,
        invalid: invalidItems.length
      }
    };
  }
}

module.exports = CasinoValidationService;


/**
 * Валидаторы для данных казино
 * Содержит функции для валидации различных полей казино
 */

/**
 * Валидация URL
 * @param {String} url - URL для валидации
 * @returns {Object} Результат валидации
 */
function validateUrl(url) {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required and must be a string' };
  }

  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return { isValid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

/**
 * Валидация оценки казино
 * @param {Number} score - Оценка для валидации
 * @returns {Object} Результат валидации
 */
function validateScore(score) {
  if (score === null || score === undefined) {
    return { isValid: true }; // Оценка может быть пустой
  }

  if (typeof score !== 'number') {
    return { isValid: false, error: 'Score must be a number' };
  }

  if (score < 0 || score > 10) {
    return { isValid: false, error: 'Score must be between 0 and 10' };
  }

  return { isValid: true };
}

/**
 * Валидация рейтинга казино
 * @param {String} rating - Рейтинг для валидации
 * @returns {Object} Результат валидации
 */
function validateRating(rating) {
  if (!rating) {
    return { isValid: true }; // Рейтинг может быть пустым
  }

  const validRatings = ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'];
  
  if (!validRatings.includes(rating)) {
    return { 
      isValid: false, 
      error: `Rating must be one of: ${validRatings.join(', ')}` 
    };
  }

  return { isValid: true };
}

/**
 * Валидация типа игры
 * @param {String} type - Тип игры для валидации
 * @returns {Object} Результат валидации
 */
function validateGameType(type) {
  if (!type) {
    return { isValid: true }; // Тип может быть пустым (будет unknown по умолчанию)
  }

  const validTypes = [
    'roulette', 'blackjack', 'baccarat', 'poker', 'slots', 
    'craps', 'dice', 'wheel', 'game show', 'live', 'stream', 'unknown'
  ];

  if (!validTypes.includes(type)) {
    return { 
      isValid: false, 
      error: `Type must be one of: ${validTypes.join(', ')}` 
    };
  }

  return { isValid: true };
}

/**
 * Валидация названия казино
 * @param {String} name - Название для валидации
 * @returns {Object} Результат валидации
 */
function validateName(name) {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Name is required and must be a string' };
  }

  const trimmedName = name.trim();
  
  if (trimmedName.length === 0) {
    return { isValid: false, error: 'Name cannot be empty' };
  }

  if (trimmedName.length > 200) {
    return { isValid: false, error: 'Name cannot exceed 200 characters' };
  }

  return { isValid: true };
}

/**
 * Валидация описания
 * @param {String} description - Описание для валидации
 * @returns {Object} Результат валидации
 */
function validateDescription(description) {
  if (!description) {
    return { isValid: true }; // Описание может быть пустым
  }

  if (typeof description !== 'string') {
    return { isValid: false, error: 'Description must be a string' };
  }

  if (description.length > 2000) {
    return { isValid: false, error: 'Description cannot exceed 2000 characters' };
  }

  return { isValid: true };
}

/**
 * Валидация провайдера
 * @param {String} provider - Провайдер для валидации
 * @returns {Object} Результат валидации
 */
function validateProvider(provider) {
  if (!provider) {
    return { isValid: true }; // Провайдер может быть пустым
  }

  if (typeof provider !== 'string') {
    return { isValid: false, error: 'Provider must be a string' };
  }

  if (provider.length > 100) {
    return { isValid: false, error: 'Provider name cannot exceed 100 characters' };
  }

  return { isValid: true };
}

/**
 * Валидация массива функций
 * @param {Array} features - Массив функций для валидации
 * @returns {Object} Результат валидации
 */
function validateFeatures(features) {
  if (!features) {
    return { isValid: true }; // Функции могут быть пустыми
  }

  if (!Array.isArray(features)) {
    return { isValid: false, error: 'Features must be an array' };
  }

  if (features.length > 20) {
    return { isValid: false, error: 'Cannot have more than 20 features' };
  }

  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    
    if (typeof feature !== 'string') {
      return { 
        isValid: false, 
        error: `Feature at index ${i} must be a string` 
      };
    }

    if (feature.length > 50) {
      return { 
        isValid: false, 
        error: `Feature at index ${i} cannot exceed 50 characters` 
      };
    }
  }

  // Проверка на дубликаты
  const uniqueFeatures = [...new Set(features)];
  if (uniqueFeatures.length !== features.length) {
    return { 
      isValid: false, 
      error: 'Duplicate features are not allowed',
      warnings: ['Consider removing duplicate features'] 
    };
  }

  return { isValid: true };
}

/**
 * Валидация массива платежных методов
 * @param {Array} paymentMethods - Массив платежных методов для валидации
 * @returns {Object} Результат валидации
 */
function validatePaymentMethods(paymentMethods) {
  if (!paymentMethods) {
    return { isValid: true }; // Платежные методы могут быть пустыми
  }

  if (!Array.isArray(paymentMethods)) {
    return { isValid: false, error: 'Payment methods must be an array' };
  }

  if (paymentMethods.length > 50) {
    return { isValid: false, error: 'Cannot have more than 50 payment methods' };
  }

  for (let i = 0; i < paymentMethods.length; i++) {
    const method = paymentMethods[i];
    
    if (typeof method !== 'string') {
      return { 
        isValid: false, 
        error: `Payment method at index ${i} must be a string` 
      };
    }

    if (method.length > 50) {
      return { 
        isValid: false, 
        error: `Payment method at index ${i} cannot exceed 50 characters` 
      };
    }
  }

  return { isValid: true };
}

/**
 * Валидация массива языков
 * @param {Array} languages - Массив языков для валидации
 * @returns {Object} Результат валидации
 */
function validateLanguages(languages) {
  if (!languages) {
    return { isValid: true };
  }

  if (!Array.isArray(languages)) {
    return { isValid: false, error: 'Languages must be an array' };
  }

  for (let i = 0; i < languages.length; i++) {
    const language = languages[i];
    
    if (typeof language !== 'string') {
      return { 
        isValid: false, 
        error: `Language at index ${i} must be a string` 
      };
    }

    if (language.length > 20) {
      return { 
        isValid: false, 
        error: `Language at index ${i} cannot exceed 20 characters` 
      };
    }
  }

  return { isValid: true };
}

/**
 * Валидация массива валют
 * @param {Array} currencies - Массив валют для валидации
 * @returns {Object} Результат валидации
 */
function validateCurrencies(currencies) {
  if (!currencies) {
    return { isValid: true };
  }

  if (!Array.isArray(currencies)) {
    return { isValid: false, error: 'Currencies must be an array' };
  }

  for (let i = 0; i < currencies.length; i++) {
    const currency = currencies[i];
    
    if (typeof currency !== 'string') {
      return { 
        isValid: false, 
        error: `Currency at index ${i} must be a string` 
      };
    }

    if (currency.length > 10) {
      return { 
        isValid: false, 
        error: `Currency at index ${i} cannot exceed 10 characters` 
      };
    }
  }

  return { isValid: true };
}

/**
 * Валидация финансовых лимитов
 * @param {String} value - Значение лимита
 * @param {String} fieldName - Название поля
 * @returns {Object} Результат валидации
 */
function validateFinancialLimit(value, fieldName) {
  if (!value) {
    return { isValid: true }; // Лимиты могут быть пустыми
  }

  if (typeof value !== 'string') {
    return { isValid: false, error: `${fieldName} must be a string` };
  }

  if (value.length > 50) {
    return { 
      isValid: false, 
      error: `${fieldName} cannot exceed 50 characters` 
    };
  }

  return { isValid: true };
}

/**
 * Валидация булевых значений
 * @param {Boolean} value - Булево значение
 * @param {String} fieldName - Название поля
 * @returns {Object} Результат валидации
 */
function validateBoolean(value, fieldName) {
  if (value === null || value === undefined) {
    return { isValid: true }; // Булевы значения могут быть пустыми
  }

  if (typeof value !== 'boolean') {
    return { 
      isValid: false, 
      error: `${fieldName} must be a boolean value` 
    };
  }

  return { isValid: true };
}

/**
 * Валидация соответствия оценки и рейтинга
 * @param {Number} score - Оценка
 * @param {String} rating - Рейтинг
 * @returns {Object} Результат валидации
 */
function validateScoreRatingConsistency(score, rating) {
  if (!score || !rating) {
    return { isValid: true }; // Если один из параметров пустой, проверка не нужна
  }

  const expectedRating = getExpectedRating(score);
  
  if (expectedRating !== rating) {
    return {
      isValid: true, // Не ошибка, но предупреждение
      warnings: [`Rating "${rating}" doesn't match score ${score}. Expected: "${expectedRating}"`]
    };
  }

  return { isValid: true };
}

/**
 * Получение ожидаемого рейтинга на основе оценки
 * @param {Number} score - Оценка
 * @returns {String} Ожидаемый рейтинг
 */
function getExpectedRating(score) {
  if (score >= 9) return 'Excellent';
  if (score >= 7.5) return 'Very Good';
  if (score >= 6) return 'Good';
  if (score >= 4) return 'Fair';
  return 'Poor';
}

module.exports = {
  validateUrl,
  validateScore,
  validateRating,
  validateGameType,
  validateName,
  validateDescription,
  validateProvider,
  validateFeatures,
  validatePaymentMethods,
  validateLanguages,
  validateCurrencies,
  validateFinancialLimit,
  validateBoolean,
  validateScoreRatingConsistency,
  getExpectedRating
};


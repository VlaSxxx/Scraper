/**
 * Data Transfer Objects для казино
 * Содержит классы для передачи данных между слоями приложения
 */

const { formatters, constants } = require('../utils');

/**
 * DTO для отображения казино в списке
 */
class CasinoListDto {
  constructor(casino) {
    this.id = casino._id || casino.id;
    this.name = casino.name;
    this.url = casino.url;
    this.type = casino.type;
    this.provider = casino.provider;
    this.score = casino.score;
    this.rating = casino.rating;
    this.scrapedAt = casino.scrapedAt;
    
    // Добавляем boolean поля только если они true
    if (casino.isLive === true) {
      this.isLive = true;
    }
    if (casino.mobileCompatible === true) {
      this.mobileCompatible = true;
    }
    if (casino.liveChat === true) {
      this.liveChat = true;
    }
    
    // Вычисляемые поля
    this.displayScore = formatters.score.formatScoreDisplay(casino.score);
    this.scoreStars = formatters.score.formatScoreToStars(casino.score);
    this.ageInDays = formatters.date.calculateAgeInDays(casino.scrapedAt);
    this.isRecentlyUpdated = formatters.date.isRecentlyUpdated(casino.scrapedAt);
    this.lastUpdatedRelative = formatters.date.formatToRelative(casino.lastUpdated || casino.scrapedAt);
  }
}

/**
 * DTO для детального отображения казино
 */
class CasinoDetailDto extends CasinoListDto {
  constructor(casino) {
    super(casino);
    
    // Дополнительные поля для детального просмотра
    this.description = casino.description;
    
    // Добавляем массивы только если они не пустые
    if (casino.features && casino.features.length > 0) {
      this.features = casino.features;
    }
    if (casino.bonuses && casino.bonuses.length > 0) {
      this.bonuses = casino.bonuses;
    }
    if (casino.paymentMethods && casino.paymentMethods.length > 0) {
      this.paymentMethods = casino.paymentMethods;
    }
    if (casino.licenses && casino.licenses.length > 0) {
      this.licenses = casino.licenses;
    }
    if (casino.languages && casino.languages.length > 0) {
      this.languages = casino.languages;
    }
    if (casino.currencies && casino.currencies.length > 0) {
      this.currencies = casino.currencies;
    }
    
    // Добавляем строковые поля только если они не пустые
    if (casino.minDeposit && casino.minDeposit.trim() !== '') {
      this.minDeposit = casino.minDeposit;
    }
    if (casino.maxWithdrawal && casino.maxWithdrawal.trim() !== '') {
      this.maxWithdrawal = casino.maxWithdrawal;
    }
    if (casino.withdrawalTime && casino.withdrawalTime.trim() !== '') {
      this.withdrawalTime = casino.withdrawalTime;
    }
    if (casino.customerSupport && casino.customerSupport.trim() !== '') {
      this.customerSupport = casino.customerSupport;
    }
    
    // Добавляем boolean поля только если они true
    if (casino.isLive === true) {
      this.isLive = true;
    }
    if (casino.mobileCompatible === true) {
      this.mobileCompatible = true;
    }
    if (casino.liveChat === true) {
      this.liveChat = true;
    }
    
    this.stats = casino.stats || {};
    this.metadata = casino.metadata || {};
    this.lastUpdated = casino.lastUpdated;
    this.createdAt = casino.createdAt;
    this.updatedAt = casino.updatedAt;
    
    // Дополнительные вычисляемые поля
    this.scorePercentage = formatters.score.formatScoreToPercentage(casino.score);
    this.qualityDescription = formatters.score.getQualityDescription(casino.score);
    this.scoreColor = formatters.score.getScoreColor(casino.score);
    this.scoreCssClass = formatters.score.getScoreCSSClass(casino.score);
    this.featuresCount = this.features ? this.features.length : 0;
    this.paymentMethodsCount = this.paymentMethods ? this.paymentMethods.length : 0;
    this.supportedLanguagesCount = this.languages ? this.languages.length : 0;
    this.supportedCurrenciesCount = this.currencies ? this.currencies.length : 0;
    
    // Форматированные даты
    this.createdAtFormatted = formatters.date.formatToReadable(casino.createdAt);
    this.updatedAtFormatted = formatters.date.formatToReadable(casino.updatedAt);
    this.scrapedAtFormatted = formatters.date.formatToReadable(casino.scrapedAt);
    this.lastUpdatedFormatted = formatters.date.formatToReadable(casino.lastUpdated);
  }
}

/**
 * DTO для создания/обновления казино
 */
class CasinoCreateDto {
  constructor(data) {
    this.name = data.name;
    this.url = data.url;
    this.type = data.type || constants.GAME_TYPES.UNKNOWN;
    this.description = data.description;
    this.provider = data.provider;
    this.score = data.score;
    this.rating = data.rating;
    
    // Добавляем boolean поля только если они true
    if (data.isLive === true) {
      this.isLive = true;
    }
    if (data.mobileCompatible === true) {
      this.mobileCompatible = true;
    }
    if (data.liveChat === true) {
      this.liveChat = true;
    }
    // Добавляем массивы только если они не пустые
    if (Array.isArray(data.features) && data.features.length > 0) {
      this.features = data.features;
    }
    if (Array.isArray(data.bonuses) && data.bonuses.length > 0) {
      this.bonuses = data.bonuses;
    }
    if (Array.isArray(data.paymentMethods) && data.paymentMethods.length > 0) {
      this.paymentMethods = data.paymentMethods;
    }
    if (Array.isArray(data.licenses) && data.licenses.length > 0) {
      this.licenses = data.licenses;
    }
    if (Array.isArray(data.languages) && data.languages.length > 0) {
      this.languages = data.languages;
    }
    if (Array.isArray(data.currencies) && data.currencies.length > 0) {
      this.currencies = data.currencies;
    }
    // Добавляем строковые поля только если они не пустые
    if (data.minDeposit && data.minDeposit.trim() !== '') {
      this.minDeposit = data.minDeposit;
    }
    if (data.maxWithdrawal && data.maxWithdrawal.trim() !== '') {
      this.maxWithdrawal = data.maxWithdrawal;
    }
    if (data.withdrawalTime && data.withdrawalTime.trim() !== '') {
      this.withdrawalTime = data.withdrawalTime;
    }
    if (data.customerSupport && data.customerSupport.trim() !== '') {
      this.customerSupport = data.customerSupport;
    }
    this.stats = data.stats || {};
    this.metadata = data.metadata || {};
  }

  /**
   * Валидация данных перед созданием/обновлением
   * @returns {Object} Результат валидации
   */
  validate() {
    const errors = [];
    
    // Проверка обязательных полей
    if (!this.name || typeof this.name !== 'string') {
      errors.push('Name is required and must be a string');
    }
    
    if (!this.url || typeof this.url !== 'string') {
      errors.push('URL is required and must be a string');
    }
    
    // Проверка длины полей
    if (this.name && this.name.length > constants.FIELD_LIMITS.CASINO_NAME_MAX_LENGTH) {
      errors.push(`Name cannot exceed ${constants.FIELD_LIMITS.CASINO_NAME_MAX_LENGTH} characters`);
    }
    
    if (this.url && this.url.length > constants.FIELD_LIMITS.CASINO_URL_MAX_LENGTH) {
      errors.push(`URL cannot exceed ${constants.FIELD_LIMITS.CASINO_URL_MAX_LENGTH} characters`);
    }
    
    // Проверка оценки
    if (this.score !== undefined && this.score !== null) {
      if (typeof this.score !== 'number' || this.score < 0 || this.score > 10) {
        errors.push('Score must be a number between 0 and 10');
      }
    }
    
    // Проверка рейтинга
    if (this.rating && !Object.values(constants.CASINO_RATINGS).includes(this.rating)) {
      errors.push(`Rating must be one of: ${Object.values(constants.CASINO_RATINGS).join(', ')}`);
    }
    
    // Проверка типа игры
    if (this.type && !Object.values(constants.GAME_TYPES).includes(this.type)) {
      errors.push(`Type must be one of: ${Object.values(constants.GAME_TYPES).join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * DTO для фильтрации казино
 */
class CasinoFilterDto {
  constructor(query) {
    this.type = query.type;
    this.provider = query.provider;
    this.rating = query.rating;
    this.isLive = query.isLive === 'true' ? true : query.isLive === 'false' ? false : undefined;
    this.mobileCompatible = query.mobileCompatible === 'true' ? true : query.mobileCompatible === 'false' ? false : undefined;
    this.liveChat = query.liveChat === 'true' ? true : query.liveChat === 'false' ? false : undefined;
    this.minScore = query.minScore ? parseFloat(query.minScore) : undefined;
    this.maxScore = query.maxScore ? parseFloat(query.maxScore) : undefined;
    this.searchTerm = query.search || query.searchTerm;
    this.features = query.features ? (Array.isArray(query.features) ? query.features : [query.features]) : undefined;
    this.paymentMethods = query.paymentMethods ? (Array.isArray(query.paymentMethods) ? query.paymentMethods : [query.paymentMethods]) : undefined;
    this.languages = query.languages ? (Array.isArray(query.languages) ? query.languages : [query.languages]) : undefined;
    this.currencies = query.currencies ? (Array.isArray(query.currencies) ? query.currencies : [query.currencies]) : undefined;
  }

  /**
   * Преобразование в фильтр для базы данных
   * @returns {Object} Фильтр для MongoDB
   */
  toDbFilter() {
    const filter = {};
    
    if (this.type) filter.type = this.type;
    if (this.provider) filter.provider = this.provider;
    if (this.rating) filter.rating = this.rating;
    if (this.isLive !== undefined) filter.isLive = this.isLive;
    if (this.mobileCompatible !== undefined) filter.mobileCompatible = this.mobileCompatible;
    if (this.liveChat !== undefined) filter.liveChat = this.liveChat;
    
    if (this.minScore !== undefined || this.maxScore !== undefined) {
      filter.score = {};
      if (this.minScore !== undefined) filter.score.$gte = this.minScore;
      if (this.maxScore !== undefined) filter.score.$lte = this.maxScore;
    }
    
    if (this.features && this.features.length > 0) {
      filter.features = { $in: this.features };
    }
    
    if (this.paymentMethods && this.paymentMethods.length > 0) {
      filter.paymentMethods = { $in: this.paymentMethods };
    }
    
    if (this.languages && this.languages.length > 0) {
      filter.languages = { $in: this.languages };
    }
    
    if (this.currencies && this.currencies.length > 0) {
      filter.currencies = { $in: this.currencies };
    }
    
    return filter;
  }
}

/**
 * DTO для пагинации казино
 */
class CasinoPaginationDto {
  constructor(query) {
    this.page = Math.max(1, parseInt(query.page) || constants.PAGINATION.DEFAULT_PAGE);
    this.limit = Math.min(
      constants.PAGINATION.MAX_LIMIT,
      Math.max(constants.PAGINATION.MIN_LIMIT, parseInt(query.limit) || constants.PAGINATION.DEFAULT_LIMIT)
    );
    this.sortBy = query.sortBy || 'score';
    this.sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
    this.skip = (this.page - 1) * this.limit;
  }

  /**
   * Преобразование в опции для базы данных
   * @returns {Object} Опции для MongoDB
   */
  toDbOptions() {
    const sortOptions = {};
    sortOptions[this.sortBy] = this.sortOrder === 'desc' ? -1 : 1;
    
    return {
      sort: sortOptions,
      limit: this.limit,
      skip: this.skip
    };
  }

  /**
   * Создание объекта пагинации для ответа
   * @param {Number} total - Общее количество записей
   * @returns {Object} Информация о пагинации
   */
  createPaginationInfo(total) {
    return {
      page: this.page,
      limit: this.limit,
      total,
      pages: Math.ceil(total / this.limit),
      hasNext: this.page < Math.ceil(total / this.limit),
      hasPrev: this.page > 1
    };
  }
}

/**
 * DTO для статистики казино
 */
class CasinoStatsDto {
  constructor(stats) {
    this.totalCasinos = stats.totalCasinos || 0;
    this.averageScore = stats.averageScore || 0;
    this.maxScore = stats.maxScore || 0;
    this.minScore = stats.minScore || 0;
    this.liveGamesCount = stats.liveGamesCount || 0;
    this.mobileCompatibleCount = stats.mobileCompatibleCount || 0;
    this.liveChatCount = stats.liveChatCount || 0;
    
    // Вычисляемые поля
    this.liveGamesPercentage = this.totalCasinos > 0 
      ? ((this.liveGamesCount / this.totalCasinos) * 100).toFixed(2)
      : 0;
    this.mobileCompatibilityRate = this.totalCasinos > 0
      ? ((this.mobileCompatibleCount / this.totalCasinos) * 100).toFixed(2)
      : 0;
    this.liveChatAvailability = this.totalCasinos > 0
      ? ((this.liveChatCount / this.totalCasinos) * 100).toFixed(2)
      : 0;
    
    // Форматированные значения
    this.averageScoreFormatted = formatters.score.formatScoreDisplay(this.averageScore);
    this.averageScoreRating = formatters.score.formatScoreToRating(this.averageScore);
    this.scoreRange = formatters.score.formatScoreRange(this.minScore, this.maxScore);
  }
}

/**
 * DTO для сравнения казино
 */
class CasinoComparisonDto {
  constructor(casinos) {
    this.casinos = casinos.map(casino => ({
      id: casino._id || casino.id,
      name: casino.name,
      score: casino.score,
      rating: casino.rating,
      type: casino.type,
      provider: casino.provider,
      isLive: casino.isLive,
      mobileCompatible: casino.mobileCompatible,
      liveChat: casino.liveChat,
      featuresCount: casino.features?.length || 0,
      paymentMethodsCount: casino.paymentMethods?.length || 0,
      
      // Форматированные значения
      displayScore: formatters.score.formatScoreDisplay(casino.score),
      scoreStars: formatters.score.formatScoreToStars(casino.score),
      qualityDescription: formatters.score.getQualityDescription(casino.score)
    }));
    
    // Сводная информация сравнения
    const scores = this.casinos.map(c => c.score).filter(s => s !== null && s !== undefined);
    
    this.comparison = {
      count: this.casinos.length,
      highestScore: scores.length > 0 ? Math.max(...scores) : null,
      lowestScore: scores.length > 0 ? Math.min(...scores) : null,
      averageScore: scores.length > 0 ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2) : null,
      liveGamesCount: this.casinos.filter(c => c.isLive).length,
      mobileCompatibleCount: this.casinos.filter(c => c.mobileCompatible).length,
      liveChatCount: this.casinos.filter(c => c.liveChat).length,
      scoreRange: scores.length > 0 ? Math.max(...scores) - Math.min(...scores) : null
    };
    
    // Рекомендации
    this.recommendations = this.generateRecommendations();
  }

  /**
   * Генерация рекомендаций на основе сравнения
   * @returns {Array} Массив рекомендаций
   */
  generateRecommendations() {
    const recommendations = [];
    
    if (this.comparison.count === 0) {
      return recommendations;
    }
    
    // Рекомендация лучшего казино по оценке
    if (this.comparison.highestScore) {
      const bestCasino = this.casinos.find(c => c.score === this.comparison.highestScore);
      if (bestCasino) {
        recommendations.push({
          type: 'best_score',
          message: `${bestCasino.name} has the highest score (${bestCasino.displayScore})`,
          casino: bestCasino.name
        });
      }
    }
    
    // Рекомендация для мобильных пользователей
    const mobileCompatible = this.casinos.filter(c => c.mobileCompatible);
    if (mobileCompatible.length > 0) {
      const bestMobile = mobileCompatible.sort((a, b) => (b.score || 0) - (a.score || 0))[0];
      recommendations.push({
        type: 'best_mobile',
        message: `${bestMobile.name} is the best mobile-compatible option`,
        casino: bestMobile.name
      });
    }
    
    // Рекомендация для живых игр
    const liveGames = this.casinos.filter(c => c.isLive);
    if (liveGames.length > 0) {
      const bestLive = liveGames.sort((a, b) => (b.score || 0) - (a.score || 0))[0];
      recommendations.push({
        type: 'best_live',
        message: `${bestLive.name} is the best option for live games`,
        casino: bestLive.name
      });
    }
    
    return recommendations;
  }
}

module.exports = {
  CasinoListDto,
  CasinoDetailDto,
  CasinoCreateDto,
  CasinoFilterDto,
  CasinoPaginationDto,
  CasinoStatsDto,
  CasinoComparisonDto
};


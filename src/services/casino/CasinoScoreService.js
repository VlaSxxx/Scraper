const { repositoryFactory } = require('../../repositories');

/**
 * Сервис для управления оценками казино
 * Содержит бизнес-логику для работы с данными казино
 */
class CasinoScoreService {
  constructor() {
    this.repository = repositoryFactory.getCasinoScoreRepository();
  }

  /**
   * Получение топ-рейтинговых казино с дополнительной логикой
   * @param {Number} limit - Лимит результатов
   * @param {Object} filters - Дополнительные фильтры
   * @returns {Promise<Array>} Отформатированный список топ казино
   */
  async getTopRatedCasinos(limit = 10, filters = {}) {
    try {
      const minScore = filters.minScore || 8;
      const casinos = await this.repository.findTopRated(limit, minScore);
      
      return this.formatCasinosForResponse(casinos);
    } catch (error) {
      throw new Error(`Failed to get top rated casinos: ${error.message}`);
    }
  }

  /**
   * Получение казино по типу игры
   * @param {String} type - Тип игры
   * @param {Object} options - Дополнительные опции
   * @returns {Promise<Array>} Список казино по типу
   */
  async getCasinosByType(type, options = {}) {
    try {
      const limit = options.limit || 20;
      const casinos = await this.repository.findByType(type, limit);
      
      return this.formatCasinosForResponse(casinos);
    } catch (error) {
      throw new Error(`Failed to get casinos by type: ${error.message}`);
    }
  }

  /**
   * Получение живых игр
   * @param {Object} options - Опции запроса
   * @returns {Promise<Array>} Список живых игр
   */
  async getLiveGames(options = {}) {
    try {
      const limit = options.limit || 50;
      const games = await this.repository.findLiveGames(limit);
      
      return this.formatCasinosForResponse(games);
    } catch (error) {
      throw new Error(`Failed to get live games: ${error.message}`);
    }
  }

  /**
   * Обновление оценки казино с дополнительной бизнес-логикой
   * @param {String} casinoId - ID казино
   * @param {Number} newScore - Новая оценка
   * @param {Object} metadata - Дополнительные метаданные
   * @returns {Promise<Object>} Обновленное казино
   */
  async updateCasinoScore(casinoId, newScore, metadata = {}) {
    try {
      // Валидация оценки
      this.validateScore(newScore);
      
      // Получение текущих данных
      const casino = await this.repository.findById(casinoId);
      if (!casino) {
        throw new Error('Casino not found');
      }
      
      // Сохранение старой оценки для истории
      const oldScore = casino.score;
      
      // Обновление данных
      const updateData = {
        score: newScore,
        lastUpdated: new Date(),
        rating: this.calculateRating(newScore)
      };
      
      // Добавление метаданных об изменении
      if (metadata.reason) {
        updateData.metadata = {
          ...casino.metadata,
          lastScoreUpdate: {
            oldScore,
            newScore,
            reason: metadata.reason,
            updatedAt: new Date(),
            updatedBy: metadata.updatedBy
          }
        };
      }
      
      const updatedCasino = await this.repository.findByIdAndUpdate(casinoId, updateData);
      
      return this.formatCasinoForResponse(updatedCasino);
    } catch (error) {
      throw new Error(`Failed to update casino score: ${error.message}`);
    }
  }

  /**
   * Добавление новой функции к казино
   * @param {String} casinoId - ID казино
   * @param {String} feature - Новая функция
   * @returns {Promise<Object>} Обновленное казино
   */
  async addFeatureToCasino(casinoId, feature) {
    try {
      const casino = await this.repository.findById(casinoId);
      if (!casino) {
        throw new Error('Casino not found');
      }
      
      // Проверка на дубликаты
      if (casino.features.includes(feature)) {
        throw new Error('Feature already exists');
      }
      
      // Валидация количества функций
      if (casino.features.length >= 20) {
        throw new Error('Maximum features limit reached');
      }
      
      const updateData = {
        $push: { features: feature },
        lastUpdated: new Date()
      };
      
      const updatedCasino = await this.repository.findByIdAndUpdate(casinoId, updateData);
      
      return this.formatCasinoForResponse(updatedCasino);
    } catch (error) {
      throw new Error(`Failed to add feature: ${error.message}`);
    }
  }

  /**
   * Поиск казино с расширенными фильтрами
   * @param {Object} filters - Фильтры поиска
   * @param {Object} options - Опции запроса
   * @returns {Promise<Object>} Результаты поиска с пагинацией
   */
  async searchCasinos(filters = {}, options = {}) {
    try {
      const {
        type,
        provider,
        rating,
        isLive,
        mobileCompatible,
        liveChat,
        minScore,
        maxScore,
        searchTerm
      } = filters;
      
      const {
        page = 1,
        limit = 20,
        sortBy = 'score',
        sortOrder = 'desc'
      } = options;
      
      let casinos = [];
      
      // Текстовый поиск
      if (searchTerm) {
        casinos = await this.repository.searchByText(searchTerm, limit * page);
      } else {
        // Построение фильтра
        const dbFilter = {};
        
        if (type) dbFilter.type = type;
        if (provider) dbFilter.provider = provider;
        if (rating) dbFilter.rating = rating;
        if (isLive !== undefined) dbFilter.isLive = isLive;
        if (mobileCompatible !== undefined) dbFilter.mobileCompatible = mobileCompatible;
        if (liveChat !== undefined) dbFilter.liveChat = liveChat;
        
        if (minScore !== undefined || maxScore !== undefined) {
          dbFilter.score = {};
          if (minScore !== undefined) dbFilter.score.$gte = minScore;
          if (maxScore !== undefined) dbFilter.score.$lte = maxScore;
        }
        
        // Построение опций сортировки
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        casinos = await this.repository.find(dbFilter, {
          sort: sortOptions,
          limit: limit,
          skip: (page - 1) * limit
        });
      }
      
      // Подсчет общего количества для пагинации
      const total = await this.repository.count(filters);
      
      return {
        casinos: this.formatCasinosForResponse(casinos),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to search casinos: ${error.message}`);
    }
  }

  /**
   * Валидация оценки
   * @param {Number} score - Оценка для валидации
   * @throws {Error} Ошибка валидации
   */
  validateScore(score) {
    if (typeof score !== 'number') {
      throw new Error('Score must be a number');
    }
    
    if (score < 0 || score > 10) {
      throw new Error('Score must be between 0 and 10');
    }
  }

  /**
   * Расчет рейтинга на основе оценки
   * @param {Number} score - Числовая оценка
   * @returns {String} Текстовый рейтинг
   */
  calculateRating(score) {
    if (score >= 9) return 'Excellent';
    if (score >= 7.5) return 'Very Good';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Poor';
  }

  /**
   * Форматирование одного казино для ответа
   * @param {Object} casino - Объект казино
   * @returns {Object} Отформатированный объект
   */
  formatCasinoForResponse(casino) {
    if (!casino) return null;
    
    const formatted = casino.toObject ? casino.toObject() : casino;
    
    return {
      ...formatted,
      displayScore: `${formatted.score}/10`,
      ageInDays: this.calculateAgeInDays(formatted.scrapedAt),
      isRecentlyUpdated: this.isRecentlyUpdated(formatted.scrapedAt)
    };
  }

  /**
   * Форматирование массива казино для ответа
   * @param {Array} casinos - Массив казино
   * @returns {Array} Отформатированный массив
   */
  formatCasinosForResponse(casinos) {
    return casinos.map(casino => this.formatCasinoForResponse(casino));
  }

  /**
   * Расчет возраста записи в днях
   * @param {Date} date - Дата создания записи
   * @returns {Number} Возраст в днях
   */
  calculateAgeInDays(date) {
    return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Проверка, была ли запись недавно обновлена
   * @param {Date} date - Дата обновления
   * @param {Number} maxDays - Максимальное количество дней
   * @returns {Boolean} Была ли недавно обновлена
   */
  isRecentlyUpdated(date, maxDays = 7) {
    return this.calculateAgeInDays(date) <= maxDays;
  }
}

module.exports = CasinoScoreService;


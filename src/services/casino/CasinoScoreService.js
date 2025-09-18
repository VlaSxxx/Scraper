const { repositoryFactory } = require('../../repositories');
const { CasinoListDto, CasinoDetailDto } = require('../../dto');

/**
 * Сервис для управления оценками казино
 * Содержит бизнес-логику для работы с данными казино
 */
class CasinoScoreService {
  constructor() {
    this.repository = repositoryFactory.getCasinoScoreRepository();
    this.mockData = this.generateMockData();
  }

  /**
   * Генерация тестовых данных для работы без MongoDB
   */
  generateMockData() {
    return [
      {
        _id: '1',
        name: 'Crazy Time Live',
        type: 'game show',
        provider: 'evolution',
        score: 9.2,
        rating: 'Excellent',
        url: 'https://casinoscores.com/crazy-time',
        description: 'Live casino game show with multipliers and bonus rounds',
        scrapedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        isLive: true,
        mobileCompatible: true,
        liveChat: true,
        features: ['live dealer', 'multipliers', 'bonus rounds'],
        stats: {
          multipliers: [2, 5, 10, 20, 50],
          rtp: [96.08],
          rounds: [1000]
        }
      },
      {
        _id: '2',
        name: 'Monopoly Live',
        type: 'game show',
        provider: 'evolution',
        score: 8.8,
        rating: 'Excellent',
        url: 'https://casinoscores.com/monopoly-live',
        description: 'Board game inspired live casino game',
        scrapedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        isLive: true,
        mobileCompatible: true,
        features: ['live dealer', 'board game', 'properties'],
        stats: {
          multipliers: [500],
          rtp: [96.23],
          rounds: [500]
        }
      },
      {
        _id: '3',
        name: 'Lightning Roulette',
        type: 'roulette',
        provider: 'evolution',
        score: 8.5,
        rating: 'Good',
        url: 'https://example.com/lightning-roulette',
        description: 'Enhanced roulette with random multipliers',
        scrapedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        isLive: true,
        mobileCompatible: true,
        features: ['live dealer', 'multipliers', 'lightning'],
        stats: {
          multipliers: [50, 100, 200, 300, 400, 500],
          rtp: [97.30]
        }
      },
      {
        _id: '4',
        name: 'Dream Catcher',
        type: 'wheel',
        provider: 'evolution',
        score: 7.8,
        rating: 'Good',
        url: 'https://example.com/dream-catcher',
        description: 'Money wheel game with live host',
        scrapedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        isLive: true,
        features: ['live dealer', 'wheel'],
        stats: {
          multipliers: [2, 5, 10, 20, 40],
          rtp: [96.58]
        }
      },
      {
        _id: '5',
        name: 'Blackjack VIP',
        type: 'blackjack',
        provider: 'evolution',
        score: 8.9,
        rating: 'Excellent',
        url: 'https://example.com/blackjack-vip',
        description: 'Premium blackjack table for high rollers',
        scrapedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        isLive: true,
        mobileCompatible: true,
        liveChat: true,
        features: ['live dealer', 'vip', 'high stakes'],
        stats: {
          rtp: [99.29]
        }
      }
    ];
  }

  /**
   * Проверка доступности MongoDB
   */
  isMongoAvailable() {
    // Для тестирования всегда возвращаем false, чтобы использовать mock данные
    console.log('📊 Using mock data for API testing (MongoDB disabled)');
    return false;
  }

  /**
   * Получение топ-рейтинговых казино с дополнительной логикой
   * @param {Number} limit - Лимит результатов
   * @param {Object} filters - Дополнительные фильтры
   * @returns {Promise<Array>} Отформатированный список топ казино
   */
  async getTopRatedCasinos(limit = 10, filters = {}) {
    try {
      const isMongoAvailable = this.isMongoAvailable();
      
      if (isMongoAvailable) {
        const minScore = filters.minScore || 8;
        const casinos = await this.repository.findTopRated(limit, minScore);
        return this.formatCasinosForResponse(casinos);
      } else {
        // Fallback: используем mock данные
        const minScore = filters.minScore || 8;
        const filteredCasinos = this.mockData
          .filter(casino => casino.score >= minScore)
          .sort((a, b) => b.score - a.score)
          .slice(0, limit);
        
        return this.formatCasinosForResponse(filteredCasinos);
      }
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
      const isMongoAvailable = this.isMongoAvailable();
      const limit = options.limit || 20;
      
      if (isMongoAvailable) {
        const casinos = await this.repository.findByType(type, limit);
        return this.formatCasinosForResponse(casinos);
      } else {
        // Fallback: используем mock данные
        const filteredCasinos = this.mockData
          .filter(casino => casino.type === type)
          .slice(0, limit);
        
        return this.formatCasinosForResponse(filteredCasinos);
      }
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
      const isMongoAvailable = this.isMongoAvailable();
      const limit = options.limit || 50;
      
      if (isMongoAvailable) {
        const games = await this.repository.findLiveGames(limit);
        return this.formatCasinosForResponse(games);
      } else {
        // Fallback: используем mock данные
        const liveGames = this.mockData
          .filter(casino => casino.isLive === true)
          .slice(0, limit);
        
        return this.formatCasinosForResponse(liveGames);
      }
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
      console.log('🔍 searchCasinos called with filters:', filters);
      const isMongoAvailable = this.isMongoAvailable();
      
      if (isMongoAvailable) {
        // Используем MongoDB
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
      } else {
        // Fallback: используем mock данные
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
        
        let casinos = [...this.mockData];
        
        // Применение фильтров
        if (type) {
          casinos = casinos.filter(c => c.type === type);
        }
        if (provider) {
          casinos = casinos.filter(c => c.provider === provider);
        }
        if (rating) {
          casinos = casinos.filter(c => c.rating === rating);
        }
        if (isLive !== undefined) {
          casinos = casinos.filter(c => c.isLive === isLive);
        }
        if (mobileCompatible !== undefined) {
          casinos = casinos.filter(c => c.mobileCompatible === mobileCompatible);
        }
        if (liveChat !== undefined) {
          casinos = casinos.filter(c => c.liveChat === liveChat);
        }
        if (minScore !== undefined) {
          casinos = casinos.filter(c => c.score >= minScore);
        }
        if (maxScore !== undefined) {
          casinos = casinos.filter(c => c.score <= maxScore);
        }
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          casinos = casinos.filter(c => 
            c.name.toLowerCase().includes(term) ||
            c.description.toLowerCase().includes(term) ||
            c.provider.toLowerCase().includes(term)
          );
        }
        
        // Сортировка
        casinos.sort((a, b) => {
          let aVal = a[sortBy] || 0;
          let bVal = b[sortBy] || 0;
          
          if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
          }
          
          if (sortOrder === 'desc') {
            return bVal > aVal ? 1 : -1;
          } else {
            return aVal > bVal ? 1 : -1;
          }
        });
        
        // Пагинация
        const total = casinos.length;
        const startIndex = (page - 1) * limit;
        const paginatedCasinos = casinos.slice(startIndex, startIndex + limit);
        
        return {
          casinos: this.formatCasinosForResponse(paginatedCasinos),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        };
      }
    } catch (error) {
      throw new Error(`Failed to search casinos: ${error.message}`);
    }
  }

  /**
   * Получение казино по ID
   * @param {String} id - ID казино
   * @returns {Promise<Object|null>} Казино или null
   */
  async findById(id) {
    try {
      console.log(`🔍 findById called with id: ${id}`);
      const isMongoAvailable = this.isMongoAvailable();
      
      if (isMongoAvailable) {
        return await this.repository.findById(id);
      } else {
        // Fallback: поиск в mock данных
        console.log('📊 Using mock data for findById');
        const result = this.mockData.find(casino => casino._id === id) || null;
        console.log(`🎯 Found casino: ${result ? result.name : 'not found'}`);
        return result;
      }
    } catch (error) {
      console.log('📊 Using mock data for findById due to error:', error.message);
      return this.mockData.find(casino => casino._id === id) || null;
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
   * @param {boolean} detailed - Использовать детальный DTO
   * @returns {Object} Отформатированный объект
   */
  formatCasinoForResponse(casino, detailed = false) {
    if (!casino) return null;
    
    // Используем DTO для фильтрации пустых значений
    if (detailed) {
      return new CasinoDetailDto(casino);
    } else {
      return new CasinoListDto(casino);
    }
  }

  /**
   * Форматирование массива казино для ответа
   * @param {Array} casinos - Массив казино
   * @param {boolean} detailed - Использовать детальный DTO
   * @returns {Array} Отформатированный массив
   */
  formatCasinosForResponse(casinos, detailed = false) {
    return casinos.map(casino => this.formatCasinoForResponse(casino, detailed));
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


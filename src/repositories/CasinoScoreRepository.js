const BaseRepository = require('./base/BaseRepository');

/**
 * Репозиторий для работы с данными казино
 * Содержит специфичные запросы к базе данных для модели CasinoScore
 */
class CasinoScoreRepository extends BaseRepository {
  constructor(casinoScoreModel) {
    super(casinoScoreModel);
  }

  /**
   * Поиск топ-рейтинговых казино
   * @param {Number} limit - Лимит результатов
   * @param {Number} minScore - Минимальный рейтинг
   * @returns {Promise<Array>} Массив топ казино
   */
  async findTopRated(limit = 10, minScore = 8) {
    return await this.find(
      { score: { $gte: minScore } },
      { 
        sort: { score: -1, scrapedAt: -1 },
        limit: limit,
        select: '-__v'
      }
    );
  }

  /**
   * Поиск казино по типу игры
   * @param {String} type - Тип игры
   * @param {Number} limit - Лимит результатов
   * @returns {Promise<Array>} Массив казино по типу
   */
  async findByType(type, limit = 20) {
    return await this.find(
      { type },
      { 
        sort: { score: -1, scrapedAt: -1 },
        limit: limit,
        select: '-__v'
      }
    );
  }

  /**
   * Поиск живых игр
   * @param {Number} limit - Лимит результатов
   * @returns {Promise<Array>} Массив живых игр
   */
  async findLiveGames(limit = 50) {
    return await this.find(
      { isLive: true },
      { 
        sort: { score: -1, scrapedAt: -1 },
        limit: limit,
        select: '-__v'
      }
    );
  }

  /**
   * Поиск недавно обновленных казино
   * @param {Number} days - Количество дней
   * @param {Number} limit - Лимит результатов
   * @returns {Promise<Array>} Массив недавно обновленных казино
   */
  async findRecentlyUpdated(days = 7, limit = 100) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return await this.find(
      { scrapedAt: { $gte: cutoffDate } },
      { 
        sort: { scrapedAt: -1 },
        limit: limit,
        select: '-__v'
      }
    );
  }

  /**
   * Поиск казино по провайдеру
   * @param {String} provider - Название провайдера
   * @param {Number} limit - Лимит результатов
   * @returns {Promise<Array>} Массив казино провайдера
   */
  async findByProvider(provider, limit = 20) {
    return await this.find(
      { provider },
      { 
        sort: { score: -1, scrapedAt: -1 },
        limit: limit,
        select: '-__v'
      }
    );
  }

  /**
   * Поиск казино по рейтингу
   * @param {String} rating - Рейтинг (Excellent, Very Good, etc.)
   * @param {Number} limit - Лимит результатов
   * @returns {Promise<Array>} Массив казино с определенным рейтингом
   */
  async findByRating(rating, limit = 20) {
    return await this.find(
      { rating },
      { 
        sort: { score: -1, scrapedAt: -1 },
        limit: limit,
        select: '-__v'
      }
    );
  }

  /**
   * Поиск казино с поддержкой мобильных устройств
   * @param {Number} limit - Лимит результатов
   * @returns {Promise<Array>} Массив мобильных казино
   */
  async findMobileCompatible(limit = 50) {
    return await this.find(
      { mobileCompatible: true },
      { 
        sort: { score: -1, scrapedAt: -1 },
        limit: limit,
        select: '-__v'
      }
    );
  }

  /**
   * Поиск казино с живым чатом
   * @param {Number} limit - Лимит результатов
   * @returns {Promise<Array>} Массив казино с живым чатом
   */
  async findWithLiveChat(limit = 50) {
    return await this.find(
      { liveChat: true },
      { 
        sort: { score: -1, scrapedAt: -1 },
        limit: limit,
        select: '-__v'
      }
    );
  }

  /**
   * Текстовый поиск по названию и описанию
   * @param {String} searchTerm - Поисковый термин
   * @param {Number} limit - Лимит результатов
   * @returns {Promise<Array>} Массив найденных казино
   */
  async searchByText(searchTerm, limit = 20) {
    return await this.find(
      { 
        $text: { 
          $search: searchTerm 
        } 
      },
      { 
        sort: { score: { $meta: 'textScore' }, score: -1 },
        limit: limit,
        select: '-__v'
      }
    );
  }

  /**
   * Получение статистики по типам игр
   * @returns {Promise<Array>} Статистика по типам
   */
  async getTypeStatistics() {
    return await this.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          averageScore: { $avg: '$score' },
          maxScore: { $max: '$score' },
          minScore: { $min: '$score' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
  }

  /**
   * Получение статистики по провайдерам
   * @returns {Promise<Array>} Статистика по провайдерам
   */
  async getProviderStatistics() {
    return await this.aggregate([
      {
        $match: { provider: { $ne: null, $ne: '' } }
      },
      {
        $group: {
          _id: '$provider',
          count: { $sum: 1 },
          averageScore: { $avg: '$score' },
          maxScore: { $max: '$score' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 20
      }
    ]);
  }

  /**
   * Получение общей статистики
   * @returns {Promise<Object>} Общая статистика
   */
  async getGeneralStatistics() {
    const result = await this.aggregate([
      {
        $group: {
          _id: null,
          totalCasinos: { $sum: 1 },
          averageScore: { $avg: '$score' },
          maxScore: { $max: '$score' },
          minScore: { $min: '$score' },
          liveGamesCount: {
            $sum: { $cond: [{ $eq: ['$isLive', true] }, 1, 0] }
          },
          mobileCompatibleCount: {
            $sum: { $cond: [{ $eq: ['$mobileCompatible', true] }, 1, 0] }
          },
          liveChatCount: {
            $sum: { $cond: [{ $eq: ['$liveChat', true] }, 1, 0] }
          }
        }
      }
    ]);

    return result[0] || {
      totalCasinos: 0,
      averageScore: 0,
      maxScore: 0,
      minScore: 0,
      liveGamesCount: 0,
      mobileCompatibleCount: 0,
      liveChatCount: 0
    };
  }

  /**
   * Поиск дубликатов по URL
   * @returns {Promise<Array>} Массив дубликатов
   */
  async findDuplicatesByUrl() {
    return await this.aggregate([
      {
        $group: {
          _id: '$url',
          count: { $sum: 1 },
          documents: { $push: '$$ROOT' }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);
  }

  /**
   * Поиск устаревших записей
   * @param {Number} days - Количество дней для определения устаревшости
   * @returns {Promise<Array>} Массив устаревших записей
   */
  async findOutdatedRecords(days = 30) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return await this.find(
      { scrapedAt: { $lt: cutoffDate } },
      { 
        sort: { scrapedAt: 1 },
        select: '_id name url scrapedAt'
      }
    );
  }
}

module.exports = CasinoScoreRepository;

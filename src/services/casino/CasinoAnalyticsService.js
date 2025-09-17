const { repositoryFactory } = require('../../repositories');

/**
 * Сервис для аналитики данных казино
 * Предоставляет статистику и аналитические отчеты
 */
class CasinoAnalyticsService {
  constructor() {
    this.repository = repositoryFactory.getCasinoScoreRepository();
  }

  /**
   * Получение общей статистики казино
   * @returns {Promise<Object>} Общая статистика
   */
  async getGeneralStatistics() {
    try {
      const stats = await this.repository.getGeneralStatistics();
      
      return {
        ...stats,
        liveGamesPercentage: stats.totalCasinos > 0 
          ? (stats.liveGamesCount / stats.totalCasinos * 100).toFixed(2)
          : 0,
        mobileCompatibilityRate: stats.totalCasinos > 0
          ? (stats.mobileCompatibleCount / stats.totalCasinos * 100).toFixed(2)
          : 0,
        liveChatAvailability: stats.totalCasinos > 0
          ? (stats.liveChatCount / stats.totalCasinos * 100).toFixed(2)
          : 0
      };
    } catch (error) {
      throw new Error(`Failed to get general statistics: ${error.message}`);
    }
  }

  /**
   * Получение статистики по типам игр
   * @returns {Promise<Array>} Статистика по типам
   */
  async getTypeStatistics() {
    try {
      const stats = await this.repository.getTypeStatistics();
      
      return stats.map(stat => ({
        type: stat._id,
        count: stat.count,
        averageScore: parseFloat(stat.averageScore?.toFixed(2) || 0),
        maxScore: stat.maxScore,
        minScore: stat.minScore,
        scoreRange: stat.maxScore - stat.minScore
      }));
    } catch (error) {
      throw new Error(`Failed to get type statistics: ${error.message}`);
    }
  }

  /**
   * Получение статистики по провайдерам
   * @returns {Promise<Array>} Статистика по провайдерам
   */
  async getProviderStatistics() {
    try {
      const stats = await this.repository.getProviderStatistics();
      
      return stats.map(stat => ({
        provider: stat._id,
        casinosCount: stat.count,
        averageScore: parseFloat(stat.averageScore?.toFixed(2) || 0),
        maxScore: stat.maxScore,
        marketShare: 0 // Будет рассчитан отдельно
      }));
    } catch (error) {
      throw new Error(`Failed to get provider statistics: ${error.message}`);
    }
  }

  /**
   * Анализ качества данных
   * @returns {Promise<Object>} Отчет о качестве данных
   */
  async getDataQualityReport() {
    try {
      const [
        total,
        withScore,
        withDescription,
        withProvider,
        duplicates,
        outdated
      ] = await Promise.all([
        this.repository.count(),
        this.repository.count({ score: { $ne: null } }),
        this.repository.count({ description: { $ne: null, $ne: '' } }),
        this.repository.count({ provider: { $ne: null, $ne: '' } }),
        this.repository.findDuplicatesByUrl(),
        this.repository.findOutdatedRecords(30)
      ]);

      return {
        totalRecords: total,
        dataCompleteness: {
          scoreAvailable: {
            count: withScore,
            percentage: total > 0 ? (withScore / total * 100).toFixed(2) : 0
          },
          descriptionAvailable: {
            count: withDescription,
            percentage: total > 0 ? (withDescription / total * 100).toFixed(2) : 0
          },
          providerAvailable: {
            count: withProvider,
            percentage: total > 0 ? (withProvider / total * 100).toFixed(2) : 0
          }
        },
        dataIssues: {
          duplicatesCount: duplicates.length,
          outdatedRecordsCount: outdated.length,
          duplicateUrls: duplicates.map(dup => ({
            url: dup._id,
            count: dup.count
          }))
        }
      };
    } catch (error) {
      throw new Error(`Failed to generate data quality report: ${error.message}`);
    }
  }

  /**
   * Получение топ провайдеров с детализацией
   * @param {Number} limit - Количество топ провайдеров
   * @returns {Promise<Array>} Детализированная информация о провайдерах
   */
  async getTopProviders(limit = 10) {
    try {
      const providers = await this.repository.getProviderStatistics();
      const totalCasinos = await this.repository.count();
      
      return providers.slice(0, limit).map(provider => ({
        name: provider._id,
        casinosCount: provider.count,
        averageScore: parseFloat(provider.averageScore?.toFixed(2) || 0),
        maxScore: provider.maxScore,
        marketShare: totalCasinos > 0 
          ? (provider.count / totalCasinos * 100).toFixed(2)
          : 0,
        scoreGrade: this.getScoreGrade(provider.averageScore)
      }));
    } catch (error) {
      throw new Error(`Failed to get top providers: ${error.message}`);
    }
  }

  /**
   * Анализ трендов по рейтингам
   * @returns {Promise<Object>} Анализ распределения рейтингов
   */
  async getRatingAnalysis() {
    try {
      const ratings = ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'];
      const results = await Promise.all(
        ratings.map(rating => this.repository.count({ rating }))
      );

      const total = results.reduce((sum, count) => sum + count, 0);

      return {
        distribution: ratings.map((rating, index) => ({
          rating,
          count: results[index],
          percentage: total > 0 ? (results[index] / total * 100).toFixed(2) : 0
        })),
        qualityMetrics: {
          highQuality: results[0] + results[1], // Excellent + Very Good
          lowQuality: results[3] + results[4],  // Fair + Poor
          qualityRatio: (results[0] + results[1]) / (results[3] + results[4] || 1)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get rating analysis: ${error.message}`);
    }
  }

  /**
   * Анализ особенностей и функций
   * @returns {Promise<Object>} Статистика по функциям
   */
  async getFeaturesAnalysis() {
    try {
      const pipeline = [
        { $unwind: '$features' },
        { 
          $group: { 
            _id: '$features', 
            count: { $sum: 1 },
            avgScore: { $avg: '$score' }
          } 
        },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ];

      const featuresStats = await this.repository.aggregate(pipeline);
      
      return {
        mostPopularFeatures: featuresStats.map(feature => ({
          feature: feature._id,
          count: feature.count,
          averageScore: parseFloat(feature.avgScore?.toFixed(2) || 0)
        })),
        totalUniqueFeatures: featuresStats.length
      };
    } catch (error) {
      throw new Error(`Failed to get features analysis: ${error.message}`);
    }
  }

  /**
   * Анализ платежных методов
   * @returns {Promise<Object>} Статистика по платежным методам
   */
  async getPaymentMethodsAnalysis() {
    try {
      const pipeline = [
        { $unwind: '$paymentMethods' },
        { 
          $group: { 
            _id: '$paymentMethods', 
            count: { $sum: 1 },
            avgScore: { $avg: '$score' }
          } 
        },
        { $sort: { count: -1 } },
        { $limit: 15 }
      ];

      const paymentStats = await this.repository.aggregate(pipeline);
      
      return {
        popularPaymentMethods: paymentStats.map(method => ({
          method: method._id,
          count: method.count,
          averageScore: parseFloat(method.avgScore?.toFixed(2) || 0)
        })),
        totalUniquePaymentMethods: paymentStats.length
      };
    } catch (error) {
      throw new Error(`Failed to get payment methods analysis: ${error.message}`);
    }
  }

  /**
   * Сравнительный анализ казино
   * @param {Array} casinoIds - Массив ID казино для сравнения
   * @returns {Promise<Object>} Сравнительный отчет
   */
  async compareCasinos(casinoIds) {
    try {
      const casinos = await Promise.all(
        casinoIds.map(id => this.repository.findById(id))
      );

      const validCasinos = casinos.filter(casino => casino !== null);
      
      if (validCasinos.length === 0) {
        throw new Error('No valid casinos found for comparison');
      }

      return {
        casinos: validCasinos.map(casino => ({
          id: casino._id,
          name: casino.name,
          score: casino.score,
          rating: casino.rating,
          type: casino.type,
          provider: casino.provider,
          isLive: casino.isLive,
          mobileCompatible: casino.mobileCompatible,
          liveChat: casino.liveChat,
          featuresCount: casino.features?.length || 0,
          paymentMethodsCount: casino.paymentMethods?.length || 0
        })),
        comparison: {
          highestScore: Math.max(...validCasinos.map(c => c.score || 0)),
          lowestScore: Math.min(...validCasinos.map(c => c.score || 0)),
          averageScore: validCasinos.reduce((sum, c) => sum + (c.score || 0), 0) / validCasinos.length,
          liveGamesCount: validCasinos.filter(c => c.isLive).length,
          mobileCompatibleCount: validCasinos.filter(c => c.mobileCompatible).length,
          liveChatCount: validCasinos.filter(c => c.liveChat).length
        }
      };
    } catch (error) {
      throw new Error(`Failed to compare casinos: ${error.message}`);
    }
  }

  /**
   * Получение оценки качества на основе числового рейтинга
   * @param {Number} score - Числовой рейтинг
   * @returns {String} Оценка качества
   */
  getScoreGrade(score) {
    if (score >= 9) return 'A+';
    if (score >= 8) return 'A';
    if (score >= 7) return 'B+';
    if (score >= 6) return 'B';
    if (score >= 5) return 'C+';
    if (score >= 4) return 'C';
    return 'D';
  }
}

module.exports = CasinoAnalyticsService;


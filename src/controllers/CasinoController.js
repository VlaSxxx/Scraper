const { serviceFactory } = require('../services');

/**
 * Контроллер для обработки HTTP запросов связанных с казино
 * Использует сервисы для выполнения бизнес-логики
 */
class CasinoController {
  constructor() {
    this.casinoService = serviceFactory.getCasinoScoreService();
    this.analyticsService = serviceFactory.getCasinoAnalyticsService();
    this.validationService = serviceFactory.getCasinoValidationService();
  }

  /**
   * Получение списка казино с фильтрацией
   * GET /api/casinos
   */
  async getCasinos(req, res, next) {
    try {
      const filters = {
        type: req.query.type,
        provider: req.query.provider,
        rating: req.query.rating,
        isLive: req.query.isLive === 'true',
        mobileCompatible: req.query.mobileCompatible === 'true',
        liveChat: req.query.liveChat === 'true',
        minScore: req.query.minScore ? parseFloat(req.query.minScore) : undefined,
        maxScore: req.query.maxScore ? parseFloat(req.query.maxScore) : undefined,
        searchTerm: req.query.search
      };

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sortBy: req.query.sortBy || 'score',
        sortOrder: req.query.sortOrder || 'desc'
      };

      const result = await this.casinoService.searchCasinos(filters, options);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение топ-рейтинговых казино
   * GET /api/casinos/top-rated
   */
  async getTopRatedCasinos(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const filters = {
        minScore: req.query.minScore ? parseFloat(req.query.minScore) : 8
      };

      const casinos = await this.casinoService.getTopRatedCasinos(limit, filters);
      
      res.status(200).json({
        success: true,
        data: casinos
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение казино по типу игры
   * GET /api/casinos/type/:type
   */
  async getCasinosByType(req, res, next) {
    try {
      const { type } = req.params;
      const options = {
        limit: parseInt(req.query.limit) || 20
      };

      const casinos = await this.casinoService.getCasinosByType(type, options);
      
      res.status(200).json({
        success: true,
        data: casinos
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение живых игр
   * GET /api/casinos/live
   */
  async getLiveGames(req, res, next) {
    try {
      const options = {
        limit: parseInt(req.query.limit) || 50
      };

      const games = await this.casinoService.getLiveGames(options);
      
      res.status(200).json({
        success: true,
        data: games
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение информации о конкретном казино
   * GET /api/casinos/:id
   */
  async getCasinoById(req, res, next) {
    try {
      const { id } = req.params;
      const casino = await this.casinoService.repository.findById(id);
      
      if (!casino) {
        return res.status(404).json({
          success: false,
          message: 'Casino not found'
        });
      }

      const formattedCasino = this.casinoService.formatCasinoForResponse(casino);
      
      res.status(200).json({
        success: true,
        data: formattedCasino
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Создание нового казино
   * POST /api/casinos
   */
  async createCasino(req, res, next) {
    try {
      // Валидация данных
      const validation = await this.validationService.validateCasinoData(req.body);
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors,
          warnings: validation.warnings
        });
      }

      const casino = await this.casinoService.repository.create(req.body);
      const formattedCasino = this.casinoService.formatCasinoForResponse(casino);
      
      res.status(201).json({
        success: true,
        data: formattedCasino,
        warnings: validation.warnings
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Обновление казино
   * PUT /api/casinos/:id
   */
  async updateCasino(req, res, next) {
    try {
      const { id } = req.params;
      
      // Валидация данных
      const validation = await this.validationService.validateCasinoData(req.body, id);
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors,
          warnings: validation.warnings
        });
      }

      const casino = await this.casinoService.repository.findByIdAndUpdate(id, req.body);
      
      if (!casino) {
        return res.status(404).json({
          success: false,
          message: 'Casino not found'
        });
      }

      const formattedCasino = this.casinoService.formatCasinoForResponse(casino);
      
      res.status(200).json({
        success: true,
        data: formattedCasino,
        warnings: validation.warnings
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Обновление оценки казино
   * PATCH /api/casinos/:id/score
   */
  async updateCasinoScore(req, res, next) {
    try {
      const { id } = req.params;
      const { score, reason, updatedBy } = req.body;

      if (typeof score !== 'number' || score < 0 || score > 10) {
        return res.status(400).json({
          success: false,
          message: 'Score must be a number between 0 and 10'
        });
      }

      const metadata = { reason, updatedBy };
      const casino = await this.casinoService.updateCasinoScore(id, score, metadata);
      
      res.status(200).json({
        success: true,
        data: casino
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Добавление функции к казино
   * POST /api/casinos/:id/features
   */
  async addFeature(req, res, next) {
    try {
      const { id } = req.params;
      const { feature } = req.body;

      if (!feature || typeof feature !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Feature must be a non-empty string'
        });
      }

      const casino = await this.casinoService.addFeatureToCasino(id, feature);
      
      res.status(200).json({
        success: true,
        data: casino
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Удаление казино
   * DELETE /api/casinos/:id
   */
  async deleteCasino(req, res, next) {
    try {
      const { id } = req.params;
      
      const casino = await this.casinoService.repository.findByIdAndDelete(id);
      
      if (!casino) {
        return res.status(404).json({
          success: false,
          message: 'Casino not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Casino deleted successfully',
        data: { id }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение статистики казино
   * GET /api/casinos/analytics/general
   */
  async getGeneralStatistics(req, res, next) {
    try {
      const stats = await this.analyticsService.getGeneralStatistics();
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение статистики по типам игр
   * GET /api/casinos/analytics/types
   */
  async getTypeStatistics(req, res, next) {
    try {
      const stats = await this.analyticsService.getTypeStatistics();
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение статистики по провайдерам
   * GET /api/casinos/analytics/providers
   */
  async getProviderStatistics(req, res, next) {
    try {
      const stats = await this.analyticsService.getProviderStatistics();
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение отчета о качестве данных
   * GET /api/casinos/analytics/data-quality
   */
  async getDataQualityReport(req, res, next) {
    try {
      const report = await this.analyticsService.getDataQualityReport();
      
      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Сравнение казино
   * POST /api/casinos/compare
   */
  async compareCasinos(req, res, next) {
    try {
      const { casinoIds } = req.body;

      if (!Array.isArray(casinoIds) || casinoIds.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'At least 2 casino IDs are required for comparison'
        });
      }

      const comparison = await this.analyticsService.compareCasinos(casinoIds);
      
      res.status(200).json({
        success: true,
        data: comparison
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Массовый импорт казино
   * POST /api/casinos/bulk-import
   */
  async bulkImport(req, res, next) {
    try {
      const { casinos } = req.body;

      if (!Array.isArray(casinos)) {
        return res.status(400).json({
          success: false,
          message: 'Casinos array is required'
        });
      }

      const validation = await this.validationService.validateBulkData(casinos);
      
      if (validation.validItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid items found for import',
          errors: validation.errors,
          summary: validation.summary
        });
      }

      // Импорт валидных записей
      const importResults = {
        successful: 0,
        failed: 0,
        results: []
      };

      for (const item of validation.validItems) {
        try {
          const casino = await this.casinoService.repository.create(item.data);
          importResults.successful++;
          importResults.results.push({
            index: item.index,
            status: 'success',
            id: casino._id,
            warnings: item.warnings
          });
        } catch (error) {
          importResults.failed++;
          importResults.results.push({
            index: item.index,
            status: 'error',
            error: error.message
          });
        }
      }

      res.status(200).json({
        success: true,
        data: {
          validation: validation.summary,
          import: {
            successful: importResults.successful,
            failed: importResults.failed,
            total: validation.validItems.length
          },
          details: importResults.results
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CasinoController;


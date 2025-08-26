const express = require('express');
const Joi = require('joi');
const CasinoScore = require('../models/CasinoScore');
const TaskExecution = require('../models/TaskExecution');

const router = express.Router();

// Схемы валидации для расширенных запросов
const advancedQuerySchema = Joi.object({
  // Пагинация
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(20),
  
  // Сортировка
  sort: Joi.string().valid(
    'score', '-score', 'name', '-name', 'scrapedAt', '-scrapedAt',
    'rating', '-rating', 'lastUpdated', '-lastUpdated'
  ).default('-score'),
  
  // Фильтрация по рейтингу
  rating: Joi.string().valid('Excellent', 'Very Good', 'Good', 'Fair', 'Poor'),
  
  // Фильтрация по диапазону оценок
  minScore: Joi.number().min(0).max(10),
  maxScore: Joi.number().min(0).max(10),
  
  // Поиск по названию
  search: Joi.string().min(1).max(100),
  
  // Фильтрация по функциям
  mobileCompatible: Joi.boolean(),
  liveChat: Joi.boolean(),
  
  // Фильтрация по методам оплаты
  paymentMethod: Joi.string(),
  
  // Фильтрация по лицензиям
  license: Joi.string(),
  
  // Фильтрация по валютам
  currency: Joi.string(),
  
  // Фильтрация по языкам
  language: Joi.string(),
  
  // Фильтрация по дате обновления
  updatedAfter: Joi.date().iso(),
  updatedBefore: Joi.date().iso(),
  
  // Выбор полей для возврата
  fields: Joi.string().pattern(/^[a-zA-Z_,()]+$/),
  
  // Включение связанных данных
  embed: Joi.string().pattern(/^[a-zA-Z_,()]+$/)
});

const taskQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  taskName: Joi.string(),
  status: Joi.string().valid('success', 'error', 'running', 'cancelled'),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso(),
  sort: Joi.string().valid('startedAt', '-startedAt', 'executionTime', '-executionTime').default('-startedAt')
});

// Middleware для валидации
const validateAdvancedQuery = (req, res, next) => {
  const { error, value } = advancedQuerySchema.validate(req.query);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }
  req.validatedQuery = value;
  next();
};

const validateTaskQuery = (req, res, next) => {
  const { error, value } = taskQuerySchema.validate(req.query);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }
  req.validatedQuery = value;
  next();
};

// GET /api/v1/casinos - Расширенный список казино с фильтрацией
router.get('/v1/casinos', validateAdvancedQuery, async (req, res) => {
  try {
    const {
      page, limit, sort, rating, minScore, maxScore, search,
      mobileCompatible, liveChat, paymentMethod, license,
      currency, language, updatedAfter, updatedBefore,
      fields, embed
    } = req.validatedQuery;

    // Строим фильтр
    const filter = {};

    if (rating) filter.rating = rating;
    if (mobileCompatible !== undefined) filter.mobileCompatible = mobileCompatible;
    if (liveChat !== undefined) filter.liveChat = liveChat;

    // Фильтрация по диапазону оценок
    if (minScore !== undefined || maxScore !== undefined) {
      filter.score = {};
      if (minScore !== undefined) filter.score.$gte = minScore;
      if (maxScore !== undefined) filter.score.$lte = maxScore;
    }

    // Поиск по названию
    if (search) {
      filter.$text = { $search: search };
    }

    // Фильтрация по методам оплаты
    if (paymentMethod) {
      filter.paymentMethods = { $in: [new RegExp(paymentMethod, 'i')] };
    }

    // Фильтрация по лицензиям
    if (license) {
      filter.licenses = { $in: [new RegExp(license, 'i')] };
    }

    // Фильтрация по валютам
    if (currency) {
      filter.currencies = { $in: [new RegExp(currency, 'i')] };
    }

    // Фильтрация по языкам
    if (language) {
      filter.languages = { $in: [new RegExp(language, 'i')] };
    }

    // Фильтрация по дате обновления
    if (updatedAfter || updatedBefore) {
      filter.lastUpdated = {};
      if (updatedAfter) filter.lastUpdated.$gte = new Date(updatedAfter);
      if (updatedBefore) filter.lastUpdated.$lte = new Date(updatedBefore);
    }

    // Выбор полей
    let selectFields = '-__v';
    if (fields) {
      const fieldArray = fields.split(',').map(f => f.trim());
      selectFields = fieldArray.join(' ');
    }

    // Выполняем запрос
    const skip = (page - 1) * limit;
    
    const [casinos, total] = await Promise.all([
      CasinoScore.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select(selectFields)
        .lean(),
      CasinoScore.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    // Формируем ссылки для пагинации
    const baseUrl = `${req.protocol}://${req.get('host')}${req.path}`;
    const queryParams = new URLSearchParams(req.query);
    
    const links = {
      self: `${baseUrl}?${queryParams.toString()}`,
      first: `${baseUrl}?${new URLSearchParams({ ...req.query, page: 1 }).toString()}`,
      last: `${baseUrl}?${new URLSearchParams({ ...req.query, page: totalPages }).toString()}`
    };

    if (page > 1) {
      links.prev = `${baseUrl}?${new URLSearchParams({ ...req.query, page: page - 1 }).toString()}`;
    }

    if (page < totalPages) {
      links.next = `${baseUrl}?${new URLSearchParams({ ...req.query, page: page + 1 }).toString()}`;
    }

    res.json({
      success: true,
      data: {
        items: casinos,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        links,
        query: req.query
      }
    });

  } catch (error) {
    console.error('Error fetching casinos:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/v1/casinos/:id - Получить конкретное казино по ID
router.get('/v1/casinos/:id', async (req, res) => {
  try {
    const casino = await CasinoScore.findById(req.params.id).select('-__v');
    
    if (!casino) {
      return res.status(404).json({
        success: false,
        message: 'Casino not found'
      });
    }

    res.json({
      success: true,
      data: casino
    });

  } catch (error) {
    console.error('Error fetching casino:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/v1/casinos/search/advanced - Расширенный поиск
router.get('/v1/casinos/search/advanced', validateAdvancedQuery, async (req, res) => {
  try {
    const { search, ...otherParams } = req.validatedQuery;
    
    if (!search) {
      return res.status(400).json({
        success: false,
        message: 'Search parameter is required'
      });
    }

    // Создаем поисковый запрос
    const searchQuery = {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { features: { $in: [new RegExp(search, 'i')] } },
        { bonuses: { $in: [new RegExp(search, 'i')] } },
        { paymentMethods: { $in: [new RegExp(search, 'i')] } }
      ]
    };

    // Объединяем с другими фильтрами
    const filter = { ...searchQuery, ...otherParams };

    const skip = (req.validatedQuery.page - 1) * req.validatedQuery.limit;
    
    const [casinos, total] = await Promise.all([
      CasinoScore.find(filter)
        .sort(req.validatedQuery.sort)
        .skip(skip)
        .limit(req.validatedQuery.limit)
        .select('-__v')
        .lean(),
      CasinoScore.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / req.validatedQuery.limit);

    res.json({
      success: true,
      data: {
        items: casinos,
        pagination: {
          page: req.validatedQuery.page,
          limit: req.validatedQuery.limit,
          total,
          totalPages,
          hasNext: req.validatedQuery.page < totalPages,
          hasPrev: req.validatedQuery.page > 1
        },
        searchTerm: search
      }
    });

  } catch (error) {
    console.error('Error in advanced search:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/v1/casinos/stats/comprehensive - Расширенная статистика
router.get('/v1/casinos/stats/comprehensive', async (req, res) => {
  try {
    const [
      totalCasinos,
      averageScore,
      ratingStats,
      featureStats,
      paymentMethodStats,
      currencyStats,
      languageStats,
      latestUpdate,
      scoreDistribution,
      mobileCompatibleCount,
      liveChatCount
    ] = await Promise.all([
      CasinoScore.countDocuments(),
      CasinoScore.aggregate([
        { $group: { _id: null, avgScore: { $avg: '$score' } } }
      ]),
      CasinoScore.aggregate([
        { $group: { _id: '$rating', count: { $sum: 1 } } }
      ]),
      CasinoScore.aggregate([
        { $unwind: '$features' },
        { $group: { _id: '$features', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      CasinoScore.aggregate([
        { $unwind: '$paymentMethods' },
        { $group: { _id: '$paymentMethods', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      CasinoScore.aggregate([
        { $unwind: '$currencies' },
        { $group: { _id: '$currencies', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      CasinoScore.aggregate([
        { $unwind: '$languages' },
        { $group: { _id: '$languages', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      CasinoScore.findOne().sort('-scrapedAt').select('scrapedAt'),
      CasinoScore.aggregate([
        {
          $bucket: {
            groupBy: '$score',
            boundaries: [0, 2, 4, 6, 8, 10],
            default: 'Other',
            output: { count: { $sum: 1 } }
          }
        }
      ]),
      CasinoScore.countDocuments({ mobileCompatible: true }),
      CasinoScore.countDocuments({ liveChat: true })
    ]);

    const stats = {
      overview: {
        totalCasinos,
        averageScore: averageScore[0]?.avgScore || 0,
        lastUpdated: latestUpdate?.scrapedAt || null
      },
      ratings: ratingStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      features: featureStats,
      paymentMethods: paymentMethodStats,
      currencies: currencyStats,
      languages: languageStats,
      scoreDistribution,
      compatibility: {
        mobileCompatible: mobileCompatibleCount,
        liveChat: liveChatCount
      }
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching comprehensive stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/v1/casinos/top/advanced - Расширенный топ казино
router.get('/v1/casinos/top/advanced', validateAdvancedQuery, async (req, res) => {
  try {
    const { limit = 10, rating, minScore, sort = '-score' } = req.validatedQuery;

    const filter = {};
    if (rating) filter.rating = rating;
    if (minScore !== undefined) filter.score = { $gte: minScore };

    const topCasinos = await CasinoScore.find(filter)
      .sort(sort)
      .limit(parseInt(limit))
      .select('name score rating url features bonuses paymentMethods mobileCompatible liveChat')
      .lean();

    res.json({
      success: true,
      data: topCasinos
    });

  } catch (error) {
    console.error('Error fetching top casinos:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/v1/tasks/executions - История выполнения задач
router.get('/v1/tasks/executions', validateTaskQuery, async (req, res) => {
  try {
    const { page, limit, taskName, status, startDate, endDate, sort } = req.validatedQuery;

    const filter = {};
    if (taskName) filter.taskName = taskName;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.startedAt = {};
      if (startDate) filter.startedAt.$gte = new Date(startDate);
      if (endDate) filter.startedAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    
    const [executions, total] = await Promise.all([
      TaskExecution.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .lean(),
      TaskExecution.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        items: executions,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching task executions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/v1/tasks/stats/advanced - Расширенная статистика задач
router.get('/v1/tasks/stats/advanced', async (req, res) => {
  try {
    const { taskName, days = 7 } = req.query;

    const filter = {};
    if (taskName) filter.taskName = taskName;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const stats = await TaskExecution.aggregate([
      {
        $match: {
          ...filter,
          startedAt: { $gte: cutoffDate }
        }
      },
      {
        $group: {
          _id: '$taskName',
          totalExecutions: { $sum: 1 },
          successfulExecutions: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
          },
          failedExecutions: {
            $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] }
          },
          averageExecutionTime: { $avg: '$executionTime' },
          totalProcessedItems: { $sum: '$processedItems' },
          lastExecution: { $max: '$startedAt' },
          successRate: {
            $multiply: [
              { $divide: [
                { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
                { $sum: 1 }
              ] },
              100
            ]
          }
        }
      },
      { $sort: { lastExecution: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        period: `${days} days`,
        taskStats: stats,
        summary: {
          totalTasks: stats.length,
          totalExecutions: stats.reduce((sum, stat) => sum + stat.totalExecutions, 0),
          averageSuccessRate: stats.length > 0 
            ? stats.reduce((sum, stat) => sum + stat.successRate, 0) / stats.length 
            : 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching advanced task stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/v1/health/detailed - Детальная проверка здоровья системы
router.get('/v1/health/detailed', async (req, res) => {
  try {
    const [
      casinoCount,
      taskExecutionCount,
      latestCasinoUpdate,
      latestTaskExecution,
      databaseStatus
    ] = await Promise.all([
      CasinoScore.countDocuments(),
      TaskExecution.countDocuments(),
      CasinoScore.findOne().sort('-scrapedAt').select('scrapedAt'),
      TaskExecution.findOne().sort('-startedAt').select('startedAt status'),
      CasinoScore.db.db.admin().ping()
    ]);

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: databaseStatus.ok ? 'connected' : 'disconnected',
        collections: {
          casinos: casinoCount,
          taskExecutions: taskExecutionCount
        }
      },
      lastUpdates: {
        casinoData: latestCasinoUpdate?.scrapedAt || null,
        taskExecution: latestTaskExecution ? {
          time: latestTaskExecution.startedAt,
          status: latestTaskExecution.status
        } : null
      },
      system: {
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    res.json({
      success: true,
      data: health
    });

  } catch (error) {
    console.error('Error checking detailed health:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

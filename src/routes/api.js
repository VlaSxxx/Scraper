const express = require('express');
const Joi = require('joi');
const CasinoScore = require('../models/CasinoScore');

const router = express.Router();

// Схемы валидации
const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid('score', 'name', 'scrapedAt', '-score', '-name', '-scrapedAt').default('-score'),
  rating: Joi.string().valid('Excellent', 'Very Good', 'Good', 'Fair', 'Poor'),
  minScore: Joi.number().min(0).max(10),
  maxScore: Joi.number().min(0).max(10),
  search: Joi.string().min(1).max(100),
  type: Joi.string(),
  provider: Joi.string(),
  isLive: Joi.boolean()
});

const idSchema = Joi.object({
  id: Joi.string().required()
});

// Middleware для валидации
const validateQuery = (req, res, next) => {
  const { error, value } = querySchema.validate(req.query);
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

const validateId = (req, res, next) => {
  const { error } = idSchema.validate(req.params);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      errors: error.details.map(detail => detail.message)
    });
  }
  next();
};

// ===== ОСНОВНЫЕ API РОУТЫ =====

// GET /api/casinos - Получить список казино
router.get('/casinos', validateQuery, async (req, res) => {
  try {
    const {
      page,
      limit,
      sort,
      rating,
      minScore,
      maxScore,
      search,
      type,
      provider,
      isLive
    } = req.validatedQuery;

    // Строим фильтр
    const filter = {};

    if (rating) filter.rating = rating;
    if (type) filter.type = type;
    if (provider) filter.provider = provider;
    if (isLive !== undefined) filter.isLive = isLive;

    if (minScore !== undefined || maxScore !== undefined) {
      filter.score = {};
      if (minScore !== undefined) filter.score.$gte = minScore;
      if (maxScore !== undefined) filter.score.$lte = maxScore;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Выполняем запрос
    const skip = (page - 1) * limit;
    
    const [casinos, total] = await Promise.all([
      CasinoScore.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .lean(),
      CasinoScore.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        casinos,
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
    console.error('Error fetching casinos:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/casinos/:id - Получить конкретное казино по ID
router.get('/casinos/:id', validateId, async (req, res) => {
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

// GET /api/casinos/search/:name - Поиск казино по названию
router.get('/casinos/search/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [casinos, total] = await Promise.all([
      CasinoScore.find({
        name: { $regex: name, $options: 'i' }
      })
        .sort({ score: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v')
        .lean(),
      CasinoScore.countDocuments({
        name: { $regex: name, $options: 'i' }
      })
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        casinos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Error searching casinos:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/stats - Получить статистику
router.get('/stats', async (req, res) => {
  try {
    const [
      totalCasinos,
      liveCasinos,
      avgScore,
      topRated,
      typeStats,
      providerStats
    ] = await Promise.all([
      CasinoScore.countDocuments(),
      CasinoScore.countDocuments({ isLive: true }),
      CasinoScore.aggregate([
        { $group: { _id: null, avgScore: { $avg: '$score' } } }
      ]),
      CasinoScore.countDocuments({ score: { $gte: 8 } }),
      CasinoScore.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      CasinoScore.aggregate([
        { $match: { provider: { $exists: true, $ne: null } } },
        { $group: { _id: '$provider', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalCasinos,
        liveCasinos,
        averageScore: avgScore[0]?.avgScore ? parseFloat(avgScore[0].avgScore.toFixed(2)) : 0,
        topRatedCasinos: topRated,
        casinosByType: typeStats,
        casinosByProvider: providerStats,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/top-casinos - Получить топ казино
router.get('/top-casinos', validateQuery, async (req, res) => {
  try {
    const { limit } = req.validatedQuery;

    const topCasinos = await CasinoScore.find({
      score: { $gte: 7 }
    })
      .sort({ score: -1, scrapedAt: -1 })
      .limit(limit)
      .select('-__v')
      .lean();

    res.json({
      success: true,
      data: {
        casinos: topCasinos,
        count: topCasinos.length
      }
    });

  } catch (error) {
    console.error('Error fetching top casinos:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/health - Проверка здоровья API
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
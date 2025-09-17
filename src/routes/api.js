const express = require('express');
const Joi = require('joi');
const CasinoScore = require('../models/CasinoScore');
const ScraperFactory = require('../scrapers/scraper-factory');
const { getAllGames, getGamesByType, getGamesByProvider } = require('../config/games');

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
  mobileCompatible: Joi.boolean(),
  liveChat: Joi.boolean(),
  type: Joi.string(),
  provider: Joi.string(),
  isLive: Joi.boolean()
});

const idSchema = Joi.object({
  id: Joi.string().required()
});

const gameKeySchema = Joi.object({
  gameKey: Joi.string().required()
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

const validateGameKey = (req, res, next) => {
  const { error } = gameKeySchema.validate(req.params);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid game key format',
      errors: error.details.map(detail => detail.message)
    });
  }
  next();
};

// GET /api/games - Получить список всех игр
router.get('/games', validateQuery, async (req, res) => {
  try {
    const {
      page,
      limit,
      sort,
      rating,
      minScore,
      maxScore,
      search,
      mobileCompatible,
      liveChat,
      type,
      provider,
      isLive
    } = req.validatedQuery;

    // Строим фильтр
    const filter = {};

    if (rating) {
      filter.rating = rating;
    }

    if (minScore !== undefined || maxScore !== undefined) {
      filter.score = {};
      if (minScore !== undefined) filter.score.$gte = minScore;
      if (maxScore !== undefined) filter.score.$lte = maxScore;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    if (mobileCompatible !== undefined) {
      filter.mobileCompatible = mobileCompatible;
    }

    if (liveChat !== undefined) {
      filter.liveChat = liveChat;
    }

    if (type) {
      filter.type = type;
    }

    if (provider) {
      filter.provider = provider;
    }

    if (isLive !== undefined) {
      filter.isLive = isLive;
    }

    // Выполняем запрос
    const skip = (page - 1) * limit;
    
    const [games, total] = await Promise.all([
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
        games,
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
    console.error('Error fetching games:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/games/:id - Получить конкретную игру по ID
router.get('/games/:id', validateId, async (req, res) => {
  try {
    const game = await CasinoScore.findById(req.params.id).select('-__v');
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    res.json({
      success: true,
      data: game
    });

  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/games/search/:name - Поиск игр по названию
router.get('/games/search/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const [games, total] = await Promise.all([
      CasinoScore.find({
        name: { $regex: name, $options: 'i' }
      })
        .sort('-score')
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v')
        .lean(),
      CasinoScore.countDocuments({
        name: { $regex: name, $options: 'i' }
      })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        games,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error searching games:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/games/types - Получить все типы игр
router.get('/games/types', async (req, res) => {
  try {
    const types = await CasinoScore.distinct('type');
    
    res.json({
      success: true,
      data: types
    });

  } catch (error) {
    console.error('Error fetching game types:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/games/providers - Получить всех провайдеров
router.get('/games/providers', async (req, res) => {
  try {
    const providers = await CasinoScore.distinct('provider');
    
    res.json({
      success: true,
      data: providers
    });

  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/games/type/:type - Получить игры определенного типа
router.get('/games/type/:type', validateQuery, async (req, res) => {
  try {
    const { type } = req.params;
    const {
      page,
      limit,
      sort,
      rating,
      minScore,
      maxScore
    } = req.validatedQuery;

    // Строим фильтр
    const filter = { type };

    if (rating) {
      filter.rating = rating;
    }

    if (minScore !== undefined || maxScore !== undefined) {
      filter.score = {};
      if (minScore !== undefined) filter.score.$gte = minScore;
      if (maxScore !== undefined) filter.score.$lte = maxScore;
    }

    // Выполняем запрос
    const skip = (page - 1) * limit;
    
    const [games, total] = await Promise.all([
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
        type,
        games,
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
    console.error('Error fetching games by type:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/games/provider/:provider - Получить игры определенного провайдера
router.get('/games/provider/:provider', validateQuery, async (req, res) => {
  try {
    const { provider } = req.params;
    const {
      page,
      limit,
      sort,
      rating,
      minScore,
      maxScore
    } = req.validatedQuery;

    // Строим фильтр
    const filter = { provider };

    if (rating) {
      filter.rating = rating;
    }

    if (minScore !== undefined || maxScore !== undefined) {
      filter.score = {};
      if (minScore !== undefined) filter.score.$gte = minScore;
      if (maxScore !== undefined) filter.score.$lte = maxScore;
    }

    // Выполняем запрос
    const skip = (page - 1) * limit;
    
    const [games, total] = await Promise.all([
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
        provider,
        games,
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
    console.error('Error fetching games by provider:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/supported-games - Получить информацию о поддерживаемых играх
router.get('/supported-games', async (req, res) => {
  try {
    const supportedGames = ScraperFactory.getSupportedGames();
    
    res.json({
      success: true,
      data: supportedGames
    });

  } catch (error) {
    console.error('Error fetching supported games:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/scrape/:gameKey - Запустить скрейпинг конкретной игры
router.post('/scrape/:gameKey', validateGameKey, async (req, res) => {
  try {
    const { gameKey } = req.params;
    
    const scraper = ScraperFactory.createScraper(gameKey);
    const results = await scraper.scrapeAndSave();
    
    res.json({
      success: true,
      data: {
        gameKey,
        results,
        count: results.length
      }
    });

  } catch (error) {
    console.error('Error scraping game:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// POST /api/scrape/all - Запустить скрейпинг всех игр
router.post('/scrape/all', async (req, res) => {
  try {
    const allScrapers = ScraperFactory.createAllScrapers();
    const results = [];
    
    for (const scraper of allScrapers) {
      try {
        const gameResults = await scraper.scrapeAndSave();
        results.push(...gameResults);
      } catch (error) {
        console.error('Error scraping with scraper:', error);
      }
    }
    
    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Error scraping all games:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// POST /api/scrape/type/:type - Запустить скрейпинг игр определенного типа  
router.post('/scrape/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    const gamesByType = getGamesByType(type);
    const results = [];
    
    for (const game of gamesByType) {
      try {
        const scraper = ScraperFactory.createScraper(game.key);
        const gameResults = await scraper.scrapeAndSave();
        results.push(...gameResults);
      } catch (error) {
        console.error(`Error scraping game ${game.key}:`, error);
      }
    }
    
    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Error scraping games by type:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// GET /api/stats - Получить статистику
router.get('/stats', async (req, res) => {
  try {
    const [
      totalGames,
      averageScore,
      ratingStats,
      latestUpdate,
      typeStats,
      providerStats
    ] = await Promise.all([
      CasinoScore.countDocuments(),
      CasinoScore.aggregate([
        { $group: { _id: null, avgScore: { $avg: '$score' } } }
      ]),
      CasinoScore.aggregate([
        { $group: { _id: '$rating', count: { $sum: 1 } } }
      ]),
      CasinoScore.findOne().sort('-scrapedAt').select('scrapedAt'),
      CasinoScore.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      CasinoScore.aggregate([
        { $group: { _id: '$provider', count: { $sum: 1 } } }
      ])
    ]);

    const stats = {
      totalGames,
      averageScore: averageScore[0]?.avgScore || 0,
      ratingDistribution: ratingStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      typeDistribution: typeStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      providerDistribution: providerStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      lastUpdated: latestUpdate?.scrapedAt || null
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/top-games - Получить топ игр
router.get('/top-games', validateQuery, async (req, res) => {
  try {
    const { limit = 10, rating, type, provider } = req.validatedQuery;

    const filter = {};
    if (rating) {
      filter.rating = rating;
    }
    if (type) {
      filter.type = type;
    }
    if (provider) {
      filter.provider = provider;
    }

    const topGames = await CasinoScore.find(filter)
      .sort('-score')
      .limit(parseInt(limit))
      .select('name score rating url features type provider')
      .lean();

    res.json({
      success: true,
      data: topGames
    });

  } catch (error) {
    console.error('Error fetching top games:', error);
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
    message: 'API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// GET /api/db-test - Тест подключения к базе данных
router.get('/db-test', async (req, res) => {
  try {
    // Проверяем подключение к MongoDB
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState;
    const dbStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    const isConnected = dbStatus === 1;
    
    // Получаем статистику базы данных
    let dbStats = null;
    let totalRecords = 0;
    let recentRecords = [];
    
    if (isConnected) {
      try {
        totalRecords = await CasinoScore.countDocuments();
        
        recentRecords = await CasinoScore.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select('name type provider createdAt scrapedAt');
          
        // Получаем статистику по типам игр
        const typeStats = await CasinoScore.aggregate([
          { $group: { _id: '$type', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]);
        
        // Получаем статистику по провайдерам
        const providerStats = await CasinoScore.aggregate([
          { $match: { provider: { $exists: true, $ne: null } } },
          { $group: { _id: '$provider', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]);
        
        dbStats = {
          totalRecords,
          typeStats,
          providerStats,
          recentRecords
        };
      } catch (dbError) {
        console.error('Error getting database stats:', dbError);
      }
    }
    
    res.json({
      success: true,
      message: 'Database test completed',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStates[dbStatus],
        connected: isConnected,
        stats: dbStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database test failed',
      error: error.message
    });
  }
});

// POST /api/db-test - Создать тестовую запись в базе данных
router.post('/db-test', async (req, res) => {
  try {
    const testGame = new CasinoScore({
      name: 'Test Crazy Time',
      url: 'https://test-casino.com/crazy-time',
      type: 'game show',
      description: 'Test game for MongoDB verification',
      stats: {
        multiplier: 100,
        rounds: 50
      },
      isLive: true,
      provider: 'evolution',
      score: 8.5,
      rating: 'Very Good',
      features: ['live', 'game show', 'wheel'],
      bonuses: ['welcome bonus'],
      paymentMethods: ['credit card', 'crypto'],
      licenses: ['MGA'],
      languages: ['English', 'Russian'],
      currencies: ['USD', 'EUR'],
      minDeposit: '$10',
      maxWithdrawal: '$5000',
      withdrawalTime: '24 hours',
      customerSupport: '24/7',
      mobileCompatible: true,
      liveChat: true,
      scrapedAt: new Date()
    });
    
    const savedGame = await testGame.save();
    
    res.json({
      success: true,
      message: 'Test record created successfully',
      data: {
        id: savedGame._id,
        name: savedGame.name,
        type: savedGame.type,
        createdAt: savedGame.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create test record',
      error: error.message
    });
  }
});

// DELETE /api/db-test - Удалить тестовые записи
router.delete('/db-test', async (req, res) => {
  try {
    const result = await CasinoScore.deleteMany({ name: 'Test Crazy Time' });
    
    res.json({
      success: true,
      message: 'Test records cleaned up',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup test records',
      error: error.message
    });
  }
});

// Оставляем старые endpoints для совместимости
// GET /api/casinos - Получить список всех казино (совместимость)
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
      mobileCompatible,
      liveChat
    } = req.validatedQuery;

    // Строим фильтр
    const filter = {};

    if (rating) {
      filter.rating = rating;
    }

    if (minScore !== undefined || maxScore !== undefined) {
      filter.score = {};
      if (minScore !== undefined) filter.score.$gte = minScore;
      if (maxScore !== undefined) filter.score.$lte = maxScore;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    if (mobileCompatible !== undefined) {
      filter.mobileCompatible = mobileCompatible;
    }

    if (liveChat !== undefined) {
      filter.liveChat = liveChat;
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

// GET /api/casinos/:id - Получить конкретное казино по ID (совместимость)
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

// GET /api/casinos/search/:name - Поиск казино по названию (совместимость)
router.get('/casinos/search/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const [casinos, total] = await Promise.all([
      CasinoScore.find({
        name: { $regex: name, $options: 'i' }
      })
        .sort('-score')
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v')
        .lean(),
      CasinoScore.countDocuments({
        name: { $regex: name, $options: 'i' }
      })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        casinos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
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

// GET /api/top-casinos - Получить топ казино (совместимость)
router.get('/top-casinos', validateQuery, async (req, res) => {
  try {
    const { limit = 10, rating } = req.validatedQuery;

    const filter = {};
    if (rating) {
      filter.rating = rating;
    }

    const topCasinos = await CasinoScore.find(filter)
      .sort('-score')
      .limit(parseInt(limit))
      .select('name score rating url features')
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

module.exports = router;

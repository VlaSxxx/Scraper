const express = require('express');
const CasinoScore = require('../models/CasinoScore');
const { getConnectionStats } = require('../config/database');

const router = express.Router();

/**
 * Диагностический endpoint для проверки состояния API и БД
 * GET /debug/status
 */
router.get('/status', async (req, res) => {
  try {
    console.log('=== DEBUG STATUS ENDPOINT ===');
    
    const status = {
      timestamp: new Date().toISOString(),
      database: {},
      collections: {},
      sampleData: {},
      environment: {
        nodeEnv: process.env.NODE_ENV,
        mongoUri: process.env.MONGODB_URI ? 'SET' : 'NOT_SET',
        port: process.env.PORT
      }
    };

    // Проверка подключения к БД
    status.database = getConnectionStats();
    console.log('Database connection stats:', status.database);

    // Проверка коллекций
    if (status.database.isConnected) {
      try {
        // Подсчет документов
        status.collections.totalCasinos = await CasinoScore.countDocuments();
        status.collections.casinosWithScore = await CasinoScore.countDocuments({ score: { $ne: null } });
        status.collections.liveCasinos = await CasinoScore.countDocuments({ isLive: true });
        status.collections.topRatedCasinos = await CasinoScore.countDocuments({ score: { $gte: 8 } });
        
        console.log('Collection stats:', status.collections);

        // Получение примеров данных
        if (status.collections.totalCasinos > 0) {
          const sampleCasinos = await CasinoScore.find()
            .select('name url type score rating isLive provider scrapedAt')
            .limit(3)
            .sort({ scrapedAt: -1 });
          
          status.sampleData.recentCasinos = sampleCasinos;
          console.log('Sample data found:', sampleCasinos.length, 'items');
        } else {
          status.sampleData.message = 'No casino data found in database';
          console.log('No data found in database');
        }

        // Проверка индексов
        const indexes = await CasinoScore.collection.getIndexes();
        status.database.indexes = Object.keys(indexes);
        
      } catch (dbError) {
        console.error('Database query error:', dbError);
        status.collections.error = dbError.message;
      }
    } else {
      status.collections.error = 'Database not connected';
    }

    res.status(200).json({
      success: true,
      debug: status
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      debug: {
        timestamp: new Date().toISOString(),
        environment: {
          nodeEnv: process.env.NODE_ENV,
          mongoUri: process.env.MONGODB_URI ? 'SET' : 'NOT_SET'
        }
      }
    });
  }
});

/**
 * Тестовый endpoint для создания демо-данных
 * POST /debug/create-test-data
 */
router.post('/create-test-data', async (req, res) => {
  try {
    console.log('=== CREATING TEST DATA ===');
    
    const testCasinos = [
      {
        name: "Test Crazy Time Casino",
        url: "https://test-crazy-time.com",
        type: "game show",
        description: "Test casino for Crazy Time game debugging",
        score: 8.5,
        rating: "Very Good",
        isLive: true,
        provider: "evolution",
        features: ["live", "game show", "wheel"],
        mobileCompatible: true,
        liveChat: true
      },
      {
        name: "Test Monopoly Casino",
        url: "https://test-monopoly.com",
        type: "game show",
        description: "Test casino for Monopoly Live game debugging",
        score: 9.0,
        rating: "Excellent",
        isLive: true,
        provider: "evolution",
        features: ["live", "game show", "board game"],
        mobileCompatible: true,
        liveChat: false
      },
      {
        name: "Test Blackjack Casino",
        url: "https://test-blackjack.com",
        type: "blackjack",
        description: "Test casino for blackjack debugging",
        score: 7.5,
        rating: "Good",
        isLive: true,
        provider: "evolution",
        features: ["live", "card game"],
        mobileCompatible: false,
        liveChat: true
      }
    ];

    const createdCasinos = [];
    const errors = [];

    for (const casinoData of testCasinos) {
      try {
        // Проверяем, существует ли уже казино с таким URL
        const existing = await CasinoScore.findOne({ url: casinoData.url });
        if (existing) {
          console.log(`Casino with URL ${casinoData.url} already exists, skipping...`);
          continue;
        }

        const casino = new CasinoScore(casinoData);
        const saved = await casino.save();
        createdCasinos.push({
          id: saved._id,
          name: saved.name,
          url: saved.url,
          score: saved.score
        });
        console.log(`Created test casino: ${saved.name}`);
      } catch (error) {
        console.error(`Error creating casino ${casinoData.name}:`, error);
        errors.push({
          casino: casinoData.name,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Created ${createdCasinos.length} test casinos`,
      data: {
        created: createdCasinos,
        errors: errors,
        totalCreated: createdCasinos.length,
        totalErrors: errors.length
      }
    });

  } catch (error) {
    console.error('Create test data error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Тестовый endpoint для проверки конкретного repository метода
 * GET /debug/test-repository/:method
 */
router.get('/test-repository/:method', async (req, res) => {
  try {
    const { method } = req.params;
    const { repositoryFactory } = require('../repositories');
    const repository = repositoryFactory.getCasinoScoreRepository();

    console.log(`=== TESTING REPOSITORY METHOD: ${method} ===`);
    
    let result;
    let queryInfo = {};

    switch (method) {
      case 'findTopRated':
        const limit = parseInt(req.query.limit) || 5;
        const minScore = parseFloat(req.query.minScore) || 0;
        queryInfo = { method, limit, minScore };
        console.log('Calling findTopRated with:', queryInfo);
        result = await repository.findTopRated(limit, minScore);
        break;

      case 'findByType':
        const type = req.query.type || 'game show';
        const typeLimit = parseInt(req.query.limit) || 5;
        queryInfo = { method, type, limit: typeLimit };
        console.log('Calling findByType with:', queryInfo);
        result = await repository.findByType(type, typeLimit);
        break;

      case 'findLiveGames':
        const liveLimit = parseInt(req.query.limit) || 5;
        queryInfo = { method, limit: liveLimit };
        console.log('Calling findLiveGames with:', queryInfo);
        result = await repository.findLiveGames(liveLimit);
        break;

      case 'getGeneralStatistics':
        queryInfo = { method };
        console.log('Calling getGeneralStatistics');
        result = await repository.getGeneralStatistics();
        break;

      default:
        return res.status(400).json({
          success: false,
          error: `Unknown repository method: ${method}`,
          availableMethods: ['findTopRated', 'findByType', 'findLiveGames', 'getGeneralStatistics']
        });
    }

    console.log(`Repository ${method} returned:`, result ? result.length || 'object' : 'null');

    res.status(200).json({
      success: true,
      debug: {
        method,
        queryInfo,
        resultType: Array.isArray(result) ? 'array' : typeof result,
        resultLength: Array.isArray(result) ? result.length : 'N/A',
        hasData: result ? (Array.isArray(result) ? result.length > 0 : true) : false
      },
      data: result
    });

  } catch (error) {
    console.error('Repository test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      debug: {
        method: req.params.method,
        query: req.query
      }
    });
  }
});

/**
 * Очистка тестовых данных
 * DELETE /debug/clear-test-data
 */
router.delete('/clear-test-data', async (req, res) => {
  try {
    console.log('=== CLEARING TEST DATA ===');
    
    const testUrls = [
      "https://test-crazy-time.com",
      "https://test-monopoly.com", 
      "https://test-blackjack.com"
    ];

    const deleteResult = await CasinoScore.deleteMany({
      url: { $in: testUrls }
    });

    console.log(`Deleted ${deleteResult.deletedCount} test casino records`);

    res.status(200).json({
      success: true,
      message: `Deleted ${deleteResult.deletedCount} test casino records`,
      data: {
        deletedCount: deleteResult.deletedCount,
        deletedUrls: testUrls
      }
    });

  } catch (error) {
    console.error('Clear test data error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;


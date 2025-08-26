const puppeteer = require('puppeteer');

class BaseGameScraper {
  constructor(gameConfig) {
    this.gameConfig = gameConfig;
    this.browser = null;
    this.page = null;
    this.startTime = null;
  }

  /**
   * Инициализация Puppeteer с оптимизированными настройками
   */
  async initialize() {
    try {
      this.startTime = Date.now();
      
      // Оптимизированные настройки запуска браузера
      this.browser = await puppeteer.launch({
        headless: process.env.PUPPETEER_HEADLESS === 'true' ? 'new' : false,
        args: [
          // Производительность
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          
          // Оптимизация памяти
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-field-trial-config',
          '--disable-ipc-flooding-protection',
          
          // Оптимизация сети
          '--disable-background-networking',
          '--disable-default-apps',
          '--disable-extensions',
          '--disable-sync',
          '--disable-translate',
          
          // Оптимизация рендеринга
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-backgrounding-occluded-windows',
          
          // Безопасность
          '--no-default-browser-check',
          '--no-experiments',
          '--no-pings',
          '--no-zygote',
          '--single-process'
        ],
        
        // Дополнительные настройки производительности
        ignoreDefaultArgs: ['--disable-extensions'],
        timeout: parseInt(process.env.PUPPETEER_TIMEOUT) || 30000
      });

      this.page = await this.browser.newPage();
      
      // Оптимизированные настройки страницы
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await this.page.setViewport({ width: 1920, height: 1080 });

      // Оптимизированные заголовки
      await this.page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1'
      });

      // Упрощенная настройка - не блокируем ресурсы для избежания проблем с сайтами

      // Оптимизация производительности
      await this.page.evaluateOnNewDocument(() => {
        // Отключаем ненужные API
        delete navigator.serviceWorker;
        delete navigator.webdriver;
        
        // Эмуляция реального браузера
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
      });

      const initTime = Date.now() - this.startTime;
      console.log(`✅ Puppeteer initialized for ${this.gameConfig.name} in ${initTime}ms`);
      
    } catch (error) {
      console.error(`❌ Error initializing Puppeteer for ${this.gameConfig.name}:`, error);
      throw error;
    }
  }

  /**
   * Навигация на страницу с оптимизированными настройками
   */
  async navigateToPage() {
    try {
      const url = this.gameConfig.url || process.env.CASINO_SCORES_URL || 'https://casinoscores.com/';
      console.log(`🌐 Navigating to: ${url}`);
      
      const navigationStart = Date.now();
      
      // Упрощенная навигация
      await this.page.goto(url, { 
        waitUntil: 'networkidle0', // Ждем полной загрузки
        timeout: parseInt(process.env.PUPPETEER_TIMEOUT) || 30000
      });

      const navigationTime = Date.now() - navigationStart;
      console.log(`✅ Page loaded in ${navigationTime}ms`);
      
      // Дополнительное ожидание для стабильности
      await this.page.waitForTimeout(3000);
      
      // Проверяем контент страницы
      try {
        const pageTitle = await this.page.title();
        console.log(`📄 Page title: ${pageTitle}`);
      } catch (error) {
        console.log(`⚠️  Could not get page title: ${error.message}`);
      }

      // Делаем скриншот только в режиме отладки
      if (process.env.NODE_ENV === 'development') {
        try {
          const screenshotPath = `debug-${this.gameConfig.key}-screenshot.png`;
          await this.page.screenshot({ 
            path: screenshotPath, 
            fullPage: false, // Только видимая область для экономии времени
            optimizeForSpeed: true
          });
          console.log(`📸 Screenshot saved as ${screenshotPath}`);
        } catch (error) {
          console.log(`⚠️  Could not take screenshot: ${error.message}`);
        }
      }

      // Получаем размер контента
      try {
        const pageContent = await this.page.content();
        console.log(`📊 Page content length: ${pageContent.length} characters`);
      } catch (error) {
        console.log(`⚠️  Could not get page content: ${error.message}`);
      }

    } catch (error) {
      console.error(`❌ Error navigating to page for ${this.gameConfig.name}:`, error);
      throw error;
    }
  }

  /**
   * Абстрактный метод для скрейпинга данных игры
   * @returns {Promise<Array>} Массив данных игры
   */
  async scrapeGameData() {
    throw new Error('scrapeGameData method must be implemented in child class');
  }

  /**
   * Сохранение данных в базу данных с оптимизированной обработкой
   * @param {Array} games - Массив данных игр
   * @returns {Promise<Array>} Сохраненные данные
   */
  async saveToDatabase(games) {
    try {
      console.log(`💾 Saving ${this.gameConfig.name} to database...`);
      
      // Проверяем подключение к базе данных
      const { connectDB, isDBConnected } = require('../config/database');
      
      if (!isDBConnected()) {
        console.log('🔗 Database not connected, attempting to connect...');
        await connectDB();
      }
      
      const CasinoScore = require('../models/CasinoScore');
      const savedGames = [];
      
      // Используем bulk операции для лучшей производительности
      const bulkOps = [];
      
      for (const game of games) {
        try {
          // Подготавливаем данные для сохранения
          const gameData = {
            ...game,
            scrapedAt: new Date()
          };

          // Используем upsert для эффективного обновления/создания
          bulkOps.push({
            updateOne: {
              filter: { name: game.name },
              update: { $set: gameData },
              upsert: true
            }
          });
          
        } catch (error) {
          console.error(`❌ Error preparing ${this.gameConfig.name} for save:`, error);
        }
      }

      // Выполняем bulk операцию
      if (bulkOps.length > 0) {
        const result = await CasinoScore.bulkWrite(bulkOps, { 
          ordered: false, // Продолжаем при ошибках
          writeConcern: { w: 1 } // Оптимизация для производительности
        });
        
        console.log(`✅ Bulk operation completed: ${result.upsertedCount} created, ${result.modifiedCount} updated`);
        
        // Получаем обновленные записи
        const savedRecords = await CasinoScore.find({ 
          name: { $in: games.map(g => g.name) } 
        }).sort({ scrapedAt: -1 });
        
        savedGames.push(...savedRecords);
      }

      const saveTime = Date.now() - this.startTime;
      console.log(`✅ Successfully saved/updated ${savedGames.length} ${this.gameConfig.name} records in ${saveTime}ms`);
      return savedGames;

    } catch (error) {
      console.error('❌ Error saving to database:', error);
      throw error;
    }
  }

  /**
   * Основной метод скрейпинга и сохранения с оптимизированной производительностью
   * @returns {Promise<Array>} Результаты скрейпинга
   */
  async scrapeAndSave() {
    try {
      console.log(`🚀 Starting optimized scraping for ${this.gameConfig.name}...`);
      
      await this.initialize();
      await this.navigateToPage();
      
      const scrapeStart = Date.now();
      const games = await this.scrapeGameData();
      const scrapeTime = Date.now() - scrapeStart;
      
      console.log(`📊 Scraped ${games.length} games in ${scrapeTime}ms`);
      
      const savedGames = await this.saveToDatabase(games);
      
      const totalTime = Date.now() - this.startTime;
      console.log(`✅ Scraping completed successfully for ${this.gameConfig.name} in ${totalTime}ms`);
      console.log(`📈 Processed ${savedGames.length} records`);
      
      return savedGames;
      
    } catch (error) {
      console.error(`❌ Error in scrapeAndSave for ${this.gameConfig.name}:`, error);
      throw error;
    } finally {
      await this.close();
    }
  }

  /**
   * Закрытие браузера с обработкой ошибок
   */
  async close() {
    try {
      if (this.browser) {
        await this.browser.close();
        console.log(`🔒 Browser closed for ${this.gameConfig.name}`);
      }
    } catch (error) {
      console.error(`❌ Error closing browser for ${this.gameConfig.name}:`, error);
    }
  }

  /**
   * Получение метрик производительности
   * @returns {Promise<Object>} Метрики производительности
   */
  async getPerformanceMetrics() {
    if (!this.page) {
      return null;
    }

    try {
      const metrics = await this.page.metrics();
      const performance = await this.page.evaluate(() => {
        const perf = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
          loadComplete: perf.loadEventEnd - perf.loadEventStart,
          domInteractive: perf.domInteractive - perf.fetchStart,
          redirectCount: perf.redirectCount,
          transferSize: perf.transferSize
        };
      });

      return {
        puppeteerMetrics: metrics,
        performanceMetrics: performance,
        totalTime: this.startTime ? Date.now() - this.startTime : null
      };
    } catch (error) {
      console.error('❌ Error getting performance metrics:', error);
      return null;
    }
  }
}

module.exports = BaseGameScraper;

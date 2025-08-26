const puppeteer = require('puppeteer');

class BaseGameScraper {
  constructor(gameConfig) {
    this.gameConfig = gameConfig;
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    try {
      this.browser = await puppeteer.launch({
        headless: process.env.PUPPETEER_HEADLESS === 'true' ? 'new' : false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });

      this.page = await this.browser.newPage();
      
      // Устанавливаем user agent для имитации реального браузера
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Устанавливаем viewport
      await this.page.setViewport({ width: 1920, height: 1080 });

      // Устанавливаем дополнительные заголовки
      await this.page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      });

      console.log(`Puppeteer initialized for ${this.gameConfig.name}`);
    } catch (error) {
      console.error(`Error initializing Puppeteer for ${this.gameConfig.name}:`, error);
      throw error;
    }
  }

  async navigateToPage() {
    try {
      const url = this.gameConfig.url || process.env.CASINO_SCORES_URL || 'https://casinoscores.com/';
      console.log(`Navigating to: ${url}`);
      
      await this.page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: parseInt(process.env.PUPPETEER_TIMEOUT) || 30000
      });

      console.log('Page loaded, waiting for content...');
      
      // Ждем загрузки контента
      await this.page.waitForTimeout(5000);

      // Проверяем, есть ли контент на странице
      const pageTitle = await this.page.title();
      console.log(`Page title: ${pageTitle}`);

      // Делаем скриншот для отладки
      const screenshotPath = `debug-${this.gameConfig.key}-screenshot.png`;
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Screenshot saved as ${screenshotPath}`);

      // Получаем HTML для анализа
      const pageContent = await this.page.content();
      console.log(`Page content length: ${pageContent.length} characters`);

    } catch (error) {
      console.error(`Error navigating to page for ${this.gameConfig.name}:`, error);
      throw error;
    }
  }

  // Абстрактный метод, который должен быть реализован в дочерних классах
  async scrapeGameData() {
    throw new Error('scrapeGameData method must be implemented in child class');
  }

  async saveToDatabase(games) {
    try {
      console.log(`Saving ${this.gameConfig.name} to database...`);
      
      const CasinoScore = require('../models/CasinoScore');
      const savedGames = [];
      
      for (const game of games) {
        try {
          // Проверяем, существует ли уже игра с таким именем
          const existingGame = await CasinoScore.findOne({ name: game.name });
          
          if (existingGame) {
            // Обновляем существующую игру
            const updatedGame = await CasinoScore.findByIdAndUpdate(
              existingGame._id,
              {
                ...game,
                scrapedAt: new Date()
              },
              { new: true }
            );
            savedGames.push(updatedGame);
            console.log(`Updated existing ${this.gameConfig.name} record`);
          } else {
            // Создаем новую игру
            const newGame = new CasinoScore({
              ...game,
              scrapedAt: new Date()
            });
            const savedGame = await newGame.save();
            savedGames.push(savedGame);
            console.log(`Created new ${this.gameConfig.name} record`);
          }
        } catch (error) {
          console.error(`Error saving ${this.gameConfig.name}:`, error);
        }
      }

      console.log(`Successfully saved/updated ${savedGames.length} ${this.gameConfig.name} records`);
      return savedGames;

    } catch (error) {
      console.error('Error saving to database:', error);
      throw error;
    }
  }

  async scrapeAndSave() {
    try {
      await this.initialize();
      await this.navigateToPage();
      const games = await this.scrapeGameData();
      const savedGames = await this.saveToDatabase(games);
      
      console.log(`Scraping completed successfully for ${this.gameConfig.name}. Processed ${savedGames.length} records`);
      return savedGames;
      
    } catch (error) {
      console.error(`Error in scrapeAndSave for ${this.gameConfig.name}:`, error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = BaseGameScraper;

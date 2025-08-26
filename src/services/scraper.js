const puppeteer = require('puppeteer');
const CasinoScore = require('../models/CasinoScore');

class CasinoScraper {
  constructor() {
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

      console.log('Puppeteer initialized successfully');
    } catch (error) {
      console.error('Error initializing Puppeteer:', error);
      throw error;
    }
  }

  async scrapeCrazyTimeOnly() {
    try {
      console.log('Starting to scrape Crazy Time data only...');
      
      const url = process.env.CASINO_SCORES_URL || 'https://casinoscores.com/';
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
      await this.page.screenshot({ path: 'debug-crazy-time-screenshot.png', fullPage: true });
      console.log('Screenshot saved as debug-crazy-time-screenshot.png');

      // Получаем HTML для анализа
      const pageContent = await this.page.content();
      console.log(`Page content length: ${pageContent.length} characters`);

      // Ищем только данные о Crazy Time
      const crazyTimeData = await this.page.evaluate(() => {
        const crazyTime = {
          name: 'Crazy Time',
          type: 'game show',
          description: '',
          stats: {},
          url: '',
          isLive: true,
          provider: 'evolution',
          score: null,
          rating: '',
          features: [],
          bonuses: [],
          paymentMethods: [],
          licenses: [],
          languages: [],
          currencies: [],
          minDeposit: '',
          maxWithdrawal: '',
          withdrawalTime: '',
          customerSupport: '',
          mobileCompatible: false,
          liveChat: false
        };

        console.log('Searching for Crazy Time data...');

        // Ищем элементы с текстом "Crazy Time"
        const crazyTimeElements = [];
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach(el => {
          const text = el.textContent.toLowerCase();
          if (text.includes('crazy time') || text.includes('crazy')) {
            crazyTimeElements.push(el);
          }
        });

        console.log(`Found ${crazyTimeElements.length} elements with Crazy Time data`);

        // Обрабатываем найденные элементы
        crazyTimeElements.forEach((element, index) => {
          try {
            const elementText = element.textContent.trim();
            
            // Ищем статистику (числа)
            const numbers = elementText.match(/\d+(?:\.\d+)?/g);
            if (numbers && numbers.length > 0) {
              crazyTime.stats = {
                numbers: numbers.map(n => parseFloat(n)),
                source: elementText.substring(0, 100)
              };
              console.log(`Found stats: ${JSON.stringify(crazyTime.stats)}`);
            }

            // Ищем описание
            if (elementText.length > 50 && elementText.length < 500 && 
                !elementText.includes('{') && !elementText.includes('}')) {
              if (!crazyTime.description) {
                crazyTime.description = elementText;
                console.log(`Found description: ${crazyTime.description.substring(0, 100)}...`);
              }
            }

            // Ищем особенности
            const featureKeywords = ['live', 'stream', 'statistics', 'big wins', 'multiplier', 'wheel'];
            featureKeywords.forEach(keyword => {
              if (elementText.toLowerCase().includes(keyword) && 
                  !crazyTime.features.includes(keyword)) {
                crazyTime.features.push(keyword);
              }
            });

            // Ищем ссылку
            const linkElement = element.querySelector('a');
            if (linkElement && linkElement.href && !crazyTime.url) {
              crazyTime.url = linkElement.href;
              console.log(`Found URL: ${crazyTime.url}`);
            }

            // Ищем рейтинг/оценку
            const scoreMatch = elementText.match(/(\d+(?:\.\d+)?)\s*(?:stars?|points?|rating)/i);
            if (scoreMatch && !crazyTime.score) {
              crazyTime.score = parseFloat(scoreMatch[1]);
              console.log(`Found score: ${crazyTime.score}`);
            }

          } catch (error) {
            console.error(`Error parsing Crazy Time element ${index}:`, error);
          }
        });

        // Если не нашли URL, создаем базовый
        if (!crazyTime.url) {
          crazyTime.url = 'https://casinoscores.com/crazy-time';
        }

        // Если не нашли описание, создаем базовое
        if (!crazyTime.description) {
          crazyTime.description = 'Crazy Time is a popular live casino game show by Evolution Gaming featuring a wheel with multipliers and bonus rounds.';
        }

        // Добавляем базовые особенности
        if (crazyTime.features.length === 0) {
          crazyTime.features = ['live', 'game show', 'wheel', 'multipliers'];
        }

        console.log(`Crazy Time data collected successfully`);
        return crazyTime;
      });

      console.log(`Crazy Time data found: ${crazyTimeData.name}`);
      console.log(`Type: ${crazyTimeData.type}`);
      console.log(`Provider: ${crazyTimeData.provider}`);
      console.log(`Live: ${crazyTimeData.isLive}`);
      console.log(`Features: ${crazyTimeData.features.join(', ')}`);
      
      if (Object.keys(crazyTimeData.stats).length > 0) {
        console.log(`Stats: ${JSON.stringify(crazyTimeData.stats)}`);
      }
      
      return [crazyTimeData]; // Возвращаем массив с одним элементом

    } catch (error) {
      console.error('Error scraping Crazy Time:', error);
      throw error;
    }
  }

  async saveToDatabase(games) {
    try {
      console.log('Saving Crazy Time to database...');
      
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
            console.log(`Updated existing Crazy Time record`);
          } else {
            // Создаем новую игру
            const newGame = new CasinoScore({
              ...game,
              scrapedAt: new Date()
            });
            const savedGame = await newGame.save();
            savedGames.push(savedGame);
            console.log(`Created new Crazy Time record`);
          }
        } catch (error) {
          console.error(`Error saving Crazy Time:`, error);
        }
      }

      console.log(`Successfully saved/updated ${savedGames.length} Crazy Time records`);
      return savedGames;

    } catch (error) {
      console.error('Error saving to database:', error);
      throw error;
    }
  }

  async scrapeAndSave() {
    try {
      await this.initialize();
      const games = await this.scrapeCrazyTimeOnly();
      const savedGames = await this.saveToDatabase(games);
      
      console.log(`Scraping completed successfully. Processed ${savedGames.length} Crazy Time records`);
      return savedGames;
      
    } catch (error) {
      console.error('Error in scrapeAndSave:', error);
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

module.exports = CasinoScraper;

const BaseGameScraper = require('../base-scraper');

class CrazyTimeScraper extends BaseGameScraper {
  constructor() {
    const gameConfig = {
      key: 'crazy-time',
      name: 'Crazy Time',
      type: 'game show',
      provider: 'evolution',
      isLive: true,
      url: 'https://casinoscores.com/',
      searchKeywords: ['crazy time', 'crazy'],
      features: ['live', 'game show', 'wheel', 'multipliers'],
      description: 'Crazy Time is a popular live casino game show by Evolution Gaming featuring a wheel with multipliers and bonus rounds.',
      defaultUrl: 'https://casinoscores.com/crazy-time'
    };
    super(gameConfig);
  }

  async scrapeGameData() {
    try {
      console.log('Starting to scrape Crazy Time data...');
      
      // Ищем только данные о Crazy Time
      const crazyTimeData = await this.page.evaluate((config) => {
        const crazyTime = {
          name: config.name,
          type: config.type,
          description: config.description,
          stats: {},
          url: config.defaultUrl,
          isLive: config.isLive,
          provider: config.provider,
          score: null,
          rating: null,
          features: [...config.features],
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
              if (!crazyTime.description || crazyTime.description === config.description) {
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

        // Если не нашли URL, используем дефолтный
        if (!crazyTime.url || crazyTime.url === config.defaultUrl) {
          crazyTime.url = config.defaultUrl;
        }

        // Если не нашли описание, используем дефолтное
        if (!crazyTime.description || crazyTime.description === config.description) {
          crazyTime.description = config.description;
        }

        console.log(`Crazy Time data collected successfully`);
        return crazyTime;
      }, this.gameConfig);

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
}

module.exports = CrazyTimeScraper;

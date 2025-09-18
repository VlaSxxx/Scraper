const BaseGameScraper = require('./base-scraper');

class MonopolyLiveScraper extends BaseGameScraper {
  constructor() {
    const gameConfig = {
      key: 'monopoly-live',
      name: 'Monopoly Live',
      type: 'game show',
      provider: 'evolution',
      isLive: true,
      url: 'https://casinoscores.com/',
      searchKeywords: ['monopoly live', 'monopoly'],
      features: ['live', 'game show', 'board game', 'multipliers'],
      description: 'Monopoly Live is a live casino game show based on the classic board game with multipliers and bonus rounds.',
      defaultUrl: 'https://casinoscores.com/monopoly-live'
    };
    super(gameConfig);
  }

  async scrapeGameData() {
    try {
      console.log('Starting to scrape Monopoly Live data...');
      
      // Ищем данные о Monopoly Live
      const monopolyData = await this.page.evaluate((config) => {
        // Функция для извлечения только игровой статистики
        function extractGameStatistics(text) {
          const stats = [];
          
          // Ищем множители (например: 2x, 5x, 10x, 50x, 100x, 500x)
          const multipliers = text.match(/(\d+)x/gi);
          if (multipliers) {
            multipliers.forEach(m => {
              const num = parseFloat(m.replace('x', ''));
              if (num >= 2 && num <= 1000) { // Разумные множители для Monopoly Live
                stats.push({ type: 'multiplier', value: num });
              }
            });
          }
          
          // Ищем проценты RTP (например: 96.23%, 95.43%)
          const rtpMatches = text.match(/(\d{2,3}\.\d{1,2})%/g);
          if (rtpMatches) {
            rtpMatches.forEach(rtp => {
              const num = parseFloat(rtp.replace('%', ''));
              if (num >= 90 && num <= 100) { // Разумные RTP для казино игр
                stats.push({ type: 'rtp', value: num });
              }
            });
          }
          
          // Ищем количество раундов/игр (например: "1000 rounds", "500 games")
          const roundMatches = text.match(/(\d{2,6})\s*(rounds?|games?|spins?)/gi);
          if (roundMatches) {
            roundMatches.forEach(match => {
              const num = parseFloat(match.match(/\d+/)[0]);
              if (num >= 10 && num <= 100000) { // Разумное количество раундов
                stats.push({ type: 'rounds', value: num });
              }
            });
          }
          
          // Ищем максимальные выигрыши (например: "Max win: 20000x")
          const maxWinMatches = text.match(/max\s*win[:\s]*(\d{1,6})x?/gi);
          if (maxWinMatches) {
            maxWinMatches.forEach(match => {
              const num = parseFloat(match.match(/\d+/)[0]);
              if (num >= 100 && num <= 100000) { // Разумные максимальные выигрыши
                stats.push({ type: 'maxWin', value: num });
              }
            });
          }
          
          return stats;
        }
        
        const monopoly = {
          name: config.name,
          type: config.type,
          description: config.description,
          stats: {},
          url: config.defaultUrl,
          isLive: config.isLive,
          provider: config.provider,
          score: null,
          rating: null,
          features: [...config.features]
        };

        console.log('Searching for Monopoly Live data...');

        // Ищем элементы с текстом "Monopoly Live"
        const monopolyElements = [];
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach(el => {
          const text = el.textContent.toLowerCase();
          if (text.includes('monopoly live') || text.includes('monopoly')) {
            monopolyElements.push(el);
          }
        });

        console.log(`Found ${monopolyElements.length} elements with Monopoly Live data`);

        // Обрабатываем найденные элементы
        monopolyElements.forEach((element, index) => {
          try {
            const elementText = element.textContent.trim();
            
            // Ищем игровую статистику (только релевантные числа)
            const gameStats = extractGameStatistics(elementText);
            if (gameStats.length > 0) {
              monopoly.stats = {
                gameStats: gameStats,
                source: elementText.substring(0, 100)
              };
              console.log(`Found game stats: ${JSON.stringify(monopoly.stats)}`);
            }

            // Ищем описание
            if (elementText.length > 50 && elementText.length < 500 && 
                !elementText.includes('{') && !elementText.includes('}')) {
              if (!monopoly.description || monopoly.description === config.description) {
                monopoly.description = elementText;
                console.log(`Found description: ${monopoly.description.substring(0, 100)}...`);
              }
            }

            // Ищем особенности
            const featureKeywords = ['live', 'stream', 'statistics', 'big wins', 'multiplier', 'board game', 'properties'];
            featureKeywords.forEach(keyword => {
              if (elementText.toLowerCase().includes(keyword) && 
                  !monopoly.features.includes(keyword)) {
                monopoly.features.push(keyword);
              }
            });

            // Ищем ссылку
            const linkElement = element.querySelector('a');
            if (linkElement && linkElement.href && !monopoly.url) {
              monopoly.url = linkElement.href;
              console.log(`Found URL: ${monopoly.url}`);
            }

            // Ищем рейтинг/оценку
            const scoreMatch = elementText.match(/(\d+(?:\.\d+)?)\s*(?:stars?|points?|rating)/i);
            if (scoreMatch && !monopoly.score) {
              monopoly.score = parseFloat(scoreMatch[1]);
              console.log(`Found score: ${monopoly.score}`);
            }

          } catch (error) {
            console.error(`Error parsing Monopoly Live element ${index}:`, error);
          }
        });

        // Если не нашли URL, используем дефолтный
        if (!monopoly.url || monopoly.url === config.defaultUrl) {
          monopoly.url = config.defaultUrl;
        }

        // Если не нашли описание, используем дефолтное
        if (!monopoly.description || monopoly.description === config.description) {
          monopoly.description = config.description;
        }

        console.log(`Monopoly Live data collected successfully`);
        return monopoly;
      }, this.gameConfig);

      console.log(`Monopoly Live data found: ${monopolyData.name}`);
      console.log(`Type: ${monopolyData.type}`);
      console.log(`Provider: ${monopolyData.provider}`);
      console.log(`Live: ${monopolyData.isLive}`);
      console.log(`Features: ${monopolyData.features.join(', ')}`);
      
      if (Object.keys(monopolyData.stats).length > 0) {
        console.log(`Stats: ${JSON.stringify(monopolyData.stats)}`);
      }
      
      return [monopolyData]; // Возвращаем массив с одним элементом

    } catch (error) {
      console.error('Error scraping Monopoly Live:', error);
      throw error;
    }
  }
}

module.exports = MonopolyLiveScraper;

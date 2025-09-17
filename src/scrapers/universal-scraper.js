const { connectDB, isDBConnected } = require('../config/database');
const ScraperFactory = require('./scraper-factory');
const { getAllGames, getGameConfig } = require('../config/games');

class UniversalScraper {
  constructor() {
    this.scrapers = new Map();
  }

  /**
   * Запускает скрейпинг для конкретной игры
   * @param {string} gameKey - Ключ игры
   * @returns {Promise<Array>} Результаты скрейпинга
   */
  async scrapeGame(gameKey) {
    try {
      console.log(`🚀 Starting scraping for game: ${gameKey}`);
      
      // Создаем скрейпер для игры
      const scraper = ScraperFactory.createScraper(gameKey);
      
      console.log(`📊 Starting scraping process for ${gameKey}...`);
      
      // Запускаем скрейпинг
      const results = await scraper.scrapeAndSave();
      
      console.log(`✅ Scraping completed successfully for ${gameKey}!`);
      console.log(`📈 Processed ${results.length} records`);
      
      return results;
      
    } catch (error) {
      console.error(`❌ Error during scraping for ${gameKey}:`, error);
      throw error;
    }
  }

  /**
   * Запускает скрейпинг для всех поддерживаемых игр
   * @returns {Promise<Object>} Результаты скрейпинга для всех игр
   */
  async scrapeAllGames() {
    try {
      console.log('🚀 Starting Universal Casino Games Scraper...');
      
      const availableScrapers = ScraperFactory.getAvailableScrapers();
      console.log(`📋 Available scrapers: ${availableScrapers.join(', ')}`);
      
      const results = {};
      const errors = {};
      
      // Запускаем скрейпинг для каждой игры параллельно
      const scrapingPromises = availableScrapers.map(async (gameKey) => {
        try {
          console.log(`📊 Starting scraping for ${gameKey}...`);
          const scraper = ScraperFactory.createScraper(gameKey);
          const gameResults = await scraper.scrapeAndSave();
          
          results[gameKey] = {
            success: true,
            count: gameResults.length,
            data: gameResults
          };
          
          console.log(`✅ Completed scraping for ${gameKey}: ${gameResults.length} records`);
          
        } catch (error) {
          console.error(`❌ Error scraping ${gameKey}:`, error);
          errors[gameKey] = {
            success: false,
            error: error.message
          };
        }
      });
      
      // Ждем завершения всех скрейперов
      await Promise.all(scrapingPromises);
      
      // Выводим общую статистику
      const totalProcessed = Object.values(results).reduce((sum, result) => sum + result.count, 0);
      const successfulGames = Object.keys(results).length;
      const failedGames = Object.keys(errors).length;
      
      console.log(`\n📊 Universal Scraping Summary:`);
      console.log(`✅ Successfully processed ${successfulGames} games`);
      console.log(`❌ Failed to process ${failedGames} games`);
      console.log(`📈 Total records processed: ${totalProcessed}`);
      
      if (Object.keys(results).length > 0) {
        console.log(`\n🎮 Successful games:`);
        Object.entries(results).forEach(([gameKey, result]) => {
          console.log(`  - ${gameKey}: ${result.count} records`);
        });
      }
      
      if (Object.keys(errors).length > 0) {
        console.log(`\n⚠️  Failed games:`);
        Object.entries(errors).forEach(([gameKey, error]) => {
          console.log(`  - ${gameKey}: ${error.error}`);
        });
      }
      
      return {
        success: true,
        results,
        errors,
        summary: {
          totalProcessed,
          successfulGames,
          failedGames,
          totalGames: availableScrapers.length
        }
      };
      
    } catch (error) {
      console.error('❌ Error in universal scraping:', error);
      throw error;
    }
  }

  /**
   * Запускает скрейпинг для игр определенного типа
   * @param {string} type - Тип игры (например, 'game show', 'roulette')
   * @returns {Promise<Object>} Результаты скрейпинга
   */
  async scrapeGamesByType(type) {
    try {
      console.log(`🚀 Starting scraping for games of type: ${type}`);
      
      const allGames = getAllGames();
      const gamesOfType = allGames.filter(game => game.type === type);
      const availableGamesOfType = gamesOfType.filter(game => 
        ScraperFactory.hasScraper(game.key)
      );
      
      if (availableGamesOfType.length === 0) {
        throw new Error(`No available scrapers found for games of type: ${type}`);
      }
      
      console.log(`📋 Found ${availableGamesOfType.length} games of type '${type}': ${availableGamesOfType.map(g => g.key).join(', ')}`);
      
      const results = {};
      const errors = {};
      
      // Запускаем скрейпинг для каждой игры данного типа
      const scrapingPromises = availableGamesOfType.map(async (game) => {
        try {
          console.log(`📊 Starting scraping for ${game.key}...`);
          const scraper = ScraperFactory.createScraper(game.key);
          const gameResults = await scraper.scrapeAndSave();
          
          results[game.key] = {
            success: true,
            count: gameResults.length,
            data: gameResults
          };
          
          console.log(`✅ Completed scraping for ${game.key}: ${gameResults.length} records`);
          
        } catch (error) {
          console.error(`❌ Error scraping ${game.key}:`, error);
          errors[game.key] = {
            success: false,
            error: error.message
          };
        }
      });
      
      await Promise.all(scrapingPromises);
      
      return {
        success: true,
        type,
        results,
        errors,
        summary: {
          totalGames: availableGamesOfType.length,
          successfulGames: Object.keys(results).length,
          failedGames: Object.keys(errors).length
        }
      };
      
    } catch (error) {
      console.error(`❌ Error scraping games of type ${type}:`, error);
      throw error;
    }
  }

  /**
   * Получает информацию о поддерживаемых играх
   * @returns {Object} Информация о играх
   */
  getSupportedGamesInfo() {
    const allGames = getAllGames();
    const availableScrapers = ScraperFactory.getAvailableScrapers();
    
    const gamesInfo = allGames.map(game => ({
      ...game,
      hasScraper: availableScrapers.includes(game.key),
      status: availableScrapers.includes(game.key) ? 'available' : 'not_implemented'
    }));
    
    return {
      totalGames: allGames.length,
      availableScrapers: availableScrapers.length,
      games: gamesInfo
    };
  }
}

module.exports = UniversalScraper;

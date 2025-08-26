const { getGameConfig, isGameSupported } = require('../config/games');

// Импортируем все скрейперы
const CrazyTimeScraper = require('./scrapers/crazy-time-scraper');
const MonopolyLiveScraper = require('./scrapers/monopoly-live-scraper');

// Реестр скрейперов
const scraperRegistry = {
  'crazy-time': CrazyTimeScraper,
  'monopoly-live': MonopolyLiveScraper
};

class ScraperFactory {
  /**
   * Создает скрейпер для указанной игры
   * @param {string} gameKey - Ключ игры (например, 'crazy-time')
   * @returns {BaseGameScraper} Экземпляр скрейпера
   */
  static createScraper(gameKey) {
    if (!isGameSupported(gameKey)) {
      throw new Error(`Game '${gameKey}' is not supported. Available games: ${Object.keys(scraperRegistry).join(', ')}`);
    }

    const ScraperClass = scraperRegistry[gameKey];
    if (!ScraperClass) {
      throw new Error(`Scraper for game '${gameKey}' is not implemented yet`);
    }

    return new ScraperClass();
  }

  /**
   * Получает список всех доступных скрейперов
   * @returns {Array} Массив ключей игр
   */
  static getAvailableScrapers() {
    return Object.keys(scraperRegistry);
  }

  /**
   * Проверяет, есть ли скрейпер для указанной игры
   * @param {string} gameKey - Ключ игры
   * @returns {boolean} true если скрейпер доступен
   */
  static hasScraper(gameKey) {
    return !!scraperRegistry[gameKey];
  }

  /**
   * Получает информацию о поддерживаемых играх
   * @returns {Array} Массив объектов с информацией об играх
   */
  static getSupportedGames() {
    return Object.keys(scraperRegistry).map(key => {
      const config = getGameConfig(key);
      return {
        key,
        name: config.name,
        type: config.type,
        provider: config.provider,
        isLive: config.isLive,
        hasScraper: true
      };
    });
  }

  /**
   * Создает скрейперы для всех поддерживаемых игр
   * @returns {Array} Массив экземпляров скрейперов
   */
  static createAllScrapers() {
    return Object.keys(scraperRegistry).map(key => this.createScraper(key));
  }

  /**
   * Регистрирует новый скрейпер
   * @param {string} gameKey - Ключ игры
   * @param {Class} ScraperClass - Класс скрейпера
   */
  static registerScraper(gameKey, ScraperClass) {
    if (!isGameSupported(gameKey)) {
      throw new Error(`Game '${gameKey}' is not configured in games config`);
    }
    
    scraperRegistry[gameKey] = ScraperClass;
    console.log(`Registered scraper for game: ${gameKey}`);
  }

  /**
   * Удаляет скрейпер из реестра
   * @param {string} gameKey - Ключ игры
   */
  static unregisterScraper(gameKey) {
    if (scraperRegistry[gameKey]) {
      delete scraperRegistry[gameKey];
      console.log(`Unregistered scraper for game: ${gameKey}`);
    }
  }
}

module.exports = ScraperFactory;

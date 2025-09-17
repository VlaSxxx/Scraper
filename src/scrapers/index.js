// Scraping Services - отдельно от бизнес-логики
const BaseScraper = require('./base-scraper');
const ScraperFactory = require('./scraper-factory');
const UniversalScraper = require('./universal-scraper');
const MainScraper = require('./scraper');

// Конкретные скраперы
const CrazyTimeScraper = require('./crazy-time-scraper');
const MonopolyLiveScraper = require('./monopoly-live-scraper');

/**
 * Фабрика для создания экземпляров скрапинг-сервисов
 * Отдельная от бизнес-логики система для парсинга данных
 */
class ScrapingServiceFactory {
  constructor() {
    this._scraperFactory = null;
    this._universalScraper = null;
    this._mainScraper = null;
  }

  getScraperFactory() {
    if (!this._scraperFactory) {
      this._scraperFactory = new ScraperFactory();
    }
    return this._scraperFactory;
  }

  getUniversalScraper() {
    if (!this._universalScraper) {
      this._universalScraper = new UniversalScraper();
    }
    return this._universalScraper;
  }

  getMainScraper() {
    if (!this._mainScraper) {
      this._mainScraper = new MainScraper();
    }
    return this._mainScraper;
  }

  // Получение конкретных скраперов
  getCrazyTimeScraper() {
    return new CrazyTimeScraper();
  }

  getMonopolyLiveScraper() {
    return new MonopolyLiveScraper();
  }

  // Получение всех доступных скраперов
  getAllScrapers() {
    return {
      factory: this.getScraperFactory(),
      universal: this.getUniversalScraper(),
      main: this.getMainScraper(),
      specific: {
        crazyTime: this.getCrazyTimeScraper(),
        monopolyLive: this.getMonopolyLiveScraper()
      }
    };
  }
}

const scrapingServiceFactory = new ScrapingServiceFactory();

module.exports = {
  // Базовые классы
  BaseScraper,
  ScraperFactory,
  UniversalScraper,
  MainScraper,
  
  // Конкретные скраперы
  CrazyTimeScraper,
  MonopolyLiveScraper,
  
  // Фабрика скрапинг-сервисов
  scrapingServiceFactory
};

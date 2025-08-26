const cron = require('node-cron');
const CasinoScraper = require('./services/scraper');

class Scheduler {
  constructor() {
    this.scraper = new CasinoScraper();
    this.isRunning = false;
  }

  start() {
    console.log('Starting scheduler...');
    
    // Запускаем скрейпинг каждую минуту
    const schedule = process.env.SCRAPING_INTERVAL || '* * * * *';
    
    cron.schedule(schedule, async () => {
      if (this.isRunning) {
        console.log('Previous scraping job is still running, skipping...');
        return;
      }

      this.isRunning = true;
      console.log(`[${new Date().toISOString()}] Starting scheduled scraping...`);

      try {
        await this.scraper.scrapeAndSave();
        console.log(`[${new Date().toISOString()}] Scheduled scraping completed successfully`);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Scheduled scraping failed:`, error);
      } finally {
        this.isRunning = false;
      }
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    console.log(`Scheduler started with schedule: ${schedule}`);
  }

  async runOnce() {
    console.log('Running scraper once...');
    
    if (this.isRunning) {
      console.log('Scraper is already running...');
      return;
    }

    this.isRunning = true;
    
    try {
      await this.scraper.scrapeAndSave();
      console.log('One-time scraping completed successfully');
    } catch (error) {
      console.error('One-time scraping failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  stop() {
    console.log('Stopping scheduler...');
    cron.getTasks().forEach(task => task.stop());
    console.log('Scheduler stopped');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      schedule: process.env.SCRAPING_INTERVAL || '* * * * *',
      nextRun: this.getNextRunTime()
    };
  }

  getNextRunTime() {
    const schedule = process.env.SCRAPING_INTERVAL || '* * * * *';
    const now = new Date();
    const nextMinute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + 1, 0, 0);
    return nextMinute;
  }
}

module.exports = Scheduler;

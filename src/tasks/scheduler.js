const cron = require('node-cron');
const UniversalScraper = require('../services/universal-scraper');
const CasinoScore = require('../models/CasinoScore');

class TaskScheduler {
  constructor() {
    this.jobs = new Map();
    this.scraper = new UniversalScraper();
    this.isRunning = false;
    this.stats = {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      lastRun: null,
      lastSuccess: null,
      lastError: null,
      averageExecutionTime: 0
    };
  }

  /**
   * Создает и запускает задачу скрейпинга
   * @param {string} schedule - Cron выражение (например: '* * * * *' для каждой минуты)
   * @param {Object} options - Дополнительные опции
   */
  createScrapingJob(schedule = '* * * * *', options = {}) {
    const {
      name = 'casino-scraping',
      timezone = 'UTC',
      runOnInit = false,
      errorHandler = null,
      onComplete = null
    } = options;

    // Останавливаем существующую задачу если есть
    if (this.jobs.has(name)) {
      this.stopJob(name);
    }

    const job = cron.schedule(schedule, async () => {
      await this.executeScrapingTask(name);
    }, {
      scheduled: true,
      timezone,
      runOnInit
    });

    // Добавляем обработчики ошибок
    if (errorHandler) {
      job.on('error', errorHandler);
    }

    // Добавляем обработчик завершения
    if (onComplete) {
      job.on('complete', onComplete);
    }

    this.jobs.set(name, {
      job,
      schedule,
      timezone,
      runOnInit,
      createdAt: new Date(),
      lastExecution: null,
      nextExecution: this.getNextExecutionTime(schedule, timezone)
    });

    console.log(`✅ Task "${name}" scheduled with cron: ${schedule}`);
    return job;
  }

  /**
   * Выполняет задачу скрейпинга
   * @param {string} jobName - Имя задачи
   */
  async executeScrapingTask(jobName) {
    if (this.isRunning) {
      console.log(`⏳ Previous scraping job is still running, skipping "${jobName}"...`);
      return;
    }

    const startTime = Date.now();
    this.isRunning = true;
    this.stats.totalRuns++;

    try {
      console.log(`🚀 [${new Date().toISOString()}] Starting scraping task: ${jobName}`);
      
      // Обновляем время последнего запуска
      const jobInfo = this.jobs.get(jobName);
      if (jobInfo) {
        jobInfo.lastExecution = new Date();
        jobInfo.nextExecution = this.getNextExecutionTime(jobInfo.schedule, jobInfo.timezone);
      }

      // Выполняем скрейпинг всех игр
      const results = await this.scraper.scrapeAllGames();
      
      const executionTime = Date.now() - startTime;
      this.stats.successfulRuns++;
      this.stats.lastSuccess = new Date();
      this.stats.lastRun = new Date();
      this.stats.averageExecutionTime = this.calculateAverageExecutionTime(executionTime);

      console.log(`✅ [${new Date().toISOString()}] Task "${jobName}" completed successfully`);
      console.log(`📊 Processed ${results.summary.totalProcessed} records from ${results.summary.successfulGames} games in ${executionTime}ms`);
      console.log(`📈 Average execution time: ${this.stats.averageExecutionTime.toFixed(2)}ms`);

      // Логируем статистику
      await this.logTaskExecution(jobName, {
        status: 'success',
        executionTime,
        processedItems: results.summary.totalProcessed,
        timestamp: new Date()
      });

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.stats.failedRuns++;
      this.stats.lastError = error.message;
      this.stats.lastRun = new Date();

      console.error(`❌ [${new Date().toISOString()}] Task "${jobName}" failed:`, error.message);
      console.error(`⏱️ Execution time: ${executionTime}ms`);

      // Логируем ошибку
      await this.logTaskExecution(jobName, {
        status: 'error',
        executionTime,
        error: error.message,
        timestamp: new Date()
      });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Запускает задачу один раз
   * @param {string} jobName - Имя задачи
   */
  async runJobOnce(jobName) {
    console.log(`🎯 Running task "${jobName}" once...`);
    await this.executeScrapingTask(jobName);
  }

  /**
   * Останавливает конкретную задачу
   * @param {string} jobName - Имя задачи
   */
  stopJob(jobName) {
    const jobInfo = this.jobs.get(jobName);
    if (jobInfo) {
      jobInfo.job.stop();
      this.jobs.delete(jobName);
      console.log(`🛑 Task "${jobName}" stopped`);
    } else {
      console.log(`⚠️ Task "${jobName}" not found`);
    }
  }

  /**
   * Останавливает все задачи
   */
  stopAllJobs() {
    console.log('🛑 Stopping all scheduled tasks...');
    this.jobs.forEach((jobInfo, jobName) => {
      jobInfo.job.stop();
    });
    this.jobs.clear();
    console.log('✅ All tasks stopped');
  }

  /**
   * Получает статус всех задач
   */
  getJobsStatus() {
    const status = {
      totalJobs: this.jobs.size,
      activeJobs: 0,
      jobs: [],
      stats: this.stats,
      isRunning: this.isRunning
    };

    this.jobs.forEach((jobInfo, jobName) => {
      const jobStatus = {
        name: jobName,
        schedule: jobInfo.schedule,
        timezone: jobInfo.timezone,
        isActive: jobInfo.job.running,
        createdAt: jobInfo.createdAt,
        lastExecution: jobInfo.lastExecution,
        nextExecution: jobInfo.nextExecution
      };

      status.jobs.push(jobStatus);
      if (jobInfo.job.running) {
        status.activeJobs++;
      }
    });

    return status;
  }

  /**
   * Получает время следующего выполнения
   * @param {string} schedule - Cron выражение
   * @param {string} timezone - Часовой пояс
   */
  getNextExecutionTime(schedule, timezone = 'UTC') {
    try {
      const now = new Date();
      const nextMinute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + 1, 0, 0);
      return nextMinute;
    } catch (error) {
      console.error('Error calculating next execution time:', error);
      return null;
    }
  }

  /**
   * Вычисляет среднее время выполнения
   * @param {number} currentExecutionTime - Текущее время выполнения
   */
  calculateAverageExecutionTime(currentExecutionTime) {
    const totalRuns = this.stats.successfulRuns + this.stats.failedRuns;
    if (totalRuns === 0) return currentExecutionTime;
    
    const currentAverage = this.stats.averageExecutionTime;
    return (currentAverage * (totalRuns - 1) + currentExecutionTime) / totalRuns;
  }

  /**
   * Логирует выполнение задачи в базу данных
   * @param {string} jobName - Имя задачи
   * @param {Object} executionData - Данные выполнения
   */
  async logTaskExecution(jobName, executionData) {
    try {
      // Здесь можно добавить логирование в базу данных
      // Например, создать модель TaskExecution
      console.log(`📝 Task execution logged: ${jobName} - ${executionData.status}`);
    } catch (error) {
      console.error('Error logging task execution:', error);
    }
  }

  /**
   * Получает статистику по собранным данным
   */
  async getScrapingStats() {
    try {
      const [
        totalCasinos,
        averageScore,
        ratingStats,
        latestUpdate
      ] = await Promise.all([
        CasinoScore.countDocuments(),
        CasinoScore.aggregate([
          { $group: { _id: null, avgScore: { $avg: '$score' } } }
        ]),
        CasinoScore.aggregate([
          { $group: { _id: '$rating', count: { $sum: 1 } } }
        ]),
        CasinoScore.findOne().sort('-scrapedAt').select('scrapedAt')
      ]);

      return {
        totalCasinos,
        averageScore: averageScore[0]?.avgScore || 0,
        ratingDistribution: ratingStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        lastUpdated: latestUpdate?.scrapedAt || null,
        schedulerStats: this.stats
      };
    } catch (error) {
      console.error('Error getting scraping stats:', error);
      throw error;
    }
  }

  /**
   * Очищает старые данные (опционально)
   * @param {number} daysToKeep - Количество дней для хранения данных
   */
  async cleanupOldData(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await CasinoScore.deleteMany({
        scrapedAt: { $lt: cutoffDate }
      });

      console.log(`🧹 Cleaned up ${result.deletedCount} old casino records`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      throw error;
    }
  }
}

module.exports = TaskScheduler;

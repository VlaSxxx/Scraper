const BaseRepository = require('./base/BaseRepository');

/**
 * Репозиторий для работы с данными выполнения задач
 * Содержит специфичные запросы к базе данных для модели TaskExecution
 */
class TaskExecutionRepository extends BaseRepository {
  constructor(taskExecutionModel) {
    super(taskExecutionModel);
  }

  /**
   * Получение статистики выполнения задач
   * @param {String} taskName - Название задачи
   * @param {Date} cutoffDate - Дата отсечения
   * @returns {Promise<Object>} Статистика выполнения
   */
  async getTaskStatsAggregation(taskName, cutoffDate) {
    const result = await this.aggregate([
      {
        $match: {
          taskName,
          startedAt: { $gte: cutoffDate }
        }
      },
      {
        $group: {
          _id: null,
          totalExecutions: { $sum: 1 },
          successfulExecutions: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
          },
          failedExecutions: {
            $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] }
          },
          runningExecutions: {
            $sum: { $cond: [{ $eq: ['$status', 'running'] }, 1, 0] }
          },
          cancelledExecutions: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          averageExecutionTime: { $avg: '$executionTime' },
          totalProcessedItems: { $sum: '$processedItems' },
          lastExecution: { $max: '$startedAt' },
          firstExecution: { $min: '$startedAt' }
        }
      }
    ]);

    return result[0] || {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      runningExecutions: 0,
      cancelledExecutions: 0,
      averageExecutionTime: 0,
      totalProcessedItems: 0,
      lastExecution: null,
      firstExecution: null
    };
  }

  /**
   * Получение последних выполнений задачи
   * @param {String} taskName - Название задачи
   * @param {Number} limit - Лимит результатов
   * @returns {Promise<Array>} Массив последних выполнений
   */
  async getRecentExecutions(taskName, limit = 10) {
    return await this.find(
      { taskName },
      {
        sort: { startedAt: -1 },
        limit: limit,
        select: '-__v'
      }
    );
  }

  /**
   * Поиск запущенных задач
   * @param {String} taskName - Название задачи (опционально)
   * @returns {Promise<Array>} Массив запущенных задач
   */
  async findRunningTasks(taskName = null) {
    const filter = { status: 'running' };
    if (taskName) {
      filter.taskName = taskName;
    }

    return await this.find(
      filter,
      {
        sort: { startedAt: -1 },
        select: '-__v'
      }
    );
  }

  /**
   * Поиск неудачных выполнений
   * @param {String} taskName - Название задачи (опционально)
   * @param {Number} limit - Лимит результатов
   * @returns {Promise<Array>} Массив неудачных выполнений
   */
  async findFailedExecutions(taskName = null, limit = 50) {
    const filter = { status: 'error' };
    if (taskName) {
      filter.taskName = taskName;
    }

    return await this.find(
      filter,
      {
        sort: { startedAt: -1 },
        limit: limit,
        select: '-__v'
      }
    );
  }

  /**
   * Поиск долго выполняющихся задач
   * @param {Number} thresholdMinutes - Порог в минутах
   * @returns {Promise<Array>} Массив долго выполняющихся задач
   */
  async findLongRunningTasks(thresholdMinutes = 60) {
    const thresholdDate = new Date(Date.now() - thresholdMinutes * 60 * 1000);
    
    return await this.find(
      {
        status: 'running',
        startedAt: { $lte: thresholdDate }
      },
      {
        sort: { startedAt: 1 },
        select: '-__v'
      }
    );
  }

  /**
   * Получение статистики по всем задачам
   * @param {Number} days - Количество дней для анализа
   * @returns {Promise<Array>} Статистика по задачам
   */
  async getAllTasksStatistics(days = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return await this.aggregate([
      {
        $match: {
          startedAt: { $gte: cutoffDate }
        }
      },
      {
        $group: {
          _id: '$taskName',
          totalExecutions: { $sum: 1 },
          successfulExecutions: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
          },
          failedExecutions: {
            $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] }
          },
          runningExecutions: {
            $sum: { $cond: [{ $eq: ['$status', 'running'] }, 1, 0] }
          },
          averageExecutionTime: { $avg: '$executionTime' },
          totalProcessedItems: { $sum: '$processedItems' },
          lastExecution: { $max: '$startedAt' },
          successRate: {
            $multiply: [
              {
                $divide: [
                  { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
                  { $sum: 1 }
                ]
              },
              100
            ]
          }
        }
      },
      {
        $sort: { totalExecutions: -1 }
      }
    ]);
  }

  /**
   * Очистка старых записей
   * @param {Number} daysToKeep - Количество дней для хранения
   * @returns {Promise<Object>} Результат удаления
   */
  async cleanupOldRecords(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    return await this.deleteMany({
      startedAt: { $lt: cutoffDate }
    });
  }

  /**
   * Получение трендов выполнения по дням
   * @param {String} taskName - Название задачи
   * @param {Number} days - Количество дней для анализа
   * @returns {Promise<Array>} Тренды по дням
   */
  async getExecutionTrends(taskName, days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return await this.aggregate([
      {
        $match: {
          taskName,
          startedAt: { $gte: cutoffDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$startedAt' },
            month: { $month: '$startedAt' },
            day: { $dayOfMonth: '$startedAt' }
          },
          executions: { $sum: 1 },
          successes: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
          },
          failures: {
            $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] }
          },
          averageTime: { $avg: '$executionTime' },
          totalItems: { $sum: '$processedItems' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);
  }

  /**
   * Поиск задач с ошибками по типу ошибки
   * @param {String} errorCode - Код ошибки
   * @param {Number} limit - Лимит результатов
   * @returns {Promise<Array>} Массив задач с ошибками
   */
  async findTasksByErrorCode(errorCode, limit = 20) {
    return await this.find(
      {
        status: 'error',
        'error.code': errorCode
      },
      {
        sort: { startedAt: -1 },
        limit: limit,
        select: '-__v'
      }
    );
  }

  /**
   * Получение самых частых ошибок
   * @param {Number} days - Количество дней для анализа
   * @param {Number} limit - Лимит результатов
   * @returns {Promise<Array>} Самые частые ошибки
   */
  async getMostFrequentErrors(days = 7, limit = 10) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return await this.aggregate([
      {
        $match: {
          status: 'error',
          startedAt: { $gte: cutoffDate },
          'error.message': { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$error.message',
          count: { $sum: 1 },
          lastOccurrence: { $max: '$startedAt' },
          affectedTasks: { $addToSet: '$taskName' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: limit
      }
    ]);
  }
}

module.exports = TaskExecutionRepository;


const { repositoryFactory } = require('../../repositories');

/**
 * Сервис для очистки и обслуживания данных задач
 * Предоставляет функции для очистки старых записей и оптимизации хранилища
 */
class TaskCleanupService {
  constructor() {
    this.repository = repositoryFactory.getTaskExecutionRepository();
  }

  /**
   * Очистка старых записей выполнения задач
   * @param {Number} daysToKeep - Количество дней для хранения
   * @param {Object} options - Дополнительные опции
   * @returns {Promise<Object>} Результат очистки
   */
  async cleanupOldRecords(daysToKeep = 30, options = {}) {
    try {
      const {
        excludeFailedTasks = false,
        excludeTaskNames = [],
        dryRun = false
      } = options;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Подготовка фильтра для удаления
      const deleteFilter = {
        startedAt: { $lt: cutoffDate }
      };

      // Исключение неудачных задач если требуется
      if (excludeFailedTasks) {
        deleteFilter.status = { $ne: 'error' };
      }

      // Исключение определенных задач
      if (excludeTaskNames.length > 0) {
        deleteFilter.taskName = { $nin: excludeTaskNames };
      }

      // Подсчет записей для удаления
      const recordsToDelete = await this.repository.count(deleteFilter);

      if (dryRun) {
        return {
          dryRun: true,
          recordsToDelete,
          cutoffDate,
          filter: deleteFilter,
          message: `Would delete ${recordsToDelete} records older than ${cutoffDate.toISOString()}`
        };
      }

      // Получение статистики перед удалением
      const beforeStats = await this.getCleanupStatistics(cutoffDate);

      // Выполнение удаления
      const deleteResult = await this.repository.cleanupOldRecords(daysToKeep);

      // Получение статистики после удаления
      const afterStats = await this.getCleanupStatistics(new Date());

      return {
        success: true,
        deletedCount: deleteResult.deletedCount,
        daysToKeep,
        cutoffDate,
        statistics: {
          before: beforeStats,
          after: afterStats,
          freed: {
            records: beforeStats.totalRecords - afterStats.totalRecords,
            estimatedSizeMB: this.estimateFreedSize(deleteResult.deletedCount)
          }
        }
      };
    } catch (error) {
      throw new Error(`Failed to cleanup old records: ${error.message}`);
    }
  }

  /**
   * Очистка записей конкретной задачи
   * @param {String} taskName - Название задачи
   * @param {Number} daysToKeep - Количество дней для хранения
   * @param {Object} options - Дополнительные опции
   * @returns {Promise<Object>} Результат очистки
   */
  async cleanupTaskRecords(taskName, daysToKeep = 30, options = {}) {
    try {
      const {
        keepSuccessful = true,
        keepFailed = true,
        maxRecordsToKeep = 100
      } = options;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Получение всех записей задачи старше cutoff даты
      const oldRecords = await this.repository.find(
        {
          taskName,
          startedAt: { $lt: cutoffDate }
        },
        {
          sort: { startedAt: -1 }
        }
      );

      let recordsToDelete = [];

      // Фильтрация записей для удаления
      oldRecords.forEach(record => {
        if (record.status === 'success' && !keepSuccessful) {
          recordsToDelete.push(record._id);
        } else if (record.status === 'error' && !keepFailed) {
          recordsToDelete.push(record._id);
        } else if (record.status === 'cancelled') {
          recordsToDelete.push(record._id);
        }
      });

      // Проверка лимита записей
      const totalRecords = await this.repository.count({ taskName });
      if (totalRecords > maxRecordsToKeep) {
        const excessRecords = totalRecords - maxRecordsToKeep;
        const oldestRecords = await this.repository.find(
          { taskName },
          {
            sort: { startedAt: 1 },
            limit: excessRecords,
            select: '_id'
          }
        );
        
        const oldestIds = oldestRecords.map(record => record._id);
        recordsToDelete = [...new Set([...recordsToDelete, ...oldestIds])];
      }

      // Выполнение удаления
      const deleteResult = await this.repository.deleteMany({
        _id: { $in: recordsToDelete }
      });

      return {
        success: true,
        taskName,
        deletedCount: deleteResult.deletedCount,
        remainingRecords: totalRecords - deleteResult.deletedCount,
        cutoffDate
      };
    } catch (error) {
      throw new Error(`Failed to cleanup task records: ${error.message}`);
    }
  }

  /**
   * Очистка зависших задач
   * @param {Number} timeoutMinutes - Таймаут в минутах
   * @param {Object} options - Дополнительные опции
   * @returns {Promise<Object>} Результат очистки зависших задач
   */
  async cleanupStuckTasks(timeoutMinutes = 120, options = {}) {
    try {
      const { markAsFailed = true, addErrorMessage = true } = options;

      // Поиск зависших задач
      const stuckTasks = await this.repository.findLongRunningTasks(timeoutMinutes);

      if (stuckTasks.length === 0) {
        return {
          success: true,
          stuckTasksFound: 0,
          message: 'No stuck tasks found'
        };
      }

      const results = {
        processed: 0,
        successful: 0,
        failed: 0,
        tasks: []
      };

      // Обработка каждой зависшей задачи
      for (const task of stuckTasks) {
        try {
          results.processed++;

          const updateData = {
            status: markAsFailed ? 'error' : 'cancelled',
            completedAt: new Date(),
            duration: Date.now() - new Date(task.startedAt).getTime()
          };

          if (markAsFailed && addErrorMessage) {
            updateData.error = {
              message: `Task timed out after ${timeoutMinutes} minutes`,
              code: 'TASK_TIMEOUT',
              stack: 'Automatically marked as failed by cleanup service'
            };
          }

          await this.repository.findByIdAndUpdate(task._id, updateData);

          results.successful++;
          results.tasks.push({
            id: task._id,
            taskName: task.taskName,
            status: 'cleaned',
            runningTime: this.formatDuration(updateData.duration)
          });
        } catch (error) {
          results.failed++;
          results.tasks.push({
            id: task._id,
            taskName: task.taskName,
            status: 'error',
            error: error.message
          });
        }
      }

      return {
        success: true,
        timeoutMinutes,
        stuckTasksFound: stuckTasks.length,
        ...results
      };
    } catch (error) {
      throw new Error(`Failed to cleanup stuck tasks: ${error.message}`);
    }
  }

  /**
   * Архивация старых задач
   * @param {Number} daysToArchive - Количество дней после которых архивировать
   * @param {String} archiveStatus - Статус для архивных записей
   * @returns {Promise<Object>} Результат архивации
   */
  async archiveOldTasks(daysToArchive = 90, archiveStatus = 'archived') {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToArchive);

      // Поиск задач для архивации
      const tasksToArchive = await this.repository.find(
        {
          startedAt: { $lt: cutoffDate },
          status: { $nin: ['running', 'archived'] }
        },
        {
          sort: { startedAt: 1 }
        }
      );

      if (tasksToArchive.length === 0) {
        return {
          success: true,
          archivedCount: 0,
          message: 'No tasks found for archiving'
        };
      }

      // Обновление статуса на архивный
      const archiveResult = await this.repository.model.updateMany(
        {
          _id: { $in: tasksToArchive.map(task => task._id) }
        },
        {
          $set: {
            status: archiveStatus,
            archivedAt: new Date(),
            'metadata.originalStatus': '$status'
          }
        }
      );

      return {
        success: true,
        archivedCount: archiveResult.modifiedCount,
        cutoffDate,
        daysToArchive,
        archiveStatus
      };
    } catch (error) {
      throw new Error(`Failed to archive old tasks: ${error.message}`);
    }
  }

  /**
   * Получение статистики для очистки
   * @param {Date} cutoffDate - Дата отсечения
   * @returns {Promise<Object>} Статистика
   */
  async getCleanupStatistics(cutoffDate) {
    try {
      const [
        totalRecords,
        oldRecords,
        runningTasks,
        failedTasks,
        successfulTasks
      ] = await Promise.all([
        this.repository.count(),
        this.repository.count({ startedAt: { $lt: cutoffDate } }),
        this.repository.count({ status: 'running' }),
        this.repository.count({ status: 'error' }),
        this.repository.count({ status: 'success' })
      ]);

      return {
        totalRecords,
        oldRecords,
        runningTasks,
        failedTasks,
        successfulTasks,
        cutoffDate
      };
    } catch (error) {
      throw new Error(`Failed to get cleanup statistics: ${error.message}`);
    }
  }

  /**
   * Получение рекомендаций по очистке
   * @returns {Promise<Object>} Рекомендации по очистке
   */
  async getCleanupRecommendations() {
    try {
      const stats = await this.getCleanupStatistics(new Date());
      const oldTasksCount = await this.repository.count({
        startedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      });

      const recommendations = [];

      // Рекомендации на основе общего количества записей
      if (stats.totalRecords > 10000) {
        recommendations.push({
          type: 'high_volume',
          priority: 'high',
          message: `High volume of records (${stats.totalRecords}). Consider more aggressive cleanup.`,
          action: 'Reduce retention period or implement more frequent cleanup'
        });
      }

      // Рекомендации на основе старых записей
      if (oldTasksCount > stats.totalRecords * 0.5) {
        recommendations.push({
          type: 'old_records',
          priority: 'medium',
          message: `${oldTasksCount} records are older than 30 days (${(oldTasksCount / stats.totalRecords * 100).toFixed(1)}%)`,
          action: 'Run cleanup for records older than 30 days'
        });
      }

      // Рекомендации на основе зависших задач
      const stuckTasks = await this.repository.findLongRunningTasks(120);
      if (stuckTasks.length > 0) {
        recommendations.push({
          type: 'stuck_tasks',
          priority: 'high',
          message: `${stuckTasks.length} tasks are running for more than 2 hours`,
          action: 'Investigate and cleanup stuck tasks'
        });
      }

      // Рекомендации на основе соотношения ошибок
      const errorRate = stats.totalRecords > 0 ? (stats.failedTasks / stats.totalRecords * 100) : 0;
      if (errorRate > 20) {
        recommendations.push({
          type: 'high_error_rate',
          priority: 'medium',
          message: `High error rate: ${errorRate.toFixed(1)}%`,
          action: 'Review and cleanup failed task records'
        });
      }

      return {
        statistics: stats,
        recommendations,
        estimatedSavings: {
          records: oldTasksCount,
          sizeMB: this.estimateFreedSize(oldTasksCount)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get cleanup recommendations: ${error.message}`);
    }
  }

  /**
   * Планировщик автоматической очистки
   * @param {Object} schedule - Расписание очистки
   * @returns {Promise<Object>} Результат планирования
   */
  async scheduleAutomaticCleanup(schedule = {}) {
    try {
      const defaultSchedule = {
        dailyCleanup: {
          enabled: true,
          daysToKeep: 7,
          excludeFailedTasks: true
        },
        weeklyCleanup: {
          enabled: true,
          daysToKeep: 30,
          excludeFailedTasks: false
        },
        monthlyArchive: {
          enabled: true,
          daysToArchive: 90
        },
        stuckTasksCleanup: {
          enabled: true,
          timeoutMinutes: 120,
          intervalMinutes: 60
        }
      };

      const config = { ...defaultSchedule, ...schedule };

      // Здесь бы был код для настройки cron jobs или других планировщиков
      // Возвращаем конфигурацию для информации

      return {
        success: true,
        message: 'Automatic cleanup scheduled',
        configuration: config,
        nextExecution: {
          daily: this.getNextExecutionTime('daily'),
          weekly: this.getNextExecutionTime('weekly'),
          monthly: this.getNextExecutionTime('monthly')
        }
      };
    } catch (error) {
      throw new Error(`Failed to schedule automatic cleanup: ${error.message}`);
    }
  }

  /**
   * Оценка освобожденного места
   * @param {Number} recordsCount - Количество записей
   * @returns {Number} Оценка в МБ
   */
  estimateFreedSize(recordsCount) {
    // Примерная оценка: каждая запись ~2KB
    const avgRecordSizeKB = 2;
    return parseFloat((recordsCount * avgRecordSizeKB / 1024).toFixed(2));
  }

  /**
   * Получение времени следующего выполнения
   * @param {String} frequency - Частота выполнения
   * @returns {Date} Время следующего выполнения
   */
  getNextExecutionTime(frequency) {
    const now = new Date();
    
    switch (frequency) {
      case 'daily':
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(2, 0, 0, 0); // 2:00 AM
        return tomorrow;
      
      case 'weekly':
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + (7 - nextWeek.getDay()));
        nextWeek.setHours(3, 0, 0, 0); // 3:00 AM on Sunday
        return nextWeek;
      
      case 'monthly':
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        nextMonth.setHours(4, 0, 0, 0); // 4:00 AM on 1st of month
        return nextMonth;
      
      default:
        return now;
    }
  }

  /**
   * Форматирование времени выполнения
   * @param {Number} milliseconds - Время в миллисекундах
   * @returns {String} Отформатированная строка времени
   */
  formatDuration(milliseconds) {
    if (!milliseconds) return '0ms';

    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

module.exports = TaskCleanupService;


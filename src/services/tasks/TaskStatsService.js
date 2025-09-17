const { repositoryFactory } = require('../../repositories');

/**
 * Сервис для статистики задач
 * Предоставляет аналитические данные по выполнению задач
 */
class TaskStatsService {
  constructor() {
    this.repository = repositoryFactory.getTaskExecutionRepository();
  }

  /**
   * Получение статистики для конкретной задачи
   * @param {String} taskName - Название задачи
   * @param {Number} days - Количество дней для анализа
   * @returns {Promise<Object>} Статистика задачи
   */
  async getTaskStatistics(taskName, days = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const rawStats = await this.repository.getTaskStatsAggregation(taskName, cutoffDate);
      
      return {
        taskName,
        period: `${days} days`,
        ...rawStats,
        successRate: this.calculateSuccessRate(rawStats),
        averageExecutionTimeFormatted: this.formatDuration(rawStats.averageExecutionTime),
        performanceGrade: this.calculatePerformanceGrade(rawStats),
        trends: await this.getTaskTrends(taskName, days)
      };
    } catch (error) {
      throw new Error(`Failed to get task statistics: ${error.message}`);
    }
  }

  /**
   * Получение общей статистики по всем задачам
   * @param {Number} days - Количество дней для анализа
   * @returns {Promise<Object>} Общая статистика
   */
  async getAllTasksStatistics(days = 7) {
    try {
      const allTasksStats = await this.repository.getAllTasksStatistics(days);
      
      const summary = allTasksStats.reduce((acc, task) => ({
        totalExecutions: acc.totalExecutions + task.totalExecutions,
        totalSuccessful: acc.totalSuccessful + task.successfulExecutions,
        totalFailed: acc.totalFailed + task.failedExecutions,
        totalRunning: acc.totalRunning + task.runningExecutions,
        totalProcessedItems: acc.totalProcessedItems + task.totalProcessedItems
      }), {
        totalExecutions: 0,
        totalSuccessful: 0,
        totalFailed: 0,
        totalRunning: 0,
        totalProcessedItems: 0
      });

      return {
        period: `${days} days`,
        summary: {
          ...summary,
          successRate: this.calculateSuccessRate({
            successfulExecutions: summary.totalSuccessful,
            totalExecutions: summary.totalExecutions
          }),
          uniqueTasks: allTasksStats.length
        },
        taskBreakdown: allTasksStats.map(task => ({
          taskName: task._id,
          executions: task.totalExecutions,
          successRate: parseFloat(task.successRate?.toFixed(2) || 0),
          averageExecutionTime: this.formatDuration(task.averageExecutionTime),
          totalProcessedItems: task.totalProcessedItems,
          lastExecution: task.lastExecution,
          performanceGrade: this.calculatePerformanceGrade(task)
        }))
      };
    } catch (error) {
      throw new Error(`Failed to get all tasks statistics: ${error.message}`);
    }
  }

  /**
   * Получение трендов выполнения задачи по дням
   * @param {String} taskName - Название задачи
   * @param {Number} days - Количество дней для анализа
   * @returns {Promise<Array>} Тренды по дням
   */
  async getTaskTrends(taskName, days = 30) {
    try {
      const trends = await this.repository.getExecutionTrends(taskName, days);
      
      return trends.map(trend => ({
        date: `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}-${String(trend._id.day).padStart(2, '0')}`,
        executions: trend.executions,
        successes: trend.successes,
        failures: trend.failures,
        successRate: trend.executions > 0 ? (trend.successes / trend.executions * 100).toFixed(2) : 0,
        averageTime: this.formatDuration(trend.averageTime),
        totalItems: trend.totalItems
      }));
    } catch (error) {
      throw new Error(`Failed to get task trends: ${error.message}`);
    }
  }

  /**
   * Анализ ошибок в задачах
   * @param {Number} days - Количество дней для анализа
   * @returns {Promise<Object>} Анализ ошибок
   */
  async getErrorAnalysis(days = 7) {
    try {
      const frequentErrors = await this.repository.getMostFrequentErrors(days, 10);
      
      const errorSummary = frequentErrors.reduce((acc, error) => ({
        totalErrors: acc.totalErrors + error.count,
        uniqueErrors: acc.uniqueErrors + 1,
        affectedTasks: new Set([...acc.affectedTasks, ...error.affectedTasks])
      }), {
        totalErrors: 0,
        uniqueErrors: 0,
        affectedTasks: new Set()
      });

      return {
        period: `${days} days`,
        summary: {
          totalErrors: errorSummary.totalErrors,
          uniqueErrorTypes: errorSummary.uniqueErrors,
          affectedTasksCount: errorSummary.affectedTasks.size
        },
        mostFrequentErrors: frequentErrors.map(error => ({
          message: error._id,
          occurrences: error.count,
          lastOccurrence: error.lastOccurrence,
          affectedTasks: error.affectedTasks,
          affectedTasksCount: error.affectedTasks.length
        })),
        recommendations: this.generateErrorRecommendations(frequentErrors)
      };
    } catch (error) {
      throw new Error(`Failed to get error analysis: ${error.message}`);
    }
  }

  /**
   * Получение метрик производительности
   * @param {String} taskName - Название задачи (опционально)
   * @param {Number} days - Количество дней для анализа
   * @returns {Promise<Object>} Метрики производительности
   */
  async getPerformanceMetrics(taskName = null, days = 7) {
    try {
      let stats;
      if (taskName) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        stats = await this.repository.getTaskStatsAggregation(taskName, cutoffDate);
      } else {
        const allStats = await this.repository.getAllTasksStatistics(days);
        stats = this.aggregateAllTasksStats(allStats);
      }

      const performance = {
        reliability: {
          successRate: this.calculateSuccessRate(stats),
          failureRate: this.calculateFailureRate(stats),
          grade: this.calculateReliabilityGrade(stats)
        },
        efficiency: {
          averageExecutionTime: stats.averageExecutionTime || 0,
          averageExecutionTimeFormatted: this.formatDuration(stats.averageExecutionTime),
          averageItemsPerExecution: stats.totalExecutions > 0 ? 
            (stats.totalProcessedItems / stats.totalExecutions).toFixed(2) : 0,
          throughput: this.calculateThroughput(stats, days)
        },
        availability: {
          totalExecutions: stats.totalExecutions,
          runningTasks: stats.runningExecutions || 0,
          uptime: this.calculateUptime(stats)
        }
      };

      return {
        taskName: taskName || 'All Tasks',
        period: `${days} days`,
        ...performance,
        overallGrade: this.calculateOverallGrade(performance)
      };
    } catch (error) {
      throw new Error(`Failed to get performance metrics: ${error.message}`);
    }
  }

  /**
   * Сравнение производительности задач
   * @param {Array} taskNames - Массив названий задач для сравнения
   * @param {Number} days - Количество дней для анализа
   * @returns {Promise<Object>} Сравнительный анализ
   */
  async compareTasksPerformance(taskNames, days = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const comparisons = await Promise.all(
        taskNames.map(async (taskName) => {
          const stats = await this.repository.getTaskStatsAggregation(taskName, cutoffDate);
          return {
            taskName,
            ...stats,
            successRate: this.calculateSuccessRate(stats),
            performanceGrade: this.calculatePerformanceGrade(stats),
            averageExecutionTimeFormatted: this.formatDuration(stats.averageExecutionTime)
          };
        })
      );

      // Находим лучшие и худшие показатели
      const bestPerformer = comparisons.reduce((best, current) => 
        current.successRate > best.successRate ? current : best
      );

      const worstPerformer = comparisons.reduce((worst, current) => 
        current.successRate < worst.successRate ? current : worst
      );

      const fastestTask = comparisons.reduce((fastest, current) => 
        (current.averageExecutionTime || Infinity) < (fastest.averageExecutionTime || Infinity) ? current : fastest
      );

      return {
        period: `${days} days`,
        tasks: comparisons,
        insights: {
          bestPerformer: bestPerformer.taskName,
          worstPerformer: worstPerformer.taskName,
          fastestTask: fastestTask.taskName,
          totalExecutions: comparisons.reduce((sum, task) => sum + task.totalExecutions, 0),
          averageSuccessRate: (comparisons.reduce((sum, task) => sum + task.successRate, 0) / comparisons.length).toFixed(2)
        }
      };
    } catch (error) {
      throw new Error(`Failed to compare tasks performance: ${error.message}`);
    }
  }

  /**
   * Расчет коэффициента успеха
   * @param {Object} stats - Статистика задачи
   * @returns {Number} Коэффициент успеха в процентах
   */
  calculateSuccessRate(stats) {
    if (!stats.totalExecutions || stats.totalExecutions === 0) return 0;
    return parseFloat(((stats.successfulExecutions / stats.totalExecutions) * 100).toFixed(2));
  }

  /**
   * Расчет коэффициента неудач
   * @param {Object} stats - Статистика задачи
   * @returns {Number} Коэффициент неудач в процентах
   */
  calculateFailureRate(stats) {
    if (!stats.totalExecutions || stats.totalExecutions === 0) return 0;
    return parseFloat(((stats.failedExecutions / stats.totalExecutions) * 100).toFixed(2));
  }

  /**
   * Расчет пропускной способности
   * @param {Object} stats - Статистика задачи
   * @param {Number} days - Количество дней
   * @returns {Number} Пропускная способность (элементов в день)
   */
  calculateThroughput(stats, days) {
    if (!stats.totalProcessedItems || days === 0) return 0;
    return parseFloat((stats.totalProcessedItems / days).toFixed(2));
  }

  /**
   * Расчет времени бесперебойной работы
   * @param {Object} stats - Статистика задачи
   * @returns {Number} Время бесперебойной работы в процентах
   */
  calculateUptime(stats) {
    const totalNonCancelled = stats.totalExecutions - (stats.cancelledExecutions || 0);
    if (totalNonCancelled === 0) return 100;
    return parseFloat(((stats.successfulExecutions / totalNonCancelled) * 100).toFixed(2));
  }

  /**
   * Расчет общей оценки производительности
   * @param {Object} stats - Статистика задачи
   * @returns {String} Оценка производительности
   */
  calculatePerformanceGrade(stats) {
    const successRate = this.calculateSuccessRate(stats);
    
    if (successRate >= 95) return 'A+';
    if (successRate >= 90) return 'A';
    if (successRate >= 85) return 'B+';
    if (successRate >= 80) return 'B';
    if (successRate >= 70) return 'C+';
    if (successRate >= 60) return 'C';
    if (successRate >= 50) return 'D';
    return 'F';
  }

  /**
   * Расчет оценки надежности
   * @param {Object} stats - Статистика задачи
   * @returns {String} Оценка надежности
   */
  calculateReliabilityGrade(stats) {
    const uptime = this.calculateUptime(stats);
    
    if (uptime >= 99.9) return 'Excellent';
    if (uptime >= 99.5) return 'Very Good';
    if (uptime >= 99) return 'Good';
    if (uptime >= 95) return 'Fair';
    return 'Poor';
  }

  /**
   * Расчет общей оценки
   * @param {Object} performance - Метрики производительности
   * @returns {String} Общая оценка
   */
  calculateOverallGrade(performance) {
    const successRate = performance.reliability.successRate;
    const uptime = performance.availability.uptime;
    
    const overallScore = (successRate + uptime) / 2;
    
    if (overallScore >= 95) return 'A+';
    if (overallScore >= 90) return 'A';
    if (overallScore >= 85) return 'B+';
    if (overallScore >= 80) return 'B';
    if (overallScore >= 70) return 'C';
    return 'D';
  }

  /**
   * Агрегация статистики всех задач
   * @param {Array} allStats - Массив статистик задач
   * @returns {Object} Агрегированная статистика
   */
  aggregateAllTasksStats(allStats) {
    return allStats.reduce((acc, task) => ({
      totalExecutions: acc.totalExecutions + task.totalExecutions,
      successfulExecutions: acc.successfulExecutions + task.successfulExecutions,
      failedExecutions: acc.failedExecutions + task.failedExecutions,
      runningExecutions: acc.runningExecutions + (task.runningExecutions || 0),
      cancelledExecutions: acc.cancelledExecutions + (task.cancelledExecutions || 0),
      totalProcessedItems: acc.totalProcessedItems + task.totalProcessedItems,
      averageExecutionTime: (acc.averageExecutionTime + (task.averageExecutionTime || 0)) / 2
    }), {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      runningExecutions: 0,
      cancelledExecutions: 0,
      totalProcessedItems: 0,
      averageExecutionTime: 0
    });
  }

  /**
   * Генерация рекомендаций на основе ошибок
   * @param {Array} errors - Массив ошибок
   * @returns {Array} Массив рекомендаций
   */
  generateErrorRecommendations(errors) {
    const recommendations = [];

    errors.forEach(error => {
      const message = error._id.toLowerCase();
      
      if (message.includes('timeout') || message.includes('connection')) {
        recommendations.push('Consider increasing timeout values or implementing retry mechanisms');
      }
      
      if (message.includes('memory') || message.includes('heap')) {
        recommendations.push('Monitor memory usage and consider optimizing data processing');
      }
      
      if (message.includes('permission') || message.includes('unauthorized')) {
        recommendations.push('Check authentication and authorization configurations');
      }
      
      if (message.includes('network') || message.includes('fetch')) {
        recommendations.push('Implement network error handling and retry policies');
      }
    });

    return [...new Set(recommendations)]; // Удаляем дубликаты
  }

  /**
   * Форматирование времени выполнения
   * @param {Number} milliseconds - Время в миллисекундах
   * @returns {String} Отформатированная строка времени
   */
  formatDuration(milliseconds) {
    if (!milliseconds || milliseconds === 0) return '0ms';

    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else if (seconds > 0) {
      return `${seconds}s`;
    } else {
      return `${Math.round(milliseconds)}ms`;
    }
  }
}

module.exports = TaskStatsService;


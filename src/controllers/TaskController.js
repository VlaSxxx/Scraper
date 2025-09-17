const { serviceFactory } = require('../services');

/**
 * Контроллер для обработки HTTP запросов связанных с задачами
 * Использует сервисы для выполнения бизнес-логики
 */
class TaskController {
  constructor() {
    this.taskService = serviceFactory.getTaskExecutionService();
    this.statsService = serviceFactory.getTaskStatsService();
    this.cleanupService = serviceFactory.getTaskCleanupService();
  }

  /**
   * Получение списка задач с фильтрацией
   * GET /api/tasks
   */
  async getTasks(req, res, next) {
    try {
      const filters = {
        taskName: req.query.taskName,
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        hasError: req.query.hasError === 'true',
        minProcessedItems: req.query.minProcessedItems ? parseInt(req.query.minProcessedItems) : undefined,
        maxExecutionTime: req.query.maxExecutionTime ? parseInt(req.query.maxExecutionTime) : undefined
      };

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sortBy: req.query.sortBy || 'startedAt',
        sortOrder: req.query.sortOrder || 'desc'
      };

      const result = await this.taskService.searchTasks(filters, options);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение информации о конкретной задаче
   * GET /api/tasks/:id
   */
  async getTaskById(req, res, next) {
    try {
      const { id } = req.params;
      const task = await this.taskService.repository.findById(id);
      
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      const formattedTask = this.taskService.formatTaskForResponse(task);
      
      res.status(200).json({
        success: true,
        data: formattedTask
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Создание новой задачи
   * POST /api/tasks
   */
  async createTask(req, res, next) {
    try {
      const { taskName, metadata } = req.body;

      if (!taskName || typeof taskName !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Task name is required and must be a string'
        });
      }

      const task = await this.taskService.createTaskExecution(taskName, metadata || {});
      
      res.status(201).json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Завершение задачи
   * PATCH /api/tasks/:id/complete
   */
  async completeTask(req, res, next) {
    try {
      const { id } = req.params;
      const { status, processedItems, error, metadata } = req.body;

      const validStatuses = ['success', 'error', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Status must be one of: ${validStatuses.join(', ')}`
        });
      }

      const completionData = {
        processedItems: processedItems || 0,
        metadata: metadata || {}
      };

      if (status === 'error' && error) {
        completionData.error = error;
      }

      const task = await this.taskService.completeTask(id, status, completionData);
      
      res.status(200).json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Обновление прогресса задачи
   * PATCH /api/tasks/:id/progress
   */
  async updateProgress(req, res, next) {
    try {
      const { id } = req.params;
      const { processedItems, metadata } = req.body;

      const progressData = {};
      
      if (processedItems !== undefined) {
        progressData.processedItems = parseInt(processedItems);
      }
      
      if (metadata) {
        progressData.metadata = metadata;
      }

      const task = await this.taskService.updateTaskProgress(id, progressData);
      
      res.status(200).json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Отмена задачи
   * PATCH /api/tasks/:id/cancel
   */
  async cancelTask(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const task = await this.taskService.cancelTask(id, reason);
      
      res.status(200).json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Повторный запуск неудачной задачи
   * POST /api/tasks/:id/retry
   */
  async retryTask(req, res, next) {
    try {
      const { id } = req.params;
      const { metadata } = req.body;

      const newTask = await this.taskService.retryFailedTask(id, metadata || {});
      
      res.status(201).json({
        success: true,
        data: newTask
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение задач по статусу
   * GET /api/tasks/status/:status
   */
  async getTasksByStatus(req, res, next) {
    try {
      const { status } = req.params;
      const options = {
        limit: parseInt(req.query.limit) || 50,
        taskName: req.query.taskName
      };

      const tasks = await this.taskService.getTasksByStatus(status, options);
      
      res.status(200).json({
        success: true,
        data: tasks
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение долго выполняющихся задач
   * GET /api/tasks/long-running
   */
  async getLongRunningTasks(req, res, next) {
    try {
      const thresholdMinutes = parseInt(req.query.threshold) || 60;
      const tasks = await this.taskService.getLongRunningTasks(thresholdMinutes);
      
      res.status(200).json({
        success: true,
        data: tasks
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение недавних выполнений задачи
   * GET /api/tasks/recent/:taskName
   */
  async getRecentExecutions(req, res, next) {
    try {
      const { taskName } = req.params;
      const limit = parseInt(req.query.limit) || 10;

      const executions = await this.taskService.getRecentExecutions(taskName, limit);
      
      res.status(200).json({
        success: true,
        data: executions
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Массовое обновление статуса задач
   * PATCH /api/tasks/bulk-update
   */
  async bulkUpdateStatus(req, res, next) {
    try {
      const { taskIds, status, updateData } = req.body;

      if (!Array.isArray(taskIds) || taskIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Task IDs array is required'
        });
      }

      const validStatuses = ['success', 'error', 'cancelled', 'running'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Status must be one of: ${validStatuses.join(', ')}`
        });
      }

      const result = await this.taskService.bulkUpdateTaskStatus(taskIds, status, updateData || {});
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение статистики задачи
   * GET /api/tasks/stats/:taskName
   */
  async getTaskStatistics(req, res, next) {
    try {
      const { taskName } = req.params;
      const days = parseInt(req.query.days) || 7;

      const stats = await this.statsService.getTaskStatistics(taskName, days);
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение общей статистики всех задач
   * GET /api/tasks/stats/all
   */
  async getAllTasksStatistics(req, res, next) {
    try {
      const days = parseInt(req.query.days) || 7;

      const stats = await this.statsService.getAllTasksStatistics(days);
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение трендов выполнения задачи
   * GET /api/tasks/trends/:taskName
   */
  async getTaskTrends(req, res, next) {
    try {
      const { taskName } = req.params;
      const days = parseInt(req.query.days) || 30;

      const trends = await this.statsService.getTaskTrends(taskName, days);
      
      res.status(200).json({
        success: true,
        data: trends
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение анализа ошибок
   * GET /api/tasks/analytics/errors
   */
  async getErrorAnalysis(req, res, next) {
    try {
      const days = parseInt(req.query.days) || 7;

      const analysis = await this.statsService.getErrorAnalysis(days);
      
      res.status(200).json({
        success: true,
        data: analysis
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение метрик производительности
   * GET /api/tasks/analytics/performance
   */
  async getPerformanceMetrics(req, res, next) {
    try {
      const taskName = req.query.taskName;
      const days = parseInt(req.query.days) || 7;

      const metrics = await this.statsService.getPerformanceMetrics(taskName, days);
      
      res.status(200).json({
        success: true,
        data: metrics
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Сравнение производительности задач
   * POST /api/tasks/analytics/compare
   */
  async compareTasksPerformance(req, res, next) {
    try {
      const { taskNames } = req.body;
      const days = parseInt(req.query.days) || 7;

      if (!Array.isArray(taskNames) || taskNames.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'At least 2 task names are required for comparison'
        });
      }

      const comparison = await this.statsService.compareTasksPerformance(taskNames, days);
      
      res.status(200).json({
        success: true,
        data: comparison
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Очистка старых записей
   * DELETE /api/tasks/cleanup/old
   */
  async cleanupOldRecords(req, res, next) {
    try {
      const daysToKeep = parseInt(req.query.daysToKeep) || 30;
      const options = {
        excludeFailedTasks: req.query.excludeFailedTasks === 'true',
        excludeTaskNames: req.query.excludeTaskNames ? req.query.excludeTaskNames.split(',') : [],
        dryRun: req.query.dryRun === 'true'
      };

      const result = await this.cleanupService.cleanupOldRecords(daysToKeep, options);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Очистка зависших задач
   * DELETE /api/tasks/cleanup/stuck
   */
  async cleanupStuckTasks(req, res, next) {
    try {
      const timeoutMinutes = parseInt(req.query.timeout) || 120;
      const options = {
        markAsFailed: req.query.markAsFailed !== 'false',
        addErrorMessage: req.query.addErrorMessage !== 'false'
      };

      const result = await this.cleanupService.cleanupStuckTasks(timeoutMinutes, options);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение рекомендаций по очистке
   * GET /api/tasks/cleanup/recommendations
   */
  async getCleanupRecommendations(req, res, next) {
    try {
      const recommendations = await this.cleanupService.getCleanupRecommendations();
      
      res.status(200).json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Архивация старых задач
   * POST /api/tasks/archive
   */
  async archiveOldTasks(req, res, next) {
    try {
      const daysToArchive = parseInt(req.body.daysToArchive) || 90;
      const archiveStatus = req.body.archiveStatus || 'archived';

      const result = await this.cleanupService.archiveOldTasks(daysToArchive, archiveStatus);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TaskController;


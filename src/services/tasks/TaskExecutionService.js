const { repositoryFactory } = require('../../repositories');

/**
 * Сервис для управления выполнением задач
 * Содержит бизнес-логику для работы с задачами
 */
class TaskExecutionService {
  constructor() {
    this.repository = repositoryFactory.getTaskExecutionRepository();
  }

  /**
   * Создание новой записи выполнения задачи
   * @param {String} taskName - Название задачи
   * @param {Object} metadata - Дополнительные метаданные
   * @returns {Promise<Object>} Созданная запись
   */
  async createTaskExecution(taskName, metadata = {}) {
    try {
      const taskData = {
        taskName,
        status: 'running',
        executionTime: 0,
        processedItems: 0,
        metadata,
        startedAt: new Date()
      };

      const task = await this.repository.create(taskData);
      return this.formatTaskForResponse(task);
    } catch (error) {
      throw new Error(`Failed to create task execution: ${error.message}`);
    }
  }

  /**
   * Завершение выполнения задачи
   * @param {String} taskId - ID задачи
   * @param {String} status - Статус завершения (success, error, cancelled)
   * @param {Object} completionData - Данные о завершении
   * @returns {Promise<Object>} Обновленная задача
   */
  async completeTask(taskId, status, completionData = {}) {
    try {
      const task = await this.repository.findById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      if (task.status !== 'running') {
        throw new Error(`Task is already ${task.status}`);
      }

      const now = new Date();
      const executionTime = now.getTime() - task.startedAt.getTime();

      const updateData = {
        status,
        completedAt: now,
        duration: executionTime,
        executionTime: executionTime,
        processedItems: completionData.processedItems || 0
      };

      // Добавление информации об ошибке
      if (status === 'error' && completionData.error) {
        updateData.error = {
          message: completionData.error.message,
          stack: completionData.error.stack,
          code: completionData.error.code
        };
      }

      // Обновление метаданных
      if (completionData.metadata) {
        updateData.metadata = {
          ...task.metadata,
          ...completionData.metadata
        };
      }

      const updatedTask = await this.repository.findByIdAndUpdate(taskId, updateData);
      return this.formatTaskForResponse(updatedTask);
    } catch (error) {
      throw new Error(`Failed to complete task: ${error.message}`);
    }
  }

  /**
   * Обновление прогресса выполнения задачи
   * @param {String} taskId - ID задачи
   * @param {Object} progressData - Данные о прогрессе
   * @returns {Promise<Object>} Обновленная задача
   */
  async updateTaskProgress(taskId, progressData) {
    try {
      const task = await this.repository.findById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      if (task.status !== 'running') {
        throw new Error('Cannot update progress of non-running task');
      }

      const updateData = {};
      
      if (progressData.processedItems !== undefined) {
        updateData.processedItems = progressData.processedItems;
      }

      if (progressData.metadata) {
        updateData.metadata = {
          ...task.metadata,
          ...progressData.metadata,
          lastProgressUpdate: new Date()
        };
      }

      const updatedTask = await this.repository.findByIdAndUpdate(taskId, updateData);
      return this.formatTaskForResponse(updatedTask);
    } catch (error) {
      throw new Error(`Failed to update task progress: ${error.message}`);
    }
  }

  /**
   * Отмена выполнения задачи
   * @param {String} taskId - ID задачи
   * @param {String} reason - Причина отмены
   * @returns {Promise<Object>} Отмененная задача
   */
  async cancelTask(taskId, reason = 'Manual cancellation') {
    try {
      const completionData = {
        metadata: { cancellationReason: reason }
      };

      return await this.completeTask(taskId, 'cancelled', completionData);
    } catch (error) {
      throw new Error(`Failed to cancel task: ${error.message}`);
    }
  }

  /**
   * Получение задач по статусу
   * @param {String} status - Статус задач
   * @param {Object} options - Опции запроса
   * @returns {Promise<Array>} Список задач
   */
  async getTasksByStatus(status, options = {}) {
    try {
      const { limit = 50, taskName } = options;
      
      let tasks;
      if (status === 'running') {
        tasks = await this.repository.findRunningTasks(taskName);
      } else if (status === 'error') {
        tasks = await this.repository.findFailedExecutions(taskName, limit);
      } else {
        tasks = await this.repository.find(
          { status, ...(taskName && { taskName }) },
          { sort: { startedAt: -1 }, limit }
        );
      }

      return this.formatTasksForResponse(tasks);
    } catch (error) {
      throw new Error(`Failed to get tasks by status: ${error.message}`);
    }
  }

  /**
   * Поиск долго выполняющихся задач
   * @param {Number} thresholdMinutes - Порог в минутах
   * @returns {Promise<Array>} Список долго выполняющихся задач
   */
  async getLongRunningTasks(thresholdMinutes = 60) {
    try {
      const tasks = await this.repository.findLongRunningTasks(thresholdMinutes);
      return this.formatTasksForResponse(tasks);
    } catch (error) {
      throw new Error(`Failed to get long running tasks: ${error.message}`);
    }
  }

  /**
   * Получение недавних выполнений задачи
   * @param {String} taskName - Название задачи
   * @param {Number} limit - Лимит результатов
   * @returns {Promise<Array>} Список недавних выполнений
   */
  async getRecentExecutions(taskName, limit = 10) {
    try {
      const executions = await this.repository.getRecentExecutions(taskName, limit);
      return this.formatTasksForResponse(executions);
    } catch (error) {
      throw new Error(`Failed to get recent executions: ${error.message}`);
    }
  }

  /**
   * Повторный запуск неудачной задачи
   * @param {String} failedTaskId - ID неудачной задачи
   * @param {Object} overrideMetadata - Переопределяющие метаданные
   * @returns {Promise<Object>} Новая задача
   */
  async retryFailedTask(failedTaskId, overrideMetadata = {}) {
    try {
      const failedTask = await this.repository.findById(failedTaskId);
      if (!failedTask) {
        throw new Error('Failed task not found');
      }

      if (failedTask.status !== 'error') {
        throw new Error('Can only retry failed tasks');
      }

      const metadata = {
        ...failedTask.metadata,
        ...overrideMetadata,
        retryOf: failedTaskId,
        retryAttempt: (failedTask.metadata?.retryAttempt || 0) + 1,
        originalError: {
          message: failedTask.error?.message,
          code: failedTask.error?.code
        }
      };

      return await this.createTaskExecution(failedTask.taskName, metadata);
    } catch (error) {
      throw new Error(`Failed to retry task: ${error.message}`);
    }
  }

  /**
   * Массовое обновление статуса задач
   * @param {Array} taskIds - Массив ID задач
   * @param {String} status - Новый статус
   * @param {Object} updateData - Дополнительные данные для обновления
   * @returns {Promise<Object>} Результат массового обновления
   */
  async bulkUpdateTaskStatus(taskIds, status, updateData = {}) {
    try {
      if (!Array.isArray(taskIds) || taskIds.length === 0) {
        throw new Error('Task IDs array is required');
      }

      const operations = taskIds.map(taskId => ({
        updateOne: {
          filter: { _id: taskId },
          update: {
            $set: {
              status,
              ...(status === 'cancelled' && { completedAt: new Date() }),
              ...updateData
            }
          }
        }
      }));

      const result = await this.repository.bulkWrite(operations);
      
      return {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
        success: result.modifiedCount === taskIds.length
      };
    } catch (error) {
      throw new Error(`Failed to bulk update tasks: ${error.message}`);
    }
  }

  /**
   * Получение задач с фильтрацией
   * @param {Object} filters - Фильтры поиска
   * @param {Object} options - Опции запроса
   * @returns {Promise<Object>} Результаты поиска с пагинацией
   */
  async searchTasks(filters = {}, options = {}) {
    try {
      const {
        taskName,
        status,
        startDate,
        endDate,
        hasError,
        minProcessedItems,
        maxExecutionTime
      } = filters;

      const {
        page = 1,
        limit = 20,
        sortBy = 'startedAt',
        sortOrder = 'desc'
      } = options;

      // Построение фильтра
      const dbFilter = {};
      
      if (taskName) dbFilter.taskName = taskName;
      if (status) dbFilter.status = status;
      if (hasError) dbFilter.error = { $exists: true };
      
      if (startDate || endDate) {
        dbFilter.startedAt = {};
        if (startDate) dbFilter.startedAt.$gte = new Date(startDate);
        if (endDate) dbFilter.startedAt.$lte = new Date(endDate);
      }
      
      if (minProcessedItems !== undefined) {
        dbFilter.processedItems = { $gte: minProcessedItems };
      }
      
      if (maxExecutionTime !== undefined) {
        dbFilter.executionTime = { $lte: maxExecutionTime };
      }

      // Построение опций сортировки
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const tasks = await this.repository.find(dbFilter, {
        sort: sortOptions,
        limit: limit,
        skip: (page - 1) * limit
      });

      const total = await this.repository.count(dbFilter);

      return {
        tasks: this.formatTasksForResponse(tasks),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to search tasks: ${error.message}`);
    }
  }

  /**
   * Форматирование одной задачи для ответа
   * @param {Object} task - Объект задачи
   * @returns {Object} Отформатированный объект
   */
  formatTaskForResponse(task) {
    if (!task) return null;

    const formatted = task.toObject ? task.toObject() : task;
    
    return {
      ...formatted,
      durationFormatted: this.formatDuration(formatted.duration),
      executionTimeFormatted: this.formatDuration(formatted.executionTime),
      isLongRunning: this.isLongRunning(formatted),
      statusDetails: this.getStatusDetails(formatted)
    };
  }

  /**
   * Форматирование массива задач для ответа
   * @param {Array} tasks - Массив задач
   * @returns {Array} Отформатированный массив
   */
  formatTasksForResponse(tasks) {
    return tasks.map(task => this.formatTaskForResponse(task));
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
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else if (seconds > 0) {
      return `${seconds}s`;
    } else {
      return `${milliseconds}ms`;
    }
  }

  /**
   * Проверка, является ли задача долго выполняющейся
   * @param {Object} task - Объект задачи
   * @returns {Boolean} Является ли долго выполняющейся
   */
  isLongRunning(task) {
    if (task.status !== 'running') return false;
    
    const runningTime = Date.now() - new Date(task.startedAt).getTime();
    return runningTime > 60 * 60 * 1000; // 1 час
  }

  /**
   * Получение детальной информации о статусе
   * @param {Object} task - Объект задачи
   * @returns {Object} Детали статуса
   */
  getStatusDetails(task) {
    const details = {
      status: task.status,
      isCompleted: ['success', 'error', 'cancelled'].includes(task.status),
      isSuccessful: task.status === 'success'
    };

    if (task.status === 'running') {
      const runningTime = Date.now() - new Date(task.startedAt).getTime();
      details.runningFor = this.formatDuration(runningTime);
      details.isLongRunning = runningTime > 60 * 60 * 1000;
    }

    if (task.error) {
      details.errorSummary = {
        message: task.error.message,
        code: task.error.code,
        hasStack: !!task.error.stack
      };
    }

    return details;
  }
}

module.exports = TaskExecutionService;


/**
 * Data Transfer Objects для задач
 * Содержит классы для передачи данных между слоями приложения
 */

const { formatters, constants } = require('../utils');

/**
 * DTO для отображения задачи в списке
 */
class TaskListDto {
  constructor(task) {
    this.id = task._id || task.id;
    this.taskName = task.taskName;
    this.status = task.status;
    this.executionTime = task.executionTime;
    this.processedItems = task.processedItems || 0;
    this.startedAt = task.startedAt;
    this.completedAt = task.completedAt;
    this.duration = task.duration;
    
    // Вычисляемые поля
    this.executionTimeFormatted = formatters.date.formatDuration(task.executionTime);
    this.durationFormatted = formatters.date.formatDuration(task.duration);
    this.startedAtRelative = formatters.date.formatToRelative(task.startedAt);
    this.completedAtRelative = task.completedAt ? formatters.date.formatToRelative(task.completedAt) : null;
    this.isCompleted = ['success', 'error', 'cancelled'].includes(task.status);
    this.isSuccessful = task.status === 'success';
    this.isRunning = task.status === 'running';
    this.isFailed = task.status === 'error';
    
    // Статус информация
    this.statusInfo = this.getStatusInfo(task);
  }

  /**
   * Получение детальной информации о статусе
   * @param {Object} task - Объект задачи
   * @returns {Object} Информация о статусе
   */
  getStatusInfo(task) {
    const info = {
      status: task.status,
      label: this.getStatusLabel(task.status),
      color: this.getStatusColor(task.status),
      icon: this.getStatusIcon(task.status)
    };

    if (task.status === 'running') {
      const runningTime = Date.now() - new Date(task.startedAt).getTime();
      info.runningFor = formatters.date.formatDuration(runningTime);
      info.isLongRunning = runningTime > constants.TIME_CONSTANTS.MILLISECONDS_IN_HOUR;
    }

    if (task.status === 'error' && task.error) {
      info.errorMessage = task.error.message;
      info.errorCode = task.error.code;
    }

    return info;
  }

  /**
   * Получение текстовой метки для статуса
   * @param {String} status - Статус задачи
   * @returns {String} Текстовая метка
   */
  getStatusLabel(status) {
    const labels = {
      running: 'Running',
      success: 'Completed Successfully',
      error: 'Failed',
      cancelled: 'Cancelled'
    };
    return labels[status] || status;
  }

  /**
   * Получение цвета для статуса
   * @param {String} status - Статус задачи
   * @returns {String} Цвет в формате hex
   */
  getStatusColor(status) {
    const colors = {
      running: '#2196F3',  // Синий
      success: '#4CAF50',  // Зеленый
      error: '#F44336',    // Красный
      cancelled: '#FF9800' // Оранжевый
    };
    return colors[status] || '#999999';
  }

  /**
   * Получение иконки для статуса
   * @param {String} status - Статус задачи
   * @returns {String} Имя иконки
   */
  getStatusIcon(status) {
    const icons = {
      running: 'play_arrow',
      success: 'check_circle',
      error: 'error',
      cancelled: 'cancel'
    };
    return icons[status] || 'help';
  }
}

/**
 * DTO для детального отображения задачи
 */
class TaskDetailDto extends TaskListDto {
  constructor(task) {
    super(task);
    
    // Дополнительные поля для детального просмотра
    this.error = task.error;
    this.metadata = task.metadata || {};
    this.createdAt = task.createdAt;
    this.updatedAt = task.updatedAt;
    
    // Форматированные даты
    this.startedAtFormatted = formatters.date.formatToReadable(task.startedAt);
    this.completedAtFormatted = task.completedAt ? formatters.date.formatToReadable(task.completedAt) : null;
    this.createdAtFormatted = formatters.date.formatToReadable(task.createdAt);
    this.updatedAtFormatted = formatters.date.formatToReadable(task.updatedAt);
    
    // Расширенная информация о производительности
    this.performanceInfo = this.getPerformanceInfo(task);
    
    // Информация об ошибке (если есть)
    this.errorInfo = task.error ? this.getErrorInfo(task.error) : null;
    
    // Прогресс информация
    this.progressInfo = this.getProgressInfo(task);
  }

  /**
   * Получение информации о производительности
   * @param {Object} task - Объект задачи
   * @returns {Object} Информация о производительности
   */
  getPerformanceInfo(task) {
    const info = {
      itemsPerSecond: 0,
      efficiency: 'Unknown'
    };

    if (task.processedItems && task.executionTime) {
      const itemsPerMs = task.processedItems / task.executionTime;
      info.itemsPerSecond = (itemsPerMs * 1000).toFixed(2);
      
      // Оценка эффективности (примерная)
      if (info.itemsPerSecond > 100) {
        info.efficiency = 'Excellent';
      } else if (info.itemsPerSecond > 50) {
        info.efficiency = 'Good';
      } else if (info.itemsPerSecond > 10) {
        info.efficiency = 'Average';
      } else {
        info.efficiency = 'Poor';
      }
    }

    return info;
  }

  /**
   * Получение детальной информации об ошибке
   * @param {Object} error - Объект ошибки
   * @returns {Object} Детальная информация об ошибке
   */
  getErrorInfo(error) {
    return {
      message: error.message,
      code: error.code,
      hasStack: !!error.stack,
      stackLines: error.stack ? error.stack.split('\n').length : 0,
      errorType: this.categorizeError(error.message, error.code),
      severity: this.getErrorSeverity(error.code)
    };
  }

  /**
   * Категоризация ошибки
   * @param {String} message - Сообщение об ошибке
   * @param {String} code - Код ошибки
   * @returns {String} Категория ошибки
   */
  categorizeError(message, code) {
    if (!message && !code) return 'Unknown';
    
    const msg = (message || '').toLowerCase();
    
    if (msg.includes('timeout') || code === 'TASK_TIMEOUT') return 'Timeout';
    if (msg.includes('network') || msg.includes('fetch')) return 'Network';
    if (msg.includes('permission') || msg.includes('unauthorized')) return 'Permission';
    if (msg.includes('validation') || code === 'VALIDATION_ERROR') return 'Validation';
    if (msg.includes('database') || code === 'DATABASE_ERROR') return 'Database';
    if (msg.includes('memory') || msg.includes('heap')) return 'Memory';
    
    return 'Application';
  }

  /**
   * Получение серьезности ошибки
   * @param {String} code - Код ошибки
   * @returns {String} Уровень серьезности
   */
  getErrorSeverity(code) {
    const criticalCodes = ['SYSTEM_ERROR', 'DATABASE_ERROR', 'TASK_TIMEOUT'];
    const highCodes = ['EXTERNAL_SERVICE_ERROR', 'AUTHENTICATION_FAILED'];
    const mediumCodes = ['VALIDATION_ERROR', 'NOT_FOUND'];
    
    if (criticalCodes.includes(code)) return 'Critical';
    if (highCodes.includes(code)) return 'High';
    if (mediumCodes.includes(code)) return 'Medium';
    
    return 'Low';
  }

  /**
   * Получение информации о прогрессе
   * @param {Object} task - Объект задачи
   * @returns {Object} Информация о прогрессе
   */
  getProgressInfo(task) {
    const info = {
      hasProgress: false,
      percentage: 0,
      eta: null
    };

    // Если в метаданных есть информация о прогрессе
    if (task.metadata && task.metadata.totalItems && task.processedItems) {
      info.hasProgress = true;
      info.percentage = Math.min(100, (task.processedItems / task.metadata.totalItems) * 100).toFixed(1);
      
      // Расчет ETA для запущенных задач
      if (task.status === 'running' && task.processedItems > 0) {
        const elapsedMs = Date.now() - new Date(task.startedAt).getTime();
        const remaining = task.metadata.totalItems - task.processedItems;
        const rate = task.processedItems / elapsedMs;
        const etaMs = remaining / rate;
        
        info.eta = formatters.date.formatDuration(etaMs);
      }
    }

    return info;
  }
}

/**
 * DTO для создания/обновления задачи
 */
class TaskCreateDto {
  constructor(data) {
    this.taskName = data.taskName;
    this.status = data.status || constants.TASK_STATUSES.RUNNING;
    this.executionTime = data.executionTime || 0;
    this.processedItems = data.processedItems || 0;
    this.error = data.error;
    this.metadata = data.metadata || {};
    this.startedAt = data.startedAt || new Date();
    this.completedAt = data.completedAt;
    this.duration = data.duration;
  }

  /**
   * Валидация данных перед созданием/обновлением
   * @returns {Object} Результат валидации
   */
  validate() {
    const errors = [];
    
    // Проверка обязательных полей
    if (!this.taskName || typeof this.taskName !== 'string') {
      errors.push('Task name is required and must be a string');
    }
    
    // Проверка названия задачи
    if (this.taskName && !constants.VALIDATION_PATTERNS.TASK_NAME.test(this.taskName)) {
      errors.push('Task name can only contain letters, numbers, hyphens, and underscores');
    }
    
    // Проверка длины названия
    if (this.taskName && this.taskName.length > constants.FIELD_LIMITS.TASK_NAME_MAX_LENGTH) {
      errors.push(`Task name cannot exceed ${constants.FIELD_LIMITS.TASK_NAME_MAX_LENGTH} characters`);
    }
    
    // Проверка статуса
    if (this.status && !Object.values(constants.TASK_STATUSES).includes(this.status)) {
      errors.push(`Status must be one of: ${Object.values(constants.TASK_STATUSES).join(', ')}`);
    }
    
    // Проверка числовых полей
    if (this.executionTime !== undefined && (typeof this.executionTime !== 'number' || this.executionTime < 0)) {
      errors.push('Execution time must be a non-negative number');
    }
    
    if (this.processedItems !== undefined && (typeof this.processedItems !== 'number' || this.processedItems < 0)) {
      errors.push('Processed items must be a non-negative number');
    }
    
    // Проверка ошибки
    if (this.error) {
      if (typeof this.error !== 'object') {
        errors.push('Error must be an object');
      } else {
        if (!this.error.message || typeof this.error.message !== 'string') {
          errors.push('Error message is required and must be a string');
        }
        if (this.error.message && this.error.message.length > constants.FIELD_LIMITS.TASK_ERROR_MESSAGE_MAX_LENGTH) {
          errors.push(`Error message cannot exceed ${constants.FIELD_LIMITS.TASK_ERROR_MESSAGE_MAX_LENGTH} characters`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * DTO для фильтрации задач
 */
class TaskFilterDto {
  constructor(query) {
    this.taskName = query.taskName;
    this.status = query.status;
    this.startDate = query.startDate ? new Date(query.startDate) : undefined;
    this.endDate = query.endDate ? new Date(query.endDate) : undefined;
    this.hasError = query.hasError === 'true' ? true : query.hasError === 'false' ? false : undefined;
    this.minProcessedItems = query.minProcessedItems ? parseInt(query.minProcessedItems) : undefined;
    this.maxExecutionTime = query.maxExecutionTime ? parseInt(query.maxExecutionTime) : undefined;
    this.errorCode = query.errorCode;
    this.isLongRunning = query.isLongRunning === 'true' ? true : undefined;
  }

  /**
   * Преобразование в фильтр для базы данных
   * @returns {Object} Фильтр для MongoDB
   */
  toDbFilter() {
    const filter = {};
    
    if (this.taskName) filter.taskName = this.taskName;
    if (this.status) filter.status = this.status;
    if (this.hasError !== undefined) {
      filter.error = this.hasError ? { $exists: true } : { $exists: false };
    }
    if (this.errorCode) filter['error.code'] = this.errorCode;
    
    if (this.startDate || this.endDate) {
      filter.startedAt = {};
      if (this.startDate) filter.startedAt.$gte = this.startDate;
      if (this.endDate) filter.startedAt.$lte = this.endDate;
    }
    
    if (this.minProcessedItems !== undefined) {
      filter.processedItems = { $gte: this.minProcessedItems };
    }
    
    if (this.maxExecutionTime !== undefined) {
      filter.executionTime = { $lte: this.maxExecutionTime };
    }
    
    if (this.isLongRunning) {
      const threshold = new Date(Date.now() - constants.PERFORMANCE_SETTINGS.LONG_RUNNING_TASK_THRESHOLD_MINUTES * 60 * 1000);
      filter.status = 'running';
      filter.startedAt = { $lte: threshold };
    }
    
    return filter;
  }
}

/**
 * DTO для статистики задач
 */
class TaskStatsDto {
  constructor(stats) {
    this.taskName = stats.taskName;
    this.period = stats.period;
    this.totalExecutions = stats.totalExecutions || 0;
    this.successfulExecutions = stats.successfulExecutions || 0;
    this.failedExecutions = stats.failedExecutions || 0;
    this.runningExecutions = stats.runningExecutions || 0;
    this.cancelledExecutions = stats.cancelledExecutions || 0;
    this.averageExecutionTime = stats.averageExecutionTime || 0;
    this.totalProcessedItems = stats.totalProcessedItems || 0;
    this.lastExecution = stats.lastExecution;
    this.firstExecution = stats.firstExecution;
    
    // Вычисляемые поля
    this.successRate = this.calculateSuccessRate();
    this.failureRate = this.calculateFailureRate();
    this.averageItemsPerExecution = this.calculateAverageItemsPerExecution();
    this.executionFrequency = this.calculateExecutionFrequency();
    this.performanceGrade = this.calculatePerformanceGrade();
    this.reliability = this.calculateReliability();
    
    // Форматированные значения
    this.averageExecutionTimeFormatted = formatters.date.formatDuration(this.averageExecutionTime);
    this.lastExecutionRelative = this.lastExecution ? formatters.date.formatToRelative(this.lastExecution) : null;
    this.firstExecutionRelative = this.firstExecution ? formatters.date.formatToRelative(this.firstExecution) : null;
  }

  /**
   * Расчет коэффициента успеха
   * @returns {Number} Коэффициент успеха в процентах
   */
  calculateSuccessRate() {
    if (this.totalExecutions === 0) return 0;
    return parseFloat(((this.successfulExecutions / this.totalExecutions) * 100).toFixed(2));
  }

  /**
   * Расчет коэффициента неудач
   * @returns {Number} Коэффициент неудач в процентах
   */
  calculateFailureRate() {
    if (this.totalExecutions === 0) return 0;
    return parseFloat(((this.failedExecutions / this.totalExecutions) * 100).toFixed(2));
  }

  /**
   * Расчет среднего количества обработанных элементов за выполнение
   * @returns {Number} Среднее количество элементов
   */
  calculateAverageItemsPerExecution() {
    if (this.totalExecutions === 0) return 0;
    return parseFloat((this.totalProcessedItems / this.totalExecutions).toFixed(2));
  }

  /**
   * Расчет частоты выполнения
   * @returns {String} Описание частоты выполнения
   */
  calculateExecutionFrequency() {
    if (!this.firstExecution || !this.lastExecution || this.totalExecutions <= 1) {
      return 'Insufficient data';
    }

    const timeDiff = new Date(this.lastExecution).getTime() - new Date(this.firstExecution).getTime();
    const avgInterval = timeDiff / (this.totalExecutions - 1);
    
    const intervalFormatted = formatters.date.formatDuration(avgInterval);
    return `Every ${intervalFormatted}`;
  }

  /**
   * Расчет оценки производительности
   * @returns {String} Оценка производительности
   */
  calculatePerformanceGrade() {
    const successRate = this.successRate;
    
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
   * Расчет уровня надежности
   * @returns {String} Уровень надежности
   */
  calculateReliability() {
    const successRate = this.successRate;
    
    if (successRate >= 99) return 'Excellent';
    if (successRate >= 95) return 'Very Good';
    if (successRate >= 90) return 'Good';
    if (successRate >= 80) return 'Fair';
    return 'Poor';
  }
}

/**
 * DTO для трендов задач
 */
class TaskTrendDto {
  constructor(trends) {
    this.trends = trends.map(trend => ({
      date: trend.date,
      executions: trend.executions,
      successes: trend.successes,
      failures: trend.failures,
      successRate: parseFloat(trend.successRate),
      averageTime: trend.averageTime,
      totalItems: trend.totalItems,
      
      // Дополнительные вычисления
      failureRate: trend.executions > 0 ? ((trend.failures / trend.executions) * 100).toFixed(2) : 0,
      itemsPerHour: this.calculateItemsPerHour(trend.totalItems, trend.averageTime, trend.executions)
    }));
    
    // Сводная информация о трендах
    this.summary = this.calculateTrendSummary();
  }

  /**
   * Расчет количества элементов в час
   * @param {Number} totalItems - Общее количество элементов
   * @param {Number} averageTime - Среднее время выполнения
   * @param {Number} executions - Количество выполнений
   * @returns {Number} Элементов в час
   */
  calculateItemsPerHour(totalItems, averageTime, executions) {
    if (!totalItems || !averageTime || !executions) return 0;
    
    const itemsPerMs = totalItems / (averageTime * executions);
    const itemsPerHour = itemsPerMs * constants.TIME_CONSTANTS.MILLISECONDS_IN_HOUR;
    
    return Math.round(itemsPerHour);
  }

  /**
   * Расчет сводки трендов
   * @returns {Object} Сводка трендов
   */
  calculateTrendSummary() {
    if (this.trends.length === 0) {
      return { trend: 'No data', change: 0 };
    }

    const firstPeriod = this.trends.slice(0, Math.ceil(this.trends.length / 2));
    const secondPeriod = this.trends.slice(Math.ceil(this.trends.length / 2));
    
    const firstAvgSuccess = firstPeriod.reduce((sum, t) => sum + t.successRate, 0) / firstPeriod.length;
    const secondAvgSuccess = secondPeriod.reduce((sum, t) => sum + t.successRate, 0) / secondPeriod.length;
    
    const change = secondAvgSuccess - firstAvgSuccess;
    
    let trend = 'Stable';
    if (change > 5) trend = 'Improving';
    else if (change < -5) trend = 'Declining';
    
    return {
      trend,
      change: parseFloat(change.toFixed(2)),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    };
  }
}

module.exports = {
  TaskListDto,
  TaskDetailDto,
  TaskCreateDto,
  TaskFilterDto,
  TaskStatsDto,
  TaskTrendDto
};


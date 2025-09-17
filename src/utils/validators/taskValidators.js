/**
 * Валидаторы для данных задач
 * Содержит функции для валидации различных полей задач
 */

/**
 * Валидация названия задачи
 * @param {String} taskName - Название задачи для валидации
 * @returns {Object} Результат валидации
 */
function validateTaskName(taskName) {
  if (!taskName || typeof taskName !== 'string') {
    return { isValid: false, error: 'Task name is required and must be a string' };
  }

  const trimmedName = taskName.trim();
  
  if (trimmedName.length === 0) {
    return { isValid: false, error: 'Task name cannot be empty' };
  }

  if (trimmedName.length > 100) {
    return { isValid: false, error: 'Task name cannot exceed 100 characters' };
  }

  // Проверка на допустимые символы (буквы, цифры, дефисы, подчеркивания)
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  if (!validPattern.test(trimmedName)) {
    return { 
      isValid: false, 
      error: 'Task name can only contain letters, numbers, hyphens, and underscores' 
    };
  }

  return { isValid: true };
}

/**
 * Валидация статуса задачи
 * @param {String} status - Статус для валидации
 * @returns {Object} Результат валидации
 */
function validateTaskStatus(status) {
  if (!status || typeof status !== 'string') {
    return { isValid: false, error: 'Status is required and must be a string' };
  }

  const validStatuses = ['success', 'error', 'running', 'cancelled'];
  
  if (!validStatuses.includes(status)) {
    return { 
      isValid: false, 
      error: `Status must be one of: ${validStatuses.join(', ')}` 
    };
  }

  return { isValid: true };
}

/**
 * Валидация времени выполнения
 * @param {Number} executionTime - Время выполнения в миллисекундах
 * @returns {Object} Результат валидации
 */
function validateExecutionTime(executionTime) {
  if (executionTime === null || executionTime === undefined) {
    return { isValid: true }; // Время выполнения может быть пустым для новых задач
  }

  if (typeof executionTime !== 'number') {
    return { isValid: false, error: 'Execution time must be a number' };
  }

  if (executionTime < 0) {
    return { isValid: false, error: 'Execution time cannot be negative' };
  }

  // Предупреждение для очень долгих выполнений (более 24 часов)
  const warnings = [];
  if (executionTime > 24 * 60 * 60 * 1000) {
    warnings.push('Execution time exceeds 24 hours, consider reviewing task efficiency');
  }

  return { isValid: true, warnings };
}

/**
 * Валидация количества обработанных элементов
 * @param {Number} processedItems - Количество обработанных элементов
 * @returns {Object} Результат валидации
 */
function validateProcessedItems(processedItems) {
  if (processedItems === null || processedItems === undefined) {
    return { isValid: true }; // Может быть пустым
  }

  if (typeof processedItems !== 'number') {
    return { isValid: false, error: 'Processed items must be a number' };
  }

  if (processedItems < 0) {
    return { isValid: false, error: 'Processed items cannot be negative' };
  }

  if (!Number.isInteger(processedItems)) {
    return { isValid: false, error: 'Processed items must be an integer' };
  }

  return { isValid: true };
}

/**
 * Валидация данных об ошибке
 * @param {Object} error - Объект ошибки
 * @returns {Object} Результат валидации
 */
function validateTaskError(error) {
  if (!error) {
    return { isValid: true }; // Ошибка может быть пустой для успешных задач
  }

  if (typeof error !== 'object') {
    return { isValid: false, error: 'Error must be an object' };
  }

  // Валидация обязательного поля message
  if (!error.message || typeof error.message !== 'string') {
    return { isValid: false, error: 'Error message is required and must be a string' };
  }

  if (error.message.length > 1000) {
    return { isValid: false, error: 'Error message cannot exceed 1000 characters' };
  }

  // Валидация опциональных полей
  if (error.stack && typeof error.stack !== 'string') {
    return { isValid: false, error: 'Error stack must be a string' };
  }

  if (error.code && typeof error.code !== 'string') {
    return { isValid: false, error: 'Error code must be a string' };
  }

  if (error.code && error.code.length > 50) {
    return { isValid: false, error: 'Error code cannot exceed 50 characters' };
  }

  return { isValid: true };
}

/**
 * Валидация метаданных задачи
 * @param {Object} metadata - Метаданные
 * @returns {Object} Результат валидации
 */
function validateTaskMetadata(metadata) {
  if (!metadata) {
    return { isValid: true }; // Метаданные могут быть пустыми
  }

  if (typeof metadata !== 'object' || Array.isArray(metadata)) {
    return { isValid: false, error: 'Metadata must be an object' };
  }

  // Проверка размера метаданных (примерно)
  const metadataString = JSON.stringify(metadata);
  if (metadataString.length > 10000) {
    return { 
      isValid: false, 
      error: 'Metadata is too large (max 10KB when serialized)' 
    };
  }

  // Проверка на циклические ссылки
  try {
    JSON.stringify(metadata);
  } catch (error) {
    return { 
      isValid: false, 
      error: 'Metadata contains circular references or non-serializable values' 
    };
  }

  return { isValid: true };
}

/**
 * Валидация даты
 * @param {Date|String} date - Дата для валидации
 * @param {String} fieldName - Название поля
 * @returns {Object} Результат валидации
 */
function validateDate(date, fieldName) {
  if (!date) {
    return { isValid: true }; // Дата может быть пустой
  }

  let dateObj;
  
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    return { 
      isValid: false, 
      error: `${fieldName} must be a Date object or ISO string` 
    };
  }

  if (isNaN(dateObj.getTime())) {
    return { 
      isValid: false, 
      error: `${fieldName} is not a valid date` 
    };
  }

  // Проверка на разумные границы дат
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

  if (dateObj < oneYearAgo) {
    return {
      isValid: true,
      warnings: [`${fieldName} is more than a year old`]
    };
  }

  if (dateObj > oneYearFromNow) {
    return { 
      isValid: false, 
      error: `${fieldName} cannot be more than a year in the future` 
    };
  }

  return { isValid: true };
}

/**
 * Валидация длительности задачи
 * @param {Number} duration - Длительность в миллисекундах
 * @returns {Object} Результат валидации
 */
function validateDuration(duration) {
  if (duration === null || duration === undefined) {
    return { isValid: true }; // Длительность может быть пустой
  }

  if (typeof duration !== 'number') {
    return { isValid: false, error: 'Duration must be a number' };
  }

  if (duration < 0) {
    return { isValid: false, error: 'Duration cannot be negative' };
  }

  const warnings = [];
  
  // Предупреждения для различных длительностей
  if (duration < 100) {
    warnings.push('Very short task duration (less than 100ms)');
  } else if (duration > 24 * 60 * 60 * 1000) {
    warnings.push('Very long task duration (more than 24 hours)');
  }

  return { isValid: true, warnings };
}

/**
 * Валидация согласованности дат задачи
 * @param {Date} startedAt - Дата начала
 * @param {Date} completedAt - Дата завершения
 * @returns {Object} Результат валидации
 */
function validateTaskDateConsistency(startedAt, completedAt) {
  if (!startedAt || !completedAt) {
    return { isValid: true }; // Если одна из дат пустая, проверка не нужна
  }

  const startDate = new Date(startedAt);
  const completeDate = new Date(completedAt);

  if (completeDate <= startDate) {
    return { 
      isValid: false, 
      error: 'Completion date must be after start date' 
    };
  }

  const duration = completeDate.getTime() - startDate.getTime();
  const warnings = [];

  // Предупреждения для подозрительных длительностей
  if (duration < 1000) {
    warnings.push('Task completed very quickly (less than 1 second)');
  } else if (duration > 7 * 24 * 60 * 60 * 1000) {
    warnings.push('Task took more than a week to complete');
  }

  return { isValid: true, warnings };
}

/**
 * Валидация перехода статуса
 * @param {String} currentStatus - Текущий статус
 * @param {String} newStatus - Новый статус
 * @returns {Object} Результат валидации
 */
function validateStatusTransition(currentStatus, newStatus) {
  const validTransitions = {
    'running': ['success', 'error', 'cancelled'],
    'success': [], // Завершенные задачи нельзя изменять
    'error': ['running'], // Можно перезапустить
    'cancelled': ['running'] // Можно перезапустить
  };

  if (!validTransitions[currentStatus]) {
    return { 
      isValid: false, 
      error: `Invalid current status: ${currentStatus}` 
    };
  }

  if (!validTransitions[currentStatus].includes(newStatus)) {
    return { 
      isValid: false, 
      error: `Cannot transition from ${currentStatus} to ${newStatus}` 
    };
  }

  return { isValid: true };
}

/**
 * Валидация данных для создания задачи
 * @param {Object} taskData - Данные задачи
 * @returns {Object} Результат валидации
 */
function validateTaskCreationData(taskData) {
  const errors = [];
  const warnings = [];

  if (!taskData || typeof taskData !== 'object') {
    return { 
      isValid: false, 
      errors: ['Task data must be an object'],
      warnings: []
    };
  }

  // Валидация обязательных полей
  const nameValidation = validateTaskName(taskData.taskName);
  if (!nameValidation.isValid) {
    errors.push(nameValidation.error);
  }

  // Валидация опциональных полей
  if (taskData.executionTime !== undefined) {
    const timeValidation = validateExecutionTime(taskData.executionTime);
    if (!timeValidation.isValid) {
      errors.push(timeValidation.error);
    } else if (timeValidation.warnings) {
      warnings.push(...timeValidation.warnings);
    }
  }

  if (taskData.processedItems !== undefined) {
    const itemsValidation = validateProcessedItems(taskData.processedItems);
    if (!itemsValidation.isValid) {
      errors.push(itemsValidation.error);
    }
  }

  if (taskData.metadata !== undefined) {
    const metadataValidation = validateTaskMetadata(taskData.metadata);
    if (!metadataValidation.isValid) {
      errors.push(metadataValidation.error);
    }
  }

  if (taskData.startedAt !== undefined) {
    const dateValidation = validateDate(taskData.startedAt, 'Started date');
    if (!dateValidation.isValid) {
      errors.push(dateValidation.error);
    } else if (dateValidation.warnings) {
      warnings.push(...dateValidation.warnings);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Валидация данных для обновления задачи
 * @param {Object} updateData - Данные для обновления
 * @param {Object} currentTask - Текущие данные задачи
 * @returns {Object} Результат валидации
 */
function validateTaskUpdateData(updateData, currentTask) {
  const errors = [];
  const warnings = [];

  if (!updateData || typeof updateData !== 'object') {
    return { 
      isValid: false, 
      errors: ['Update data must be an object'],
      warnings: []
    };
  }

  // Валидация изменения статуса
  if (updateData.status && currentTask && currentTask.status) {
    const statusValidation = validateStatusTransition(currentTask.status, updateData.status);
    if (!statusValidation.isValid) {
      errors.push(statusValidation.error);
    }
  }

  // Валидация других полей при обновлении
  if (updateData.status !== undefined) {
    const statusValidation = validateTaskStatus(updateData.status);
    if (!statusValidation.isValid) {
      errors.push(statusValidation.error);
    }
  }

  if (updateData.processedItems !== undefined) {
    const itemsValidation = validateProcessedItems(updateData.processedItems);
    if (!itemsValidation.isValid) {
      errors.push(itemsValidation.error);
    }
  }

  if (updateData.error !== undefined) {
    const errorValidation = validateTaskError(updateData.error);
    if (!errorValidation.isValid) {
      errors.push(errorValidation.error);
    }
  }

  if (updateData.completedAt !== undefined) {
    const dateValidation = validateDate(updateData.completedAt, 'Completion date');
    if (!dateValidation.isValid) {
      errors.push(dateValidation.error);
    }

    // Проверка согласованности дат
    if (currentTask && currentTask.startedAt) {
      const consistencyValidation = validateTaskDateConsistency(currentTask.startedAt, updateData.completedAt);
      if (!consistencyValidation.isValid) {
        errors.push(consistencyValidation.error);
      } else if (consistencyValidation.warnings) {
        warnings.push(...consistencyValidation.warnings);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

module.exports = {
  validateTaskName,
  validateTaskStatus,
  validateExecutionTime,
  validateProcessedItems,
  validateTaskError,
  validateTaskMetadata,
  validateDate,
  validateDuration,
  validateTaskDateConsistency,
  validateStatusTransition,
  validateTaskCreationData,
  validateTaskUpdateData
};


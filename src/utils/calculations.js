/**
 * Математические вычисления и расчеты
 * Содержит функции для различных математических операций в приложении
 */

/**
 * Расчет процентного соотношения
 * @param {Number} value - Значение
 * @param {Number} total - Общее количество
 * @param {Object} options - Опции расчета
 * @returns {Number} Процентное соотношение
 */
function calculatePercentage(value, total, options = {}) {
  if (!value || !total || total === 0) return 0;
  
  const {
    precision = 2,        // Количество знаков после запятой
    multiply100 = true    // Умножать на 100 для получения процентов
  } = options;

  const ratio = value / total;
  const result = multiply100 ? ratio * 100 : ratio;
  
  return parseFloat(result.toFixed(precision));
}

/**
 * Расчет коэффициента успеха
 * @param {Number} successes - Количество успешных операций
 * @param {Number} total - Общее количество операций
 * @returns {Number} Коэффициент успеха в процентах
 */
function calculateSuccessRate(successes, total) {
  return calculatePercentage(successes, total);
}

/**
 * Расчет среднего значения
 * @param {Array} values - Массив значений
 * @param {Object} options - Опции расчета
 * @returns {Number|null} Среднее значение
 */
function calculateAverage(values, options = {}) {
  if (!Array.isArray(values) || values.length === 0) {
    return null;
  }

  const {
    excludeNull = true,   // Исключать null/undefined значения
    precision = 2         // Точность результата
  } = options;

  let validValues = values;
  
  if (excludeNull) {
    validValues = values.filter(value => 
      value !== null && value !== undefined && typeof value === 'number'
    );
  }

  if (validValues.length === 0) {
    return null;
  }

  const sum = validValues.reduce((acc, value) => acc + value, 0);
  const average = sum / validValues.length;
  
  return parseFloat(average.toFixed(precision));
}

/**
 * Расчет медианы
 * @param {Array} values - Массив значений
 * @returns {Number|null} Медиана
 */
function calculateMedian(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return null;
  }

  const validValues = values
    .filter(value => value !== null && value !== undefined && typeof value === 'number')
    .sort((a, b) => a - b);

  if (validValues.length === 0) {
    return null;
  }

  const middle = Math.floor(validValues.length / 2);
  
  if (validValues.length % 2 === 0) {
    return (validValues[middle - 1] + validValues[middle]) / 2;
  }
  
  return validValues[middle];
}

/**
 * Расчет стандартного отклонения
 * @param {Array} values - Массив значений
 * @param {Object} options - Опции расчета
 * @returns {Number|null} Стандартное отклонение
 */
function calculateStandardDeviation(values, options = {}) {
  const average = calculateAverage(values, options);
  
  if (average === null) {
    return null;
  }

  const {
    precision = 2,
    excludeNull = true
  } = options;

  let validValues = values;
  
  if (excludeNull) {
    validValues = values.filter(value => 
      value !== null && value !== undefined && typeof value === 'number'
    );
  }

  if (validValues.length === 0) {
    return null;
  }

  const variance = validValues.reduce((acc, value) => {
    return acc + Math.pow(value - average, 2);
  }, 0) / validValues.length;

  const standardDeviation = Math.sqrt(variance);
  
  return parseFloat(standardDeviation.toFixed(precision));
}

/**
 * Поиск минимального и максимального значений
 * @param {Array} values - Массив значений
 * @returns {Object} Объект с min и max значениями
 */
function findMinMax(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return { min: null, max: null };
  }

  const validValues = values.filter(value => 
    value !== null && value !== undefined && typeof value === 'number'
  );

  if (validValues.length === 0) {
    return { min: null, max: null };
  }

  return {
    min: Math.min(...validValues),
    max: Math.max(...validValues)
  };
}

/**
 * Расчет пропускной способности (throughput)
 * @param {Number} items - Количество обработанных элементов
 * @param {Number} timeMs - Время в миллисекундах
 * @param {String} unit - Единица времени для результата
 * @returns {Number} Пропускная способность
 */
function calculateThroughput(items, timeMs, unit = 'second') {
  if (!items || !timeMs || timeMs === 0) return 0;

  const timeInSeconds = timeMs / 1000;
  const throughputPerSecond = items / timeInSeconds;

  switch (unit) {
    case 'millisecond':
      return throughputPerSecond / 1000;
    case 'second':
      return throughputPerSecond;
    case 'minute':
      return throughputPerSecond * 60;
    case 'hour':
      return throughputPerSecond * 3600;
    case 'day':
      return throughputPerSecond * 86400;
    default:
      return throughputPerSecond;
  }
}

/**
 * Расчет времени до завершения (ETA)
 * @param {Number} completed - Количество завершенных элементов
 * @param {Number} total - Общее количество элементов
 * @param {Number} elapsedMs - Время, прошедшее с начала
 * @returns {Number|null} Оставшееся время в миллисекундах
 */
function calculateETA(completed, total, elapsedMs) {
  if (!completed || !total || !elapsedMs || completed >= total) {
    return null;
  }

  const rate = completed / elapsedMs; // элементов в миллисекунду
  const remaining = total - completed;
  
  return Math.round(remaining / rate);
}

/**
 * Расчет прогресса в процентах
 * @param {Number} current - Текущее значение
 * @param {Number} target - Целевое значение
 * @param {Object} options - Опции расчета
 * @returns {Number} Прогресс в процентах
 */
function calculateProgress(current, target, options = {}) {
  if (!target || target === 0) return 0;
  
  const {
    precision = 1,
    cap = true // Ограничивать максимум 100%
  } = options;

  const progress = (current / target) * 100;
  const result = cap ? Math.min(100, progress) : progress;
  
  return parseFloat(result.toFixed(precision));
}

/**
 * Расчет скорости роста
 * @param {Number} oldValue - Старое значение
 * @param {Number} newValue - Новое значение
 * @param {Object} options - Опции расчета
 * @returns {Number} Скорость роста в процентах
 */
function calculateGrowthRate(oldValue, newValue, options = {}) {
  if (!oldValue || oldValue === 0) {
    return newValue > 0 ? Infinity : 0;
  }

  const {
    precision = 2,
    absolute = false // Возвращать абсолютное значение
  } = options;

  const growth = ((newValue - oldValue) / oldValue) * 100;
  const result = absolute ? Math.abs(growth) : growth;
  
  return parseFloat(result.toFixed(precision));
}

/**
 * Взвешенное среднее
 * @param {Array} values - Массив объектов {value, weight}
 * @param {Object} options - Опции расчета
 * @returns {Number|null} Взвешенное среднее
 */
function calculateWeightedAverage(values, options = {}) {
  if (!Array.isArray(values) || values.length === 0) {
    return null;
  }

  const { precision = 2 } = options;

  let totalValue = 0;
  let totalWeight = 0;

  for (const item of values) {
    if (item && typeof item.value === 'number' && typeof item.weight === 'number') {
      totalValue += item.value * item.weight;
      totalWeight += item.weight;
    }
  }

  if (totalWeight === 0) {
    return null;
  }

  const weightedAverage = totalValue / totalWeight;
  return parseFloat(weightedAverage.toFixed(precision));
}

/**
 * Группировка значений по диапазонам
 * @param {Array} values - Массив значений
 * @param {Array} ranges - Массив диапазонов [{min, max, label}]
 * @returns {Object} Объект с группировкой по диапазонам
 */
function groupByRanges(values, ranges) {
  if (!Array.isArray(values) || !Array.isArray(ranges)) {
    return {};
  }

  const result = {};
  
  // Инициализация счетчиков
  ranges.forEach(range => {
    result[range.label] = 0;
  });

  // Группировка значений
  values.forEach(value => {
    if (typeof value === 'number') {
      const range = ranges.find(r => value >= r.min && value <= r.max);
      if (range) {
        result[range.label]++;
      }
    }
  });

  return result;
}

/**
 * Расчет накопительной суммы
 * @param {Array} values - Массив значений
 * @returns {Array} Массив накопительных сумм
 */
function calculateCumulativeSum(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  const result = [];
  let sum = 0;

  values.forEach(value => {
    if (typeof value === 'number') {
      sum += value;
    }
    result.push(sum);
  });

  return result;
}

/**
 * Расчет скользящего среднего
 * @param {Array} values - Массив значений
 * @param {Number} windowSize - Размер окна
 * @returns {Array} Массив скользящих средних
 */
function calculateMovingAverage(values, windowSize) {
  if (!Array.isArray(values) || windowSize <= 0) {
    return [];
  }

  const result = [];

  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = values.slice(start, i + 1);
    const average = calculateAverage(window);
    result.push(average);
  }

  return result;
}

/**
 * Интерполация значения
 * @param {Number} x - Позиция для интерполяции
 * @param {Array} points - Массив точек [{x, y}]
 * @returns {Number|null} Интерполированное значение
 */
function interpolate(x, points) {
  if (!Array.isArray(points) || points.length < 2) {
    return null;
  }

  // Сортировка точек по x
  const sortedPoints = points.sort((a, b) => a.x - b.x);

  // Если x вне диапазона, возвращаем крайние значения
  if (x <= sortedPoints[0].x) return sortedPoints[0].y;
  if (x >= sortedPoints[sortedPoints.length - 1].x) return sortedPoints[sortedPoints.length - 1].y;

  // Поиск соседних точек
  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const p1 = sortedPoints[i];
    const p2 = sortedPoints[i + 1];

    if (x >= p1.x && x <= p2.x) {
      // Линейная интерполяция
      const ratio = (x - p1.x) / (p2.x - p1.x);
      return p1.y + ratio * (p2.y - p1.y);
    }
  }

  return null;
}

module.exports = {
  calculatePercentage,
  calculateSuccessRate,
  calculateAverage,
  calculateMedian,
  calculateStandardDeviation,
  findMinMax,
  calculateThroughput,
  calculateETA,
  calculateProgress,
  calculateGrowthRate,
  calculateWeightedAverage,
  groupByRanges,
  calculateCumulativeSum,
  calculateMovingAverage,
  interpolate
};


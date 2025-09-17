/**
 * Форматировщики для работы с датами
 * Содержит функции для форматирования дат в различные форматы
 */

/**
 * Форматирование даты в ISO строку
 * @param {Date} date - Дата для форматирования
 * @returns {String} ISO строка или null
 */
function formatToISO(date) {
  if (!date) return null;
  
  try {
    const dateObj = new Date(date);
    return dateObj.toISOString();
  } catch (error) {
    return null;
  }
}

/**
 * Форматирование даты в читаемый формат
 * @param {Date} date - Дата для форматирования
 * @param {Object} options - Опции форматирования
 * @returns {String} Отформатированная дата
 */
function formatToReadable(date, options = {}) {
  if (!date) return 'N/A';
  
  try {
    const dateObj = new Date(date);
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    };
    
    const formatOptions = { ...defaultOptions, ...options };
    return dateObj.toLocaleDateString('en-US', formatOptions);
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Форматирование даты в относительный формат (например, "2 hours ago")
 * @param {Date} date - Дата для форматирования
 * @returns {String} Относительное время
 */
function formatToRelative(date) {
  if (!date) return 'N/A';
  
  try {
    const dateObj = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    
    // Если дата в будущем
    if (diffMs < 0) {
      return formatFutureTime(Math.abs(diffMs));
    }
    
    return formatPastTime(diffMs);
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Форматирование времени в прошлом
 * @param {Number} diffMs - Разница в миллисекундах
 * @returns {String} Отформатированное время
 */
function formatPastTime(diffMs) {
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) {
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
  if (months > 0) {
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
  if (weeks > 0) {
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  if (seconds > 0) {
    return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
  }
  
  return 'Just now';
}

/**
 * Форматирование времени в будущем
 * @param {Number} diffMs - Разница в миллисекундах
 * @returns {String} Отформатированное время
 */
function formatFutureTime(diffMs) {
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `in ${days} day${days > 1 ? 's' : ''}`;
  }
  if (hours > 0) {
    return `in ${hours} hour${hours > 1 ? 's' : ''}`;
  }
  if (minutes > 0) {
    return `in ${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  if (seconds > 0) {
    return `in ${seconds} second${seconds > 1 ? 's' : ''}`;
  }
  
  return 'Very soon';
}

/**
 * Форматирование длительности в миллисекундах
 * @param {Number} milliseconds - Длительность в миллисекундах
 * @param {Object} options - Опции форматирования
 * @returns {String} Отформатированная длительность
 */
function formatDuration(milliseconds, options = {}) {
  if (!milliseconds || milliseconds === 0) {
    return options.showZero ? '0ms' : 'N/A';
  }

  if (typeof milliseconds !== 'number' || milliseconds < 0) {
    return 'Invalid Duration';
  }

  const {
    precision = 'auto', // 'auto', 'seconds', 'minutes', 'hours'
    compact = false,    // Краткий формат (1h 30m вместо 1 hour 30 minutes)
    maxUnits = 3        // Максимальное количество единиц времени
  } = options;

  const units = [
    { name: 'year', short: 'y', ms: 365 * 24 * 60 * 60 * 1000 },
    { name: 'month', short: 'mo', ms: 30 * 24 * 60 * 60 * 1000 },
    { name: 'week', short: 'w', ms: 7 * 24 * 60 * 60 * 1000 },
    { name: 'day', short: 'd', ms: 24 * 60 * 60 * 1000 },
    { name: 'hour', short: 'h', ms: 60 * 60 * 1000 },
    { name: 'minute', short: 'm', ms: 60 * 1000 },
    { name: 'second', short: 's', ms: 1000 },
    { name: 'millisecond', short: 'ms', ms: 1 }
  ];

  const result = [];
  let remaining = milliseconds;

  // Определяем минимальную единицу на основе precision
  let minUnitIndex = units.length - 1; // По умолчанию до миллисекунд
  
  if (precision === 'seconds') {
    minUnitIndex = 6;
  } else if (precision === 'minutes') {
    minUnitIndex = 5;
  } else if (precision === 'hours') {
    minUnitIndex = 4;
  } else if (precision === 'auto') {
    // Автоматическое определение точности
    if (milliseconds >= 60 * 60 * 1000) { // >= 1 hour
      minUnitIndex = 5; // до минут
    } else if (milliseconds >= 60 * 1000) { // >= 1 minute
      minUnitIndex = 6; // до секунд
    }
  }

  for (let i = 0; i < units.length && i <= minUnitIndex && result.length < maxUnits; i++) {
    const unit = units[i];
    const value = Math.floor(remaining / unit.ms);
    
    if (value > 0) {
      const unitName = compact ? unit.short : 
        (value === 1 ? unit.name : unit.name + 's');
      
      result.push(`${value}${compact ? '' : ' '}${unitName}`);
      remaining -= value * unit.ms;
    }
  }

  if (result.length === 0) {
    return precision === 'auto' ? '< 1ms' : '0' + (compact ? 'ms' : ' milliseconds');
  }

  return result.join(compact ? ' ' : ', ');
}

/**
 * Расчет возраста записи в днях
 * @param {Date} date - Дата создания записи
 * @returns {Number} Возраст в днях
 */
function calculateAgeInDays(date) {
  if (!date) return 0;
  
  try {
    const dateObj = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  } catch (error) {
    return 0;
  }
}

/**
 * Получение даты N дней назад
 * @param {Number} days - Количество дней
 * @returns {Date} Дата в прошлом
 */
function getDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Получение даты N дней вперед
 * @param {Number} days - Количество дней
 * @returns {Date} Дата в будущем
 */
function getDateDaysAhead(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Проверка, была ли дата недавно обновлена
 * @param {Date} date - Дата для проверки
 * @param {Number} maxDays - Максимальное количество дней
 * @returns {Boolean} Была ли недавно обновлена
 */
function isRecentlyUpdated(date, maxDays = 7) {
  if (!date) return false;
  
  const ageInDays = calculateAgeInDays(date);
  return ageInDays <= maxDays;
}

/**
 * Форматирование диапазона дат
 * @param {Date} startDate - Начальная дата
 * @param {Date} endDate - Конечная дата
 * @param {Object} options - Опции форматирования
 * @returns {String} Отформатированный диапазон
 */
function formatDateRange(startDate, endDate, options = {}) {
  if (!startDate && !endDate) return 'N/A';
  
  const { separator = ' - ', compact = false } = options;
  
  if (!startDate) return `Until ${formatToReadable(endDate, { compact })}`;
  if (!endDate) return `From ${formatToReadable(startDate, { compact })}`;
  
  const start = formatToReadable(startDate, { compact });
  const end = formatToReadable(endDate, { compact });
  
  return `${start}${separator}${end}`;
}

/**
 * Получение временных зон
 * @returns {Array} Список временных зон
 */
function getTimezones() {
  return [
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney'
  ];
}

/**
 * Конвертация времени в другую временную зону
 * @param {Date} date - Дата для конвертации
 * @param {String} timezone - Целевая временная зона
 * @returns {String} Отформатированная дата в новой зоне
 */
function convertToTimezone(date, timezone) {
  if (!date) return null;
  
  try {
    const dateObj = new Date(date);
    return dateObj.toLocaleString('en-US', { timeZone: timezone });
  } catch (error) {
    return 'Invalid Timezone';
  }
}

module.exports = {
  formatToISO,
  formatToReadable,
  formatToRelative,
  formatDuration,
  calculateAgeInDays,
  getDateDaysAgo,
  getDateDaysAhead,
  isRecentlyUpdated,
  formatDateRange,
  getTimezones,
  convertToTimezone
};

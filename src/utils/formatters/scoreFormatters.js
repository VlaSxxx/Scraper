/**
 * Форматировщики для работы с оценками и рейтингами
 * Содержит функции для форматирования числовых оценок в различные форматы
 */

/**
 * Форматирование числовой оценки в текстовый рейтинг
 * @param {Number} score - Числовая оценка (0-10)
 * @returns {String} Текстовый рейтинг
 */
function formatScoreToRating(score) {
  if (score === null || score === undefined) return 'Unrated';
  
  if (typeof score !== 'number' || score < 0 || score > 10) {
    return 'Invalid Score';
  }

  if (score >= 9) return 'Excellent';
  if (score >= 7.5) return 'Very Good';
  if (score >= 6) return 'Good';
  if (score >= 4) return 'Fair';
  return 'Poor';
}

/**
 * Форматирование оценки с отображением из 10
 * @param {Number} score - Числовая оценка
 * @param {Object} options - Опции форматирования
 * @returns {String} Отформатированная оценка
 */
function formatScoreDisplay(score, options = {}) {
  if (score === null || score === undefined) {
    return options.showUnrated ? 'Unrated' : 'N/A';
  }
  
  if (typeof score !== 'number') {
    return 'Invalid';
  }

  const {
    precision = 1,        // Количество знаков после запятой
    showOutOf = true,     // Показывать "/10"
    compact = false       // Компактный формат
  } = options;

  const formattedScore = score.toFixed(precision);
  
  if (compact) {
    return `${formattedScore}${showOutOf ? '/10' : ''}`;
  }
  
  return showOutOf ? `${formattedScore}/10` : formattedScore;
}

/**
 * Форматирование оценки в звездный рейтинг
 * @param {Number} score - Числовая оценка (0-10)
 * @param {Object} options - Опции форматирования
 * @returns {String} Звездный рейтинг
 */
function formatScoreToStars(score, options = {}) {
  if (score === null || score === undefined) {
    return options.showUnrated ? '☆☆☆☆☆' : 'N/A';
  }
  
  if (typeof score !== 'number' || score < 0 || score > 10) {
    return 'Invalid';
  }

  const {
    maxStars = 5,         // Максимальное количество звезд
    fullStar = '★',       // Символ полной звезды
    emptyStar = '☆',      // Символ пустой звезды
    halfStar = '⭐'       // Символ половинной звезды
  } = options;

  // Конвертируем из 10-балльной в 5-звездочную систему
  const starScore = (score / 10) * maxStars;
  const fullStars = Math.floor(starScore);
  const hasHalfStar = (starScore - fullStars) >= 0.5;
  const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);

  let result = '';
  
  // Добавляем полные звезды
  result += fullStar.repeat(fullStars);
  
  // Добавляем половинную звезду если нужно
  if (hasHalfStar) {
    result += halfStar;
  }
  
  // Добавляем пустые звезды
  result += emptyStar.repeat(emptyStars);

  return result;
}

/**
 * Форматирование оценки в процентный формат
 * @param {Number} score - Числовая оценка (0-10)
 * @param {Object} options - Опции форматирования
 * @returns {String} Процентное значение
 */
function formatScoreToPercentage(score, options = {}) {
  if (score === null || score === undefined) {
    return options.showUnrated ? 'Unrated' : 'N/A';
  }
  
  if (typeof score !== 'number' || score < 0 || score > 10) {
    return 'Invalid';
  }

  const {
    precision = 0,        // Количество знаков после запятой
    showPercent = true    // Показывать символ %
  } = options;

  const percentage = (score / 10) * 100;
  const formatted = percentage.toFixed(precision);
  
  return showPercent ? `${formatted}%` : formatted;
}

/**
 * Получение цветового кода для оценки
 * @param {Number} score - Числовая оценка
 * @param {Object} options - Опции форматирования
 * @returns {String} Цветовой код
 */
function getScoreColor(score, options = {}) {
  if (score === null || score === undefined) {
    return options.defaultColor || '#999999';
  }
  
  if (typeof score !== 'number' || score < 0 || score > 10) {
    return options.errorColor || '#ff0000';
  }

  const {
    colorScheme = 'default' // 'default', 'traffic', 'heatmap'
  } = options;

  switch (colorScheme) {
    case 'traffic':
      if (score >= 7) return '#00cc00'; // Зеленый
      if (score >= 4) return '#ffcc00'; // Желтый
      return '#ff0000'; // Красный

    case 'heatmap':
      if (score >= 9) return '#4CAF50'; // Зеленый
      if (score >= 7.5) return '#8BC34A'; // Светло-зеленый
      if (score >= 6) return '#FFEB3B'; // Желтый
      if (score >= 4) return '#FF9800'; // Оранжевый
      return '#F44336'; // Красный

    default:
      if (score >= 8) return '#4CAF50'; // Зеленый
      if (score >= 6) return '#2196F3'; // Синий
      if (score >= 4) return '#FF9800'; // Оранжевый
      return '#F44336'; // Красный
  }
}

/**
 * Получение класса CSS для оценки
 * @param {Number} score - Числовая оценка
 * @returns {String} CSS класс
 */
function getScoreCSSClass(score) {
  if (score === null || score === undefined) return 'score-unrated';
  if (typeof score !== 'number' || score < 0 || score > 10) return 'score-invalid';

  if (score >= 9) return 'score-excellent';
  if (score >= 7.5) return 'score-very-good';
  if (score >= 6) return 'score-good';
  if (score >= 4) return 'score-fair';
  return 'score-poor';
}

/**
 * Форматирование диапазона оценок
 * @param {Number} minScore - Минимальная оценка
 * @param {Number} maxScore - Максимальная оценка
 * @param {Object} options - Опции форматирования
 * @returns {String} Отформатированный диапазон
 */
function formatScoreRange(minScore, maxScore, options = {}) {
  const {
    separator = ' - ',
    precision = 1,
    showOutOf = true
  } = options;

  if (minScore === null || minScore === undefined) {
    return maxScore !== null && maxScore !== undefined 
      ? `≤ ${formatScoreDisplay(maxScore, { precision, showOutOf })}`
      : 'Any score';
  }

  if (maxScore === null || maxScore === undefined) {
    return `≥ ${formatScoreDisplay(minScore, { precision, showOutOf })}`;
  }

  if (minScore === maxScore) {
    return formatScoreDisplay(minScore, { precision, showOutOf });
  }

  const min = formatScoreDisplay(minScore, { precision, showOutOf: false });
  const max = formatScoreDisplay(maxScore, { precision, showOutOf: false });
  
  return showOutOf ? `${min}${separator}${max}/10` : `${min}${separator}${max}`;
}

/**
 * Получение описания качества на основе оценки
 * @param {Number} score - Числовая оценка
 * @param {Object} options - Опции форматирования
 * @returns {String} Описание качества
 */
function getQualityDescription(score, options = {}) {
  if (score === null || score === undefined) {
    return options.showUnrated ? 'Not rated yet' : 'N/A';
  }
  
  if (typeof score !== 'number' || score < 0 || score > 10) {
    return 'Invalid score';
  }

  const {
    detailed = false // Подробное описание
  } = options;

  if (detailed) {
    if (score >= 9.5) return 'Outstanding quality - among the very best';
    if (score >= 9) return 'Excellent quality - highly recommended';
    if (score >= 8) return 'Very good quality - great choice';
    if (score >= 7) return 'Good quality - solid option';
    if (score >= 6) return 'Above average quality - decent choice';
    if (score >= 5) return 'Average quality - meets basic standards';
    if (score >= 4) return 'Below average quality - limited appeal';
    if (score >= 3) return 'Poor quality - significant issues';
    if (score >= 2) return 'Very poor quality - major problems';
    return 'Extremely poor quality - avoid if possible';
  } else {
    if (score >= 9) return 'Outstanding';
    if (score >= 8) return 'Excellent';
    if (score >= 7) return 'Very Good';
    if (score >= 6) return 'Good';
    if (score >= 5) return 'Average';
    if (score >= 4) return 'Below Average';
    if (score >= 3) return 'Poor';
    return 'Very Poor';
  }
}

/**
 * Нормализация оценки в диапазон 0-10
 * @param {Number} score - Исходная оценка
 * @param {Object} scale - Масштаб исходной оценки
 * @returns {Number} Нормализованная оценка
 */
function normalizeScore(score, scale = { min: 0, max: 10 }) {
  if (score === null || score === undefined) return null;
  if (typeof score !== 'number') return null;

  const { min, max } = scale;
  
  if (min === max) return 5; // Средняя оценка при некорректном масштабе
  
  // Нормализация в диапазон 0-10
  const normalized = ((score - min) / (max - min)) * 10;
  
  // Ограничиваем результат диапазоном 0-10
  return Math.max(0, Math.min(10, normalized));
}

/**
 * Расчет средней оценки
 * @param {Array} scores - Массив оценок
 * @param {Object} options - Опции расчета
 * @returns {Number|null} Средняя оценка
 */
function calculateAverageScore(scores, options = {}) {
  if (!Array.isArray(scores) || scores.length === 0) {
    return null;
  }

  const {
    excludeNull = true,   // Исключать null/undefined значения
    precision = 1         // Точность результата
  } = options;

  let validScores = scores;
  
  if (excludeNull) {
    validScores = scores.filter(score => 
      score !== null && score !== undefined && typeof score === 'number'
    );
  }

  if (validScores.length === 0) {
    return null;
  }

  const sum = validScores.reduce((acc, score) => acc + score, 0);
  const average = sum / validScores.length;
  
  return parseFloat(average.toFixed(precision));
}

/**
 * Создание сводки оценок
 * @param {Array} scores - Массив оценок
 * @returns {Object} Сводка оценок
 */
function createScoreSummary(scores) {
  if (!Array.isArray(scores) || scores.length === 0) {
    return {
      count: 0,
      average: null,
      min: null,
      max: null,
      distribution: {}
    };
  }

  const validScores = scores.filter(score => 
    score !== null && score !== undefined && typeof score === 'number'
  );

  if (validScores.length === 0) {
    return {
      count: 0,
      average: null,
      min: null,
      max: null,
      distribution: {}
    };
  }

  const average = calculateAverageScore(validScores);
  const min = Math.min(...validScores);
  const max = Math.max(...validScores);

  // Распределение по рейтингам
  const distribution = validScores.reduce((dist, score) => {
    const rating = formatScoreToRating(score);
    dist[rating] = (dist[rating] || 0) + 1;
    return dist;
  }, {});

  return {
    count: validScores.length,
    average,
    min,
    max,
    distribution
  };
}

module.exports = {
  formatScoreToRating,
  formatScoreDisplay,
  formatScoreToStars,
  formatScoreToPercentage,
  getScoreColor,
  getScoreCSSClass,
  formatScoreRange,
  getQualityDescription,
  normalizeScore,
  calculateAverageScore,
  createScoreSummary
};


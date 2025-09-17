// Конфигурация для всех поддерживаемых игр
const gamesConfig = {
  'crazy-time': {
    key: 'crazy-time',
    name: 'Crazy Time',
    type: 'game show',
    provider: 'evolution',
    isLive: true,
    url: 'https://casinoscores.com/',
    searchKeywords: ['crazy time', 'crazy'],
    features: ['live', 'game show', 'wheel', 'multipliers'],
    description: 'Crazy Time is a popular live casino game show by Evolution Gaming featuring a wheel with multipliers and bonus rounds.',
    defaultUrl: 'https://casinoscores.com/crazy-time'
  },
  'monopoly-live': {
    key: 'monopoly-live',
    name: 'Monopoly Live',
    type: 'game show',
    provider: 'evolution',
    isLive: true,
    url: 'https://casinoscores.com/',
    searchKeywords: ['monopoly live', 'monopoly'],
    features: ['live', 'game show', 'board game', 'multipliers'],
    description: 'Monopoly Live is a live casino game show based on the classic board game with multipliers and bonus rounds.',
    defaultUrl: 'https://casinoscores.com/monopoly-live'
  },
  'deal-or-no-deal': {
    key: 'deal-or-no-deal',
    name: 'Deal or No Deal',
    type: 'game show',
    provider: 'evolution',
    isLive: true,
    url: 'https://casinoscores.com/',
    searchKeywords: ['deal or no deal', 'deal'],
    features: ['live', 'game show', 'cases', 'banker'],
    description: 'Deal or No Deal is a live casino game show where players choose cases and negotiate with the banker.',
    defaultUrl: 'https://casinoscores.com/deal-or-no-deal'
  },
  'lightning-roulette': {
    key: 'lightning-roulette',
    name: 'Lightning Roulette',
    type: 'roulette',
    provider: 'evolution',
    isLive: true,
    url: 'https://casinoscores.com/',
    searchKeywords: ['lightning roulette', 'lightning'],
    features: ['live', 'roulette', 'lightning', 'multipliers'],
    description: 'Lightning Roulette is a live roulette game with lightning multipliers that can boost winnings.',
    defaultUrl: 'https://casinoscores.com/lightning-roulette'
  },
  'blackjack-live': {
    key: 'blackjack-live',
    name: 'Blackjack Live',
    type: 'blackjack',
    provider: 'evolution',
    isLive: true,
    url: 'https://casinoscores.com/',
    searchKeywords: ['blackjack live', 'blackjack'],
    features: ['live', 'blackjack', 'card game'],
    description: 'Live Blackjack is a classic card game played with a real dealer in a live casino environment.',
    defaultUrl: 'https://casinoscores.com/blackjack-live'
  },
  'baccarat-live': {
    key: 'baccarat-live',
    name: 'Baccarat Live',
    type: 'baccarat',
    provider: 'evolution',
    isLive: true,
    url: 'https://casinoscores.com/',
    searchKeywords: ['baccarat live', 'baccarat'],
    features: ['live', 'baccarat', 'card game'],
    description: 'Live Baccarat is an elegant card game played with a real dealer in a live casino setting.',
    defaultUrl: 'https://casinoscores.com/baccarat-live'
  },
  'casino-scores': {
    key: 'casino-scores',
    name: 'Casino Scores',
    type: 'casino',
    provider: 'various',
    isLive: false,
    url: 'https://casinoscores.com/',
    searchKeywords: ['casino', 'bonus', 'payment', 'license'],
    features: ['casino reviews', 'bonuses', 'payment methods'],
    description: 'Comprehensive casino reviews and ratings from Casino Scores',
    defaultUrl: 'https://casinoscores.com/'
  }
};

// Функция для получения конфигурации игры по ключу
function getGameConfig(gameKey) {
  return gamesConfig[gameKey];
}

// Функция для получения всех доступных игр
function getAllGames() {
  return Object.keys(gamesConfig).map(key => ({
    key,
    ...gamesConfig[key]
  }));
}

// Функция для проверки существования игры
function isGameSupported(gameKey) {
  return !!gamesConfig[gameKey];
}

// Функция для получения игр по типу
function getGamesByType(type) {
  return Object.entries(gamesConfig)
    .filter(([key, config]) => config.type === type)
    .map(([key, config]) => ({
      key,
      ...config
    }));
}

// Функция для получения игр по провайдеру
function getGamesByProvider(provider) {
  return Object.entries(gamesConfig)
    .filter(([key, config]) => config.provider === provider)
    .map(([key, config]) => ({
      key,
      ...config
    }));
}

module.exports = {
  gamesConfig,
  getGameConfig,
  getAllGames,
  isGameSupported,
  getGamesByType,
  getGamesByProvider
};

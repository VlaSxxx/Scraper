const mongoose = require('mongoose');

const casinoScoreSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  url: {
    type: String,
    required: true
  },
  // Новые поля для игр
  type: {
    type: String,
    enum: ['roulette', 'blackjack', 'baccarat', 'poker', 'slots', 'craps', 'dice', 'wheel', 'game show', 'live', 'stream', 'unknown']
  },
  description: {
    type: String
  },
  stats: {
    type: mongoose.Schema.Types.Mixed
  },
  isLive: {
    type: Boolean,
    default: false
  },
  provider: {
    type: String
  },
  // Существующие поля (оставляем для совместимости)
  score: {
    type: Number,
    min: 0,
    max: 10
  },
  rating: {
    type: String,
    enum: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor']
  },
  features: [{
    type: String
  }],
  bonuses: [{
    type: String
  }],
  paymentMethods: [{
    type: String
  }],
  licenses: [{
    type: String
  }],
  languages: [{
    type: String
  }],
  currencies: [{
    type: String
  }],
  minDeposit: {
    type: String
  },
  maxWithdrawal: {
    type: String
  },
  withdrawalTime: {
    type: String
  },
  customerSupport: {
    type: String
  },
  mobileCompatible: {
    type: Boolean,
    default: false
  },
  liveChat: {
    type: Boolean,
    default: false
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  scrapedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Индексы для быстрого поиска
casinoScoreSchema.index({ score: -1 });
casinoScoreSchema.index({ rating: 1 });
casinoScoreSchema.index({ scrapedAt: -1 });
casinoScoreSchema.index({ name: 'text' });
casinoScoreSchema.index({ type: 1 });
casinoScoreSchema.index({ provider: 1 });
casinoScoreSchema.index({ isLive: 1 });

module.exports = mongoose.model('CasinoScore', casinoScoreSchema);

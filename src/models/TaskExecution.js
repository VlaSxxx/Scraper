const mongoose = require('mongoose');

const taskExecutionSchema = new mongoose.Schema({
  taskName: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['success', 'error', 'running', 'cancelled'],
    required: true
  },
  executionTime: {
    type: Number, // в миллисекундах
    required: true
  },
  processedItems: {
    type: Number,
    default: 0
  },
  error: {
    message: String,
    stack: String,
    code: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  duration: {
    type: Number // в миллисекундах
  }
}, {
  timestamps: true
});

// Индексы для быстрого поиска
taskExecutionSchema.index({ taskName: 1, startedAt: -1 });
taskExecutionSchema.index({ status: 1, startedAt: -1 });
taskExecutionSchema.index({ startedAt: -1 });

// Виртуальное поле для вычисления длительности
taskExecutionSchema.virtual('durationMs').get(function() {
  if (this.completedAt && this.startedAt) {
    return this.completedAt.getTime() - this.startedAt.getTime();
  }
  return null;
});

// Метод для завершения задачи перенесен в TaskExecutionService

// Статические методы перенесены в TaskExecutionRepository и TaskStatsService

module.exports = mongoose.model('TaskExecution', taskExecutionSchema);

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

// Метод для завершения задачи
taskExecutionSchema.methods.complete = function(status, processedItems = 0, error = null) {
  this.status = status;
  this.processedItems = processedItems;
  this.completedAt = new Date();
  this.duration = this.durationMs;
  
  if (error) {
    this.error = {
      message: error.message,
      stack: error.stack,
      code: error.code
    };
  }
  
  return this.save();
};

// Статические методы для статистики
taskExecutionSchema.statics.getTaskStats = async function(taskName, days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const stats = await this.aggregate([
    {
      $match: {
        taskName,
        startedAt: { $gte: cutoffDate }
      }
    },
    {
      $group: {
        _id: null,
        totalExecutions: { $sum: 1 },
        successfulExecutions: {
          $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
        },
        failedExecutions: {
          $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] }
        },
        averageExecutionTime: { $avg: '$executionTime' },
        totalProcessedItems: { $sum: '$processedItems' },
        lastExecution: { $max: '$startedAt' }
      }
    }
  ]);

  return stats[0] || {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    averageExecutionTime: 0,
    totalProcessedItems: 0,
    lastExecution: null
  };
};

// Статические методы для получения последних выполнений
taskExecutionSchema.statics.getRecentExecutions = async function(taskName, limit = 10) {
  return this.find({ taskName })
    .sort({ startedAt: -1 })
    .limit(limit)
    .select('-__v')
    .lean();
};

// Статические методы для очистки старых записей
taskExecutionSchema.statics.cleanupOldRecords = async function(daysToKeep = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await this.deleteMany({
    startedAt: { $lt: cutoffDate }
  });

  return result.deletedCount;
};

module.exports = mongoose.model('TaskExecution', taskExecutionSchema);

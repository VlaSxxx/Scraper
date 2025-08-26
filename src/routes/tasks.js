const express = require('express');
const Joi = require('joi');
const TaskScheduler = require('../tasks/scheduler');
const TaskExecution = require('../models/TaskExecution');

const router = express.Router();
const taskScheduler = new TaskScheduler();

// Схемы валидации
const createTaskSchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  schedule: Joi.string().required().pattern(/^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/),
  timezone: Joi.string().default('UTC'),
  runOnInit: Joi.boolean().default(false)
});

const runTaskSchema = Joi.object({
  taskName: Joi.string().required()
});

// Middleware для валидации
const validateCreateTask = (req, res, next) => {
  const { error, value } = createTaskSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }
  req.validatedData = value;
  next();
};

const validateRunTask = (req, res, next) => {
  const { error, value } = runTaskSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }
  req.validatedData = value;
  next();
};

// GET /api/tasks - Получить статус всех задач
router.get('/', async (req, res) => {
  try {
    const status = taskScheduler.getJobsStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting tasks status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/tasks - Создать новую задачу
router.post('/', validateCreateTask, async (req, res) => {
  try {
    const { name, schedule, timezone, runOnInit } = req.validatedData;

    // Создаем задачу
    const job = taskScheduler.createScrapingJob(schedule, {
      name,
      timezone,
      runOnInit
    });

    res.status(201).json({
      success: true,
      message: `Task "${name}" created successfully`,
      data: {
        name,
        schedule,
        timezone,
        runOnInit
      }
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task'
    });
  }
});

// POST /api/tasks/run - Запустить задачу один раз
router.post('/run', validateRunTask, async (req, res) => {
  try {
    const { taskName } = req.validatedData;

    // Проверяем, существует ли задача
    const status = taskScheduler.getJobsStatus();
    const taskExists = status.jobs.some(job => job.name === taskName);

    if (!taskExists) {
      return res.status(404).json({
        success: false,
        message: `Task "${taskName}" not found`
      });
    }

    // Запускаем задачу
    await taskScheduler.runJobOnce(taskName);

    res.json({
      success: true,
      message: `Task "${taskName}" executed successfully`
    });
  } catch (error) {
    console.error('Error running task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run task'
    });
  }
});

// DELETE /api/tasks/:name - Остановить задачу
router.delete('/:name', async (req, res) => {
  try {
    const { name } = req.params;

    taskScheduler.stopJob(name);

    res.json({
      success: true,
      message: `Task "${name}" stopped successfully`
    });
  } catch (error) {
    console.error('Error stopping task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop task'
    });
  }
});

// DELETE /api/tasks - Остановить все задачи
router.delete('/', async (req, res) => {
  try {
    taskScheduler.stopAllJobs();

    res.json({
      success: true,
      message: 'All tasks stopped successfully'
    });
  } catch (error) {
    console.error('Error stopping all tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop tasks'
    });
  }
});

// GET /api/tasks/stats - Получить статистику задач
router.get('/stats', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const status = taskScheduler.getJobsStatus();
    
    // Получаем статистику для каждой задачи
    const tasksStats = await Promise.all(
      status.jobs.map(async (job) => {
        const stats = await TaskExecution.getTaskStats(job.name, parseInt(days));
        return {
          name: job.name,
          schedule: job.schedule,
          isActive: job.isActive,
          lastExecution: job.lastExecution,
          nextExecution: job.nextExecution,
          stats
        };
      })
    );

    res.json({
      success: true,
      data: {
        tasks: tasksStats,
        overall: status.stats,
        isRunning: status.isRunning
      }
    });
  } catch (error) {
    console.error('Error getting tasks stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/tasks/:name/executions - Получить историю выполнения задачи
router.get('/:name/executions', async (req, res) => {
  try {
    const { name } = req.params;
    const { limit = 10, page = 1 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [executions, total] = await Promise.all([
      TaskExecution.find({ taskName: name })
        .sort({ startedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v')
        .lean(),
      TaskExecution.countDocuments({ taskName: name })
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        executions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error getting task executions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/tasks/scraping-stats - Получить статистику скрейпинга
router.get('/scraping-stats', async (req, res) => {
  try {
    const stats = await taskScheduler.getScrapingStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting scraping stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/tasks/cleanup - Очистить старые данные
router.post('/cleanup', async (req, res) => {
  try {
    const { daysToKeep = 30 } = req.body;

    const [casinoRecordsDeleted, executionRecordsDeleted] = await Promise.all([
      taskScheduler.cleanupOldData(daysToKeep),
      TaskExecution.cleanupOldRecords(daysToKeep)
    ]);

    res.json({
      success: true,
      message: 'Cleanup completed successfully',
      data: {
        casinoRecordsDeleted,
        executionRecordsDeleted,
        daysToKeep
      }
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform cleanup'
    });
  }
});

// GET /api/tasks/health - Проверка здоровья системы задач
router.get('/health', async (req, res) => {
  try {
    const status = taskScheduler.getJobsStatus();
    const isHealthy = status.activeJobs > 0 && !status.isRunning;

    res.json({
      success: true,
      data: {
        healthy: isHealthy,
        activeJobs: status.activeJobs,
        totalJobs: status.totalJobs,
        isRunning: status.isRunning,
        lastRun: status.stats.lastRun,
        lastSuccess: status.stats.lastSuccess,
        lastError: status.stats.lastError
      }
    });
  } catch (error) {
    console.error('Error checking tasks health:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;

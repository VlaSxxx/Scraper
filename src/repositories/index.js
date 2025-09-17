const CasinoScore = require('../models/CasinoScore');
const TaskExecution = require('../models/TaskExecution');

const BaseRepository = require('./base/BaseRepository');
const CasinoScoreRepository = require('./CasinoScoreRepository');
const TaskExecutionRepository = require('./TaskExecutionRepository');

/**
 * Фабрика для создания экземпляров репозиториев
 * Обеспечивает единый интерфейс доступа к репозиториям
 */
class RepositoryFactory {
  constructor() {
    this._casinoScoreRepository = null;
    this._taskExecutionRepository = null;
  }

  /**
   * Получение репозитория для CasinoScore
   * @returns {CasinoScoreRepository} Экземпляр репозитория
   */
  getCasinoScoreRepository() {
    if (!this._casinoScoreRepository) {
      this._casinoScoreRepository = new CasinoScoreRepository(CasinoScore);
    }
    return this._casinoScoreRepository;
  }

  /**
   * Получение репозитория для TaskExecution
   * @returns {TaskExecutionRepository} Экземпляр репозитория
   */
  getTaskExecutionRepository() {
    if (!this._taskExecutionRepository) {
      this._taskExecutionRepository = new TaskExecutionRepository(TaskExecution);
    }
    return this._taskExecutionRepository;
  }
}

// Создаем единственный экземпляр фабрики (Singleton)
const repositoryFactory = new RepositoryFactory();

module.exports = {
  BaseRepository,
  CasinoScoreRepository,
  TaskExecutionRepository,
  repositoryFactory
};


const CasinoController = require('./CasinoController');
const TaskController = require('./TaskController');

/**
 * Фабрика для создания экземпляров контроллеров
 * Обеспечивает единый интерфейс доступа к контроллерам
 */
class ControllerFactory {
  constructor() {
    this._casinoController = null;
    this._taskController = null;
  }

  /**
   * Получение контроллера казино
   * @returns {CasinoController} Экземпляр контроллера
   */
  getCasinoController() {
    if (!this._casinoController) {
      this._casinoController = new CasinoController();
    }
    return this._casinoController;
  }

  /**
   * Получение контроллера задач
   * @returns {TaskController} Экземпляр контроллера
   */
  getTaskController() {
    if (!this._taskController) {
      this._taskController = new TaskController();
    }
    return this._taskController;
  }

  /**
   * Получение всех контроллеров
   * @returns {Object} Объект с контроллерами
   */
  getAllControllers() {
    return {
      casino: this.getCasinoController(),
      task: this.getTaskController()
    };
  }
}

// Создаем единственный экземпляр фабрики (Singleton)
const controllerFactory = new ControllerFactory();

module.exports = {
  CasinoController,
  TaskController,
  controllerFactory
};


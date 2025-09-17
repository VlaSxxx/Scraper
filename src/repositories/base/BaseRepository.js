/**
 * Базовый репозиторий для работы с MongoDB через Mongoose
 * Предоставляет стандартные CRUD операции для всех моделей
 */
class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  /**
   * Создание нового документа
   * @param {Object} data - Данные для создания
   * @returns {Promise<Object>} Созданный документ
   */
  async create(data) {
    try {
      const document = new this.model(data);
      return await document.save();
    } catch (error) {
      throw new Error(`Failed to create document: ${error.message}`);
    }
  }

  /**
   * Поиск по ID
   * @param {String} id - ID документа
   * @param {Object} options - Опции запроса (select, populate)
   * @returns {Promise<Object|null>} Найденный документ или null
   */
  async findById(id, options = {}) {
    try {
      let query = this.model.findById(id);
      
      if (options.select) {
        query = query.select(options.select);
      }
      
      if (options.populate) {
        query = query.populate(options.populate);
      }
      
      return await query.exec();
    } catch (error) {
      throw new Error(`Failed to find document by ID: ${error.message}`);
    }
  }

  /**
   * Поиск одного документа по условию
   * @param {Object} filter - Условия поиска
   * @param {Object} options - Опции запроса
   * @returns {Promise<Object|null>} Найденный документ или null
   */
  async findOne(filter, options = {}) {
    try {
      let query = this.model.findOne(filter);
      
      if (options.select) {
        query = query.select(options.select);
      }
      
      if (options.populate) {
        query = query.populate(options.populate);
      }
      
      return await query.exec();
    } catch (error) {
      throw new Error(`Failed to find document: ${error.message}`);
    }
  }

  /**
   * Поиск множества документов
   * @param {Object} filter - Условия поиска
   * @param {Object} options - Опции запроса (sort, limit, skip, select, populate)
   * @returns {Promise<Array>} Массив найденных документов
   */
  async find(filter = {}, options = {}) {
    try {
      let query = this.model.find(filter);
      
      if (options.sort) {
        query = query.sort(options.sort);
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.skip) {
        query = query.skip(options.skip);
      }
      
      if (options.select) {
        query = query.select(options.select);
      }
      
      if (options.populate) {
        query = query.populate(options.populate);
      }
      
      return await query.exec();
    } catch (error) {
      throw new Error(`Failed to find documents: ${error.message}`);
    }
  }

  /**
   * Обновление документа по ID
   * @param {String} id - ID документа
   * @param {Object} updateData - Данные для обновления
   * @param {Object} options - Опции обновления
   * @returns {Promise<Object|null>} Обновленный документ
   */
  async findByIdAndUpdate(id, updateData, options = { new: true, runValidators: true }) {
    try {
      return await this.model.findByIdAndUpdate(id, updateData, options);
    } catch (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }

  /**
   * Обновление одного документа по условию
   * @param {Object} filter - Условия поиска
   * @param {Object} updateData - Данные для обновления
   * @param {Object} options - Опции обновления
   * @returns {Promise<Object|null>} Обновленный документ
   */
  async findOneAndUpdate(filter, updateData, options = { new: true, runValidators: true }) {
    try {
      return await this.model.findOneAndUpdate(filter, updateData, options);
    } catch (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }

  /**
   * Удаление документа по ID
   * @param {String} id - ID документа
   * @returns {Promise<Object|null>} Удаленный документ
   */
  async findByIdAndDelete(id) {
    try {
      return await this.model.findByIdAndDelete(id);
    } catch (error) {
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  /**
   * Удаление множества документов
   * @param {Object} filter - Условия удаления
   * @returns {Promise<Object>} Результат операции удаления
   */
  async deleteMany(filter) {
    try {
      return await this.model.deleteMany(filter);
    } catch (error) {
      throw new Error(`Failed to delete documents: ${error.message}`);
    }
  }

  /**
   * Подсчет документов
   * @param {Object} filter - Условия подсчета
   * @returns {Promise<Number>} Количество документов
   */
  async count(filter = {}) {
    try {
      return await this.model.countDocuments(filter);
    } catch (error) {
      throw new Error(`Failed to count documents: ${error.message}`);
    }
  }

  /**
   * Проверка существования документа
   * @param {Object} filter - Условия поиска
   * @returns {Promise<Boolean>} Существует ли документ
   */
  async exists(filter) {
    try {
      const document = await this.model.exists(filter);
      return !!document;
    } catch (error) {
      throw new Error(`Failed to check document existence: ${error.message}`);
    }
  }

  /**
   * Агрегация данных
   * @param {Array} pipeline - Pipeline для агрегации
   * @returns {Promise<Array>} Результат агрегации
   */
  async aggregate(pipeline) {
    try {
      return await this.model.aggregate(pipeline);
    } catch (error) {
      throw new Error(`Failed to aggregate data: ${error.message}`);
    }
  }

  /**
   * Сохранение документа
   * @param {Object} document - Документ для сохранения
   * @returns {Promise<Object>} Сохраненный документ
   */
  async save(document) {
    try {
      return await document.save();
    } catch (error) {
      throw new Error(`Failed to save document: ${error.message}`);
    }
  }

  /**
   * Bulk операции
   * @param {Array} operations - Массив операций
   * @returns {Promise<Object>} Результат bulk операции
   */
  async bulkWrite(operations) {
    try {
      return await this.model.bulkWrite(operations);
    } catch (error) {
      throw new Error(`Failed to execute bulk operations: ${error.message}`);
    }
  }
}

module.exports = BaseRepository;


// Casino DTOs
const {
  CasinoListDto,
  CasinoDetailDto,
  CasinoCreateDto,
  CasinoFilterDto,
  CasinoPaginationDto,
  CasinoStatsDto,
  CasinoComparisonDto
} = require('./CasinoDto');

// Task DTOs
const {
  TaskListDto,
  TaskDetailDto,
  TaskCreateDto,
  TaskFilterDto,
  TaskStatsDto,
  TaskTrendDto
} = require('./TaskDto');

/**
 * Фабрика для создания DTO объектов
 * Предоставляет единый интерфейс для создания всех типов DTO
 */
class DtoFactory {
  // Casino DTO factories
  createCasinoListDto(casino) {
    return new CasinoListDto(casino);
  }

  createCasinoDetailDto(casino) {
    return new CasinoDetailDto(casino);
  }

  createCasinoCreateDto(data) {
    return new CasinoCreateDto(data);
  }

  createCasinoFilterDto(query) {
    return new CasinoFilterDto(query);
  }

  createCasinoPaginationDto(query) {
    return new CasinoPaginationDto(query);
  }

  createCasinoStatsDto(stats) {
    return new CasinoStatsDto(stats);
  }

  createCasinoComparisonDto(casinos) {
    return new CasinoComparisonDto(casinos);
  }

  // Task DTO factories
  createTaskListDto(task) {
    return new TaskListDto(task);
  }

  createTaskDetailDto(task) {
    return new TaskDetailDto(task);
  }

  createTaskCreateDto(data) {
    return new TaskCreateDto(data);
  }

  createTaskFilterDto(query) {
    return new TaskFilterDto(query);
  }

  createTaskStatsDto(stats) {
    return new TaskStatsDto(stats);
  }

  createTaskTrendDto(trends) {
    return new TaskTrendDto(trends);
  }

  // Bulk DTO creation methods
  createCasinoListDtos(casinos) {
    return casinos.map(casino => this.createCasinoListDto(casino));
  }

  createTaskListDtos(tasks) {
    return tasks.map(task => this.createTaskListDto(task));
  }

  // Response DTO creation with pagination
  createPaginatedCasinoResponse(casinos, total, paginationDto) {
    return {
      data: this.createCasinoListDtos(casinos),
      pagination: paginationDto.createPaginationInfo(total)
    };
  }

  createPaginatedTaskResponse(tasks, total, paginationDto) {
    return {
      data: this.createTaskListDtos(tasks),
      pagination: paginationDto.createPaginationInfo(total)
    };
  }

  // API Response helpers
  createSuccessResponse(data, message = null) {
    const response = {
      success: true,
      data
    };
    
    if (message) {
      response.message = message;
    }
    
    return response;
  }

  createErrorResponse(message, errors = null, code = null) {
    const response = {
      success: false,
      message
    };
    
    if (errors) {
      response.errors = errors;
    }
    
    if (code) {
      response.code = code;
    }
    
    return response;
  }

  createValidationErrorResponse(errors, warnings = null) {
    const response = {
      success: false,
      message: 'Validation failed',
      errors
    };
    
    if (warnings && warnings.length > 0) {
      response.warnings = warnings;
    }
    
    return response;
  }

  // Utility methods for DTO transformation
  transformQueryToFilter(query, type = 'casino') {
    if (type === 'casino') {
      return this.createCasinoFilterDto(query);
    } else if (type === 'task') {
      return this.createTaskFilterDto(query);
    }
    throw new Error(`Unknown filter type: ${type}`);
  }

  transformQueryToPagination(query) {
    return this.createCasinoPaginationDto(query);
  }

  // Data validation helpers
  validateAndCreateCasinoDto(data) {
    const dto = this.createCasinoCreateDto(data);
    const validation = dto.validate();
    
    return {
      dto,
      validation,
      isValid: validation.isValid
    };
  }

  validateAndCreateTaskDto(data) {
    const dto = this.createTaskCreateDto(data);
    const validation = dto.validate();
    
    return {
      dto,
      validation,
      isValid: validation.isValid
    };
  }
}

// Создаем единственный экземпляр фабрики (Singleton)
const dtoFactory = new DtoFactory();

module.exports = {
  // DTO классы
  CasinoListDto,
  CasinoDetailDto,
  CasinoCreateDto,
  CasinoFilterDto,
  CasinoPaginationDto,
  CasinoStatsDto,
  CasinoComparisonDto,
  TaskListDto,
  TaskDetailDto,
  TaskCreateDto,
  TaskFilterDto,
  TaskStatsDto,
  TaskTrendDto,
  
  // Фабрика DTO
  DtoFactory,
  dtoFactory
};

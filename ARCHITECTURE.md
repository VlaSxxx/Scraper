# 🏗️ Архитектура Pars-bot

## 📋 Обзор Архитектуры

Проект был рефакторен в соответствии с современными принципами Clean Architecture с четким разделением ответственности между слоями.

## 🎯 Схема Архитектуры

```
📁 src/
├── 📁 models/                    # ✅ ТОЛЬКО схемы данных
│   ├── CasinoScore.js           # Mongoose schema + простые virtuals
│   └── TaskExecution.js         # Mongoose schema + простые virtuals
│
├── 📁 repositories/              # 🆕 Data Access Layer (DAL)
│   ├── base/
│   │   └── BaseRepository.js    # Базовый класс с CRUD
│   ├── CasinoScoreRepository.js # Сложные запросы к БД
│   ├── TaskExecutionRepository.js
│   └── index.js                 # Экспорт всех репозиториев
│
├── 📁 services/                  # 🔄 Business Logic Layer
│   ├── casino/
│   │   ├── CasinoScoreService.js     # Бизнес-логика казино
│   │   ├── CasinoAnalyticsService.js # Аналитика и статистика
│   │   └── CasinoValidationService.js # Валидация бизнес-правил
│   ├── tasks/
│   │   ├── TaskExecutionService.js   # Управление задачами
│   │   ├── TaskStatsService.js       # Статистика задач
│   │   └── TaskCleanupService.js     # Очистка старых данных
│   └── index.js
│
├── 📁 scrapers/                  # 🕷️ Scraping Layer (отдельно!)
│   ├── base-scraper.js          # Базовый скрапер
│   ├── scraper-factory.js       # Фабрика скраперов
│   ├── universal-scraper.js     # Универсальный скрапер
│   ├── scraper.js               # Основной скрапер
│   ├── crazy-time-scraper.js    # Скрапер Crazy Time
│   ├── monopoly-live-scraper.js # Скрапер Monopoly Live
│   └── index.js                 # Экспорт скрапинг-сервисов
│
├── 📁 controllers/               # 🌐 Presentation Layer
│   ├── CasinoController.js      # HTTP handlers
│   ├── TaskController.js
│   └── index.js
│
├── 📁 utils/                     # 🛠️ Утилиты
│   ├── validators/
│   │   ├── casinoValidators.js  # Валидаторы данных
│   │   └── taskValidators.js
│   ├── formatters/
│   │   ├── dateFormatters.js    # Форматирование дат
│   │   └── scoreFormatters.js   # Форматирование оценок
│   ├── calculations.js          # Математические вычисления
│   └── constants.js             # Константы приложения
│
├── 📁 dto/                       # 🆕 Data Transfer Objects
│   ├── CasinoDto.js             # Объекты для передачи данных
│   └── TaskDto.js
│
├── 📁 tasks/                     # ⏰ Планировщик задач
│   └── scheduler.js             # Cron задачи и планировщик
│
└── 📁 config/                    # ⚙️ Конфигурация
    ├── database.js
    ├── games.js
    └── layers.js                 # 🆕 Конфигурация слоев
```

## 🔄 Что Было Перенесено

### ❌ ИЗ MODELS (что было удалено)

**CasinoScore.js:**
```javascript
// ❌ УДАЛЕНО - перенесено в CasinoScoreRepository
casinoScoreSchema.statics.findTopRated = function(limit = 10) { ... }
casinoScoreSchema.statics.findByType = function(type, limit = 20) { ... }
casinoScoreSchema.statics.findLiveGames = function() { ... }
casinoScoreSchema.statics.findRecentlyUpdated = function(days = 7) { ... }

// ❌ УДАЛЕНО - перенесено в CasinoScoreService
casinoScoreSchema.methods.updateScore = function(newScore) { ... }
casinoScoreSchema.methods.addFeature = function(feature) { ... }
```

**TaskExecution.js:**
```javascript
// ❌ УДАЛЕНО - перенесено в TaskExecutionService
taskExecutionSchema.methods.complete = function(status, processedItems, error) { ... }

// ❌ УДАЛЕНО - перенесено в TaskExecutionRepository
taskExecutionSchema.statics.getTaskStats = async function(taskName, days) { ... }
taskExecutionSchema.statics.getRecentExecutions = async function(taskName, limit) { ... }
taskExecutionSchema.statics.cleanupOldRecords = async function(daysToKeep) { ... }
```

### ✅ КУДА ПЕРЕНЕСЕНО

#### 1. **Models → Repositories** (Запросы к БД)
- `findTopRated()` → `CasinoScoreRepository.findTopRated()`
- `findByType()` → `CasinoScoreRepository.findByType()`
- `getTaskStats()` → `TaskExecutionRepository.getTaskStatsAggregation()`
- `cleanupOldRecords()` → `TaskExecutionRepository.cleanupOldRecords()`

#### 2. **Models → Services** (Бизнес-логика)
- `updateScore()` → `CasinoScoreService.updateCasinoScore()`
- `addFeature()` → `CasinoScoreService.addFeatureToCasino()`
- `complete()` → `TaskExecutionService.completeTask()`

#### 3. **Новые Возможности**
- **Валидация**: `CasinoValidationService`, встроенные валидаторы
- **Аналитика**: `CasinoAnalyticsService`, `TaskStatsService`
- **Форматирование**: `dateFormatters`, `scoreFormatters`
- **DTO**: Структурированные объекты для передачи данных
- **Утилиты**: Переиспользуемые функции

## 🎯 Преимущества Новой Архитектуры

### 1. **🧩 Разделение Ответственности**
- **Models**: Только схемы данных и простые виртуальные поля
- **Repositories**: Запросы к базе данных
- **Services**: Бизнес-логика и сложные операции
- **Controllers**: HTTP обработка и маршрутизация
- **DTO**: Форматирование данных для передачи
- **Utils**: Переиспользуемые утилиты

### 2. **🧪 Тестируемость**
```javascript
// Легко мокать репозитории в тестах
const mockRepository = {
  findTopRated: jest.fn().mockResolvedValue([...])
};
const service = new CasinoScoreService(mockRepository);
```

### 3. **🔄 Переиспользование**
```javascript
// Один сервис используется в разных контроллерах
const casinoService = serviceFactory.getCasinoScoreService();
```

### 4. **📈 Масштабируемость**
```javascript
// Легко добавлять новые сервисы
class CasinoRecommendationService {
  // Новая функциональность
}
```

### 5. **🛠️ Поддержка**
- Ошибки легко локализовать по слоям
- Изменения в одном слое не затрагивают другие
- Четкая структура для новых разработчиков

## 📊 Примеры Использования

### Repository Layer
```javascript
const repository = repositoryFactory.getCasinoScoreRepository();
const topCasinos = await repository.findTopRated(10, 8.0);
```

### Service Layer
```javascript
const service = serviceFactory.getCasinoScoreService();
const result = await service.updateCasinoScore(casinoId, 9.5, {
  reason: 'Updated after review',
  updatedBy: 'admin'
});
```

### Controller Layer
```javascript
const controller = controllerFactory.getCasinoController();
// Используется в Express routes
app.get('/api/casinos', controller.getCasinos.bind(controller));
```

### DTO Layer
```javascript
const dto = dtoFactory.createCasinoDetailDto(casino);
// Отформатированные данные готовы для API ответа
```

## 🚀 Инициализация

```javascript
const { layersConfig } = require('./src/config/layers');

// Инициализация всей архитектуры
await layersConfig.initialize();

// Проверка корректности
const validation = layersConfig.validateArchitecture();
console.log('Architecture is valid:', validation.isValid);
```

## 📝 Результат

✅ **Все TODO задачи выполнены:**
- [x] Создать базовый репозиторий с CRUD операциями
- [x] Создать репозитории для CasinoScore и TaskExecution
- [x] Создать сервисы для бизнес-логики
- [x] Создать контроллеры для HTTP обработки
- [x] Создать утилиты и валидаторы
- [x] Создать Data Transfer Objects
- [x] Рефакторить модели, оставив только схемы
- [x] Создать конфигурацию слоев

🎉 **Архитектура готова к использованию!**

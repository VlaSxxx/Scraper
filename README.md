# 🎰 Casino Scores Scraper

Высокопроизводительный веб-скрейпер для сбора данных о казино и игровых автоматах с использованием Node.js, Express.js, MongoDB и Puppeteer.

## ✨ Особенности

- 🚀 **Высокая производительность** - Оптимизированный скрейпинг с использованием Puppeteer
- 🗄️ **Надежное хранение** - MongoDB с оптимизированными индексами и схемами
- 🔄 **Автоматизация** - Планировщик задач с cron-выражениями
- 🛡️ **Безопасность** - Rate limiting, CORS, Helmet и другие меры защиты
- 📊 **API** - RESTful API с расширенными возможностями фильтрации
- 📈 **Мониторинг** - Детальная статистика и метрики производительности
- 🔧 **Гибкость** - Модульная архитектура с поддержкой различных игр

## 🏗️ Архитектура

```
src/
├── config/           # Конфигурация приложения
│   ├── database.js   # Настройки MongoDB
│   └── games.js      # Конфигурация игр
├── middleware/       # Express middleware
│   └── errorHandler.js
├── models/          # Mongoose модели
│   ├── CasinoScore.js
│   └── TaskExecution.js
├── routes/          # API маршруты
│   ├── api.js       # Базовые эндпоинты
│   ├── direct-api.js # Расширенные эндпоинты
│   └── tasks.js     # Управление задачами
├── services/        # Бизнес-логика
│   ├── base-scraper.js      # Базовый класс скрейпера
│   ├── scraper-factory.js   # Фабрика скрейперов
│   ├── universal-scraper.js # Универсальный скрейпер
│   └── scrapers/           # Специфичные скрейперы
│       ├── crazy-time-scraper.js
│       └── monopoly-live-scraper.js
├── tasks/           # Планировщик задач
│   └── scheduler.js
└── server.js        # Основной файл сервера
```

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18+ 
- MongoDB 5+
- npm или yarn

### Установка

1. **Клонируйте репозиторий**
```bash
git clone https://github.com/your-username/casino-scraper.git
cd casino-scraper
```

2. **Установите зависимости**
```bash
npm install
```

3. **Настройте переменные окружения**
```bash
cp env.example config.env
# Отредактируйте config.env под ваши нужды
```

4. **Запустите MongoDB**
```bash
# Локально
mongod

# Или с Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

5. **Запустите приложение**
```bash
# Режим разработки
npm run dev

# Продакшн
npm start
```

## 📖 Использование

### Запуск скрейпера

```bash
# Скрейпинг всех игр
node src/scraper.js

# Скрейпинг конкретной игры
node src/scraper.js crazy-time

# Скрейпинг игр определенного типа
node src/scraper.js type "game show"

# Справка
node src/scraper.js --help
```

### API Endpoints

#### Базовые эндпоинты
- `GET /api/casinos` - Получить все казино с пагинацией
- `GET /api/casinos/:id` - Получить казино по ID
- `GET /api/casinos/search/:name` - Поиск казино по имени
- `GET /api/stats` - Статистика казино
- `GET /api/top-casinos` - Топ казино по рейтингу

#### Расширенные эндпоинты (v1)
- `GET /api/v1/casinos` - Расширенный список с фильтрацией
- `GET /api/v1/casinos/search/advanced` - Продвинутый поиск
- `GET /api/v1/casinos/stats/comprehensive` - Детальная статистика
- `GET /api/v1/health/detailed` - Детальная проверка здоровья

#### Управление задачами
- `GET /api/tasks` - Статус всех задач
- `POST /api/tasks` - Создать новую задачу
- `POST /api/tasks/run` - Запустить задачу
- `DELETE /api/tasks/:name` - Остановить задачу

### Примеры запросов

```bash
# Получить все казино
curl http://localhost:3000/api/casinos

# Поиск казино с фильтрацией
curl "http://localhost:3000/api/v1/casinos?type=roulette&minScore=8&limit=10"

# Создать задачу скрейпинга
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"name":"crazy-time","schedule":"0 */2 * * *"}'

# Проверить здоровье системы
curl http://localhost:3000/health
```

## ⚙️ Конфигурация

### Основные переменные окружения

```env
# База данных
MONGODB_URI=mongodb://127.0.0.1:27017/casino-scores

# Сервер
PORT=3000
NODE_ENV=development

# Скрейпинг
SCRAPING_INTERVAL=0 */6 * * *  # Каждые 6 часов
PUPPETEER_HEADLESS=true

# Безопасность
RATE_LIMIT_MAX_REQUESTS=100
ALLOWED_ORIGINS=http://localhost:3000
```

### Настройка планировщика

```javascript
// Cron выражения для различных интервалов
'* * * * *'     // Каждую минуту
'0 */2 * * *'   // Каждые 2 часа
'0 9 * * *'     // Каждый день в 9:00
'0 0 * * 0'     // Каждое воскресенье
```

## 🔧 Разработка

### Структура проекта

#### Добавление нового скрейпера

1. Создайте файл в `src/services/scrapers/`
2. Наследуйтесь от `BaseGameScraper`
3. Реализуйте метод `scrapeGameData()`
4. Добавьте конфигурацию в `src/config/games.js`

```javascript
// src/services/scrapers/new-game-scraper.js
const BaseGameScraper = require('../base-scraper');

class NewGameScraper extends BaseGameScraper {
  constructor() {
    const gameConfig = {
      key: 'new-game',
      name: 'New Game',
      type: 'slots',
      provider: 'provider-name',
      url: 'https://example.com/game'
    };
    super(gameConfig);
  }

  async scrapeGameData() {
    // Ваша логика скрейпинга
    return [gameData];
  }
}

module.exports = NewGameScraper;
```

#### Добавление новых API эндпоинтов

```javascript
// src/routes/api.js
router.get('/new-endpoint', async (req, res) => {
  try {
    const data = await someService.getData();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});
```

### Тестирование

```bash
# Запуск тестов
npm test

# Тестирование с покрытием
npm run test:coverage

# Линтинг
npm run lint

# Проверка типов (если используется TypeScript)
npm run type-check
```

## 📊 Мониторинг и метрики

### Health Check

```bash
curl http://localhost:3000/health
```

Ответ включает:
- Статус системы
- Время работы
- Состояние базы данных
- Использование памяти
- Версию приложения

### Метрики производительности

Скрейпер автоматически собирает метрики:
- Время выполнения операций
- Количество обработанных записей
- Ошибки и их типы
- Использование ресурсов

## 🛡️ Безопасность

### Встроенные меры защиты

- **Rate Limiting** - Ограничение количества запросов
- **CORS** - Настройка кросс-доменных запросов
- **Helmet** - Заголовки безопасности
- **Валидация данных** - Проверка входных данных
- **SQL Injection Protection** - Mongoose автоматически защищает от инъекций

### Рекомендации по безопасности

1. **Используйте HTTPS в продакшене**
2. **Настройте правильные CORS origins**
3. **Используйте сильные секретные ключи**
4. **Регулярно обновляйте зависимости**
5. **Мониторьте логи на подозрительную активность**

## 🚀 Развертывание

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Сборка образа
docker build -t casino-scraper .

# Запуск контейнера
docker run -d -p 3000:3000 --name casino-scraper casino-scraper
```

### Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/casino-scores
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

volumes:
  mongo_data:
```

### Продакшн рекомендации

1. **Используйте PM2 для управления процессами**
2. **Настройте логирование в файлы**
3. **Используйте reverse proxy (nginx)**
4. **Настройте мониторинг (Prometheus/Grafana)**
5. **Регулярно делайте бэкапы базы данных**

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📝 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 🆘 Поддержка

- 📧 Email: support@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/casino-scraper/issues)
- 📖 Документация: [Wiki](https://github.com/your-username/casino-scraper/wiki)

## 🙏 Благодарности

- [Puppeteer](https://pptr.dev/) - Автоматизация браузера
- [Express.js](https://expressjs.com/) - Веб-фреймворк
- [Mongoose](https://mongoosejs.com/) - ODM для MongoDB
- [Node-cron](https://github.com/node-cron/node-cron) - Планировщик задач

---

⭐ Если этот проект вам помог, поставьте звездочку!

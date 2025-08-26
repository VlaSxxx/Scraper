# Casino Scores Scraper API

Веб-скрейпер для сбора данных с сайта [Casino Scores](https://casinoscores.com/) с предоставлением данных через REST API.

## 🚀 Возможности

- **Автоматический скрейпинг**: Сбор данных каждую минуту
- **Система управления задачами**: Полноценная система планирования и управления задачами
- **REST API**: Полноценное API для получения данных и управления задачами
- **База данных**: Хранение данных в MongoDB с логированием выполнения задач
- **Фильтрация и поиск**: Расширенные возможности поиска и фильтрации
- **Статистика**: Аналитика по собранным данным и выполнению задач
- **Мониторинг**: Отслеживание здоровья системы и производительности
- **Очистка данных**: Автоматическая очистка старых записей

## 📋 Требования

- Node.js 16+ 
- MongoDB 4.4+
- npm или yarn

## 🛠 Установка

1. **Клонируйте репозиторий:**
```bash
git clone <repository-url>
cd casino-scores-scraper
```

2. **Установите зависимости:**
```bash
npm install
```

3. **Настройте переменные окружения:**
```bash
cp env.example .env
```

Отредактируйте файл `.env`:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/casino-scores

# Scraping Configuration
SCRAPING_INTERVAL=* * * * * # Every minute
CASINO_SCORES_URL=https://casinoscores.com/

# API Configuration
API_RATE_LIMIT=100
API_TIMEOUT=30000

# Puppeteer Configuration
PUPPETEER_HEADLESS=true
PUPPETEER_TIMEOUT=30000
```

4. **Запустите MongoDB:**
```bash
# Локально
mongod

# Или используйте Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

5. **Запустите приложение:**
```bash
# Разработка
npm run dev

# Продакшн
npm start
```

## 📊 API Endpoints

### Основные эндпоинты

#### GET `/api/casinos`
Получить список всех казино с пагинацией и фильтрацией.

**Параметры запроса:**
- `page` (number, default: 1) - Номер страницы
- `limit` (number, default: 20, max: 100) - Количество записей на странице
- `sort` (string) - Сортировка: `score`, `name`, `scrapedAt`, `-score`, `-name`, `-scrapedAt`
- `rating` (string) - Фильтр по рейтингу: `Excellent`, `Very Good`, `Good`, `Fair`, `Poor`
- `minScore` (number) - Минимальный рейтинг (0-10)
- `maxScore` (number) - Максимальный рейтинг (0-10)
- `search` (string) - Поиск по названию
- `mobileCompatible` (boolean) - Фильтр по мобильной совместимости
- `liveChat` (boolean) - Фильтр по наличию live чата

**Пример:**
```bash
GET /api/casinos?page=1&limit=10&sort=-score&rating=Excellent&minScore=8
```

#### GET `/api/casinos/:id`
Получить конкретное казино по ID.

**Пример:**
```bash
GET /api/casinos/507f1f77bcf86cd799439011
```

#### GET `/api/casinos/search/:name`
Поиск казино по названию.

**Параметры:**
- `page` (number, default: 1)
- `limit` (number, default: 20)

**Пример:**
```bash
GET /api/casinos/search/bet365?page=1&limit=5
```

#### GET `/api/stats`
Получить статистику по собранным данным.

**Пример:**
```bash
GET /api/stats
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "totalCasinos": 150,
    "averageScore": 7.5,
    "ratingDistribution": {
      "Excellent": 25,
      "Very Good": 45,
      "Good": 60,
      "Fair": 15,
      "Poor": 5
    },
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  }
}
```

#### GET `/api/top-casinos`
Получить топ казино по рейтингу.

**Параметры:**
- `limit` (number, default: 10)
- `rating` (string) - Фильтр по рейтингу

**Пример:**
```bash
GET /api/top-casinos?limit=5&rating=Excellent
```

### Управление задачами

#### GET `/api/tasks`
Получить статус всех запланированных задач.

#### POST `/api/tasks`
Создать новую задачу.
```json
{
  "name": "my-task",
  "schedule": "*/5 * * * *",
  "timezone": "UTC",
  "runOnInit": false
}
```

#### POST `/api/tasks/run`
Запустить задачу один раз.
```json
{
  "taskName": "my-task"
}
```

#### DELETE `/api/tasks/:name`
Остановить конкретную задачу.

#### DELETE `/api/tasks`
Остановить все задачи.

#### GET `/api/tasks/stats`
Получить статистику выполнения задач.

#### GET `/api/tasks/:name/executions`
Получить историю выполнения конкретной задачи.

#### GET `/api/tasks/scraping-stats`
Получить статистику скрейпинга.

#### POST `/api/tasks/cleanup`
Очистить старые данные.
```json
{
  "daysToKeep": 30
}
```

#### GET `/api/tasks/health`
Проверить здоровье системы задач.

#### GET `/api/health`
Проверка здоровья API.

## 🗄 Структура данных

### Модель CasinoScore

```javascript
{
  name: String,           // Название казино
  url: String,           // URL казино
  score: Number,         // Рейтинг (0-10)
  rating: String,        // Текстовый рейтинг
  features: [String],    // Особенности
  bonuses: [String],     // Бонусы
  paymentMethods: [String], // Методы оплаты
  licenses: [String],    // Лицензии
  languages: [String],   // Поддерживаемые языки
  currencies: [String],  // Поддерживаемые валюты
  minDeposit: String,    // Минимальный депозит
  maxWithdrawal: String, // Максимальный вывод
  withdrawalTime: String, // Время вывода
  customerSupport: String, // Поддержка клиентов
  mobileCompatible: Boolean, // Мобильная совместимость
  liveChat: Boolean,     // Наличие live чата
  lastUpdated: Date,     // Последнее обновление
  scrapedAt: Date        // Время скрейпинга
}
```

### Модель TaskExecution

```javascript
{
  taskName: String,       // Имя задачи
  status: String,         // Статус: 'success', 'error', 'running', 'cancelled'
  executionTime: Number,  // Время выполнения в миллисекундах
  processedItems: Number, // Количество обработанных элементов
  error: {                // Информация об ошибке (если есть)
    message: String,
    stack: String,
    code: String
  },
  metadata: Object,       // Дополнительные метаданные
  startedAt: Date,        // Время начала выполнения
  completedAt: Date,      // Время завершения
  duration: Number        // Длительность выполнения
}
```

## ⚙️ Конфигурация

### Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `PORT` | Порт сервера | 3000 |
| `NODE_ENV` | Окружение | development |
| `MONGODB_URI` | URI MongoDB | mongodb://localhost:27017/casino-scores |
| `SCRAPING_INTERVAL` | Интервал скрейпинга (cron) | * * * * * |
| `CASINO_SCORES_URL` | URL сайта для скрейпинга | https://casinoscores.com/ |
| `PUPPETEER_HEADLESS` | Режим Puppeteer | true |
| `PUPPETEER_TIMEOUT` | Таймаут Puppeteer (мс) | 30000 |

### Cron выражения

Для настройки интервала скрейпинга используйте cron выражения:

- `* * * * *` - Каждую минуту
- `*/5 * * * *` - Каждые 5 минут
- `0 * * * *` - Каждый час
- `0 0 * * *` - Каждый день в полночь

## 🚀 Развертывание

### Docker

1. **Создайте Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

2. **Создайте docker-compose.yml:**
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
      - mongodb_data:/data/db
    restart: unless-stopped

volumes:
  mongodb_data:
```

3. **Запустите:**
```bash
docker-compose up -d
```

### PM2 (Продакшн)

1. **Установите PM2:**
```bash
npm install -g pm2
```

2. **Создайте ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'casino-scraper',
    script: 'src/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

3. **Запустите:**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🔧 Разработка

### Структура проекта

```
src/
├── config/
│   └── database.js          # Конфигурация MongoDB
├── middleware/
│   └── errorHandler.js      # Обработка ошибок
├── models/
│   ├── CasinoScore.js       # Модель данных казино
│   └── TaskExecution.js     # Модель логирования задач
├── routes/
│   ├── api.js              # API маршруты для казино
│   └── tasks.js            # API маршруты для задач
├── services/
│   └── scraper.js          # Сервис скрейпинга
├── tasks/
│   └── scheduler.js        # Система управления задачами
└── server.js               # Основной сервер
```

### Команды

```bash
# Разработка
npm run dev

# Запуск скрейпера один раз
npm run scrape

# Продакшн
npm start

# Тестирование API
node test-api.js

# Тестирование системы задач
node test-tasks.js
```

## 📝 Логирование

Приложение ведет подробные логи:

- Запросы к API
- Процесс скрейпинга
- Ошибки и исключения
- Статус планировщика

## 🔒 Безопасность

- **Helmet.js** для защиты заголовков
- **CORS** настройки
- **Валидация** входных данных
- **Rate limiting** (можно добавить)
- **Graceful shutdown**

## 🐛 Устранение неполадок

### Проблемы с Puppeteer

1. **Ошибка запуска браузера:**
```bash
# Установите зависимости
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
```

2. **Проблемы с памятью:**
```javascript
// В scraper.js добавьте аргументы
args: [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--no-first-run',
  '--no-zygote',
  '--disable-gpu',
  '--memory-pressure-off',
  '--max_old_space_size=4096'
]
```

### Проблемы с MongoDB

1. **Ошибка подключения:**
```bash
# Проверьте, что MongoDB запущен
sudo systemctl status mongod

# Перезапустите MongoDB
sudo systemctl restart mongod
```

2. **Проблемы с правами:**
```bash
# Создайте пользователя
mongo
use casino-scores
db.createUser({
  user: "casino_user",
  pwd: "password",
  roles: ["readWrite"]
})
```

## 📈 Мониторинг

### Health Check

```bash
curl http://localhost:3000/api/health
```

### Статус скрейпера

```bash
curl http://localhost:3000/api/scrape/status
```

### Статистика

```bash
curl http://localhost:3000/api/stats
```

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

MIT License - см. файл [LICENSE](LICENSE) для деталей.

## ⚠️ Отказ от ответственности

Этот проект предназначен только для образовательных целей. Убедитесь, что вы соблюдаете условия использования сайта Casino Scores и применимое законодательство при использовании этого скрейпера.

## 📞 Поддержка

Если у вас есть вопросы или проблемы:

1. Создайте Issue в GitHub
2. Проверьте документацию
3. Посмотрите логи приложения

---

**Примечание:** Этот скрейпер может потребовать адаптации под изменения в структуре сайта Casino Scores.

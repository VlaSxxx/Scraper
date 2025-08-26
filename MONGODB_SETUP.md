# Настройка MongoDB для проверки работы

## Вариант 1: MongoDB Atlas (Рекомендуется - самый простой)

### Шаг 1: Создайте бесплатный аккаунт
1. Перейдите на [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Нажмите "Try Free"
3. Зарегистрируйтесь или войдите в аккаунт

### Шаг 2: Создайте кластер
1. Выберите "FREE" план (M0)
2. Выберите провайдера (AWS, Google Cloud, Azure)
3. Выберите регион (ближайший к вам)
4. Нажмите "Create"

### Шаг 3: Настройте доступ
1. В разделе "Security" → "Database Access"
2. Нажмите "Add New Database User"
3. Создайте пользователя и пароль
4. В разделе "Network Access" → "Add IP Address"
5. Нажмите "Allow Access from Anywhere" (0.0.0.0/0)

### Шаг 4: Получите строку подключения
1. В разделе "Database" → "Connect"
2. Выберите "Connect your application"
3. Скопируйте строку подключения
4. Замените `<password>` на ваш пароль

### Шаг 5: Обновите .env файл
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/casino-scores?retryWrites=true&w=majority
```

## Вариант 2: Docker (Быстрая настройка)

### Установите Docker Desktop
1. Скачайте [Docker Desktop](https://www.docker.com/products/docker-desktop)
2. Установите и запустите

### Запустите MongoDB
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Проверьте статус
```bash
docker ps
```

### Подключитесь к MongoDB
```bash
docker exec -it mongodb mongosh
```

## Вариант 3: Локальная установка MongoDB

### Windows
1. Скачайте [MongoDB Community Server](https://www.mongodb.com/try/download/community)
2. Установите с настройками по умолчанию
3. MongoDB будет запущен как служба Windows

### macOS
```bash
# Через Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

### Linux (Ubuntu)
```bash
# Импортируйте публичный ключ
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Добавьте репозиторий
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Установите MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Запустите MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

## Проверка подключения

После настройки любого из вариантов, запустите тесты:

### 1. Простой тест подключения
```bash
node test-mongodb-simple.js
```

### 2. Полный тест с созданием записи
```bash
node test-mongodb.js
```

### 3. Тест скрейпинга
```bash
node test-scraping.js
```

### 4. Запуск сервера и проверка API
```bash
npm start
```

Затем откройте в браузере:
- http://localhost:3000/api/db-test
- http://localhost:3000/api/health

## Ожидаемые результаты

При успешной настройке вы должны увидеть:

```
✅ MongoDB Connected: localhost (или ваш хост)
📊 Database: casino-scores
📋 Collections: []
✅ Test record saved successfully
📊 Total records in database: 1
```

## Устранение проблем

### Ошибка "authentication failed"
- Проверьте правильность логина и пароля в MONGODB_URI
- Убедитесь, что пользователь создан в MongoDB Atlas

### Ошибка "connection refused"
- MongoDB не запущен
- Проверьте, что порт 27017 свободен
- Убедитесь, что Docker контейнер запущен

### Ошибка "network error"
- Проверьте интернет-соединение (для Atlas)
- Проверьте настройки firewall
- Убедитесь, что IP адрес добавлен в whitelist (для Atlas)

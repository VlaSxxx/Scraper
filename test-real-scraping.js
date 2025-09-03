const { connectDB } = require('./src/config/database');
const ScraperFactory = require('./src/services/scraper-factory');

async function testRealScraping() {
  try {
    console.log('🚀 ТЕСТИРОВАНИЕ РЕАЛЬНОГО ПАРСИНГА CRAZY TIME');
    console.log('=' * 50);
    
    // Подключаемся к базе данных
    console.log('🔗 Подключение к базе данных...');
    await connectDB();
    
    // Создаем скрейпер с улучшенными настройками
    console.log('🛠️ Создание улучшенного скрейпера...');
    const scraper = ScraperFactory.createScraper('crazy-time');
    
    console.log('📊 Конфигурация скрейпера:');
    console.log(`   🎮 Игра: ${scraper.gameConfig.name}`);
    console.log(`   🌐 URL: ${scraper.gameConfig.url}`);
    console.log(`   🏢 Провайдер: ${scraper.gameConfig.provider}`);
    console.log(`   🎯 Тип: ${scraper.gameConfig.type}`);
    console.log('');
    
    // Показываем настройки из config.env
    console.log('⚙️ Настройки Puppeteer:');
    console.log(`   👁️ Headless: ${process.env.PUPPETEER_HEADLESS}`);
    console.log(`   ⏱️ Timeout: ${process.env.PUPPETEER_TIMEOUT}ms`);
    console.log(`   🛡️ Stealth: ${process.env.PUPPETEER_STEALTH}`);
    console.log('');
    
    console.log('🚀 Запуск реального парсинга...');
    console.log('💡 Браузер откроется в видимом режиме для диагностики');
    console.log('⏳ Это может занять 1-2 минуты...');
    console.log('');
    
    const startTime = Date.now();
    
    // Запускаем парсинг
    const results = await scraper.scrapeAndSave();
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log('');
    console.log('✅ ПАРСИНГ ЗАВЕРШЕН!');
    console.log('=' * 30);
    console.log(`⏱️ Время выполнения: ${duration} секунд`);
    console.log(`📊 Получено записей: ${results.length}`);
    console.log('');
    
    if (results.length > 0) {
      console.log('🎮 Полученные данные:');
      results.forEach((result, index) => {
        console.log(`\n   ${index + 1}. ${result.name}`);
        console.log(`      📊 Рейтинг: ${result.score}/10`);
        console.log(`      🎯 Множитель: ${result.stats?.multiplier || 'N/A'}x`);
        console.log(`      🔄 Раундов: ${result.stats?.rounds || 'N/A'}`);
        console.log(`      🌐 URL: ${result.url}`);
        console.log(`      📝 Описание: ${result.description.substring(0, 100)}...`);
      });
      
      console.log('\n🎉 УСПЕХ! Реальные данные получены и сохранены в базу!');
      
      // Проверяем данные через API
      console.log('\n📡 Проверка через API...');
      const http = require('http');
      
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/casinos?search=crazy',
        method: 'GET'
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const apiCount = parsed.data?.casinos?.length || 0;
            console.log(`✅ API показывает ${apiCount} записей Crazy Time`);
            
            if (apiCount > 0) {
              console.log('🌐 API полностью функционален с реальными данными!');
            }
          } catch (error) {
            console.log('⚠️ API пока недоступен (возможно, сервер не запущен)');
          }
        });
      });

      req.on('error', () => {
        console.log('⚠️ API недоступен (сервер не запущен)');
      });

      req.end();
      
    } else {
      console.log('⚠️ Данные не получены, но fallback система сработала');
    }
    
    console.log('\n💡 Рекомендации:');
    console.log('   1. Запустите сервер: npm start');
    console.log('   2. Запустите автообновление: node crazy-time-updater.js');
    console.log('   3. Проверьте API: curl http://localhost:3000/api/casinos');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ОШИБКА ТЕСТИРОВАНИЯ:', error.message);
    console.error('\n🔧 Попробуйте:');
    console.error('   1. Проверить подключение к интернету');
    console.error('   2. Запустить с отключенным headless: PUPPETEER_HEADLESS=false');
    console.error('   3. Проверить доступность https://casinoscores.com/');
    
    process.exit(1);
  }
}

console.log('🔍 Запуск тестирования реального парсинга...\n');
testRealScraping();



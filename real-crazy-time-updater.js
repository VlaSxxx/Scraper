const { connectDB } = require('./src/config/database');
const ScraperFactory = require('./src/services/scraper-factory');
const CasinoScore = require('./src/models/CasinoScore');

async function realCrazyTimeUpdater() {
  try {
    console.log('🔗 Подключение к базе данных...');
    await connectDB();
    
    console.log('🚀 ЗАПУСК РЕАЛЬНОГО ПАРСИНГА CRAZY TIME');
    console.log('=' * 50);
    console.log('⏰ Парсинг реальных данных каждую минуту');
    console.log('🌐 Источник: https://casinoscores.com/');
    console.log('🎮 Игра: Crazy Time (Evolution Gaming)');
    console.log('Нажмите Ctrl+C для остановки\n');
    
    let updateCount = 0;
    
    // Функция парсинга
    const runScraping = async () => {
      try {
        updateCount++;
        const timestamp = new Date().toLocaleTimeString();
        
        console.log(`🎯 [${timestamp}] Запуск парсинга #${updateCount}...`);
        
        // Создаем скрейпер
        const scraper = ScraperFactory.createScraper('crazy-time');
        
        // Запускаем парсинг с реального сайта
        const results = await scraper.scrapeAndSave();
        
        if (results && results.length > 0) {
          const result = results[0];
          console.log(`✅ [${timestamp}] Реальные данные получены:`);
          console.log(`   🎮 Название: ${result.name}`);
          console.log(`   📊 Рейтинг: ${result.score}/10`);
          console.log(`   🏢 Провайдер: ${result.provider}`);
          console.log(`   🌐 URL: ${result.url}`);
          
          // Если есть статистика, показываем её
          if (result.stats) {
            console.log(`   📈 Статистика: найдена`);
          }
          
          console.log(`   💾 Сохранено в базу данных\n`);
          
        } else {
          console.log(`⚠️ [${timestamp}] Данные не получены, используется fallback\n`);
        }
        
        // Очистка старых записей (оставляем 20 последних)
        const totalCount = await CasinoScore.countDocuments({ name: /Crazy Time/i });
        if (totalCount > 20) {
          const oldRecords = await CasinoScore.find({ name: /Crazy Time/i })
            .sort({ createdAt: 1 })
            .limit(totalCount - 20);
          
          for (const record of oldRecords) {
            await CasinoScore.findByIdAndDelete(record._id);
          }
          console.log(`🧹 Очищено ${oldRecords.length} старых записей`);
        }
        
      } catch (error) {
        console.error(`❌ Ошибка парсинга:`, error.message);
      }
    };
    
    // Запускаем первый парсинг сразу
    console.log('🚀 Запуск первого парсинга...');
    await runScraping();
    
    // Затем каждую минуту
    setInterval(runScraping, 60000); // 60 секунд
    
    console.log('⏰ Автоматический парсинг настроен на каждую минуту');
    console.log('📊 Данные обновляются с реального сайта Casino Scores');
    console.log('🔄 Система работает в фоновом режиме...\n');
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Остановка реального парсинга Crazy Time...');
  console.log('💾 Все данные сохранены в базе');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Получен сигнал завершения...');
  process.exit(0);
});

console.log('🎮 Инициализация реального парсинга Crazy Time...\n');
realCrazyTimeUpdater();



require('dotenv').config();
const { connectDB } = require('./config/database');
const UniversalScraper = require('./universal-scraper');

async function main() {
  try {
    console.log('🚀 Starting Casino Games Scraper...');
    
    // Пытаемся подключиться к базе данных (не критично)
    try {
      await connectDB();
      console.log('✅ Database connected successfully');
    } catch (dbError) {
      console.warn('⚠️  Database connection failed, continuing in fallback mode...');
      console.warn('📊 Scraping will work but data will not be saved to database');
    }
    
    // Создаем экземпляр универсального скрейпера
    const scraper = new UniversalScraper();
    
    // Получаем информацию о поддерживаемых играх
    const gamesInfo = scraper.getSupportedGamesInfo();
    console.log(`📋 Supported games: ${gamesInfo.totalGames}`);
    console.log(`🔧 Available scrapers: ${gamesInfo.availableScrapers}`);
    
    // Показываем статус каждой игры
    console.log('\n🎮 Games status:');
    gamesInfo.games.forEach(game => {
      const status = game.hasScraper ? '✅' : '❌';
      console.log(`  ${status} ${game.name} (${game.key}) - ${game.type} by ${game.provider}`);
    });
    
    // Проверяем аргументы командной строки
    const args = process.argv.slice(2);
    let gameKey = args[0];
    let gameType = args[1];
    
    if (gameKey && gameKey !== 'all' && gameKey !== 'type') {
      // Скрейпинг конкретной игры
      console.log(`\n🎯 Scraping specific game: ${gameKey}`);
      const results = await scraper.scrapeGame(gameKey);
      
      console.log(`✅ Scraping completed successfully!`);
      console.log(`📈 Processed ${results.length} records for ${gameKey}`);
      
      // Выводим краткую статистику
      if (results.length > 0) {
        const avgScore = results.reduce((sum, game) => sum + (game.score || 0), 0) / results.length;
        const topGame = results.reduce((top, game) => 
          (game.score || 0) > (top.score || 0) ? game : top
        );
        
        console.log(`📊 Average score: ${avgScore.toFixed(2)}/10`);
        console.log(`🏆 Top game: ${topGame.name} (${topGame.score}/10)`);
      }
      
    } else if (gameType && args[0] === 'type') {
      // Скрейпинг игр определенного типа
      console.log(`\n🎯 Scraping games of type: ${gameType}`);
      const results = await scraper.scrapeGamesByType(gameType);
      
      console.log(`✅ Scraping completed successfully!`);
      console.log(`📈 Summary: ${results.summary.successfulGames} successful, ${results.summary.failedGames} failed`);
      
      // Выводим детали по каждой игре
      Object.entries(results.results).forEach(([gameKey, result]) => {
        console.log(`  ✅ ${gameKey}: ${result.count} records`);
      });
      
      if (Object.keys(results.errors).length > 0) {
        Object.entries(results.errors).forEach(([gameKey, error]) => {
          console.log(`  ❌ ${gameKey}: ${error.error}`);
        });
      }
      
    } else {
      // Скрейпинг всех игр
      console.log(`\n🎯 Scraping all available games...`);
      const results = await scraper.scrapeAllGames();
      
      console.log(`✅ Universal scraping completed successfully!`);
      console.log(`📈 Summary: ${results.summary.successfulGames} successful, ${results.summary.failedGames} failed`);
      console.log(`📊 Total records processed: ${results.summary.totalProcessed}`);
      
      // Выводим детали по каждой игре
      if (Object.keys(results.results).length > 0) {
        console.log('\n🎮 Successful games:');
        Object.entries(results.results).forEach(([gameKey, result]) => {
          console.log(`  ✅ ${gameKey}: ${result.count} records`);
        });
      }
      
      if (Object.keys(results.errors).length > 0) {
        console.log('\n⚠️  Failed games:');
        Object.entries(results.errors).forEach(([gameKey, error]) => {
          console.log(`  ❌ ${gameKey}: ${error.error}`);
        });
      }
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during scraping:', error);
    process.exit(1);
  }
}

// Обработка сигналов для graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Показываем справку по использованию
function showUsage() {
  console.log('\n📖 Usage:');
  console.log('  node src/scraper.js                    - Scrape all available games');
  console.log('  node src/scraper.js <game-key>         - Scrape specific game');
  console.log('  node src/scraper.js type <game-type>   - Scrape games by type');
  console.log('\n🎮 Available game keys:');
  console.log('  crazy-time, monopoly-live, deal-or-no-deal, lightning-roulette, blackjack-live, baccarat-live');
  console.log('\n🎯 Available game types:');
  console.log('  game show, roulette, blackjack, baccarat');
  console.log('\n💡 Examples:');
  console.log('  node src/scraper.js crazy-time');
  console.log('  node src/scraper.js type "game show"');
  console.log('  node src/scraper.js all');
}

// Показываем справку если запрошена
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showUsage();
  process.exit(0);
}

// Запускаем основную функцию
main();

require('dotenv').config({ path: './config.env' });
const CasinoScraper = require('./src/services/scraper');

async function testScraping() {
  console.log('🚀 Starting scraping test...');
  
  const scraper = new CasinoScraper();
  
  try {
    // Запускаем скрейпинг
    console.log('📡 Running scraper...');
    const results = await scraper.scrapeAndSave();
    
    console.log('✅ Scraping completed successfully!');
    console.log(`📊 Processed ${results.length} records`);
    
    // Выводим детали результатов
    results.forEach((result, index) => {
      console.log(`\n📋 Record ${index + 1}:`);
      console.log(`   ID: ${result._id}`);
      console.log(`   Name: ${result.name}`);
      console.log(`   Type: ${result.type}`);
      console.log(`   Provider: ${result.provider}`);
      console.log(`   Live: ${result.isLive}`);
      console.log(`   Created: ${result.createdAt}`);
      console.log(`   Scraped: ${result.scrapedAt}`);
      
      if (result.stats && Object.keys(result.stats).length > 0) {
        console.log(`   Stats: ${JSON.stringify(result.stats)}`);
      }
      
      if (result.features && result.features.length > 0) {
        console.log(`   Features: ${result.features.join(', ')}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Scraping test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Закрываем браузер
    await scraper.close();
    console.log('🔌 Browser closed');
  }
}

// Запускаем тест
testScraping();

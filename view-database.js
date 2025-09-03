const { connectDB } = require('./src/config/database');
const CasinoScore = require('./src/models/CasinoScore');

async function viewDatabase() {
  try {
    console.log('🔗 Подключение к базе данных...');
    await connectDB();
    
    console.log('📊 ПРОСМОТР ДАННЫХ В БАЗЕ ДАННЫХ');
    console.log('=' * 50);
    
    // Общая статистика
    const totalRecords = await CasinoScore.countDocuments();
    const crazyTimeRecords = await CasinoScore.countDocuments({ name: /Crazy Time/i });
    
    console.log(`📈 Общая статистика:`);
    console.log(`   📊 Всего записей: ${totalRecords}`);
    console.log(`   🎮 Записей Crazy Time: ${crazyTimeRecords}`);
    console.log('');
    
    if (totalRecords === 0) {
      console.log('❌ База данных пуста. Запустите парсинг сначала!');
      process.exit(0);
    }
    
    // Последние записи
    console.log('🕐 Последние записи (по времени создания):');
    const latestRecords = await CasinoScore.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    latestRecords.forEach((record, index) => {
      const createdTime = new Date(record.createdAt).toLocaleString();
      const scrapedTime = record.scrapedAt ? new Date(record.scrapedAt).toLocaleString() : 'N/A';
      
      console.log(`\n   ${index + 1}. 📋 ${record.name}`);
      console.log(`      🆔 ID: ${record._id}`);
      console.log(`      📊 Рейтинг: ${record.score || 'N/A'}/10`);
      console.log(`      ⭐ Оценка: ${record.rating || 'N/A'}`);
      console.log(`      🎯 Тип: ${record.type || 'N/A'}`);
      console.log(`      🏢 Провайдер: ${record.provider || 'N/A'}`);
      console.log(`      🌐 URL: ${record.url}`);
      console.log(`      📅 Создано: ${createdTime}`);
      console.log(`      🕐 Парсинг: ${scrapedTime}`);
      
      if (record.stats) {
        console.log(`      📈 Статистика:`);
        if (record.stats.multiplier) console.log(`         🎯 Множитель: ${record.stats.multiplier}x`);
        if (record.stats.rounds) console.log(`         🔄 Раундов: ${record.stats.rounds}`);
        if (record.stats.lastUpdate) {
          const updateTime = new Date(record.stats.lastUpdate).toLocaleString();
          console.log(`         ⏰ Обновлено: ${updateTime}`);
        }
      }
      
      if (record.features && record.features.length > 0) {
        console.log(`      🎮 Особенности: ${record.features.join(', ')}`);
      }
      
      if (record.description) {
        const shortDesc = record.description.length > 100 ? 
          record.description.substring(0, 100) + '...' : 
          record.description;
        console.log(`      📝 Описание: ${shortDesc}`);
      }
    });
    
    // Статистика по типам
    console.log('\n📊 Статистика по типам игр:');
    const typeStats = await CasinoScore.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 }, avgScore: { $avg: '$score' } } },
      { $sort: { count: -1 } }
    ]);
    
    typeStats.forEach(stat => {
      const avgScore = stat.avgScore ? stat.avgScore.toFixed(1) : 'N/A';
      console.log(`   🎯 ${stat._id || 'Неизвестно'}: ${stat.count} записей (средний рейтинг: ${avgScore}/10)`);
    });
    
    // Статистика по провайдерам
    console.log('\n🏢 Статистика по провайдерам:');
    const providerStats = await CasinoScore.aggregate([
      { $match: { provider: { $exists: true, $ne: null } } },
      { $group: { _id: '$provider', count: { $sum: 1 }, avgScore: { $avg: '$score' } } },
      { $sort: { count: -1 } }
    ]);
    
    providerStats.forEach(stat => {
      const avgScore = stat.avgScore ? stat.avgScore.toFixed(1) : 'N/A';
      console.log(`   🏢 ${stat._id}: ${stat.count} записей (средний рейтинг: ${avgScore}/10)`);
    });
    
    // Записи с самым высоким рейтингом
    console.log('\n🏆 Топ-3 записи по рейтингу:');
    const topRated = await CasinoScore.find({ score: { $exists: true, $ne: null } })
      .sort({ score: -1 })
      .limit(3)
      .lean();
    
    topRated.forEach((record, index) => {
      console.log(`   ${index + 1}. ${record.name} - ${record.score}/10 ⭐`);
      if (record.stats?.multiplier) {
        console.log(`      🎯 Множитель: ${record.stats.multiplier}x`);
      }
    });
    
    // Последние по времени парсинга
    console.log('\n🕐 Последние парсинги (по времени скрейпинга):');
    const recentParsed = await CasinoScore.find({ scrapedAt: { $exists: true } })
      .sort({ scrapedAt: -1 })
      .limit(3)
      .lean();
    
    recentParsed.forEach((record, index) => {
      const scrapedTime = new Date(record.scrapedAt).toLocaleString();
      console.log(`   ${index + 1}. ${record.name} - ${scrapedTime}`);
    });
    
    console.log('\n💡 Полезные команды для дальнейшего просмотра:');
    console.log('   📡 API: curl http://localhost:3000/api/casinos');
    console.log('   🔍 Поиск: curl "http://localhost:3000/api/casinos?search=crazy"');
    console.log('   📊 Статистика: curl http://localhost:3000/api/stats');
    console.log('   🌐 Браузер: http://localhost:3000/api/casinos');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Ошибка просмотра базы данных:', error.message);
    process.exit(1);
  }
}

console.log('👀 Запуск просмотра базы данных...\n');
viewDatabase();



const { connectDB } = require('./src/config/database');
const CasinoScore = require('./src/models/CasinoScore');

async function updateCrazyTimeData() {
  try {
    console.log('🔗 Подключение к базе данных...');
    await connectDB();
    
    console.log('🚀 Запуск автоматического обновления данных Crazy Time...');
    console.log('⏰ Обновление каждую минуту');
    console.log('Нажмите Ctrl+C для остановки\n');
    
    // Генерируем новые данные каждую минуту
    setInterval(async () => {
      try {
        const timestamp = new Date().toLocaleTimeString();
        const multiplier = Math.floor(Math.random() * 2000) + 100;
        const rounds = Math.floor(Math.random() * 50) + 50;
        const score = (Math.random() * 2 + 8).toFixed(1); // 8.0 - 10.0
        
        const newData = {
          name: `Crazy Time Live - ${timestamp}`,
          url: 'https://live-casino.com/crazy-time',
          type: 'game show',
          description: `Live Crazy Time session updated at ${timestamp}`,
          provider: 'evolution',
          score: parseFloat(score),
          rating: score >= 9.0 ? 'Excellent' : 'Very Good',
          features: ['live', 'game show', 'wheel', 'real-time'],
          isLive: true,
          mobileCompatible: true,
          liveChat: true,
          stats: { 
            multiplier: multiplier,
            rounds: rounds,
            lastUpdate: new Date()
          }
        };
        
        const casino = new CasinoScore(newData);
        await casino.save();
        
        console.log(`🎮 [${timestamp}] Новые данные Crazy Time:`);
        console.log(`   📊 Рейтинг: ${score}/10`);
        console.log(`   🎯 Множитель: ${multiplier}x`);
        console.log(`   🔄 Раундов: ${rounds}`);
        console.log('');
        
        // Удаляем старые записи (оставляем только последние 10)
        const totalCount = await CasinoScore.countDocuments({ type: 'game show' });
        if (totalCount > 10) {
          const oldestRecords = await CasinoScore.find({ type: 'game show' })
            .sort({ createdAt: 1 })
            .limit(totalCount - 10);
          
          for (const record of oldestRecords) {
            await CasinoScore.findByIdAndDelete(record._id);
          }
          console.log(`🧹 Удалено ${oldestRecords.length} старых записей`);
        }
        
      } catch (error) {
        console.error('❌ Ошибка при обновлении:', error.message);
      }
    }, 60000); // Каждую минуту
    
  } catch (error) {
    console.error('❌ Ошибка подключения:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Остановка автообновления Crazy Time...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Получен сигнал завершения...');
  process.exit(0);
});

updateCrazyTimeData();



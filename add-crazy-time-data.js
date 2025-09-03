const { connectDB } = require('./src/config/database');
const CasinoScore = require('./src/models/CasinoScore');

async function addCrazyTimeData() {
  try {
    console.log('🔗 Подключение к базе данных...');
    await connectDB();
    
    const crazyTimeData = [
      {
        name: 'Crazy Time - Casino A',
        url: 'https://casino-a.com/crazy-time',
        type: 'game show',
        description: 'Evolution Gaming Crazy Time with multipliers up to 20000x',
        provider: 'evolution',
        score: 9.2,
        rating: 'Excellent',
        features: ['live', 'game show', 'wheel', 'bonus rounds'],
        isLive: true,
        mobileCompatible: true,
        liveChat: true,
        stats: { multiplier: 500, rounds: 120 }
      },
      {
        name: 'Crazy Time - Casino B', 
        url: 'https://casino-b.com/crazy-time',
        type: 'game show',
        description: 'Premium Crazy Time experience with VIP tables',
        provider: 'evolution',
        score: 8.8,
        rating: 'Very Good',
        features: ['live', 'game show', 'wheel', 'vip'],
        isLive: true,
        mobileCompatible: true,
        liveChat: true,
        stats: { multiplier: 1000, rounds: 85 }
      },
      {
        name: 'Crazy Time - Casino C',
        url: 'https://casino-c.com/crazy-time', 
        type: 'game show',
        description: 'High stakes Crazy Time with unlimited betting',
        provider: 'evolution',
        score: 9.0,
        rating: 'Excellent',
        features: ['live', 'game show', 'wheel', 'high stakes'],
        isLive: true,
        mobileCompatible: true,
        liveChat: true,
        stats: { multiplier: 2000, rounds: 95 }
      }
    ];
    
    console.log('📊 Добавление данных Crazy Time...');
    
    for (const data of crazyTimeData) {
      const casino = new CasinoScore(data);
      await casino.save();
      console.log('✅ Добавлено:', data.name);
    }
    
    console.log('🎉 Все данные Crazy Time добавлены успешно!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

addCrazyTimeData();



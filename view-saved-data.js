const { connectDB } = require('./src/config/database');
const CasinoScore = require('./src/models/CasinoScore');

async function viewSavedData() {
  try {
    console.log('🔍 ПРОСМОТР СОХРАНЕННЫХ ДАННЫХ В БАЗЕ');
    console.log('=' * 50);
    
    await connectDB();
    
    // 1. Общая статистика
    const totalRecords = await CasinoScore.countDocuments();
    const crazyTimeRecords = await CasinoScore.countDocuments({ name: /crazy time/i });
    
    console.log('📊 ОБЩАЯ СТАТИСТИКА:');
    console.log(`   Всего записей в базе: ${totalRecords}`);
    console.log(`   Записей Crazy Time: ${crazyTimeRecords}`);
    
    if (totalRecords === 0) {
      console.log('❌ База данных пуста. Запустите парсинг!');
      return;
    }
    
    // 2. Последние 3 записи
    console.log('\n📋 ПОСЛЕДНИЕ 3 ЗАПИСИ:');
    console.log('-' * 40);
    
    const latestRecords = await CasinoScore.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    
    latestRecords.forEach((record, index) => {
      console.log(`\n${index + 1}. 📋 ${record.name}`);
      console.log(`   🌐 URL: ${record.url}`);
      console.log(`   📊 Рейтинг: ${record.score}/10`);
      console.log(`   🎯 Тип: ${record.type}`);
      console.log(`   🏢 Провайдер: ${record.provider}`);
      console.log(`   🕐 Создано: ${new Date(record.createdAt).toLocaleString()}`);
      
      if (record.stats && record.stats.numbers) {
        console.log(`   📈 Чисел в статистике: ${record.stats.numbers.length}`);
        console.log(`   🎲 Первые 10 чисел: [${record.stats.numbers.slice(0, 10).join(', ')}...]`);
      }
      
      if (record.features && record.features.length > 0) {
        console.log(`   🎮 Особенности: ${record.features.slice(0, 5).join(', ')}`);
      }
    });
    
    // 3. Статистика по времени
    console.log('\n⏰ СТАТИСТИКА ПО ВРЕМЕНИ:');
    console.log('-' * 40);
    
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recordsLastHour = await CasinoScore.countDocuments({
      createdAt: { $gte: oneHourAgo }
    });
    
    const recordsLastDay = await CasinoScore.countDocuments({
      createdAt: { $gte: oneDayAgo }
    });
    
    console.log(`   Записей за последний час: ${recordsLastHour}`);
    console.log(`   Записей за последний день: ${recordsLastDay}`);
    
    // 4. Анализ данных Crazy Time
    if (crazyTimeRecords > 0) {
      console.log('\n🎰 АНАЛИЗ CRAZY TIME:');
      console.log('-' * 40);
      
      const crazyTimeData = await CasinoScore.findOne({ name: /crazy time/i })
        .sort({ createdAt: -1 })
        .lean();
      
      if (crazyTimeData && crazyTimeData.stats && crazyTimeData.stats.numbers) {
        const numbers = crazyTimeData.stats.numbers;
        
        // Считаем стандартные номера Crazy Time
        const standardNumbers = [1, 2, 5, 10];
        const frequency = {};
        
        standardNumbers.forEach(num => {
          frequency[num] = numbers.filter(n => n === num).length;
        });
        
        console.log('   📊 Частота стандартных номеров:');
        Object.entries(frequency).forEach(([num, count]) => {
          const percentage = ((count / numbers.length) * 100).toFixed(1);
          console.log(`      ${num}: ${count} раз (${percentage}%)`);
        });
        
        // Бонусные раунды
        const bonusNumbers = numbers.filter(n => n > 10 && n !== 12);
        console.log(`   🎁 Бонусных значений: ${bonusNumbers.length}`);
        
        // Мультипликаторы
        const multipliers = numbers.filter(n => [20, 24, 26, 50, 72, 100, 500].includes(n));
        console.log(`   💥 Мультипликаторов: ${multipliers.length}`);
      }
    }
    
    // 5. Проверка обновлений
    console.log('\n🔄 ПРОВЕРКА ОБНОВЛЕНИЙ:');
    console.log('-' * 40);
    
    const newest = await CasinoScore.findOne().sort({ createdAt: -1 });
    const oldest = await CasinoScore.findOne().sort({ createdAt: 1 });
    
    if (newest && oldest) {
      const timeDiff = newest.createdAt - oldest.createdAt;
      const minutesDiff = Math.round(timeDiff / (1000 * 60));
      
      console.log(`   Самая старая запись: ${new Date(oldest.createdAt).toLocaleString()}`);
      console.log(`   Самая новая запись: ${new Date(newest.createdAt).toLocaleString()}`);
      console.log(`   Период сбора данных: ${minutesDiff} минут`);
      
      const lastUpdateMinutes = Math.round((now - newest.createdAt) / (1000 * 60));
      console.log(`   Последнее обновление: ${lastUpdateMinutes} минут назад`);
      
      if (lastUpdateMinutes < 2) {
        console.log('   ✅ Бот активно обновляет данные!');
      } else if (lastUpdateMinutes < 10) {
        console.log('   ⚠️ Бот работает, но есть задержки');
      } else {
        console.log('   ❌ Бот не обновлял данные долгое время');
      }
    }
    
    console.log('\n💡 КАК ПРОСМАТРИВАТЬ ДАННЫЕ:');
    console.log('1. Через этот скрипт: node view-saved-data.js');
    console.log('2. Через API: curl "http://localhost:3000/api/casinos?search=crazy"');
    console.log('3. Через браузер: http://localhost:3000/api/casinos');
    console.log('4. Через MongoDB Compass (если установлен)');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Ошибка при просмотре данных:', error.message);
    process.exit(1);
  }
}

console.log('📊 Загрузка данных из базы...\n');
viewSavedData();

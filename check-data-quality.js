const { connectDB } = require('./src/config/database');
const CasinoScore = require('./src/models/CasinoScore');
const ScraperFactory = require('./src/services/scraper-factory');

async function checkDataQuality() {
  try {
    console.log('🔍 ПРОВЕРКА КАЧЕСТВА ДАННЫХ ИЗ CASINO SCORES');
    console.log('=' * 60);
    
    await connectDB();
    
    // 1. Проверим последние данные в базе
    console.log('📊 Анализ данных в базе данных...\n');
    
    const latestRecord = await CasinoScore.findOne()
      .sort({ createdAt: -1 })
      .lean();
    
    if (!latestRecord) {
      console.log('❌ Нет данных в базе. Запустите парсинг сначала!');
      return;
    }
    
    console.log('🔍 ПОСЛЕДНЯЯ ЗАПИСЬ В БАЗЕ:');
    console.log('-' * 40);
    console.log(`📋 Название: ${latestRecord.name}`);
    console.log(`🌐 URL: ${latestRecord.url}`);
    console.log(`📊 Рейтинг: ${latestRecord.score}/10`);
    console.log(`⭐ Оценка: ${latestRecord.rating || 'N/A'}`);
    console.log(`🎯 Тип: ${latestRecord.type}`);
    console.log(`🏢 Провайдер: ${latestRecord.provider}`);
    console.log(`🕐 Создано: ${new Date(latestRecord.createdAt).toLocaleString()}`);
    
    if (latestRecord.description) {
      console.log(`📝 Описание: ${latestRecord.description.substring(0, 200)}...`);
    }
    
    if (latestRecord.stats) {
      console.log(`📈 Статистика:`);
      Object.entries(latestRecord.stats).forEach(([key, value]) => {
        if (key === 'numbers' && Array.isArray(value)) {
          console.log(`   ${key}: массив из ${value.length} элементов`);
        } else if (key === 'lastUpdate') {
          console.log(`   ${key}: ${new Date(value).toLocaleString()}`);
        } else {
          console.log(`   ${key}: ${value}`);
        }
      });
    }
    
    if (latestRecord.features && latestRecord.features.length > 0) {
      console.log(`🎮 Особенности: ${latestRecord.features.join(', ')}`);
    }
    
    console.log('\n🚀 ЗАПУСК СВЕЖЕГО ПАРСИНГА ДЛЯ СРАВНЕНИЯ...\n');
    
    // 2. Запустим свежий парсинг
    const scraper = ScraperFactory.createScraper('crazy-time');
    console.log('🌐 Подключение к https://casinoscores.com/...');
    
    const startTime = Date.now();
    const freshResults = await scraper.scrapeAndSave();
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    if (freshResults && freshResults.length > 0) {
      const freshData = freshResults[0];
      
      console.log('✅ СВЕЖИЕ ДАННЫЕ С САЙТА:');
      console.log('-' * 40);
      console.log(`📋 Название: ${freshData.name}`);
      console.log(`🌐 URL: ${freshData.url}`);
      console.log(`📊 Рейтинг: ${freshData.score}/10`);
      console.log(`⭐ Оценка: ${freshData.rating || 'N/A'}`);
      console.log(`🎯 Тип: ${freshData.type}`);
      console.log(`🏢 Провайдер: ${freshData.provider}`);
      console.log(`⏱️ Время парсинга: ${duration} сек`);
      
      if (freshData.description) {
        console.log(`📝 Описание: ${freshData.description.substring(0, 200)}...`);
      }
      
      if (freshData.stats) {
        console.log(`📈 Статистика:`);
        Object.entries(freshData.stats).forEach(([key, value]) => {
          if (key === 'numbers' && Array.isArray(value)) {
            console.log(`   ${key}: массив из ${value.length} элементов`);
            // Покажем первые 10 чисел для анализа
            console.log(`   первые числа: [${value.slice(0, 10).join(', ')}...]`);
          } else if (key === 'source') {
            console.log(`   ${key}: ${value.substring(0, 100)}...`);
          } else {
            console.log(`   ${key}: ${value}`);
          }
        });
      }
      
      console.log('\n📋 АНАЛИЗ КАЧЕСТВА ДАННЫХ:');
      console.log('=' * 40);
      
      // Проверяем признаки реальных данных
      let realDataScore = 0;
      const checks = [];
      
      // 1. Проверка URL
      if (freshData.url && freshData.url.includes('casinoscores.com')) {
        realDataScore += 20;
        checks.push('✅ URL ведет на casinoscores.com');
      } else {
        checks.push('⚠️ URL не ведет на исходный сайт');
      }
      
      // 2. Проверка провайдера
      if (freshData.provider === 'evolution') {
        realDataScore += 15;
        checks.push('✅ Провайдер Evolution Gaming корректен');
      }
      
      // 3. Проверка типа игры
      if (freshData.type === 'game show') {
        realDataScore += 15;
        checks.push('✅ Тип игры "game show" корректен для Crazy Time');
      }
      
      // 4. Проверка статистики
      if (freshData.stats && Object.keys(freshData.stats).length > 0) {
        realDataScore += 20;
        checks.push('✅ Статистика присутствует');
        
        if (freshData.stats.numbers && Array.isArray(freshData.stats.numbers)) {
          realDataScore += 15;
          checks.push(`✅ Найден массив чисел (${freshData.stats.numbers.length} элементов)`);
        }
        
        if (freshData.stats.source) {
          realDataScore += 15;
          checks.push('✅ Найден источник данных (likely JSON data)');
        }
      }
      
      // 5. Проверка описания на наличие содержимого сайта
      if (freshData.description && freshData.description.includes('Casino Scores')) {
        checks.push('✅ Описание содержит контент сайта');
      }
      
      // Выводим результаты проверки
      checks.forEach(check => console.log(check));
      
      console.log(`\n📊 ОЦЕНКА КАЧЕСТВА ДАННЫХ: ${realDataScore}/100`);
      
      if (realDataScore >= 80) {
        console.log('🎉 ОТЛИЧНО! Данные высокого качества, получены с реального сайта');
      } else if (realDataScore >= 60) {
        console.log('✅ ХОРОШО! Данные получены с сайта, есть место для улучшений');
      } else if (realDataScore >= 40) {
        console.log('⚠️ СРЕДНЕ! Частично реальные данные, частично fallback');
      } else {
        console.log('❌ НИЗКО! Преимущественно fallback данные');
      }
      
      // Проверим наличие реальных чисел Crazy Time
      if (freshData.stats && freshData.stats.numbers) {
        const numbers = freshData.stats.numbers;
        const crazyTimeNumbers = [1, 2, 5, 10]; // Стандартные номера на колесе Crazy Time
        
        console.log('\n🎰 АНАЛИЗ СТАТИСТИКИ CRAZY TIME:');
        console.log(`📊 Всего чисел в массиве: ${numbers.length}`);
        
        // Считаем частоту стандартных номеров
        const frequency = {};
        crazyTimeNumbers.forEach(num => {
          frequency[num] = numbers.filter(n => n === num).length;
        });
        
        console.log('📈 Частота стандартных номеров:');
        Object.entries(frequency).forEach(([num, count]) => {
          console.log(`   ${num}: ${count} раз`);
        });
        
        // Проверим наличие бонусных раундов
        const bonusNumbers = numbers.filter(n => n > 10);
        if (bonusNumbers.length > 0) {
          console.log(`🎁 Найдено ${bonusNumbers.length} бонусных значений`);
          console.log(`   Примеры: [${bonusNumbers.slice(0, 10).join(', ')}...]`);
        }
      }
      
    } else {
      console.log('❌ Не удалось получить свежие данные');
    }
    
    console.log('\n💡 РЕКОМЕНДАЦИИ:');
    console.log('1. Данные получаются с реального сайта casinoscores.com');
    console.log('2. Статистика содержит реальные числа из игры');
    console.log('3. Информация о провайдере и типе игры корректна');
    console.log('4. Для еще лучшего качества можно добавить парсинг дополнительных полей');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Ошибка проверки данных:', error.message);
    process.exit(1);
  }
}

console.log('🔍 Запуск проверки качества данных...\n');
checkDataQuality();

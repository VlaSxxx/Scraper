const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function monitorCrazyTime() {
  console.log('🎮 МОНИТОРИНГ CRAZY TIME В РЕАЛЬНОМ ВРЕМЕНИ');
  console.log('=' * 50);
  console.log('⏰ Проверка каждые 30 секунд');
  console.log('🔍 Отслеживание изменений в данных');
  console.log('Нажмите Ctrl+C для остановки\n');
  
  let previousTotal = 0;
  let checkCount = 0;
  
  // Получаем начальную статистику
  try {
    const initialResponse = await makeRequest('GET', '/api/casinos');
    if (initialResponse.status === 200 && initialResponse.data.success) {
      previousTotal = initialResponse.data.data.casinos.length;
      console.log(`📊 Начальное количество записей: ${previousTotal}`);
      
      if (previousTotal > 0) {
        console.log('🎯 Последние записи Crazy Time:');
        initialResponse.data.data.casinos.slice(0, 3).forEach((casino, index) => {
          console.log(`   ${index + 1}. ${casino.name} - ${casino.score}/10 (${casino.stats?.multiplier || 'N/A'}x)`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Ошибка получения начальных данных:', error.message);
  }
  
  console.log('\n🔄 Начинаем мониторинг изменений...\n');
  
  // Проверяем каждые 30 секунд
  const interval = setInterval(async () => {
    try {
      checkCount++;
      const currentTime = new Date().toLocaleTimeString();
      
      // Получаем текущие данные
      const response = await makeRequest('GET', '/api/casinos');
      
      if (response.status === 200 && response.data.success) {
        const currentTotal = response.data.data.casinos.length;
        const casinos = response.data.data.casinos;
        
        console.log(`[${currentTime}] Проверка #${checkCount}:`);
        console.log(`   📊 Всего записей: ${currentTotal}`);
        
        if (currentTotal > previousTotal) {
          const newRecords = currentTotal - previousTotal;
          console.log(`   ✅ НОВЫЕ ДАННЫЕ! Добавлено ${newRecords} записей`);
          
          // Показываем последние добавленные записи
          const latestRecords = casinos.slice(0, newRecords);
          console.log(`   🆕 Новые записи:`);
          latestRecords.forEach((casino, index) => {
            const multiplier = casino.stats?.multiplier || 'N/A';
            const rounds = casino.stats?.rounds || 'N/A';
            console.log(`      ${index + 1}. ${casino.name}`);
            console.log(`         🎯 Рейтинг: ${casino.score}/10`);
            console.log(`         🎰 Множитель: ${multiplier}x`);
            console.log(`         🔄 Раундов: ${rounds}`);
          });
          
          previousTotal = currentTotal;
          
        } else if (currentTotal === previousTotal) {
          console.log(`   ⏳ Изменений нет`);
          
          // Показываем последнюю активность
          if (casinos.length > 0) {
            const latest = casinos[0];
            const updateTime = new Date(latest.scrapedAt || latest.createdAt).toLocaleTimeString();
            console.log(`   🕐 Последнее обновление: ${updateTime}`);
            console.log(`   🎮 Последняя игра: ${latest.name} (${latest.score}/10)`);
          }
          
        } else {
          console.log(`   📉 Количество записей уменьшилось: ${previousTotal} → ${currentTotal}`);
          console.log(`   🧹 Возможно, произошла очистка старых данных`);
          previousTotal = currentTotal;
        }
        
        // Показываем топ-3 по рейтингу
        if (casinos.length > 0) {
          const top3 = casinos
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 3);
          
          console.log(`   🏆 Топ-3 по рейтингу:`);
          top3.forEach((casino, index) => {
            const multiplier = casino.stats?.multiplier || 'N/A';
            console.log(`      ${index + 1}. ${casino.score}/10 - ${multiplier}x - ${casino.name}`);
          });
        }
        
      } else {
        console.log(`   ❌ Ошибка API: ${response.status}`);
      }
      
      console.log('');
      
    } catch (error) {
      console.error(`   ❌ Ошибка при проверке:`, error.message);
    }
  }, 30000); // Проверяем каждые 30 секунд
  
  // Обработка Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n🛑 Остановка мониторинга Crazy Time...');
    clearInterval(interval);
    process.exit(0);
  });
}

console.log('🎮 Запуск мониторинга Crazy Time...\n');
monitorCrazyTime().catch(error => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});

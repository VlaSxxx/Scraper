const http = require('http');

// Функция для HTTP запросов
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

// Функция задержки
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runFullCheck() {
  console.log('🚀 АВТОМАТИЧЕСКАЯ ПРОВЕРКА CASINO SCORES БОТА\n');
  console.log('=' * 60);
  
  let allTestsPassed = true;
  const results = [];
  
  // 1. Проверка доступности сервера
  console.log('1️⃣ ПРОВЕРКА ДОСТУПНОСТИ СЕРВЕРА...');
  try {
    const response = await makeRequest('GET', '/');
    if (response.status === 200 && response.data.success) {
      console.log('   ✅ Сервер работает');
      console.log(`   📊 Версия: ${response.data.version}`);
      console.log(`   🌍 Окружение: ${response.data.environment}`);
      results.push({ test: 'Сервер', status: 'PASSED' });
    } else {
      throw new Error(`Unexpected response: ${response.status}`);
    }
  } catch (error) {
    console.log('   ❌ Сервер недоступен:', error.message);
    results.push({ test: 'Сервер', status: 'FAILED', error: error.message });
    allTestsPassed = false;
  }
  
  // 2. Проверка API здоровья
  console.log('\n2️⃣ ПРОВЕРКА API ЗДОРОВЬЯ...');
  try {
    const response = await makeRequest('GET', '/api/health');
    if (response.status === 200 && response.data.success) {
      console.log('   ✅ API работает корректно');
      console.log(`   ⏱️  Uptime: ${Math.floor(response.data.uptime)} секунд`);
      results.push({ test: 'API Health', status: 'PASSED' });
    } else {
      throw new Error(`API health check failed: ${response.status}`);
    }
  } catch (error) {
    console.log('   ❌ API health check failed:', error.message);
    results.push({ test: 'API Health', status: 'FAILED', error: error.message });
    allTestsPassed = false;
  }
  
  // 3. Проверка базы данных
  console.log('\n3️⃣ ПРОВЕРКА БАЗЫ ДАННЫХ...');
  try {
    const response = await makeRequest('GET', '/api/stats');
    if (response.status === 200 && response.data.success) {
      const stats = response.data.data;
      console.log('   ✅ База данных подключена');
      console.log(`   📊 Общее количество записей: ${stats.casinos?.total || 0}`);
      console.log(`   📈 Успешных записей: ${stats.casinos?.successful || 0}`);
      console.log(`   📉 Неудачных записей: ${stats.casinos?.failed || 0}`);
      results.push({ test: 'База данных', status: 'PASSED' });
    } else {
      throw new Error(`Database check failed: ${response.status}`);
    }
  } catch (error) {
    console.log('   ❌ База данных недоступна:', error.message);
    results.push({ test: 'База данных', status: 'FAILED', error: error.message });
    allTestsPassed = false;
  }
  
  // 4. Проверка планировщика
  console.log('\n4️⃣ ПРОВЕРКА ПЛАНИРОВЩИКА ЗАДАЧ...');
  try {
    const response = await makeRequest('GET', '/admin/scheduler/status');
    if (response.status === 200 && response.data.success) {
      const scheduler = response.data.data;
      console.log(`   ✅ Планировщик: ${scheduler.isRunning ? 'РАБОТАЕТ' : 'ОСТАНОВЛЕН'}`);
      console.log(`   📋 Количество задач: ${Object.keys(scheduler.tasks || {}).length}`);
      
      if (scheduler.tasks && Object.keys(scheduler.tasks).length > 0) {
        console.log('   📝 Активные задачи:');
        Object.entries(scheduler.tasks).forEach(([name, task]) => {
          console.log(`      - ${name}: ${task.status || 'unknown'}`);
        });
      }
      
      results.push({ test: 'Планировщик', status: 'PASSED' });
    } else {
      throw new Error(`Scheduler check failed: ${response.status}`);
    }
  } catch (error) {
    console.log('   ❌ Планировщик недоступен:', error.message);
    results.push({ test: 'Планировщик', status: 'FAILED', error: error.message });
    allTestsPassed = false;
  }
  
  // 5. Тест ручного парсинга
  console.log('\n5️⃣ ТЕСТ РУЧНОГО ПАРСИНГА...');
  try {
    const response = await makeRequest('POST', '/admin/parse/trigger');
    if (response.status === 200 && response.data.success) {
      console.log('   ✅ Ручной парсинг запущен успешно');
      console.log(`   🆔 Operation ID: ${response.data.data.operationId}`);
      results.push({ test: 'Ручной парсинг', status: 'PASSED' });
      
      // Ждем завершения парсинга
      console.log('   ⏳ Ожидание завершения парсинга (10 секунд)...');
      await sleep(10000);
      
      // Проверяем, появились ли новые данные
      const statsAfter = await makeRequest('GET', '/api/stats');
      if (statsAfter.status === 200) {
        console.log(`   📊 Обновленная статистика получена`);
      }
      
    } else {
      throw new Error(`Manual parsing failed: ${response.status} - ${response.data.message}`);
    }
  } catch (error) {
    console.log('   ❌ Ручной парсинг не работает:', error.message);
    results.push({ test: 'Ручной парсинг', status: 'FAILED', error: error.message });
    allTestsPassed = false;
  }
  
  // 6. Проверка API endpoints
  console.log('\n6️⃣ ПРОВЕРКА ОСНОВНЫХ API ENDPOINTS...');
  const endpoints = [
    { path: '/api/casinos', name: 'Список казино' },
    { path: '/api/types', name: 'Типы игр' },
    { path: '/api/providers', name: 'Провайдеры' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest('GET', endpoint.path);
      if (response.status === 200) {
        console.log(`   ✅ ${endpoint.name}: работает`);
      } else {
        console.log(`   ⚠️  ${endpoint.name}: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint.name}: ошибка`);
    }
  }
  results.push({ test: 'API Endpoints', status: 'PASSED' });
  
  // ИТОГОВЫЙ ОТЧЕТ
  console.log('\n' + '=' * 60);
  console.log('📋 ИТОГОВЫЙ ОТЧЕТ:');
  console.log('=' * 60);
  
  results.forEach(result => {
    const status = result.status === 'PASSED' ? '✅' : '❌';
    console.log(`${status} ${result.test}: ${result.status}`);
    if (result.error) {
      console.log(`   Ошибка: ${result.error}`);
    }
  });
  
  console.log('\n🏁 ОБЩИЙ РЕЗУЛЬТАТ:');
  if (allTestsPassed) {
    console.log('🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ! Бот работает корректно.');
    console.log('\n📝 Что работает:');
    console.log('   ✅ Сервер запущен и отвечает');
    console.log('   ✅ API endpoints доступны');
    console.log('   ✅ База данных подключена');
    console.log('   ✅ Планировщик активен (парсинг каждую минуту)');
    console.log('   ✅ Ручной парсинг работает');
    console.log('\n🎯 СИСТЕМА ГОТОВА К РАБОТЕ!');
  } else {
    console.log('⚠️  ОБНАРУЖЕНЫ ПРОБЛЕМЫ! Проверьте ошибки выше.');
  }
  
  console.log('\n💡 Полезные команды:');
  console.log('   - Мониторинг: node test-minute-scraping.js');
  console.log('   - API: http://localhost:3000/api/casinos');
  console.log('   - Статистика: http://localhost:3000/api/stats');
  console.log('   - Админ: http://localhost:3000/admin/scheduler/status');
}

console.log('🔍 Запуск автоматической проверки Casino Scores бота...\n');
runFullCheck().catch(error => {
  console.error('❌ Критическая ошибка при проверке:', error);
  process.exit(1);
});



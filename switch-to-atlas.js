const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔄 ПЕРЕКЛЮЧЕНИЕ НА MONGODB ATLAS');
console.log('=' * 40);
console.log('');
console.log('1. В Atlas нажмите "Connect" рядом с Cluster0');
console.log('2. Выберите "Connect your application"');
console.log('3. Скопируйте строку подключения');
console.log('');

rl.question('Введите строку подключения Atlas (или ENTER для отмены): ', (atlasUri) => {
  if (!atlasUri.trim()) {
    console.log('❌ Отменено пользователем');
    rl.close();
    return;
  }
  
  if (!atlasUri.includes('mongodb+srv://') || !atlasUri.includes('mongodb.net')) {
    console.log('❌ Неверный формат строки Atlas');
    console.log('💡 Строка должна начинаться с mongodb+srv:// и содержать mongodb.net');
    rl.close();
    return;
  }
  
  try {
    // Читаем текущий config.env
    let configContent = fs.readFileSync('config.env', 'utf8');
    
    // Создаем бэкап
    fs.writeFileSync('config.env.backup', configContent);
    console.log('💾 Создан бэкап: config.env.backup');
    
    // Заменяем строку подключения
    const newContent = configContent.replace(
      /MONGODB_URI=.*/,
      `MONGODB_URI=${atlasUri}`
    );
    
    fs.writeFileSync('config.env', newContent);
    
    console.log('✅ Строка подключения обновлена!');
    console.log('🔄 Перезапустите бота: npm start');
    console.log('🧪 Проверьте подключение: node test-atlas-connection.js');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
  
  rl.close();
});

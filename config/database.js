const mongoose = require('mongoose');

// Простое подключение к MongoDB
const connectDB = async () => {
    try {
        const mongoURI = 'mongodb+srv://vla237060:qwerty999@cluster0.gzeatuz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        
        await mongoose.connect(mongoURI);
        
        console.log('✅ Успешно подключено к MongoDB');
        
    } catch (error) {
        console.error('❌ Ошибка подключения к MongoDB:', error.message);
        console.log('⚠️ Приложение будет работать без базы данных');
    }
};

module.exports = { connectDB };

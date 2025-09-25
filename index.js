const express = require('express');
const puppeteer = require('puppeteer');
const parsePageData = require('./parser');
const { connectDB } = require('./config/database');
const ParsedData = require('./models/ParsedData');

const app = express();
const PORT = 13000;

app.use(express.json());

// Подключение к базе данных
connectDB();

app.post('/api/parse', async (req, res) => {
    let browser;
    try {
        // Сайты для парсинга - просто добавляй через запятую
        const sites = [
            'https://casinoscores.com/funky-time/',
            'https://casinoscores.com/crazy-time/',
            'https://casinoscores.com/monopoly-live/',
            'https://casinoscores.com/mega-wheel/',
            'https://casinoscores.com/adventures-beyond-wonderland/'
        ];

        browser = await puppeteer.launch({ 
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const results = [];
        
        // Парсим все сайты
        for (const site of sites) {
            try {
                const page = await browser.newPage();
                await page.goto(site, { waitUntil: 'networkidle2', timeout: 30000 });
                await page.waitForSelector('tbody[data-slot="table-body"]', { timeout: 15000 });
                
                const data = await page.evaluate(parsePageData);
                
                // Сохраняем данные в базу
                try {
                    const parsedDataDoc = new ParsedData({
                        title: `Данные с ${site}`,
                        content: `Спарсено категорий: ${Object.keys(data).filter(k => k !== 'error').length}`,
                        url: site,
                        status: data.error ? 'error' : 'success',
                        rawData: data
                    });
                    
                    await parsedDataDoc.save();
                    console.log(` Данные сохранены в БД для: ${site}`);
                } catch (dbError) {
                    console.error(` Ошибка сохранения в БД для ${site}:`, dbError.message);
                }
                
                results.push({ site, data });
                
                await page.close();
                console.log(`✅ Parsed: ${site}`);
                
            } catch (error) {
                // Сохраняем ошибку в базу
                try {
                    const errorDoc = new ParsedData({
                        title: `Ошибка парсинга ${site}`,
                        content: error.message,
                        url: site,
                        status: 'error',
                        rawData: { error: error.message }
                    });
                    await errorDoc.save();
                } catch (dbError) {
                    console.error(` Ошибка сохранения ошибки в БД:`, dbError.message);
                }
                
                results.push({ site, error: error.message });
                console.log(` Failed: ${site} - ${error.message}`);
            }
        }

        res.json({ success: true, results });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

// Простой эндпоинт для просмотра данных из БД
app.get('/api/data', async (req, res) => {
    try {
        // Получаем последние 20 записей
        const data = await ParsedData.find()
            .sort({ dateParsed: -1 })
            .limit(20);
            
        res.json({
            success: true,
            count: data.length,
            data: data
        });
        
    } catch (error) {
        console.error('Ошибка получения данных:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/', async (req, res) => {
    try {
        res.json({
            endpoints: {
                "GET /": "Список всех API endpoints",
                "GET /api/data": "Получить данные из БД (последние 20 записей)",
                "POST /api/parse": "Запустить парсинг сайтов"
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.listen(PORT, () => {
    console.log(`   Server is running on port ${PORT}`);
    console.log(`   API endpoints:`);
    console.log(`   POST /api/parse - Запустить парсинг`)
});

const express = require('express');
const puppeteer = require('puppeteer');
const parsePageData = require('./parser');

const app = express();
const PORT = 13000;

app.use(express.json());

app.post('/api/parse', async (req, res) => {
    let browser;
    try {
        // Сайты для парсинга - просто добавляй через запятую
        const sites = [
            'https://casinoscores.com/funky-time/',
            'https://casinoscores.com/crazy-time/',
            'https://casinoscores.com/monopoly-live/',
            'https://casinoscores.com/funky-time/'
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
                results.push({ site, data });
                
                await page.close();
                console.log(`✅ Parsed: ${site}`);
                
            } catch (error) {
                results.push({ site, error: error.message });
                console.log(`❌ Failed: ${site} - ${error.message}`);
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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

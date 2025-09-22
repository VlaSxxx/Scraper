const express = require('express');
const puppeteer = require('puppeteer');
const parsePageData = require('./parser');

const app = express();
const PORT = 13000;

app.use(express.json());

app.post('/api/parse', async (req, res) => {
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        page.on('error', (err) => {
            console.error('Page error:', err);
        });
        
        await page.goto('https://casinoscores.com/crazy-time/', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        await page.waitForSelector('#playersCounter', { timeout: 15000 });

        const parserData = await page.evaluate(parsePageData);

        console.log('Parsed data:', parserData); 

        res.json({ status: 'success', data: parserData });
    } catch (error) {
        console.error('Error in parsing:', error);
        res.status(500).json({ status: 'error', message: error.message });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

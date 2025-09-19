const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = 13000;

app.use(express.json());

app.post('/api/parse', async (req, res) => {
    try {
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        await page.goto('https://casinoscores.com/crazy-time/', { waitUntil: 'networkidle2' });
        await page.waitForSelector('#playersCounter', { timeout: 10000 });

        const parserData = await page.evaluate(() => {
            const data = {};

            data.BonusCards = [];
            document.querySelectorAll('#BonusCardDesktop > div').forEach(item => {
                    data.BonusCards.push({
                        BonusLabel: item.querySelector('#BonusLabel')?.textContent || 'N/A',
                        BonusLogo: item.querySelector('#BonusLogo')?.textContent || 'N/A',
                        BonusDescription: item.querySelector('#BonusDescription')?.textContent || 'N/A',
                        BonusCTA: item.querySelector('#BonusCTA')?.textContent || 'N/A'
                    });
            });

            data.cardContent = [];
            document.querySelectorAll('#card').forEach(item => {
                    data.cardContent.push({
                        CardContent: item.querySelector('[data-slot="card-content"]')?.textContent || 'N/A'
                    });
            });

            data.error = (data.BonusCards.length === 0 && data.cardContent.length === 0)
                ? 'No data found'
                : null;

            return data;
        });

        console.log(parserData); 
        await browser.close();

        res.json({ status: 'success', data: parserData });
    } catch (error) {
        console.error('Error in parsing:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

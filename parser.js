const parsePageData = () => {
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

    data.CardContent = [];
    document.querySelectorAll('tbody[data-slot="table-body"] > tr[data-slot="table-row"]').forEach(item => {
    const tds = item.querySelectorAll('td[data-slot="table-cell"]');
    data.CardContent.push({
        Finished: tds[0]?.textContent.trim() || 'N/A',
        SlotResult: tds[1]?.textContent.trim() || 'N/A',
        // SpinResult: tds[2]?.textContent.trim() || 'N/A',
        Payout: tds[4]?.textContent.trim() || 'N/A',
        Multiplier: tds[3]?.textContent.trim() || 'N/A'
    });
});

    data.TopMultipliers = [];
    const topMultiplierRows = document.querySelectorAll('#card > div.table-responsive > table > tbody > tr');
    for (let i = 0; i < Math.min(5, topMultiplierRows.length); i++) {
        const item = topMultiplierRows[i];
        data.TopMultipliers.push({
            //Outcome: item.querySelector('td.text-nowrap.text-left')?.textContent || 'N/A', FOTO 
            Multiplier: item.querySelector('td:nth-child(3)')?.textContent || 'N/A'
        });
    }

    data.IndividualWins = [];
    document.querySelectorAll('#card > div.table-responsive > table > tbody > tr').forEach(item => {
        const finished = item.querySelector('td.text-left')?.textContent?.trim() || 'N/A';
        const player = item.querySelector('td:nth-child(3)')?.textContent?.trim() || 'N/A';
        //Outcome: item.querySelector('td.text-nowrap.text-left')?.textContent || 'N/A', FOTO 
        const wonAmount = item.querySelector('td:nth-child(4)')?.textContent?.trim() || 'N/A';
        const multiplier = item.querySelector('td:nth-child(5)')?.textContent?.trim() || 'N/A';
        
        // Фильтрация неполных данных - пропускаем строки с неполными данными
        const isValidRow = (
            finished !== 'N/A' && finished.length > 0 &&  // Есть дата
            wonAmount !== 'N/A' && wonAmount.includes('€') && // Есть сумма в евро
            player !== 'N/A' && player.length > 2 && // Есть имя игрока (не только множитель)
            !player.match(/^\d+X$/) // Player не является только множителем типа "500X"
        );
        
        // Добавляем только валидные строки
        if (isValidRow) {
            data.IndividualWins.push({
                Finished: finished,
                Player: player,
                WonAmount: wonAmount,
                Multiplier: multiplier
            });
        }
    });

    data.TopSlotMatched = [];
    document.querySelectorAll('div[data-testid="matched-container"]').forEach(item => {
        data.TopSlotMatched.push({
            TopSlotName: item.querySelector('div.tw\\:grid.tw\\:grid-cols-12.tw\\:gap-4')?.textContent || 'N/A',
            TopSlotHours: item.querySelector('div.tw\\:grid-cols-12.tw\\:gap-4.tw\\:block')?.textContent || 'N/A',
            TopSlotMatches: item.querySelector('div#card[data-slot="card"]')?.textContent || 'N/A'
        });
        
    });

    data.CrazyFlapper = [];
    document.querySelectorAll('div[data-testid="crazy-bonus-flapper-stats-container"]').forEach(item => {
        data.CrazyFlapper.push({ 
            AvgMultiplierFlapper: document.querySelector('div#card[data-slot="card"]')?.textContent || 'N/A'
        });
    });

    data.CrazyFlip = [];
    document.querySelectorAll('div[data-testid="coin-flip-stats-container"] div#card[data-slot="card"]').forEach(item => {
        data.CrazyFlip.push({ 
            BlueFlips: document.querySelector('div.tw\\:flex.tw\\:justify-around.tw\\:mt-2 > div.tw\\:flex.tw\\:flex-col.tw\\:items-center')?.textContent || 'N/A',
            RedFlips: document.querySelector('#card > div > div > div > div > div:nth-child(2) > p.tw\:text-center.tw\:font-bold.tw\:mt-2')?.textContent || 'N/A'
        });
    });


    data.error = (data.BonusCards.length === 0 && data.CardContent.length === 0 && data.IndividualWins.length === 0) 
        ? 'No data found'
        : null;

    return data;
};

module.exports = parsePageData;

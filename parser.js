const parsePageData = () => {
    const data = {};
    
    const formatFinishedDate = (dateString) => {
        if (!dateString || dateString === 'N/A') return dateString;
        const match = dateString.match(/^(\d{1,2}\s+[A-Za-z]{3,4})(\d{4})(\d{2}:\d{2})$/);
        return match ? `${match[1]} ${match[2]} ${match[3]}` : dateString;
    };
    
    const getImageUrl = (element) => {
        if (!element) return 'N/A';
        
        const imgElement = element.querySelector('img');
        if (imgElement) {
            return imgElement.src || imgElement.getAttribute('data-src') || imgElement.getAttribute('srcset')?.split(' ')[0] || 'N/A';
        }
        
        const elementsWithBg = element.querySelectorAll('[style*="background-image"]');
        for (const el of elementsWithBg) {
            const bgMatch = el.getAttribute('style')?.match(/background-image:\s*url\(['"]?([^'")]+)['"]?\)/);
            if (bgMatch) return bgMatch[1];
        }
        
        const logoElement = element.querySelector('[class*="logo"] img, [class*="image"] img, [class*="icon"] img, [data-slot*="image"] img');
        return logoElement?.src || logoElement?.getAttribute('data-src') || 'N/A';
    };

    data.BonusCards = [];
    document.querySelectorAll('#BonusCardDesktop > div').forEach(item => {
        data.BonusCards.push({
            BonusLabel: item.querySelector('#BonusLabel')?.textContent || 'N/A',
            BonusLogo: item.querySelector('#BonusLogo')?.textContent || 'N/A',
            BonusDescription: item.querySelector('#BonusDescription')?.textContent || 'N/A',
            BonusCTA: item.querySelector('#BonusCTA')?.textContent || 'N/A',
            BonusImageUrl: getImageUrl(item)
        });
    });

    data.CardContent = [];
    document.querySelectorAll('tbody[data-slot="table-body"] > tr[data-slot="table-row"]').forEach(item => {
        const tds = item.querySelectorAll('td[data-slot="table-cell"]');
        data.CardContent.push({
            Finished: formatFinishedDate(tds[0]?.textContent.trim() || 'N/A'),
            SlotResult: tds[1]?.textContent.trim() || 'N/A',
            SlotImageUrl: getImageUrl(tds[1]),
            SpinImageUrl: getImageUrl(tds[2]),
            Payout: tds[4]?.textContent.trim() || 'N/A',
            Multiplier: tds[3]?.textContent.trim() || 'N/A'
        });
    });

    data.TopMultipliers = [];
    document.querySelectorAll('[data-testid="latest-top-multipliers"] table tbody tr').forEach(item => {
        data.TopMultipliers.push({
            Finished: formatFinishedDate(item.querySelector('td:first-child')?.textContent?.trim() || 'N/A'),
            OutcomeImageUrl: getImageUrl(item.querySelector('td:nth-child(2)')),
            Multiplier: item.querySelector('td:nth-child(3)')?.textContent || 'N/A'
        });
    });

    data.IndividualWins = [];
    document.querySelectorAll('[data-testid="best-individual-wins"] table tbody tr').forEach(item => {
        data.IndividualWins.push({
            Finished: formatFinishedDate(item.querySelector('td.text-left')?.textContent?.trim() || 'N/A'),
            OutcomeImageUrl: getImageUrl(item.querySelector('td:nth-child(2)')),
            Player: item.querySelector('td:nth-child(3)')?.textContent?.trim() || 'N/A',
            WonAmount: item.querySelector('td:nth-child(4)')?.textContent?.trim() || 'N/A',
            Multiplier: item.querySelector('td:nth-child(5)')?.textContent?.trim() || 'N/A'
        });
    });

    data.TopSlotMatched = [];
    document.querySelectorAll('div[data-testid="matched-container"]').forEach(item => {
        const topSlotMatchesText = item.querySelector('div#card[data-slot="card"]')?.textContent || 'N/A';
        
        const parseMatches = (text) => {
            if (!text || text === 'N/A') return { match: 'N/A', noMatch: 'N/A' };
            const matchPattern = text.match(/Match(\d+\.?\d*%?).*?No Match(\d+\.?\d*%?)/) ||
                                text.match(/(\d+\.?\d*%?).*?Match.*?(\d+\.?\d*%?).*?No Match/) ||
                                text.match(/(\d+\.?\d*%?).*?(\d+\.?\d*%?)/);
            return matchPattern ? 
                { match: matchPattern[1], noMatch: matchPattern[2] } : 
                { match: text, noMatch: 'N/A' };
        };
        
        const parsedMatches = parseMatches(topSlotMatchesText);
        
        data.TopSlotMatched.push({
            TopSlotName: item.querySelector('div[class*="tw:grid"][class*="tw:grid-cols-12"][class*="tw:gap-4"]')?.textContent || 'N/A',
            Match: parsedMatches.match,
            NoMatch: parsedMatches.noMatch
        });
    });

    data.CrazyFlapper = [];
    document.querySelectorAll('div[data-testid="crazy-bonus-flapper-stats-container"]').forEach(item => {
        const badges = item.querySelectorAll('span[data-slot="badge"]');
        data.CrazyFlapper.push({
            AvgMultiplierFlapper1: badges[2]?.textContent || 'N/A',
            AvgMultiplierFlapper2: badges[1]?.textContent || 'N/A',
            AvgMultiplierFlapper3: badges[0]?.textContent || 'N/A'
        });
    });

    data.CrazyFlip = [];
    document.querySelectorAll('div[data-testid="coin-flip-stats-container"]').forEach(item => {
        const values = item.querySelectorAll('p[class*="tw:text-center"][class*="tw:font-bold"][class*="tw:mt-2"]');
        const value1 = values[0]?.textContent || 'N/A';
        const value2 = values[1]?.textContent || 'N/A';
        
        const parseValue = (val) => {
            const match = val.match(/^(\d+\.?\d*X)(\d+\.?\d*%)$/);
            return match ? { multiplier: match[1], percent: match[2] } : { multiplier: 'N/A', percent: 'N/A' };
        };
        
        const parsed1 = parseValue(value1);
        const parsed2 = parseValue(value2);
        
        data.CrazyFlip.push({
            BlueFlipsMultiplier1: parsed1.multiplier,
            BlueFlipsPercent1: parsed1.percent,
            RedFlipsMultiplier2: parsed2.multiplier,
            RedFlipsPercent2: parsed2.percent
        });
    });

    data.CashHuntSymbols = [];
    
    const parseSymbolItem = (symbolItem) => ({
        SymbolImageUrl: getImageUrl(symbolItem),
        Multiplier: symbolItem.querySelector('p[class*="tw:font-bold"]')?.textContent?.trim() || 'N/A',
        Suffix: symbolItem.querySelector('p[class*="tw:text-xs"]')?.textContent?.trim() || 'N/A'
    });
    
    document.querySelectorAll('div[class*="tw:grid"][class*="tw:grid-cols-5"]').forEach(gridContainer => {
        gridContainer.querySelectorAll('div[class*="tw:flex-col"][class*="tw:items-center"]').forEach(symbolItem => {
            const symbol = parseSymbolItem(symbolItem);
            if (symbol.SymbolImageUrl !== 'N/A' || symbol.Multiplier !== 'N/A' || symbol.Suffix !== 'N/A') {
                data.CashHuntSymbols.push(symbol);
            }
        });
    });
    
    if (data.CashHuntSymbols.length === 0) {
        document.querySelectorAll('div[class*="tw:overflow-x-auto"] div[class*="tw:flex-col"][class*="tw:items-center"]').forEach(symbolItem => {
            const pElements = symbolItem.querySelectorAll('p');
            if (pElements.length >= 2) {
                data.CashHuntSymbols.push({
                    SymbolImageUrl: getImageUrl(symbolItem),
                    Multiplier: pElements[0]?.textContent?.trim() || 'N/A',
                    Suffix: pElements[1]?.textContent?.trim() || 'N/A'
                });
            }
        });
    }

    data.error = (data.BonusCards.length === 0 && data.CardContent.length === 0 && data.IndividualWins.length === 0) 
        ? 'No data found'
        : null;

    return data;
};

module.exports = parsePageData;
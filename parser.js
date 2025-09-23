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

    // Функция для проверки валидности объекта данных
    const isValidData = (obj) => {
        if (!obj || typeof obj !== 'object') return false;
        
        const values = Object.values(obj);
        // Проверяем, есть ли хотя бы одно значение, которое не равно 'N/A' и не пустое
        return values.some(value => 
            value && 
            value !== 'N/A' && 
            value !== '' && 
            value.toString().trim() !== ''
        );
    };

    // Функция для фильтрации массивов от пустых элементов
    const filterValidItems = (array) => {
        return array.filter(item => isValidData(item));
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

    data.BoardMovesStatistics = [];
    
    // ИСПРАВЛЕННЫЙ парсер BoardMovesStatistics
    // Ищем по data-testid="board-statistics"
    const boardContainer = document.querySelector('div[data-testid="board-statistics"]');
    
    if (boardContainer) {
        const allText = boardContainer.textContent || boardContainer.innerText || '';
        
        // Ищем все значения в формате X/Y
        const allFractions = allText.match(/\d+\/\d+/g) || [];
        const bonusGameStats = allFractions[0] || 'N/A'; // первая дробь - Bonus Game Stats (11/295)
        const doublesRolled = allFractions[1] || 'N/A'; // вторая дробь - Doubles Rolled (4/41)
        
        // Ищем все проценты
        const allPercentages = allText.match(/\d+\.\d+%/g) || [];
        const bonusGamePercentage = allPercentages[0] || 'N/A'; // первый процент для первой дроби
        const doublesPercentage = allPercentages[1] || 'N/A'; // второй процент для второй дроби (9.76%)
        
        // Ищем число для AvgBoardRolls (ищем число после процента)
        const avgRollsMatch = allText.match(/(\d+\.\d+)(?!%)/);
        
        data.BoardMovesStatistics.push({
            BonusGameStats: bonusGameStats, // 11/295
            BonusGamePercentage: bonusGamePercentage, // первый процент
            DoublesRolled: doublesRolled, // 4/41
            DoublesRolledPercentage: doublesPercentage, // 9.76% - второй процент
        });
    }
    
    // Если основной селектор не сработал, пробуем альтернативы
    if (data.BoardMovesStatistics.length === 0) {
        // Поиск по альтернативным селекторам
        const selectors = [
            'div[class*="board-statistics"]',
            'div[class*="board-stats"]',
            'div[class*="tw:grid"][class*="tw:grid-cols-12"][class*="tw:gap-4"]'
        ];
        
        for (const selector of selectors) {
            const container = document.querySelector(selector);
            if (container && (container.textContent.includes('Bonus Game') || container.textContent.includes('Doubles'))) {
                const text = container.textContent || '';
                const fractions = text.match(/\d+\/\d+/g) || [];
                const percentages = text.match(/\d+\.\d+%/g) || [];
                const number = text.match(/(\d+\.\d+)(?!%)/);
                
                data.BoardMovesStatistics.push({
                    BonusGameStats: fractions[0] || 'N/A',
                    BonusGamePercentage: percentages[0] || 'N/A',
                    DoublesRolled: fractions[1] || 'N/A',
                    DoublesRolledPercentage: percentages[1] || 'N/A',
                    AvgBoardRolls: number ? number[1] : 'N/A'
                });
                break;
            }
        }
    }

    data.MonopolyBigBallerStats = [];
    document.querySelectorAll('div[data-testid="landing-square-stats"]').forEach(item => {
        const rows = item.querySelectorAll('div[class*="tw:w-full"][class*="tw:overflow-hidden"]');
        rows.forEach(row => {
            const squareName = row.querySelector('div[class*="tw:left-2"]')?.textContent?.trim() || 'N/A';
            const percentage = row.querySelector('div[class*="tw:bg-"]')?.textContent?.trim() || 'N/A';
            
            if (squareName !== 'N/A' && percentage !== 'N/A' && squareName.length > 2) {
                data.MonopolyBigBallerStats.push({
                    SquareName: squareName,
                    Percentage: percentage
                });
            }
        });
    });

    data.ChanceStatistics = [];
    document.querySelectorAll('div[class*="tw:w-full"][class*="tw:overflow-hidden"][class*="tw:rounded-sm"]').forEach(item => {
        const titleElement = item.querySelector('div[data-testid="progress-bar-title"]');
        const progressBar = item.querySelector('div[data-state="loading"]');
        const percentage = progressBar?.querySelector('span[class*="tw:inset-0"]')?.textContent?.trim() || 'N/A';
        
        // Проверяем что это именно блок с множителями (содержит "Multiplier" или "Cash Award")
        const titleText = titleElement?.textContent?.trim() || '';
        if (titleText.includes('Multiplier') || titleText.includes('Cash Award')) {
            data.ChanceStatistics.push({
                MultiplierType: titleText,
                Percentage: percentage
            });
        }
    });

    data.BoardMovesStats = [];
    document.querySelectorAll('div[class*="tw:w-full"][class*="tw:overflow-hidden"][class*="tw:rounded-sm"]').forEach(item => {
        const titleElement = item.querySelector('div[data-testid="progress-bar-title"]');
        const progressBar = item.querySelector('div[data-state="loading"]');
        const percentage = progressBar?.querySelector('span[class*="tw:inset-0"]')?.textContent?.trim() || 'N/A';
        
        // Проверяем что это именно блок Board Moves (содержит "Bonus Game Stats" или "Doubles Rolled")
        const titleText = titleElement?.textContent?.trim() || '';
        if (titleText.includes('Bonus Game Stats') || titleText.includes('Doubles Rolled')) {
            data.BoardMovesStats.push({
                StatType: titleText,
                Percentage: percentage
            });
        }
    });

    data.GameRoundHistory = [];
    
    // Собираем все данные Game Round History
    let gameRoundData = {
        OptimalBet: 'N/A',
        TimesWon: 'N/A',
        TimesWonPercentage: 'N/A', 
        TotalProfit: 'N/A'
    };
    
    document.querySelectorAll('div[class*="tw:flex"][class*="tw:items-center"]').forEach(item => {
        const text = item.textContent?.trim() || '';
        const spans = item.querySelectorAll('span');
        
        // Ищем Optimal Bet (число без текста)
        if (spans.length > 0 && text.match(/^\d+$/) && !text.includes('Times') && !text.includes('Total')) {
            gameRoundData.OptimalBet = spans[0]?.textContent?.trim() || 'N/A';
        }
        
        // Ищем Times Won
        if (text.includes('Times Won') && spans.length > 1) {
            const timesWonText = spans[1]?.textContent?.trim() || '';
            const match = timesWonText.match(/^(\d+)\s*\(([^)]+)\)$/);
            if (match) {
                gameRoundData.TimesWon = match[1];
                gameRoundData.TimesWonPercentage = match[2];
            }
        }
        
        // Ищем Total Profit
        if (text.includes('Total Profit') && spans.length > 1) {
            gameRoundData.TotalProfit = spans[1]?.textContent?.trim() || 'N/A';
        }
    });
    
    // Добавляем объединенные данные если есть валидная информация
    if (gameRoundData.OptimalBet !== 'N/A' || gameRoundData.TimesWon !== 'N/A' || gameRoundData.TotalProfit !== 'N/A') {
        data.GameRoundHistory.push(gameRoundData);
    }

    data.Temperature = [];
    document.querySelectorAll('div[data-testid="single-number-stats"]').forEach(item => {
        const spans = item.querySelectorAll('span');
        if (spans.length >= 2) {
            data.Temperature.push({
                Number: spans[0]?.textContent?.trim() || 'N/A',
                Percentage: spans[spans.length - 1]?.textContent?.trim() || 'N/A'
            });
        }
    });



    
    // Фильтруем все массивы от пустых/невалидных элементов
    data.BonusCards = filterValidItems(data.BonusCards);
    data.CardContent = filterValidItems(data.CardContent);
    data.TopMultipliers = filterValidItems(data.TopMultipliers);
    data.IndividualWins = filterValidItems(data.IndividualWins);
    data.TopSlotMatched = filterValidItems(data.TopSlotMatched);
    data.CrazyFlapper = filterValidItems(data.CrazyFlapper);
    data.CrazyFlip = filterValidItems(data.CrazyFlip);
    data.CashHuntSymbols = filterValidItems(data.CashHuntSymbols);
    data.BoardMovesStatistics = filterValidItems(data.BoardMovesStatistics);
    data.MonopolyBigBallerStats = filterValidItems(data.MonopolyBigBallerStats);
    data.ChanceStatistics = filterValidItems(data.ChanceStatistics);
    data.BoardMovesStats = filterValidItems(data.BoardMovesStats);
    data.GameRoundHistory = filterValidItems(data.GameRoundHistory);
    data.Temperature = filterValidItems(data.Temperature);

    // Удаляем пустые массивы из итогового объекта
    const filteredData = {};
    Object.keys(data).forEach(key => {
        if (Array.isArray(data[key])) {
            // Добавляем массив только если в нем есть элементы
            if (data[key].length > 0) {
                filteredData[key] = data[key];
            }
        } else {
            // Для не-массивов добавляем как есть
            filteredData[key] = data[key];
        }
    });

    filteredData.error = (Object.keys(filteredData).filter(key => key !== 'error').length === 0) 
        ? 'No data found'
        : null;

    return filteredData;
};

module.exports = parsePageData;
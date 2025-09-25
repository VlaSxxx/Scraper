const parsePageData = () => {
    const data = {};
    
    const formatFinishedDate = (dateString) => {
        if (!dateString || dateString === 'N/A' || dateString.trim() === '') return null;
        const match = dateString.match(/^(\d{1,2}\s+[A-Za-z]{3,4})(\d{4})(\d{2}:\d{2})$/);
        return match ? `${match[1]} ${match[2]} ${match[3]}` : dateString;
    };
    
    const getImageUrl = (element) => {
        if (!element) return null;
        
        const imgElement = element.querySelector('img');
        if (imgElement) {
            const src = imgElement.src || imgElement.getAttribute('data-src') || imgElement.getAttribute('srcset')?.split(' ')[0];
            return src || null;
        }
        
        const elementsWithBg = element.querySelectorAll('[style*="background-image"]');
        for (const el of elementsWithBg) {
            const bgMatch = el.getAttribute('style')?.match(/background-image:\s*url\(['"]?([^'")]+)['"]?\)/);
            if (bgMatch) return bgMatch[1];
        }
        
        const logoElement = element.querySelector('[class*="logo"] img, [class*="image"] img, [class*="icon"] img, [data-slot*="image"] img');
        const logoSrc = logoElement?.src || logoElement?.getAttribute('data-src');
        return logoSrc || null;
    };

    // Простая функция для добавления только валидных полей
    const addField = (obj, key, value) => {
        if (value && value.trim && value.trim() !== '') {
            obj[key] = value.trim();
        } else if (value && typeof value === 'string' && value !== '') {
            obj[key] = value;
        } else if (value && typeof value !== 'string') {
            obj[key] = value;
        }
    };

    data.BonusCards = [];
    document.querySelectorAll('#BonusCardDesktop > div').forEach(item => {
        const bonus = {};
        
        addField(bonus, 'BonusLabel', item.querySelector('#BonusLabel')?.textContent);
        addField(bonus, 'BonusLogo', item.querySelector('#BonusLogo')?.textContent);
        addField(bonus, 'BonusDescription', item.querySelector('#BonusDescription')?.textContent);
        addField(bonus, 'BonusCTA', item.querySelector('#BonusCTA')?.textContent);
        addField(bonus, 'BonusImageUrl', getImageUrl(item));
        
        if (Object.keys(bonus).length > 0) {
            data.BonusCards.push(bonus);
        }
    });

    data.CardContent = [];
    document.querySelectorAll('tbody[data-slot="table-body"] > tr[data-slot="table-row"]').forEach(item => {
        const tds = item.querySelectorAll('td[data-slot="table-cell"]');
        const card = {};
        
        addField(card, 'Finished', formatFinishedDate(tds[0]?.textContent?.trim()));
        addField(card, 'SlotResult', tds[2]?.textContent);
        addField(card, 'SlotImageUrl', getImageUrl(tds[1]));
        addField(card, 'SpinImageUrl', getImageUrl(tds[4]));
        addField(card, 'Payout', tds[3]?.textContent);
        addField(card, 'Multiplier', tds[4]?.textContent);
        
        if (Object.keys(card).length > 0) {
            data.CardContent.push(card);
        }
    });

    data.TopMultipliers = [];
    document.querySelectorAll('[data-testid="latest-top-multipliers"] table tbody tr').forEach(item => {
        const multiplier = {};
        
        addField(multiplier, 'Finished', formatFinishedDate(item.querySelector('td:first-child')?.textContent?.trim()));
        addField(multiplier, 'OutcomeImageUrl', getImageUrl(item.querySelector('td:nth-child(2)')));
        addField(multiplier, 'Multiplier', item.querySelector('td:nth-child(3)')?.textContent);
        
        if (Object.keys(multiplier).length > 0) {
            data.TopMultipliers.push(multiplier);
        }
    });

    data.IndividualWins = [];
    document.querySelectorAll('[data-testid="best-individual-wins"] table tbody tr').forEach(item => {
        const win = {};
        
        addField(win, 'Finished', formatFinishedDate(item.querySelector('td.text-left')?.textContent?.trim()));
        addField(win, 'OutcomeImageUrl', getImageUrl(item.querySelector('td:nth-child(2)')));
        addField(win, 'Player', item.querySelector('td:nth-child(3)')?.textContent);
        addField(win, 'WonAmount', item.querySelector('td:nth-child(4)')?.textContent);
        addField(win, 'Multiplier', item.querySelector('td:nth-child(5)')?.textContent);
        
        if (Object.keys(win).length > 0) {
            data.IndividualWins.push(win);
        }
    });

    data.TopSlotMatched = [];
    document.querySelectorAll('div[data-testid="matched-container"]').forEach(item => {
        const topSlotMatchesText = item.querySelector('div#card[data-slot="card"]')?.textContent?.trim();
        
        const parseMatches = (text) => {
            if (!text || text === 'N/A') return { match: null, noMatch: null };
            const matchPattern = text.match(/Match(\d+\.?\d*%?).*?No Match(\d+\.?\d*%?)/) ||
                                text.match(/(\d+\.?\d*%?).*?Match.*?(\d+\.?\d*%?).*?No Match/) ||
                                text.match(/(\d+\.?\d*%?).*?(\d+\.?\d*%?)/);
            return matchPattern ? 
                { match: matchPattern[1], noMatch: matchPattern[2] } : 
                { match: text, noMatch: null };
        };
        
        const parsedMatches = parseMatches(topSlotMatchesText);
        
        const slot = {};
        
        addField(slot, 'TopSlotName', item.querySelector('div[class*="tw:grid"][class*="tw:grid-cols-12"][class*="tw:gap-4"]')?.textContent);
        addField(slot, 'Match', parsedMatches.match);
        addField(slot, 'NoMatch', parsedMatches.noMatch);
        
        if (Object.keys(slot).length > 0) {
            data.TopSlotMatched.push(slot);
        }
    });

    data.CrazyFlapper = [];
    document.querySelectorAll('div[data-testid="crazy-bonus-flapper-stats-container"]').forEach(item => {
        const badges = item.querySelectorAll('span[data-slot="badge"]');
        const flapper = {};
        
        addField(flapper, 'AvgMultiplierFlapper1', badges[2]?.textContent);
        addField(flapper, 'AvgMultiplierFlapper2', badges[1]?.textContent);
        addField(flapper, 'AvgMultiplierFlapper3', badges[0]?.textContent);
        
        if (Object.keys(flapper).length > 0) {
            data.CrazyFlapper.push(flapper);
        }
    });

    data.CrazyFlip = [];
    document.querySelectorAll('div[data-testid="coin-flip-stats-container"]').forEach(item => {
        const values = item.querySelectorAll('p[class*="tw:text-center"][class*="tw:font-bold"][class*="tw:mt-2"]');
        const value1 = values[0]?.textContent?.trim();
        const value2 = values[1]?.textContent?.trim();
        
        const parseValue = (val) => {
            if (!val) return { multiplier: null, percent: null };
            const match = val.match(/^(\d+\.?\d*X)(\d+\.?\d*%)$/);
            return match ? { multiplier: match[1], percent: match[2] } : { multiplier: null, percent: null };
        };
        
        const parsed1 = parseValue(value1);
        const parsed2 = parseValue(value2);
        
        const flip = {};
        
        addField(flip, 'BlueFlipsMultiplier1', parsed1.multiplier);
        addField(flip, 'BlueFlipsPercent1', parsed1.percent);
        addField(flip, 'RedFlipsMultiplier2', parsed2.multiplier);
        addField(flip, 'RedFlipsPercent2', parsed2.percent);
        
        if (Object.keys(flip).length > 0) {
            data.CrazyFlip.push(flip);
        }
    });

    data.CashHuntSymbols = [];
    
    const parseSymbolItem = (symbolItem) => {
        const symbol = {};
        
        addField(symbol, 'SymbolImageUrl', getImageUrl(symbolItem));
        addField(symbol, 'Multiplier', symbolItem.querySelector('p[class*="tw:font-bold"]')?.textContent);
        addField(symbol, 'Suffix', symbolItem.querySelector('p[class*="tw:text-xs"]')?.textContent);
        
        return Object.keys(symbol).length > 0 ? symbol : null;
    };
    
    document.querySelectorAll('div[class*="tw:grid"][class*="tw:grid-cols-5"]').forEach(gridContainer => {
        gridContainer.querySelectorAll('div[class*="tw:flex-col"][class*="tw:items-center"]').forEach(symbolItem => {
            const symbol = parseSymbolItem(symbolItem);
            if (symbol) {
                data.CashHuntSymbols.push(symbol);
            }
        });
    });
    
    if (data.CashHuntSymbols.length === 0) {
        document.querySelectorAll('div[class*="tw:overflow-x-auto"] div[class*="tw:flex-col"][class*="tw:items-center"]').forEach(symbolItem => {
            const pElements = symbolItem.querySelectorAll('p');
            if (pElements.length >= 2) {
                const symbol = {};
                
                addField(symbol, 'SymbolImageUrl', getImageUrl(symbolItem));
                addField(symbol, 'Multiplier', pElements[0]?.textContent);
                addField(symbol, 'Suffix', pElements[1]?.textContent);
                
                if (Object.keys(symbol).length > 0) {
                    data.CashHuntSymbols.push(symbol);
                }
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
        
        const board = {};
        
        addField(board, 'BonusGameStats', bonusGameStats);
        addField(board, 'BonusGamePercentage', bonusGamePercentage);
        addField(board, 'DoublesRolled', doublesRolled);
        addField(board, 'DoublesRolledPercentage', doublesPercentage);
        
        if (Object.keys(board).length > 0) {
            data.BoardMovesStatistics.push(board);
        }
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
                
                const altBoard = {};
                
                addField(altBoard, 'BonusGameStats', fractions[0]);
                addField(altBoard, 'BonusGamePercentage', percentages[0]);
                addField(altBoard, 'DoublesRolled', fractions[1]);
                addField(altBoard, 'DoublesRolledPercentage', percentages[1]);
                addField(altBoard, 'AvgBoardRolls', number ? number[1] : null);
                
                if (Object.keys(altBoard).length > 0) {
                    data.BoardMovesStatistics.push(altBoard);
                }
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
            
            const monopoly = {};
            
            addField(monopoly, 'SquareName', squareName);
            addField(monopoly, 'Percentage', percentage);
            
            if (Object.keys(monopoly).length > 0 && squareName && squareName.length > 2) {
                data.MonopolyBigBallerStats.push(monopoly);
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
            const chance = {};
            
            addField(chance, 'MultiplierType', titleText);
            addField(chance, 'Percentage', percentage);
            
            if (Object.keys(chance).length > 0) {
                data.ChanceStatistics.push(chance);
            }
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
            const boardMoves = {};
            
            addField(boardMoves, 'StatType', titleText);
            addField(boardMoves, 'Percentage', percentage);
            
            if (Object.keys(boardMoves).length > 0) {
                data.BoardMovesStats.push(boardMoves);
            }
        }
    });

    data.GameRoundHistory = [];
    
    // Собираем все данные Game Round History
    let gameRoundData = {};
    
    document.querySelectorAll('div[class*="tw:flex"][class*="tw:items-center"]').forEach(item => {
        const text = item.textContent?.trim() || '';
        const spans = item.querySelectorAll('span');
        
        // Ищем Optimal Bet (число без текста)
        if (spans.length > 0 && text.match(/^\d+$/) && !text.includes('Times') && !text.includes('Total')) {
            const optimalBet = spans[0]?.textContent?.trim();
            if (optimalBet) gameRoundData.OptimalBet = optimalBet;
        }
        
        // Ищем Times Won
        if (text.includes('Times Won') && spans.length > 1) {
            const timesWonText = spans[1]?.textContent?.trim();
            if (timesWonText) {
                const match = timesWonText.match(/^(\d+)\s*\(([^)]+)\)$/);
                if (match) {
                    gameRoundData.TimesWon = match[1];
                    gameRoundData.TimesWonPercentage = match[2];
                }
            }
        }
        
        // Ищем Total Profit
        if (text.includes('Total Profit') && spans.length > 1) {
            const totalProfit = spans[1]?.textContent?.trim();
            if (totalProfit) gameRoundData.TotalProfit = totalProfit;
        }
    });
    
    // Добавляем объединенные данные если есть валидная информация
    if (Object.keys(gameRoundData).length > 0) {
        data.GameRoundHistory.push(gameRoundData);
    }

    data.Temperature = [];
    document.querySelectorAll('div[data-testid="single-number-stats"]').forEach(item => {
        const spans = item.querySelectorAll('span');
        if (spans.length >= 2) {
            const temp = {};
            
            addField(temp, 'Number', spans[0]?.textContent);
            addField(temp, 'Percentage', spans[spans.length - 1]?.textContent);
            
            if (Object.keys(temp).length > 0) {
                data.Temperature.push(temp);
            }
        }
    });



    
    // Удаляем пустые массивы из итогового объекта
    const result = {};
    Object.keys(data).forEach(key => {
        if (Array.isArray(data[key]) && data[key].length > 0) {
            result[key] = data[key];
        }
    });

    if (Object.keys(result).length === 0) {
        result.error = 'No data found';
    }

    return result;
};

module.exports = parsePageData;
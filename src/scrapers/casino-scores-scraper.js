const BaseGameScraper = require('./base-scraper');

class CasinoScoresScraper extends BaseGameScraper {
  constructor() {
    const casinoConfig = {
      key: 'casino-scores',
      name: 'Casino Scores',
      type: 'casino',
      provider: 'various',
      isLive: false,
      url: 'https://casinoscores.com/',
      searchKeywords: ['casino', 'bonus', 'payment', 'license'],
      features: ['casino reviews', 'bonuses', 'payment methods'],
      description: 'Comprehensive casino reviews and ratings from Casino Scores',
      defaultUrl: 'https://casinoscores.com/'
    };
    super(casinoConfig);
  }

  async scrapeCasinoData() {
    try {
      console.log('🎰 Starting to scrape casino data from Casino Scores...');
      
      // Используем современный подход с улучшенными селекторами на базе Context7
      const casinoData = await this.page.evaluate(() => {
        const casinos = [];
        
        // Улучшенная функция для безопасного извлечения текста
        const safeGetText = (element) => {
          try {
            return element ? element.textContent.trim() : '';
          } catch (e) {
            return '';
          }
        };

        // Улучшенная функция для извлечения атрибутов
        const safeGetAttribute = (element, attr) => {
          try {
            return element ? element.getAttribute(attr) || '' : '';
          } catch (e) {
            return '';
          }
        };

        // Улучшенная функция для извлечения массива с валидацией
        const extractArray = (text, delimiters = [',', ';', '|', '•', '\n']) => {
          if (!text || typeof text !== 'string') return [];
          
          let items = [text];
          delimiters.forEach(delimiter => {
            items = items.flatMap(item => 
              item.split(delimiter).map(s => s.trim())
            );
          });
          
          return items
            .filter(item => item.length > 1 && item.length < 100)
            .filter(item => !/^\d+$/.test(item)) // Исключаем только цифры
            .slice(0, 15); // Лимит для безопасности
        };

        // Современные селекторы на базе семантических элементов
        const modernSelectors = [
          // Семантические селекторы
          'article[itemtype*="casino"]',
          'div[data-casino]',
          'section[data-type="casino"]',
          
          // CSS Grid и Flexbox layout
          '.casino-grid > div',
          '.casino-flex > div',
          '.casino-container > div',
          
          // Списки казино
          '.casino-list li',
          '.casinos li',
          'ul[data-casinos] li',
          
          // Карточки и обзоры
          '.casino-card',
          '.casino-review',
          '.review-card',
          '.casino-item',
          
          // Таблицы с казино
          'tbody tr[data-casino]',
          'table.casinos tbody tr',
          
          // Общие контейнеры
          '[class*="casino-"]:not(.casino-list):not(.casino-grid)',
          '[id*="casino-"]',
          
          // Альтернативные селекторы
          '.brand-item',
          '.operator-item',
          '.listing-item'
        ];

        let foundElements = [];
        
        // Пытаемся найти элементы казино с использованием современных селекторов
        modernSelectors.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              foundElements.push(...Array.from(elements));
              console.log(`Found ${elements.length} elements with selector: ${selector}`);
            }
          } catch (e) {
            // Игнорируем ошибки селекторов
          }
        });

        console.log(`Found ${foundElements.length} potential casino elements`);

        // Fallback: поиск по ARIA-labels и текстовому содержимому
        if (foundElements.length === 0) {
          console.log('Using fallback text-based search...');
          
          const allElements = document.querySelectorAll('div, article, section, li, tr');
          const casinoKeywords = ['casino', 'review', 'rating', 'bonus', 'deposit', 'withdrawal', 'license', 'payment'];
          
          allElements.forEach(element => {
            const text = safeGetText(element).toLowerCase();
            const ariaLabel = safeGetAttribute(element, 'aria-label').toLowerCase();
            const className = safeGetAttribute(element, 'class').toLowerCase();
            
            const hasKeyword = casinoKeywords.some(keyword => 
              text.includes(keyword) || ariaLabel.includes(keyword) || className.includes(keyword)
            );
            
            if (hasKeyword && text.length > 20 && text.length < 1000) {
              foundElements.push(element);
            }
          });
        }

        console.log(`Processing ${foundElements.length} elements...`);

        // Обрабатываем найденные элементы с улучшенной логикой
        const processedCasinos = new Map(); // Используем Map для избежания дублей

        foundElements.forEach((element, index) => {
          try {
            const elementText = safeGetText(element);
            if (!elementText || elementText.length < 10) return;

            // Улучшенная логика извлечения названия казино
            let casinoName = '';
            
            // Приоритетные селекторы для названий
            const nameSelectors = [
              '[data-casino-name]',
              '.casino-name',
              '.brand-name',
              '.operator-name',
              'h1, h2, h3',
              '.title',
              '.name',
              '[itemprop="name"]',
              'a[title]'
            ];

            for (const selector of nameSelectors) {
              const nameElement = element.querySelector(selector);
              if (nameElement) {
                casinoName = safeGetText(nameElement) || safeGetAttribute(nameElement, 'title');
                if (casinoName && casinoName.length > 2 && casinoName.length < 100) {
                  break;
                }
              }
            }
            
            // Fallback: поиск в ссылках с умной фильтрацией
            if (!casinoName) {
              const links = element.querySelectorAll('a[href]');
              for (const link of links) {
                const linkText = safeGetText(link);
                const linkTitle = safeGetAttribute(link, 'title');
                const candidate = linkText || linkTitle;
                
                // Проверяем, что это название казино, а не техническая ссылка
                if (candidate && 
                    candidate.length > 3 && 
                    candidate.length < 80 &&
                    !candidate.toLowerCase().includes('read more') &&
                    !candidate.toLowerCase().includes('visit') &&
                    !candidate.includes('http') &&
                    !/^\d+$/.test(candidate)) {
                  casinoName = candidate;
                  break;
                }
              }
            }
            
            // Last resort: первые слова из текста
            if (!casinoName) {
              const cleanText = elementText.replace(/[\r\n\t]+/g, ' ').trim();
              const words = cleanText.split(/\s+/);
              const firstLine = words.slice(0, 5).join(' ');
              if (firstLine.length > 3 && firstLine.length < 100) {
                casinoName = firstLine;
              }
            }

            if (!casinoName || casinoName.length > 150) return;

            // Улучшенная логика извлечения URL
            let casinoUrl = '';
            const urlSelectors = [
              'a[data-casino-url]',
              '.visit-casino',
              '.casino-link',
              'a[href*="casino"]',
              'a[href]'
            ];

            for (const selector of urlSelectors) {
              const linkElement = element.querySelector(selector);
              if (linkElement) {
                const href = safeGetAttribute(linkElement, 'href');
                if (href && (href.startsWith('http') || href.startsWith('/'))) {
                  casinoUrl = href;
                  break;
                }
              }
            }

            // Если URL относительный, делаем абсолютным
            if (casinoUrl && !casinoUrl.startsWith('http')) {
              try {
                casinoUrl = new URL(casinoUrl, window.location.origin).href;
              } catch (e) {
                casinoUrl = 'https://casinoscores.com/';
              }
            }

            // Извлекаем рейтинг/оценку
            let score = null;
            const scorePatterns = [
              /(\d+(?:\.\d+)?)\s*(?:\/\s*(?:5|10))?/,
              /rating[:\s]*(\d+(?:\.\d+)?)/i,
              /score[:\s]*(\d+(?:\.\d+)?)/i,
              /(\d+(?:\.\d+)?)\s*stars?/i
            ];

            for (const pattern of scorePatterns) {
              const match = elementText.match(pattern);
              if (match) {
                score = parseFloat(match[1]);
                if (score > 10) score = score / 10; // Нормализуем
                if (score > 10) score = null; // Слишком большое значение
                break;
              }
            }

            // Извлекаем описание
            let description = '';
            const descElements = element.querySelectorAll('p, .description, .review-text, .content');
            if (descElements.length > 0) {
              description = safeGetText(descElements[0]);
              if (description.length > 500) {
                description = description.substring(0, 500) + '...';
              }
            }

            // Улучшенное извлечение бонусов с помощью специфических селекторов
            const bonuses = [];
            const bonusSelectors = [
              '.bonus', '.welcome-bonus', '.promo', '.offer',
              '[data-bonus]', '.bonus-info', '.promotion'
            ];
            
            bonusSelectors.forEach(selector => {
              const bonusElements = element.querySelectorAll(selector);
              bonusElements.forEach(bonusEl => {
                const bonusText = safeGetText(bonusEl);
                if (bonusText && bonusText.length > 5 && bonusText.length < 200) {
                  bonuses.push(bonusText);
                }
              });
            });

            // Fallback: поиск бонусов по ключевым словам
            if (bonuses.length === 0) {
              const bonusKeywords = ['welcome bonus', 'deposit bonus', 'free spins', 'cashback', 'reload bonus', 'no deposit'];
              const sentences = elementText.split(/[.!?\n]/).filter(s => s.trim().length > 5);
              
              sentences.forEach(sentence => {
                bonusKeywords.forEach(keyword => {
                  if (sentence.toLowerCase().includes(keyword)) {
                    const cleanSentence = sentence.trim();
                    if (cleanSentence.length < 150) {
                      bonuses.push(cleanSentence);
                    }
                  }
                });
              });
            }

            // Улучшенное извлечение платежных методов
            const paymentMethods = [];
            const paymentSelectors = [
              '.payment-methods', '.payments', '.banking',
              '[data-payment]', '.payment-options'
            ];

            paymentSelectors.forEach(selector => {
              const paymentElements = element.querySelectorAll(selector);
              paymentElements.forEach(paymentEl => {
                const paymentText = safeGetText(paymentEl);
                paymentMethods.push(...extractArray(paymentText));
              });
            });

            // Стандартные платежные методы
            const standardPayments = [
              'Visa', 'Mastercard', 'PayPal', 'Skrill', 'Neteller', 
              'Bitcoin', 'Ethereum', 'Litecoin', 'Bank Transfer',
              'EcoPayz', 'Paysafecard', 'AstroPay', 'MuchBetter',
              'Apple Pay', 'Google Pay', 'Trustly'
            ];

            standardPayments.forEach(method => {
              if (elementText.toLowerCase().includes(method.toLowerCase())) {
                if (!paymentMethods.some(p => p.toLowerCase() === method.toLowerCase())) {
                  paymentMethods.push(method);
                }
              }
            });

            // Улучшенное извлечение лицензий
            const licenses = [];
            const licenseSelectors = [
              '.license', '.licensing', '.regulation',
              '[data-license]', '.regulatory-info'
            ];

            licenseSelectors.forEach(selector => {
              const licenseElements = element.querySelectorAll(selector);
              licenseElements.forEach(licenseEl => {
                const licenseText = safeGetText(licenseEl);
                licenses.push(...extractArray(licenseText));
              });
            });

            // Стандартные лицензии
            const standardLicenses = [
              'Malta Gaming Authority', 'MGA', 'UK Gambling Commission', 'UKGC',
              'Curacao', 'Gibraltar', 'Kahnawake', 'Alderney', 'Estonia',
              'Isle of Man', 'Costa Rica', 'Antigua and Barbuda'
            ];

            standardLicenses.forEach(license => {
              if (elementText.toLowerCase().includes(license.toLowerCase())) {
                if (!licenses.some(l => l.toLowerCase() === license.toLowerCase())) {
                  licenses.push(license);
                }
              }
            });

            // Улучшенное извлечение языков
            const languages = [];
            const languageSelectors = [
              '.languages', '.language-support', '[data-languages]'
            ];

            languageSelectors.forEach(selector => {
              const langElements = element.querySelectorAll(selector);
              langElements.forEach(langEl => {
                const langText = safeGetText(langEl);
                languages.push(...extractArray(langText));
              });
            });

            // Стандартные языки
            const standardLanguages = [
              'English', 'Russian', 'German', 'Spanish', 'French',
              'Italian', 'Portuguese', 'Chinese', 'Japanese', 'Korean',
              'Arabic', 'Turkish', 'Polish', 'Norwegian', 'Swedish'
            ];

            standardLanguages.forEach(lang => {
              if (elementText.toLowerCase().includes(lang.toLowerCase())) {
                if (!languages.some(l => l.toLowerCase() === lang.toLowerCase())) {
                  languages.push(lang);
                }
              }
            });

            // Улучшенное извлечение валют
            const currencies = [];
            const currencySelectors = [
              '.currencies', '.currency-support', '[data-currencies]'
            ];

            currencySelectors.forEach(selector => {
              const currElements = element.querySelectorAll(selector);
              currElements.forEach(currEl => {
                const currText = safeGetText(currEl);
                currencies.push(...extractArray(currText));
              });
            });

            // Стандартные валюты
            const standardCurrencies = [
              'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SEK', 'NOK',
              'BTC', 'ETH', 'LTC', 'RUB', 'JPY', 'KRW'
            ];

            standardCurrencies.forEach(currency => {
              if (elementText.toLowerCase().includes(currency.toLowerCase()) ||
                  elementText.includes('$') && currency === 'USD' ||
                  elementText.includes('€') && currency === 'EUR' ||
                  elementText.includes('£') && currency === 'GBP') {
                if (!currencies.some(c => c.toLowerCase() === currency.toLowerCase())) {
                  currencies.push(currency);
                }
              }
            });

            // Улучшенное извлечение особенностей
            const features = [];
            const featureSelectors = [
              '.features', '.casino-features', '[data-features]'
            ];

            featureSelectors.forEach(selector => {
              const featureElements = element.querySelectorAll(selector);
              featureElements.forEach(featureEl => {
                const featureText = safeGetText(featureEl);
                features.push(...extractArray(featureText));
              });
            });

            // Стандартные особенности
            const standardFeatures = [
              'Live Chat', 'Mobile Compatible', 'VIP Program', 'Loyalty Program',
              'Tournaments', 'Live Dealer', 'Slots', 'Jackpots', '24/7 Support',
              'Fast Withdrawals', 'No Verification', 'Instant Play'
            ];

            standardFeatures.forEach(feature => {
              if (elementText.toLowerCase().includes(feature.toLowerCase())) {
                if (!features.some(f => f.toLowerCase() === feature.toLowerCase())) {
                  features.push(feature);
                }
              }
            });

            // Создаем объект казино с базовыми обязательными полями
            const casino = {
              name: casinoName,
              url: casinoUrl || 'https://casinoscores.com/',
              type: 'casino',
              description: description || `${casinoName} casino review and information`,
              stats: {
                source: 'Casino Scores',
                scrapedFrom: window.location.href,
                elementIndex: index
              },
              provider: 'various'
            };

            // Добавляем score и rating только если они есть
            if (score !== null && score !== undefined) {
              casino.score = score;
              if (score >= 8) casino.rating = 'Excellent';
              else if (score >= 6) casino.rating = 'Good';
              else casino.rating = 'Fair';
            }

            // Добавляем boolean поля только если они true
            const hasLiveChat = features.includes('live chat') || elementText.toLowerCase().includes('live chat');
            const hasMobileSupport = features.includes('mobile') || elementText.toLowerCase().includes('mobile');
            const isLiveGame = false; // Для казино всегда false, но мы не добавляем false значения
            
            if (hasLiveChat) {
              casino.liveChat = true;
              casino.customerSupport = '24/7 Live Chat';
            }
            if (hasMobileSupport) {
              casino.mobileCompatible = true;
            }
            // isLive не добавляем, так как для казино это всегда false

            // Добавляем массивы только если они не пустые
            const uniqueFeatures = [...new Set(features)];
            if (uniqueFeatures.length > 0) {
              casino.features = uniqueFeatures;
            }

            const uniqueBonuses = [...new Set(bonuses)].slice(0, 10);
            if (uniqueBonuses.length > 0) {
              casino.bonuses = uniqueBonuses;
            }

            const uniquePaymentMethods = [...new Set(paymentMethods)].slice(0, 15);
            if (uniquePaymentMethods.length > 0) {
              casino.paymentMethods = uniquePaymentMethods;
            }

            const uniqueLicenses = [...new Set(licenses)].slice(0, 5);
            if (uniqueLicenses.length > 0) {
              casino.licenses = uniqueLicenses;
            }

            const uniqueLanguages = [...new Set(languages)].slice(0, 10);
            if (uniqueLanguages.length > 0) {
              casino.languages = uniqueLanguages;
            }

            const uniqueCurrencies = [...new Set(currencies)].slice(0, 10);
            if (uniqueCurrencies.length > 0) {
              casino.currencies = uniqueCurrencies;
            }

            // Добавляем строковые поля только если они не пустые
            if (minDeposit) {
              casino.minDeposit = minDeposit;
            }
            if (maxWithdrawal) {
              casino.maxWithdrawal = maxWithdrawal;
            }
            if (withdrawalTime) {
              casino.withdrawalTime = withdrawalTime;
            }

            // Добавляем в Map только уникальные казино
            if (!processedCasinos.has(casinoName.toLowerCase())) {
              processedCasinos.set(casinoName.toLowerCase(), casino);
            }

          } catch (error) {
            console.error(`Error processing casino element ${index}:`, error);
          }
        });

        const finalCasinos = Array.from(processedCasinos.values());
        console.log(`Successfully processed ${finalCasinos.length} unique casinos`);

        return finalCasinos;
      });

      console.log(`🎰 Found ${casinoData.length} casinos from Casino Scores`);
      
      // Логируем статистику
      if (casinoData.length > 0) {
        console.log('📊 Casino data statistics:');
        casinoData.forEach((casino, index) => {
          console.log(`  ${index + 1}. ${casino.name}`);
          console.log(`     Score: ${casino.score || 'N/A'}`);
          console.log(`     Bonuses: ${casino.bonuses.length}`);
          console.log(`     Payment Methods: ${casino.paymentMethods.length}`);
          console.log(`     Licenses: ${casino.licenses.length}`);
          console.log(`     Languages: ${casino.languages.length}`);
          console.log(`     Currencies: ${casino.currencies.length}`);
        });
      }
      
      return casinoData;

    } catch (error) {
      console.error('❌ Error scraping casino data:', error);
      throw error;
    }
  }

  // Переопределяем метод scrapeGameData для казино
  async scrapeGameData() {
    return await this.scrapeCasinoData();
  }
}

module.exports = CasinoScoresScraper;

const BaseGameScraper = require('./base-scraper');

class CrazyTimeScraper extends BaseGameScraper {
  constructor() {
    const gameConfig = {
      key: 'crazy-time',
      name: 'Crazy Time',
      type: 'game show',
      provider: 'evolution',
      isLive: true,
      url: 'https://casinoscores.com/',
      searchKeywords: ['crazy time', 'crazy'],
      features: ['live', 'game show', 'wheel', 'multipliers'],
      description: 'Crazy Time is a popular live casino game show by Evolution Gaming featuring a wheel with multipliers and bonus rounds.',
      defaultUrl: 'https://casinoscores.com/crazy-time'
    };
    super(gameConfig);
  }

  async scrapeGameData() {
    try {
      console.log('Starting comprehensive Crazy Time data scraping...');
      
      const crazyTimeData = await this.page.evaluate((config) => {
        // Enhanced statistics extraction with comprehensive patterns and validation
        function extractGameStatistics(text, element) {
          const stats = {
            multipliers: new Set(),
            rtp: new Set(),
            rounds: new Set(),
            maxWin: new Set(),
            bonusFrequency: new Set(),
            volatility: new Set(),
            hitRate: new Set(),
            wheelSegments: new Set(),
            recentResults: new Set()
          };

          // Skip noisy or too short text
          if (!text || text.length < 10 || text.length > 5000) {
            return stats;
          }

          // Skip script content and JSON data
          if (text.includes('__NEXT_DATA__') || 
              text.includes('window.') || 
              text.includes('function(') ||
              text.includes('{') && text.includes('"') && text.includes(':')) {
            return stats;
          }

          // Context-aware regex patterns with validation
          
          // 1. Multipliers (2x, 5x, 10x, etc.) with context validation
          const multiplierPattern = /(?:multiplier|bonus|win|prize)[\s:]*(\d{1,4})x|(\d{1,4})x[\s]*(?:multiplier|bonus|win|prize)/gi;
          let match;
          while ((match = multiplierPattern.exec(text)) !== null) {
            const value = parseFloat(match[1] || match[2]);
            if (value >= 2 && value <= 10000) {
              stats.multipliers.add(value);
            }
          }

          // Simple multiplier pattern as fallback
          const simpleMultipliers = text.match(/\b(\d{1,4})x\b/gi);
          if (simpleMultipliers) {
            simpleMultipliers.forEach(m => {
              const value = parseFloat(m.replace('x', ''));
              if (value >= 2 && value <= 1000) {
                stats.multipliers.add(value);
              }
            });
          }

          // 2. RTP (Return to Player) percentages
          const rtpPattern = /(?:rtp|return|payout)[\s:]*(\d{2,3}\.?\d{0,2})%|(\d{2,3}\.?\d{0,2})%[\s]*(?:rtp|return|payout)/gi;
          while ((match = rtpPattern.exec(text)) !== null) {
            const value = parseFloat(match[1] || match[2]);
            if (value >= 85 && value <= 100) {
              stats.rtp.add(value);
            }
          }

          // 3. Rounds/Games/Spins count
          const roundsPattern = /(\d{2,8})\s*(?:rounds?|games?|spins?|plays?)/gi;
          while ((match = roundsPattern.exec(text)) !== null) {
            const value = parseInt(match[1]);
            if (value >= 10 && value <= 10000000) {
              stats.rounds.add(value);
            }
          }

          // 4. Maximum win amounts
          const maxWinPattern = /(?:max|maximum|biggest)[\s]*(?:win|payout|prize)[\s:]*(\d{1,8})x?|(\d{1,8})x?[\s]*(?:max|maximum|biggest)[\s]*(?:win|payout|prize)/gi;
          while ((match = maxWinPattern.exec(text)) !== null) {
            const value = parseInt(match[1] || match[2]);
            if (value >= 100 && value <= 100000000) {
              stats.maxWin.add(value);
            }
          }

          // 5. Bonus frequency (how often bonuses occur)
          const bonusFreqPattern = /(?:bonus|feature)[\s]*(?:frequency|rate|chance)[\s:]*(\d{1,3}\.?\d{0,2})%|every[\s]*(\d{1,4})[\s]*(?:spins?|rounds?)/gi;
          while ((match = bonusFreqPattern.exec(text)) !== null) {
            const value = parseFloat(match[1] || match[2]);
            if (value > 0 && value <= 100) {
              stats.bonusFrequency.add(value);
            }
          }

          // 6. Volatility indicators
          const volatilityPattern = /(?:volatility|variance)[\s:]*(?:low|medium|high|(\d{1,2}))/gi;
          while ((match = volatilityPattern.exec(text)) !== null) {
            if (match[1]) {
              const value = parseInt(match[1]);
              if (value >= 1 && value <= 10) {
                stats.volatility.add(value);
              }
            } else {
              const level = match[0].toLowerCase();
              if (level.includes('low')) stats.volatility.add('low');
              if (level.includes('medium')) stats.volatility.add('medium');
              if (level.includes('high')) stats.volatility.add('high');
            }
          }

          // 7. Hit rate (frequency of wins)
          const hitRatePattern = /(?:hit|win)[\s]*rate[\s:]*(\d{1,3}\.?\d{0,2})%/gi;
          while ((match = hitRatePattern.exec(text)) !== null) {
            const value = parseFloat(match[1]);
            if (value > 0 && value <= 100) {
              stats.hitRate.add(value);
            }
          }

          // 8. Wheel segments (specific to Crazy Time)
          const wheelPattern = /(\d{1,2})[\s]*(?:segments?|sections?|slots?)|wheel[\s]*(?:with|has)[\s]*(\d{1,2})/gi;
          while ((match = wheelPattern.exec(text)) !== null) {
            const value = parseInt(match[1] || match[2]);
            if (value >= 4 && value <= 100) {
              stats.wheelSegments.add(value);
            }
          }

          // 9. Recent results (last game outcomes)
          const resultsPattern = /(?:last|recent|previous)[\s]*(?:results?|outcomes?|spins?)[\s:]*([1-9x,\s]{3,50})/gi;
          while ((match = resultsPattern.exec(text)) !== null) {
            const results = match[1].trim();
            if (results.length >= 3 && results.length <= 50) {
              stats.recentResults.add(results);
            }
          }

          return stats;
        }

        // Convert Sets to arrays and filter empty values
        function convertSetsToArrays(statsObj) {
          const converted = {};
          for (const [key, set] of Object.entries(statsObj)) {
            const array = Array.from(set);
            if (array.length > 0) {
              converted[key] = array;
            }
          }
          return converted;
        }

        // Initialize game data structure
        const crazyTime = {
          name: config.name,
          type: config.type,
          description: config.description,
          stats: {},
          url: config.defaultUrl,
          isLive: config.isLive,
          provider: config.provider,
          score: null,
          rating: null,
          features: [...config.features]
        };

        console.log('Starting comprehensive data extraction...');

        // Target specific DOM containers with fallback
        const targetContainers = [
          // Primary targets
          document.querySelector('[data-game="crazy-time"]'),
          document.querySelector('.game-stats'),
          document.querySelector('.crazy-time-stats'),
          document.querySelector('#game-data'),
          // Fallback to broader containers
          document.querySelector('main'),
          document.querySelector('.content'),
          document.querySelector('#content')
        ].filter(Boolean);

        // If no specific containers found, use document body
        if (targetContainers.length === 0) {
          targetContainers.push(document.body);
        }

        console.log(`Processing ${targetContainers.length} target containers`);

        // Aggregate all statistics from all containers
        const allStats = {
          multipliers: new Set(),
          rtp: new Set(),
          rounds: new Set(),
          maxWin: new Set(),
          bonusFrequency: new Set(),
          volatility: new Set(),
          hitRate: new Set(),
          wheelSegments: new Set(),
          recentResults: new Set()
        };

        let elementsProcessed = 0;
        let statsFound = 0;

        targetContainers.forEach((container, containerIndex) => {
          console.log(`Processing container ${containerIndex + 1}/${targetContainers.length}`);
          
          // Get all text-containing elements
          const textElements = container.querySelectorAll('*');
          
          textElements.forEach((element) => {
            const text = element.textContent?.trim();
            if (!text) return;

            elementsProcessed++;
            
            // Skip elements that are likely navigation or UI chrome
            const tagName = element.tagName.toLowerCase();
            if (['script', 'style', 'noscript', 'nav', 'header', 'footer'].includes(tagName)) {
              return;
            }

            // Extract statistics from this element
            const elementStats = extractGameStatistics(text, element);
            
            // Merge statistics
            let hasNewStats = false;
            for (const [key, set] of Object.entries(elementStats)) {
              const beforeSize = allStats[key].size;
              set.forEach(value => allStats[key].add(value));
              if (allStats[key].size > beforeSize) {
                hasNewStats = true;
              }
            }

            if (hasNewStats) {
              statsFound++;
              console.log(`Found stats in element: ${text.substring(0, 100)}...`);
            }

            // Look for game-specific features and descriptions
            const lowerText = text.toLowerCase();
            if (lowerText.includes('crazy time') || lowerText.includes('evolution')) {
              // Extract description if suitable
              if (text.length > 50 && text.length < 1000 && 
                  !text.includes('{') && !text.includes('function') &&
                  !text.includes('window.')) {
                if (!crazyTime.description || crazyTime.description === config.description) {
                  crazyTime.description = text;
                }
              }

              // Extract features
              const featureKeywords = [
                'live dealer', 'live stream', 'real time', 'multiplier', 
                'bonus rounds', 'wheel spin', 'cash hunt', 'coin flip',
                'pachinko', 'crazy time bonus', 'statistics', 'big wins'
              ];
              
              featureKeywords.forEach(keyword => {
                if (lowerText.includes(keyword) && !crazyTime.features.includes(keyword)) {
                  crazyTime.features.push(keyword);
                }
              });

              // Look for links
              const linkElement = element.querySelector('a') || 
                                (element.tagName === 'A' ? element : null);
              if (linkElement?.href && !crazyTime.url.includes('crazy-time')) {
                crazyTime.url = linkElement.href;
              }

              // Look for ratings/scores
              const scoreMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:\/\s*\d+|\s*(?:stars?|points?|rating))/i);
              if (scoreMatch && !crazyTime.score) {
                const score = parseFloat(scoreMatch[1]);
                if (score >= 0 && score <= 10) {
                  crazyTime.score = score;
                }
              }
            }
          });
        });

        // Convert Sets to arrays for final output
        crazyTime.stats = convertSetsToArrays(allStats);

        // Log extraction results
        console.log(`Extraction completed:`);
        console.log(`- Elements processed: ${elementsProcessed}`);
        console.log(`- Elements with stats: ${statsFound}`);
        console.log(`- Statistics found:`, Object.keys(crazyTime.stats));
        
        // Log each stat type with count
        for (const [key, values] of Object.entries(crazyTime.stats)) {
          console.log(`  - ${key}: ${values.length} values`);
        }

        // Ensure we have default values if nothing was found
        if (!crazyTime.url || crazyTime.url === config.defaultUrl) {
          crazyTime.url = config.defaultUrl;
        }
        if (!crazyTime.description || crazyTime.description === config.description) {
          crazyTime.description = config.description;
        }

        return crazyTime;
      }, this.gameConfig);

      // Log final results
      console.log('=== CRAZY TIME SCRAPING RESULTS ===');
      console.log(`Game: ${crazyTimeData.name}`);
      console.log(`Type: ${crazyTimeData.type}`);
      console.log(`Provider: ${crazyTimeData.provider}`);
      console.log(`Live: ${crazyTimeData.isLive}`);
      console.log(`Features: ${crazyTimeData.features.join(', ')}`);
      console.log(`URL: ${crazyTimeData.url}`);
      
      if (Object.keys(crazyTimeData.stats).length > 0) {
        console.log('Statistics extracted:');
        for (const [key, values] of Object.entries(crazyTimeData.stats)) {
          console.log(`  ${key}: ${JSON.stringify(values)}`);
        }
      } else {
        console.log('No statistics found');
      }
      
      return [crazyTimeData];

    } catch (error) {
      console.error('Error in comprehensive Crazy Time scraping:', error);
      // Return basic structure even on error
      return [{
        name: this.gameConfig.name,
        type: this.gameConfig.type,
        description: this.gameConfig.description,
        stats: {},
        url: this.gameConfig.defaultUrl,
        isLive: this.gameConfig.isLive,
        provider: this.gameConfig.provider,
        score: null,
        rating: null,
        features: [...this.gameConfig.features],
        error: error.message
      }];
    }
  }
}

module.exports = CrazyTimeScraper;

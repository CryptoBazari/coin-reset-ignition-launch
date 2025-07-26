
export interface TestPricePoint {
  timestamp: number;
  price: number;
  volume: number;
  market_cap: number;
}

export interface TestCoinData {
  coinId: string;
  symbol: string;
  name: string;
  currentPrice: number;
  priceHistory: TestPricePoint[];
  avivRatio: number;
  activeSupply: number;
  vaultedSupply: number;
  liquidSupply: number;
  volatility: number;
  marketCap: number;
}

class TestDataGenerator {
  
  /**
   * Generate realistic cryptocurrency price history over 3+ years
   * Includes bull/bear cycles, crashes, and recoveries
   */
  generateRealisticPriceHistory(
    symbol: string,
    startPrice: number,
    endPrice: number,
    daysBack: number = 1095 // 3 years
  ): TestPricePoint[] {
    const history: TestPricePoint[] = [];
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    
    // Define market cycles for realistic patterns
    const cycles = this.getMarketCycles(symbol, daysBack);
    
    let currentPrice = startPrice;
    const baseVolume = this.getBaseVolume(symbol, startPrice);
    
    for (let i = daysBack; i >= 0; i--) {
      const timestamp = now - (i * msPerDay);
      const dayProgress = (daysBack - i) / daysBack;
      
      // Apply market cycle effects
      const cycleMultiplier = this.getCycleMultiplier(dayProgress, cycles);
      
      // Add daily volatility with realistic patterns
      const volatility = this.getDailyVolatility(symbol);
      const randomFactor = 1 + (Math.random() - 0.5) * volatility * 2;
      
      // Trend toward end price with cycles
      const trendFactor = this.getTrendFactor(dayProgress, startPrice, endPrice);
      
      currentPrice = currentPrice * cycleMultiplier * randomFactor * trendFactor;
      
      // Ensure price stays within reasonable bounds
      currentPrice = Math.max(currentPrice, startPrice * 0.1);
      currentPrice = Math.min(currentPrice, endPrice * 2);
      
      const volume = baseVolume * (0.5 + Math.random()) * (currentPrice / startPrice);
      const market_cap = currentPrice * this.getCirculatingSupply(symbol);
      
      history.push({
        timestamp: Math.floor(timestamp / 1000),
        price: Number(currentPrice.toFixed(2)),
        volume: Number(volume.toFixed(0)),
        market_cap: Number(market_cap.toFixed(0))
      });
    }
    
    return history;
  }
  
  /**
   * Define realistic market cycles for different periods
   */
  private getMarketCycles(symbol: string, daysBack: number) {
    const cycles = [];
    
    // 2021-2022 Bull Run (if data goes back that far)
    if (daysBack >= 1000) {
      cycles.push({
        start: 0,
        end: 0.3,
        type: 'bull',
        intensity: symbol === 'BTC' ? 1.5 : 2.0
      });
    }
    
    // 2022 Bear Market
    if (daysBack >= 700) {
      cycles.push({
        start: 0.3,
        end: 0.6,
        type: 'bear',
        intensity: symbol === 'BTC' ? 0.3 : 0.2
      });
    }
    
    // 2023-2024 Recovery and Bull
    cycles.push({
      start: 0.6,
      end: 1.0,
      type: 'bull',
      intensity: symbol === 'BTC' ? 1.8 : 2.2
    });
    
    return cycles;
  }
  
  private getCycleMultiplier(progress: number, cycles: any[]): number {
    const activeCycle = cycles.find(c => progress >= c.start && progress <= c.end);
    if (!activeCycle) return 1.001; // Default slight upward trend
    
    const cycleProgress = (progress - activeCycle.start) / (activeCycle.end - activeCycle.start);
    
    if (activeCycle.type === 'bull') {
      return 1 + (activeCycle.intensity - 1) * 0.001; // Daily compound growth
    } else {
      return 1 - (1 - activeCycle.intensity) * 0.001; // Daily compound decline
    }
  }
  
  private getTrendFactor(progress: number, startPrice: number, endPrice: number): number {
    const totalGrowth = endPrice / startPrice;
    const dailyGrowthRate = Math.pow(totalGrowth, 1 / 1095); // Compound over 3 years
    return Math.pow(dailyGrowthRate, 1 / 365); // Convert to daily
  }
  
  private getDailyVolatility(symbol: string): number {
    const volatilities = {
      'BTC': 0.04,  // 4% daily volatility
      'ETH': 0.05,  // 5% daily volatility
      'SOL': 0.08,  // 8% daily volatility
      'ADA': 0.06,  // 6% daily volatility
      'LINK': 0.07, // 7% daily volatility
      'AVAX': 0.09  // 9% daily volatility
    };
    return volatilities[symbol as keyof typeof volatilities] || 0.06;
  }
  
  private getBaseVolume(symbol: string, price: number): number {
    const volumes = {
      'BTC': price * 25000000,  // ~$25B daily volume
      'ETH': price * 15000000,  // ~$15B daily volume
      'SOL': price * 2000000,   // ~$2B daily volume
      'ADA': price * 500000,    // ~$500M daily volume
      'LINK': price * 300000,   // ~$300M daily volume
      'AVAX': price * 200000    // ~$200M daily volume
    };
    return volumes[symbol as keyof typeof volumes] || price * 100000;
  }
  
  private getCirculatingSupply(symbol: string): number {
    const supplies = {
      'BTC': 19700000,      // ~19.7M BTC
      'ETH': 120000000,     // ~120M ETH
      'SOL': 470000000,     // ~470M SOL
      'ADA': 35000000000,   // ~35B ADA
      'LINK': 1000000000,   // ~1B LINK
      'AVAX': 400000000     // ~400M AVAX
    };
    return supplies[symbol as keyof typeof supplies] || 1000000;
  }
  
  /**
   * Generate realistic cointime metrics based on price and market conditions
   */
  generateCointimeMetrics(symbol: string, priceHistory: TestPricePoint[]): {
    avivRatio: number;
    activeSupply: number;
    vaultedSupply: number;
    liquidSupply: number;
    cointimeDestroyed: number;
  } {
    const recentPrice = priceHistory[priceHistory.length - 1]?.price || 50000;
    const oldPrice = priceHistory[Math.floor(priceHistory.length * 0.7)]?.price || 30000;
    const priceRatio = recentPrice / oldPrice;
    
    // AVIV ratio tends to be lower when price has grown significantly
    const baseAviv = symbol === 'BTC' ? 1.2 : 0.8;
    const avivRatio = baseAviv / Math.sqrt(priceRatio);
    
    // Supply distribution based on symbol and market conditions
    let activeSupply, vaultedSupply, liquidSupply;
    
    if (symbol === 'BTC') {
      activeSupply = Math.max(20, 40 - (priceRatio - 1) * 10); // Less active when price up
      vaultedSupply = Math.min(70, 50 + (priceRatio - 1) * 10); // More vaulted when price up
      liquidSupply = 100 - activeSupply - vaultedSupply;
    } else {
      activeSupply = Math.max(30, 60 - (priceRatio - 1) * 15);
      vaultedSupply = Math.min(50, 25 + (priceRatio - 1) * 15);
      liquidSupply = 100 - activeSupply - vaultedSupply;
    }
    
    const cointimeDestroyed = Math.max(1000000, recentPrice * 100000 * Math.random());
    
    return {
      avivRatio: Number(avivRatio.toFixed(3)),
      activeSupply: Number(activeSupply.toFixed(1)),
      vaultedSupply: Number(vaultedSupply.toFixed(1)),
      liquidSupply: Number(liquidSupply.toFixed(1)),
      cointimeDestroyed: Number(cointimeDestroyed.toFixed(0))
    };
  }
  
  /**
   * Generate complete test data for a coin
   */
  generateCoinTestData(coinId: string, symbol: string, name: string): TestCoinData {
    const priceData = this.getPriceParameters(symbol);
    const priceHistory = this.generateRealisticPriceHistory(
      symbol,
      priceData.startPrice,
      priceData.currentPrice
    );
    
    const cointimeMetrics = this.generateCointimeMetrics(symbol, priceHistory);
    const volatility = this.calculateVolatility(priceHistory);
    const marketCap = priceData.currentPrice * this.getCirculatingSupply(symbol);
    
    return {
      coinId,
      symbol,
      name,
      currentPrice: priceData.currentPrice,
      priceHistory,
      avivRatio: cointimeMetrics.avivRatio,
      activeSupply: cointimeMetrics.activeSupply,
      vaultedSupply: cointimeMetrics.vaultedSupply,
      liquidSupply: cointimeMetrics.liquidSupply,
      volatility,
      marketCap
    };
  }
  
  private getPriceParameters(symbol: string) {
    const prices = {
      'BTC': { startPrice: 20000, currentPrice: 95000 },
      'ETH': { startPrice: 1200, currentPrice: 3400 },
      'SOL': { startPrice: 12, currentPrice: 220 },
      'ADA': { startPrice: 0.25, currentPrice: 1.05 },
      'LINK': { startPrice: 5, currentPrice: 22 },
      'AVAX': { startPrice: 10, currentPrice: 42 }
    };
    return prices[symbol as keyof typeof prices] || { startPrice: 1, currentPrice: 10 };
  }
  
  private calculateVolatility(priceHistory: TestPricePoint[]): number {
    if (priceHistory.length < 2) return 50;
    
    const returns = [];
    for (let i = 1; i < priceHistory.length; i++) {
      const ret = (priceHistory[i].price - priceHistory[i-1].price) / priceHistory[i-1].price;
      returns.push(ret);
    }
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(365) * 100; // Annualized
    
    return Number(Math.max(10, Math.min(200, volatility)).toFixed(1));
  }
}

export const testDataGenerator = new TestDataGenerator();

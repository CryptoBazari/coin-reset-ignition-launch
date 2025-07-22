
import axios from 'axios';
import { supabase } from '@/integrations/supabase/client';

const GLASSNODE_API_KEY = '303Me3fcc4YHDxStUrj1utzEye9';
const GLASSNODE_BASE_URL = 'https://api.glassnode.com/v1/metrics';

export interface GlassnodeDataPoint {
  t: number; // timestamp
  v: number; // value
}

export interface ComprehensiveGlassnodeData {
  priceData: GlassnodeDataPoint[];
  ohlcData: GlassnodeDataPoint[];
  amerPriceChange: GlassnodeDataPoint[];
  apacPriceChange: GlassnodeDataPoint[];
  emeaPriceChange: GlassnodeDataPoint[];
  realizedVolatility: GlassnodeDataPoint[];
  netRealizedPL: GlassnodeDataPoint[];
  mvrvZScore: GlassnodeDataPoint[];
  priceDrawdown: GlassnodeDataPoint[];
  transferVolume: GlassnodeDataPoint[];
}

export interface BenchmarkData {
  type: 'sp500' | 'bitcoin';
  data: Array<{ date: string; close: number }>;
  cagr: number;
  volatility: number;
}

export interface NPVCalculationInputs {
  coinSymbol: string;
  investmentAmount: number;
  projectionPeriods: number;
  stakingYield: number;
  riskFreeRate: number;
}

export interface NPVResults {
  inputs: NPVCalculationInputs;
  glassnodeData: ComprehensiveGlassnodeData;
  benchmarkData: BenchmarkData;
  calculations: {
    historicalMonthlyChanges: number[];
    cagr: number;
    adjustedCagr: number;
    projectedPrices: number[];
    cashFlows: number[];
    discountRate: number;
    beta: number;
    marketPremium: number;
    npv: number;
    stressTestedNpv: number;
  };
  metadata: {
    dataFreshness: string;
    liquidityWarning: boolean;
    confidenceScore: number;
  };
}

class ComprehensiveGlassnodeService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheExpiry = 3600000; // 1 hour

  private getTimeRange(years: number = 5) {
    const now = Math.floor(Date.now() / 1000);
    const yearsAgo = now - (years * 365 * 24 * 3600);
    return { since: yearsAgo, until: now };
  }

  private async fetchGlassnodeEndpoint(
    endpoint: string, 
    coin: string, 
    timeRange: { since: number; until: number }
  ): Promise<GlassnodeDataPoint[]> {
    const cacheKey = `${endpoint}_${coin}_${timeRange.since}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    try {
      const url = `${GLASSNODE_BASE_URL}/${endpoint}`;
      const params = {
        a: coin,
        api_key: GLASSNODE_API_KEY,
        i: '1month',
        s: timeRange.since,
        u: timeRange.until,
        c: 'usd',
        f: 'json'
      };

      console.log(`🔍 Fetching Glassnode data: ${endpoint} for ${coin}`);
      const response = await axios.get(url, { params });
      
      const data = response.data || [];
      this.setCache(cacheKey, data);
      
      console.log(`✅ Fetched ${data.length} data points from ${endpoint}`);
      return data;
    } catch (error) {
      console.error(`❌ Error fetching ${endpoint}:`, error);
      return [];
    }
  }

  async fetchComprehensiveData(coin: string): Promise<ComprehensiveGlassnodeData> {
    const timeRange = this.getTimeRange(5);
    
    console.log(`🚀 Fetching comprehensive Glassnode data for ${coin.toUpperCase()}`);

    const [
      priceData,
      ohlcData,
      amerPriceChange,
      apacPriceChange,
      emeaPriceChange,
      realizedVolatility,
      netRealizedPL,
      mvrvZScore,
      priceDrawdown,
      transferVolume
    ] = await Promise.all([
      this.fetchGlassnodeEndpoint('market/price_usd_close', coin, timeRange),
      this.fetchGlassnodeEndpoint('market/price_usd_ohlc', coin, timeRange),
      this.fetchGlassnodeEndpoint('market/amer_30d_price_change', coin, timeRange),
      this.fetchGlassnodeEndpoint('market/apac_30d_price_change', coin, timeRange),
      this.fetchGlassnodeEndpoint('market/emea_30d_price_change', coin, timeRange),
      this.fetchGlassnodeEndpoint('market/realized_volatility_all', coin, timeRange),
      this.fetchGlassnodeEndpoint('indicators/net_realized_profit_loss', coin, timeRange),
      this.fetchGlassnodeEndpoint('market/mvrv_z_score', coin, timeRange),
      this.fetchGlassnodeEndpoint('market/price_drawdown_relative', coin, timeRange),
      this.fetchGlassnodeEndpoint('transactions/transfers_volume_mean', coin, timeRange)
    ]);

    return {
      priceData,
      ohlcData,
      amerPriceChange,
      apacPriceChange,
      emeaPriceChange,
      realizedVolatility,
      netRealizedPL,
      mvrvZScore,
      priceDrawdown,
      transferVolume
    };
  }

  async fetchBenchmarkData(coin: string): Promise<BenchmarkData> {
    if (coin.toLowerCase() === 'btc') {
      return this.fetchSP500Data();
    } else {
      return this.fetchBitcoinBenchmarkData();
    }
  }

  private async fetchSP500Data(): Promise<BenchmarkData> {
    const cacheKey = 'sp500_5y';
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    try {
      const { since, until } = this.getTimeRange(5);
      const url = `https://query1.finance.yahoo.com/v7/finance/download/^GSPC?period1=${since}&period2=${until}&interval=1mo&events=history&includeAdjustedClose=true`;
      
      console.log('🔍 Fetching S&P 500 benchmark data');
      const response = await axios.get(url);
      
      // Parse CSV data
      const lines = response.data.split('\n').slice(1); // Skip header
      const data = lines
        .filter((line: string) => line.trim())
        .map((line: string) => {
          const [date, , , , close] = line.split(',');
          return { date, close: parseFloat(close) };
        })
        .filter((item: any) => !isNaN(item.close));

      const cagr = this.calculateCAGR(data[0].close, data[data.length - 1].close, 5);
      const volatility = this.calculateVolatility(data.map(d => d.close));

      const benchmarkData: BenchmarkData = {
        type: 'sp500',
        data,
        cagr,
        volatility
      };

      this.setCache(cacheKey, benchmarkData);
      console.log(`✅ S&P 500 benchmark: CAGR ${cagr.toFixed(2)}%, Volatility ${volatility.toFixed(2)}%`);
      
      return benchmarkData;
    } catch (error) {
      console.error('❌ Error fetching S&P 500 data:', error);
      // Fallback data
      return {
        type: 'sp500',
        data: [],
        cagr: 8,
        volatility: 15
      };
    }
  }

  private async fetchBitcoinBenchmarkData(): Promise<BenchmarkData> {
    const cacheKey = 'btc_benchmark_5y';
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    try {
      const timeRange = this.getTimeRange(5);
      const priceData = await this.fetchGlassnodeEndpoint('market/price_usd_close', 'btc', timeRange);
      
      if (priceData.length === 0) {
        throw new Error('No Bitcoin price data available');
      }

      const data = priceData.map(point => ({
        date: new Date(point.t * 1000).toISOString().split('T')[0],
        close: point.v
      }));

      const cagr = this.calculateCAGR(data[0].close, data[data.length - 1].close, 5);
      const volatility = this.calculateVolatility(data.map(d => d.close));

      const benchmarkData: BenchmarkData = {
        type: 'bitcoin',
        data,
        cagr,
        volatility
      };

      this.setCache(cacheKey, benchmarkData);
      console.log(`✅ Bitcoin benchmark: CAGR ${cagr.toFixed(2)}%, Volatility ${volatility.toFixed(2)}%`);
      
      return benchmarkData;
    } catch (error) {
      console.error('❌ Error fetching Bitcoin benchmark data:', error);
      // Fallback data
      return {
        type: 'bitcoin',
        data: [],
        cagr: 25,
        volatility: 80
      };
    }
  }

  calculateNPV(inputs: NPVCalculationInputs, glassnodeData: ComprehensiveGlassnodeData, benchmarkData: BenchmarkData): NPVResults {
    console.log(`🧮 Starting NPV calculation for ${inputs.coinSymbol.toUpperCase()}`);

    // Calculate historical monthly changes
    const historicalMonthlyChanges = this.calculateMonthlyChanges(glassnodeData.priceData);
    
    // Calculate CAGR (price-based)
    const priceBasedCAGR = this.calculateCAGRFromPrices(glassnodeData.priceData);
    
    // Adjust CAGR with net realized P&L data
    const adjustedCagr = this.adjustCAGRWithRealizedPL(priceBasedCAGR, glassnodeData.netRealizedPL);
    
    // Calculate beta
    const cryptoVolatility = this.getLatestValue(glassnodeData.realizedVolatility) || 50;
    const beta = cryptoVolatility / benchmarkData.volatility;
    
    // Calculate market premium
    const marketPremium = benchmarkData.cagr - inputs.riskFreeRate;
    
    // Calculate base discount rate
    let discountRate = inputs.riskFreeRate + (beta * marketPremium);
    
    // Adjust discount rate with MVRV z-score
    const mvrvZScore = this.getLatestValue(glassnodeData.mvrvZScore) || 0;
    if (mvrvZScore > 7) {
      discountRate += 2; // Add 2% for overvaluation risk
      console.log(`⚠️ High MVRV Z-Score (${mvrvZScore.toFixed(2)}): Adding 2% to discount rate`);
    } else if (mvrvZScore > 3) {
      discountRate += 1; // Add 1% for moderate overvaluation
      console.log(`⚠️ Moderate MVRV Z-Score (${mvrvZScore.toFixed(2)}): Adding 1% to discount rate`);
    }
    
    // Generate projected prices
    const currentPrice = this.getLatestValue(glassnodeData.priceData) || 50000;
    const projectedPrices = this.calculateProjectedPrices(currentPrice, adjustedCagr, inputs.projectionPeriods);
    
    // Calculate cash flows
    const cashFlows = this.calculateCashFlows(
      inputs.investmentAmount,
      projectedPrices,
      currentPrice,
      inputs.stakingYield,
      inputs.coinSymbol
    );
    
    // Calculate NPV
    const npv = this.calculateNPVFromCashFlows(inputs.investmentAmount, cashFlows, discountRate / 100);
    
    // Calculate stress-tested NPV
    const maxDrawdown = Math.abs(this.getLatestValue(glassnodeData.priceDrawdown) || 0.5);
    const stressedCashFlows = cashFlows.map(cf => cf * (1 - maxDrawdown));
    const stressTestedNpv = this.calculateNPVFromCashFlows(inputs.investmentAmount, stressedCashFlows, discountRate / 100);
    
    // Check liquidity warning
    const meanVolume = this.getLatestValue(glassnodeData.transferVolume) || 0;
    const liquidityWarning = meanVolume < 1000000; // Arbitrary threshold
    
    // Calculate confidence score
    const confidenceScore = this.calculateConfidenceScore(glassnodeData, benchmarkData);

    console.log(`💰 NPV Analysis Results:`);
    console.log(`   CAGR: ${adjustedCagr.toFixed(2)}%`);
    console.log(`   Discount Rate: ${discountRate.toFixed(2)}%`);
    console.log(`   Beta: ${beta.toFixed(2)}`);
    console.log(`   NPV: $${npv.toLocaleString()}`);
    console.log(`   Stress-Tested NPV: $${stressTestedNpv.toLocaleString()}`);

    return {
      inputs,
      glassnodeData,
      benchmarkData,
      calculations: {
        historicalMonthlyChanges,
        cagr: priceBasedCAGR,
        adjustedCagr,
        projectedPrices,
        cashFlows,
        discountRate,
        beta,
        marketPremium,
        npv,
        stressTestedNpv
      },
      metadata: {
        dataFreshness: new Date().toISOString(),
        liquidityWarning,
        confidenceScore
      }
    };
  }

  // Helper methods
  private calculateMonthlyChanges(priceData: GlassnodeDataPoint[]): number[] {
    const changes: number[] = [];
    for (let i = 1; i < priceData.length; i++) {
      const change = ((priceData[i].v - priceData[i - 1].v) / priceData[i - 1].v) * 100;
      changes.push(change);
    }
    return changes;
  }

  private calculateCAGRFromPrices(priceData: GlassnodeDataPoint[]): number {
    if (priceData.length < 2) return 15; // Fallback
    
    const startPrice = priceData[0].v;
    const endPrice = priceData[priceData.length - 1].v;
    const years = (priceData[priceData.length - 1].t - priceData[0].t) / (365 * 24 * 3600);
    
    return ((Math.pow(endPrice / startPrice, 1 / years) - 1) * 100);
  }

  private adjustCAGRWithRealizedPL(priceCAGR: number, realizedPLData: GlassnodeDataPoint[]): number {
    if (realizedPLData.length === 0) return priceCAGR;
    
    // Simple adjustment: average positive/negative sentiment
    const avgRealizedPL = realizedPLData.reduce((sum, point) => sum + point.v, 0) / realizedPLData.length;
    const sentiment = avgRealizedPL > 0 ? 1.05 : 0.95; // 5% adjustment based on sentiment
    
    return priceCAGR * sentiment;
  }

  private calculateCAGR(startValue: number, endValue: number, years: number): number {
    return ((Math.pow(endValue / startValue, 1 / years) - 1) * 100);
  }

  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 15; // Fallback
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance * 12) * 100; // Annualized volatility
  }

  private calculateProjectedPrices(currentPrice: number, cagr: number, years: number): number[] {
    const prices: number[] = [];
    for (let t = 1; t <= years; t++) {
      const projectedPrice = currentPrice * Math.pow(1 + cagr / 100, t);
      prices.push(projectedPrice);
    }
    return prices;
  }

  private calculateCashFlows(
    investmentAmount: number,
    projectedPrices: number[],
    currentPrice: number,
    stakingYield: number,
    coinSymbol: string
  ): number[] {
    const baseFlow = investmentAmount * 0.2; // 20% base flow
    const stakeable = ['eth', 'ada', 'dot', 'sol', 'atom', 'avax', 'matic'].includes(coinSymbol.toLowerCase());
    
    return projectedPrices.map((price, index) => {
      let cashFlow = baseFlow * (price / currentPrice);
      
      // Add staking yield only for stakeable coins
      if (stakeable && stakingYield > 0) {
        const stakingIncome = investmentAmount * (stakingYield / 100);
        cashFlow += stakingIncome;
      }
      
      return cashFlow;
    });
  }

  private calculateNPVFromCashFlows(initialInvestment: number, cashFlows: number[], discountRate: number): number {
    let npv = -initialInvestment;
    
    for (let t = 0; t < cashFlows.length; t++) {
      npv += cashFlows[t] / Math.pow(1 + discountRate, t + 1);
    }
    
    return npv;
  }

  private calculateConfidenceScore(glassnodeData: ComprehensiveGlassnodeData, benchmarkData: BenchmarkData): number {
    let score = 50; // Base score
    
    // Data availability bonuses
    if (glassnodeData.priceData.length > 50) score += 15;
    if (glassnodeData.realizedVolatility.length > 0) score += 10;
    if (glassnodeData.mvrvZScore.length > 0) score += 10;
    if (glassnodeData.netRealizedPL.length > 0) score += 10;
    if (benchmarkData.data.length > 50) score += 5;
    
    return Math.min(100, score);
  }

  private getLatestValue(data: GlassnodeDataPoint[]): number | null {
    return data.length > 0 ? data[data.length - 1].v : null;
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    return cached && (Date.now() - cached.timestamp) < this.cacheExpiry;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Save results to Supabase
  async saveResults(results: NPVResults, userId?: string): Promise<void> {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('investment_analyses')
        .insert({
          coin_id: results.inputs.coinSymbol,
          investment_amount: results.inputs.investmentAmount,
          total_portfolio: results.inputs.investmentAmount,
          investment_horizon: results.inputs.projectionPeriods,
          npv: results.calculations.npv,
          cagr: results.calculations.adjustedCagr,
          beta: results.calculations.beta,
          recommendation: results.calculations.npv > 0 ? 'buy' : 'sell',
          conditions: `NPV Analysis using Glassnode data. Confidence: ${results.metadata.confidenceScore}%`,
          risks: results.metadata.liquidityWarning ? 'Low liquidity warning' : null
        });

      if (error) {
        console.error('Error saving NPV results:', error);
      } else {
        console.log('✅ NPV results saved to database');
      }
    } catch (error) {
      console.error('Error saving NPV results:', error);
    }
  }
}

export const comprehensiveGlassnodeService = new ComprehensiveGlassnodeService();

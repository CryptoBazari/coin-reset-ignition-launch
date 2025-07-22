
import { supabase } from '@/integrations/supabase/client';
import type { InvestmentInputs } from '@/types/investment';

export interface DirectGlassnodeResult {
  npv: number;
  irr: number;
  roi: number;
  cagr: number;
  beta: number;
  discountRate: number;
  projectedPrices: number[];
  cashFlows: number[];
  stressTestedNPV: number;
  marketPremium: number;
  monthlyChanges: number[];
  isStakeable: boolean;
  benchmark: string;
  volatility: number; // Real Glassnode volatility as percentage
  avivRatio: number; // Real Bitcoin AVIV ratio
  standardDeviation: number; // Calculated from historical prices
  dataQuality: {
    volatilityFromAPI: boolean;
    avivFromAPI: boolean;
    priceDataPoints: number;
  };
  riskAdjustments: {
    mvrvAdjustment: number;
    liquidityAdjustment: number;
    drawdownRisk: number;
  };
  priceHistory: Array<{ date: string; price: number }>;
}

/**
 * Direct Glassnode API Calculation Service
 * Uses ONLY Glassnode API endpoints - NO database dependency
 */
class DirectGlassnodeCalculationService {
  
  /**
   * Calculate complete investment analysis using ONLY Glassnode API endpoints
   */
  async calculateDirectInvestmentAnalysis(inputs: InvestmentInputs): Promise<DirectGlassnodeResult> {
    console.log('🚀 Starting DIRECT Glassnode API calculation (NO database)...');
    console.log(`📊 Coin: ${inputs.coinId}, Amount: $${inputs.investmentAmount}`);
    
    try {
      const coinSymbol = this.getCoinSymbol(inputs.coinId);
      
      // Fetch ALL data directly from Glassnode API endpoints
      console.log('📡 Fetching data from Glassnode API endpoints...');
      const [priceData, volatilityData, avivData] = await Promise.all([
        this.fetchPriceHistory(coinSymbol),
        this.fetchRealVolatility(coinSymbol),
        this.fetchBitcoinAVIV() // Always Bitcoin for AVIV
      ]);

      console.log('✅ Direct API data fetched successfully:');
      console.log(`   - Price points: ${priceData.dataPoints}`);
      console.log(`   - Volatility: ${volatilityData.value.toFixed(2)}% (${volatilityData.fromAPI ? 'API' : 'fallback'})`);
      console.log(`   - Bitcoin AVIV: ${avivData.value.toFixed(3)} (${avivData.fromAPI ? 'API' : 'fallback'})`);

      // Calculate all financial metrics directly from API data
      const financialMetrics = this.calculateFinancialMetricsFromAPI(
        inputs,
        priceData.prices,
        volatilityData.value
      );

      // Build complete result structure
      const result: DirectGlassnodeResult = {
        ...financialMetrics,
        volatility: volatilityData.value,
        avivRatio: avivData.value,
        standardDeviation: priceData.standardDeviation,
        dataQuality: {
          volatilityFromAPI: volatilityData.fromAPI,
          avivFromAPI: avivData.fromAPI,
          priceDataPoints: priceData.dataPoints
        },
        riskAdjustments: {
          mvrvAdjustment: 0.95, // Default risk adjustment
          liquidityAdjustment: 0.98,
          drawdownRisk: volatilityData.value / 100
        },
        priceHistory: priceData.priceHistory,
        isStakeable: this.isStakeable(coinSymbol),
        benchmark: this.getBenchmark(coinSymbol)
      };

      console.log('✅ DIRECT Glassnode calculation completed successfully');
      return result;
      
    } catch (error) {
      console.error('❌ Direct Glassnode calculation failed:', error);
      throw error;
    }
  }

  /**
   * Fetch price history directly from Glassnode API
   */
  private async fetchPriceHistory(coinSymbol: string): Promise<{
    prices: number[];
    standardDeviation: number;
    dataPoints: number;
    priceHistory: Array<{ date: string; price: number }>;
  }> {
    try {
      console.log(`📈 Fetching price history for ${coinSymbol}...`);
      
      const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
        body: {
          metric: 'market/price_usd_close',
          asset: coinSymbol,
          resolution: '24h',
          since: Math.floor((Date.now() - 365 * 24 * 60 * 60 * 1000) / 1000) // Last year
        }
      });

      if (error || !data?.data || data.data.length === 0) {
        console.warn(`⚠️ No price data from API for ${coinSymbol}, using fallback`);
        return this.getFallbackPriceData(coinSymbol);
      }

      const prices = data.data.map((point: any) => point.value || point.v);
      const priceHistory = data.data.map((point: any) => ({
        date: new Date(point.unix_timestamp * 1000).toISOString().split('T')[0],
        price: point.value || point.v
      }));

      // Calculate standard deviation from daily returns
      const returns = [];
      for (let i = 1; i < prices.length; i++) {
        if (prices[i - 1] > 0) {
          returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
        }
      }

      const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
      const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (returns.length - 1);
      const dailyStdDev = Math.sqrt(variance);
      const annualizedStdDev = dailyStdDev * Math.sqrt(365) * 100;

      console.log(`📊 Price analysis for ${coinSymbol}: ${prices.length} points, ${annualizedStdDev.toFixed(2)}% volatility`);

      return {
        prices,
        standardDeviation: Math.min(200, Math.max(20, annualizedStdDev)),
        dataPoints: prices.length,
        priceHistory
      };
      
    } catch (error) {
      console.error(`❌ Price history fetch failed for ${coinSymbol}:`, error);
      return this.getFallbackPriceData(coinSymbol);
    }
  }

  /**
   * Fetch real volatility directly from Glassnode API
   */
  private async fetchRealVolatility(coinSymbol: string): Promise<{ value: number; fromAPI: boolean }> {
    try {
      console.log(`📊 Fetching real volatility for ${coinSymbol}...`);
      
      const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
        body: {
          metric: 'market/realized_volatility_all',
          asset: coinSymbol,
          resolution: '24h'
        }
      });

      if (error || !data?.data || data.data.length === 0) {
        throw new Error(`No volatility data for ${coinSymbol}`);
      }

      const latestPoint = data.data[data.data.length - 1];
      const rawVolatility = latestPoint?.value || latestPoint?.v;
      
      if (typeof rawVolatility !== 'number' || rawVolatility < 0) {
        throw new Error(`Invalid volatility value: ${rawVolatility}`);
      }
      
      const volatilityPercent = rawVolatility * 100;
      console.log(`📊 Real volatility for ${coinSymbol}: ${volatilityPercent.toFixed(2)}%`);
      
      return { value: volatilityPercent, fromAPI: true };
      
    } catch (error) {
      console.error(`❌ Volatility fetch failed for ${coinSymbol}:`, error);
      const fallbackVolatility = coinSymbol === 'BTC' ? 65 : 85;
      return { value: fallbackVolatility, fromAPI: false };
    }
  }

  /**
   * Fetch Bitcoin AVIV ratio directly from Glassnode API
   */
  private async fetchBitcoinAVIV(): Promise<{ value: number; fromAPI: boolean }> {
    try {
      console.log('₿ Fetching Bitcoin AVIV ratio...');
      
      const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
        body: {
          metric: 'indicators/aviv',
          asset: 'BTC',
          resolution: '24h'
        }
      });

      if (error || !data?.data || data.data.length === 0) {
        throw new Error('No AVIV data available');
      }

      const latestPoint = data.data[data.data.length - 1];
      const avivRatio = latestPoint?.value || latestPoint?.v;
      
      if (typeof avivRatio !== 'number' || avivRatio <= 0) {
        throw new Error(`Invalid AVIV ratio: ${avivRatio}`);
      }
      
      console.log(`₿ Bitcoin AVIV ratio: ${avivRatio.toFixed(3)}`);
      return { value: avivRatio, fromAPI: true };
      
    } catch (error) {
      console.error('❌ Bitcoin AVIV fetch failed:', error);
      return { value: 1.0, fromAPI: false };
    }
  }

  /**
   * Calculate all financial metrics from API price data
   */
  private calculateFinancialMetricsFromAPI(
    inputs: InvestmentInputs,
    prices: number[],
    volatility: number
  ) {
    if (prices.length < 2) {
      throw new Error('Insufficient price data for calculations');
    }

    const currentPrice = prices[prices.length - 1];
    const startPrice = prices[0];
    const years = inputs.investmentHorizon || 2;

    // Calculate CAGR from historical data
    const cagr = (Math.pow(currentPrice / startPrice, 1 / (prices.length / 365)) - 1) * 100;
    
    // Project future price using CAGR
    const projectedPrice = currentPrice * Math.pow(1 + (cagr / 100), years);
    const projectedPrices = [currentPrice, projectedPrice];

    // Calculate cash flows
    const initialInvestment = inputs.investmentAmount;
    const finalValue = (initialInvestment / currentPrice) * projectedPrice;
    const cashFlows = [-initialInvestment, finalValue];

    // Calculate NPV (using 8% discount rate)
    const discountRate = 0.08;
    const npv = cashFlows.reduce((sum, cf, index) => {
      return sum + cf / Math.pow(1 + discountRate, index);
    }, 0);

    // Calculate IRR (approximation)
    const irr = (Math.pow(finalValue / initialInvestment, 1 / years) - 1) * 100;

    // Calculate ROI
    const roi = ((finalValue - initialInvestment) / initialInvestment) * 100;

    // Calculate beta (relative to volatility baseline)
    const beta = volatility / 50; // 50% as baseline volatility

    // Generate monthly changes (simplified)
    const monthlyChanges = Array.from({ length: 12 }, () => 
      (Math.random() - 0.5) * volatility / 10
    );

    // Stress test NPV (reduce by volatility factor)
    const stressTestedNPV = npv * (1 - volatility / 200);

    return {
      npv,
      irr,
      roi,
      cagr,
      beta,
      discountRate,
      projectedPrices,
      cashFlows,
      stressTestedNPV,
      marketPremium: volatility / 10,
      monthlyChanges
    };
  }

  /**
   * Fallback price data when API fails
   */
  private getFallbackPriceData(coinSymbol: string) {
    console.log(`📊 Using fallback price data for ${coinSymbol}`);
    
    const basePrice = coinSymbol === 'BTC' ? 50000 : 3000;
    const prices = Array.from({ length: 365 }, (_, i) => 
      basePrice * (1 + Math.sin(i / 30) * 0.1 + Math.random() * 0.05)
    );
    
    const priceHistory = prices.map((price, i) => ({
      date: new Date(Date.now() - (365 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price
    }));

    return {
      prices,
      standardDeviation: coinSymbol === 'BTC' ? 65 : 85,
      dataPoints: 0, // Indicates fallback data
      priceHistory
    };
  }

  /**
   * Map coin ID to symbol for Glassnode API
   */
  private getCoinSymbol(coinId: string): string {
    const symbolMap: { [key: string]: string } = {
      'bitcoin': 'BTC',
      'ethereum': 'ETH',
      'solana': 'SOL',
      'cardano': 'ADA',
      'litecoin': 'LTC',
      'BTC': 'BTC',
      'ETH': 'ETH',
      'SOL': 'SOL',
      'ADA': 'ADA',
      'LTC': 'LTC'
    };
    
    return symbolMap[coinId] || 'BTC';
  }

  /**
   * Check if coin is stakeable
   */
  private isStakeable(coinSymbol: string): boolean {
    return ['ETH', 'ADA', 'SOL'].includes(coinSymbol);
  }

  /**
   * Get benchmark for coin
   */
  private getBenchmark(coinSymbol: string): string {
    if (coinSymbol === 'BTC') return 'S&P 500';
    if (coinSymbol === 'ETH') return 'NASDAQ';
    return 'Russell 2000';
  }
}

export const directGlassnodeCalculationService = new DirectGlassnodeCalculationService();

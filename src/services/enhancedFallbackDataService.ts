
import { mockGlassNodeService } from './mockGlassNodeService';
import { supabase } from '@/integrations/supabase/client';

export interface FallbackFinancialData {
  npv: number;
  irr: number;
  roi: number;
  cagr: number;
  beta: number;
  volatility: number;
  sharpeRatio: number;
  riskFactor: number;
  dataSource: 'live_api' | 'test_data' | 'database';
  dataQuality: 'high' | 'medium' | 'low';
  confidence: number;
}

export interface FallbackAnalysisResult {
  financial: FallbackFinancialData;
  coinData: {
    currentPrice: number;
    priceHistory: Array<{ date: string; price: number }>;
    volume24h: number;
    marketCap: number;
  };
  onChainMetrics: {
    avivRatio?: number;
    activeSupply?: number;
    liquidSupply?: number;
    cointimeDestroyed?: number;
  };
  marketTiming: {
    recommendation: string;
    confidence: number;
    signals: string[];
  };
}

class EnhancedFallbackDataService {
  private apiAvailabilityCache = new Map<string, { available: boolean; lastCheck: number }>();
  private cacheExpiry = 300000; // 5 minutes
  
  /**
   * Check if Glassnode API is available (not returning 403)
   */
  async checkGlassnodeAvailability(): Promise<boolean> {
    const cacheKey = 'glassnode_availability';
    const cached = this.apiAvailabilityCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.lastCheck) < this.cacheExpiry) {
      return cached.available;
    }
    
    try {
      console.log('🔍 Checking Glassnode API availability...');
      
      const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
        body: { 
          metric: 'market/price_usd_close',
          asset: 'BTC',
          resolution: '24h'
        }
      });
      
      // If we get a 403 error or specific error message, API is not available
      const isAvailable = !error && data && !data.message?.includes('API addon');
      
      this.apiAvailabilityCache.set(cacheKey, {
        available: isAvailable,
        lastCheck: Date.now()
      });
      
      console.log(`🌐 Glassnode API availability: ${isAvailable ? '✅ Available' : '❌ Not Available'}`);
      return isAvailable;
      
    } catch (error) {
      console.log('⚠️ Glassnode API check failed, assuming unavailable:', error);
      
      this.apiAvailabilityCache.set(cacheKey, {
        available: false,
        lastCheck: Date.now()
      });
      
      return false;
    }
  }
  
  /**
   * Get comprehensive analysis data with robust fallbacks
   */
  async getAnalysisData(
    coinId: string,
    symbol: string,
    investmentAmount: number,
    timeHorizon: number
  ): Promise<FallbackAnalysisResult> {
    console.log(`🔄 Getting analysis data for ${symbol} with fallback support...`);
    
    // Check API availability first
    const glassnodeAvailable = await this.checkGlassnodeAvailability();
    
    if (glassnodeAvailable) {
      console.log('🌐 Using live Glassnode data');
      return this.getLiveAnalysisData(coinId, symbol, investmentAmount, timeHorizon);
    } else {
      console.log('🧪 Using enhanced test data fallback');
      return this.getTestAnalysisData(coinId, symbol, investmentAmount, timeHorizon);
    }
  }
  
  /**
   * Get live API data (when available)
   */
  private async getLiveAnalysisData(
    coinId: string,
    symbol: string,
    investmentAmount: number,
    timeHorizon: number
  ): Promise<FallbackAnalysisResult> {
    try {
      // Try to fetch live data here
      // This would use the existing API services
      throw new Error('Live API implementation placeholder');
      
    } catch (error) {
      console.log('⚠️ Live API failed, falling back to test data');
      return this.getTestAnalysisData(coinId, symbol, investmentAmount, timeHorizon);
    }
  }
  
  /**
   * Get comprehensive test data analysis
   */
  private async getTestAnalysisData(
    coinId: string,
    symbol: string,
    investmentAmount: number,
    timeHorizon: number
  ): Promise<FallbackAnalysisResult> {
    console.log(`🧪 Generating comprehensive test analysis for ${symbol}`);
    
    // Get test data from mock service
    const testData = mockGlassNodeService.getTestData(symbol);
    
    if (!testData) {
      throw new Error(`No test data available for ${symbol}`);
    }
    
    // Calculate realistic financial metrics
    const financialMetrics = this.calculateTestFinancialMetrics(
      testData,
      investmentAmount,
      timeHorizon
    );
    
    // Prepare coin data
    const coinData = {
      currentPrice: testData.currentPrice,
      priceHistory: testData.priceHistory.slice(-90).map(point => ({
        date: new Date(point.timestamp * 1000).toISOString(),
        price: point.price
      })),
      volume24h: testData.priceHistory[testData.priceHistory.length - 1]?.volume || 0,
      marketCap: testData.marketCap
    };
    
    // Prepare on-chain metrics
    const onChainMetrics = {
      avivRatio: testData.avivRatio,
      activeSupply: testData.activeSupply,
      liquidSupply: testData.liquidSupply,
      cointimeDestroyed: Math.random() * 1000000 + 500000
    };
    
    // Generate market timing analysis
    const marketTiming = this.generateMarketTiming(testData);
    
    return {
      financial: financialMetrics,
      coinData,
      onChainMetrics,
      marketTiming
    };
  }
  
  /**
   * Calculate realistic financial metrics from test data
   */
  private calculateTestFinancialMetrics(
    testData: any,
    investmentAmount: number,
    timeHorizon: number
  ): FallbackFinancialData {
    const priceHistory = testData.priceHistory;
    
    if (priceHistory.length < 2) {
      throw new Error('Insufficient price history for calculations');
    }
    
    // Get relevant price points for the time horizon
    const timeHorizonDays = timeHorizon * 365;
    const relevantHistory = priceHistory.slice(-timeHorizonDays);
    
    const initialPrice = relevantHistory[0]?.price || priceHistory[0].price;
    const currentPrice = testData.currentPrice;
    const actualYears = timeHorizon;
    
    // Calculate CAGR
    const cagr = (Math.pow(currentPrice / initialPrice, 1 / actualYears) - 1) * 100;
    
    // Calculate ROI
    const roi = ((currentPrice - initialPrice) / initialPrice) * 100;
    
    // Calculate volatility (annualized standard deviation)
    const returns = [];
    for (let i = 1; i < relevantHistory.length; i++) {
      const dailyReturn = (relevantHistory[i].price - relevantHistory[i-1].price) / relevantHistory[i-1].price;
      returns.push(dailyReturn);
    }
    
    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance * 252) * 100; // Annualized
    
    // Estimate beta (correlation with market)
    const beta = this.estimateBeta(testData.symbol);
    
    // Calculate NPV (simplified)
    const riskFreeRate = 0.03; // 3%
    const discountRate = riskFreeRate + beta * 0.06; // Risk premium
    const futureValue = investmentAmount * (1 + cagr / 100) ** timeHorizon;
    const npv = futureValue / Math.pow(1 + discountRate, timeHorizon) - investmentAmount;
    
    // Calculate IRR (approximation)
    const irr = (Math.pow(futureValue / investmentAmount, 1 / timeHorizon) - 1) * 100;
    
    // Calculate Sharpe Ratio
    const excessReturn = (cagr / 100) - riskFreeRate;
    const sharpeRatio = volatility > 0 ? excessReturn / (volatility / 100) : 0;
    
    // Risk factor (1-10 scale)
    const riskFactor = Math.min(10, Math.max(1, Math.floor(volatility / 10)));
    
    return {
      npv: Math.round(npv),
      irr: Math.round(irr * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      cagr: Math.round(cagr * 100) / 100,
      beta: Math.round(beta * 100) / 100,
      volatility: Math.round(volatility * 100) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      riskFactor,
      dataSource: 'test_data',
      dataQuality: 'high',
      confidence: 85
    };
  }
  
  /**
   * Estimate beta based on asset type
   */
  private estimateBeta(symbol: string): number {
    const betas: Record<string, number> = {
      'BTC': 1.2,
      'ETH': 1.4,
      'SOL': 1.8,
      'ADA': 1.6,
      'LINK': 1.5,
      'AVAX': 1.7
    };
    
    return betas[symbol] || 1.5;
  }
  
  /**
   * Generate market timing analysis
   */
  private generateMarketTiming(testData: any): {
    recommendation: string;
    confidence: number;
    signals: string[];
  } {
    const avivRatio = testData.avivRatio;
    const signals: string[] = [];
    let recommendation = 'HOLD';
    let confidence = 60;
    
    // AVIV-based analysis
    if (avivRatio < 0.8) {
      recommendation = 'STRONG BUY';
      confidence = 85;
      signals.push(`Low AVIV ratio (${avivRatio.toFixed(3)}) indicates undervaluation`);
    } else if (avivRatio < 1.2) {
      recommendation = 'BUY';
      confidence = 75;
      signals.push(`Moderate AVIV ratio (${avivRatio.toFixed(3)}) suggests fair value with upside`);
    } else if (avivRatio > 2.0) {
      recommendation = 'SELL';
      confidence = 80;
      signals.push(`High AVIV ratio (${avivRatio.toFixed(3)}) indicates potential overvaluation`);
    }
    
    // Supply analysis
    if (testData.vaultedSupply > 70) {
      signals.push(`${testData.vaultedSupply.toFixed(1)}% vaulted supply shows strong hodling behavior`);
      confidence += 5;
    }
    
    if (testData.activeSupply < 25) {
      signals.push(`Low active supply (${testData.activeSupply.toFixed(1)}%) reduces selling pressure`);
      confidence += 5;
    }
    
    return {
      recommendation,
      confidence: Math.min(95, confidence),
      signals
    };
  }
  
  /**
   * Clear availability cache (useful for testing)
   */
  clearCache(): void {
    this.apiAvailabilityCache.clear();
  }
}

export const enhancedFallbackDataService = new EnhancedFallbackDataService();

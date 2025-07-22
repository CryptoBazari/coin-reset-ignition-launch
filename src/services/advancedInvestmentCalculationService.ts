
import { supabase } from '@/integrations/supabase/client';
import { realDataCalculationService, RealDataCalculationResult } from './realDataCalculationService';
import { bitcoinGlassNodeService } from './bitcoinGlassNodeService';
import { enhancedGlassnodeService } from './enhancedGlassnodeService';
import type { InvestmentInputs } from '@/types/investment';

interface EnhancedInvestmentResult extends RealDataCalculationResult {
  volatility: number; // Real Glassnode volatility as percentage
  avivRatio: number; // Real Bitcoin AVIV ratio
  standardDeviation: number; // Calculated from historical prices
  dataQuality: {
    volatilityFromAPI: boolean;
    avivFromAPI: boolean;
    priceDataPoints: number;
  };
}

/**
 * Advanced Investment Calculation Service
 * Uses real Glassnode API data for volatility and AVIV calculations
 */
class AdvancedInvestmentCalculationService {
  
  /**
   * Calculate investment analysis with real Glassnode volatility and AVIV data
   */
  async calculateAdvancedInvestmentAnalysis(inputs: InvestmentInputs): Promise<EnhancedInvestmentResult> {
    console.log('🔄 Starting ADVANCED investment analysis with REAL Glassnode data...');
    console.log(`📊 Coin: ${inputs.coinId}, Amount: $${inputs.investmentAmount}`);
    
    try {
      // Get the base real data calculation
      const realResult = await realDataCalculationService.calculateRealInvestmentAnalysis(
        inputs.coinId,
        inputs.investmentAmount,
        inputs.investmentHorizon
      );

      // Get real Bitcoin AVIV ratio
      console.log('📊 Fetching REAL Bitcoin AVIV ratio from Glassnode API...');
      const bitcoinData = await bitcoinGlassNodeService.getBitcoinRealData();
      
      // Get real volatility for the selected coin
      console.log(`📊 Fetching REAL volatility for ${inputs.coinId} from Glassnode API...`);
      const coinSymbol = this.getCoinSymbol(inputs.coinId);
      const realVolatilityResult = await this.fetchRealVolatilityFromGlassnode(coinSymbol);
      
      // Get historical prices and calculate standard deviation
      console.log(`📊 Calculating standard deviation from historical prices for ${coinSymbol}...`);
      const standardDeviationResult = await this.calculateStandardDeviationFromPrices(coinSymbol);

      // Log the real data being used
      console.log('✅ REAL Glassnode Data Retrieved:');
      console.log(`   - Bitcoin AVIV Ratio: ${bitcoinData.avivRatio.toFixed(3)} (${bitcoinData.dataQuality.avivFromAPI ? 'REAL API' : 'FALLBACK'})`);
      console.log(`   - ${coinSymbol} Volatility: ${realVolatilityResult.value.toFixed(2)}% (${realVolatilityResult.fromAPI ? 'REAL API' : 'FALLBACK'})`);
      console.log(`   - ${coinSymbol} Std Dev: ${standardDeviationResult.value.toFixed(2)}% (${standardDeviationResult.dataPoints} price points)`);

      const enhancedResult: EnhancedInvestmentResult = {
        ...realResult,
        volatility: realVolatilityResult.value, // Real Glassnode volatility as percentage
        avivRatio: bitcoinData.avivRatio, // Real Bitcoin AVIV ratio
        standardDeviation: standardDeviationResult.value, // Calculated from real prices
        dataQuality: {
          volatilityFromAPI: realVolatilityResult.fromAPI,
          avivFromAPI: bitcoinData.dataQuality.avivFromAPI,
          priceDataPoints: standardDeviationResult.dataPoints
        }
      };

      console.log('✅ ADVANCED investment analysis completed with real Glassnode data');
      return enhancedResult;
      
    } catch (error) {
      console.error('❌ Advanced investment calculation failed:', error);
      throw error;
    }
  }

  /**
   * Fetch real volatility from Glassnode API for the selected coin
   */
  private async fetchRealVolatilityFromGlassnode(coinSymbol: string): Promise<{ value: number; fromAPI: boolean }> {
    try {
      console.log(`🔍 Fetching REAL volatility from Glassnode API for ${coinSymbol}...`);
      
      const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
        body: {
          metric: 'market/realized_volatility_all',
          asset: coinSymbol,
          resolution: '24h'
        }
      });

      if (error) {
        console.error(`❌ Glassnode API error for ${coinSymbol}:`, error);
        throw error;
      }

      if (!data?.data || data.data.length === 0) {
        console.warn(`⚠️ No volatility data from Glassnode for ${coinSymbol}`);
        throw new Error(`No volatility data available for ${coinSymbol}`);
      }

      const latestPoint = data.data[data.data.length - 1];
      const rawVolatility = latestPoint?.value || latestPoint?.v;
      
      if (typeof rawVolatility !== 'number' || rawVolatility < 0) {
        throw new Error(`Invalid volatility value: ${rawVolatility}`);
      }
      
      // Convert to percentage (Glassnode returns as decimal)
      const volatilityPercent = rawVolatility * 100;
      
      console.log(`📊 REAL ${coinSymbol} Volatility from Glassnode:`);
      console.log(`   - Raw API value: ${rawVolatility.toFixed(4)}`);
      console.log(`   - As percentage: ${volatilityPercent.toFixed(2)}%`);
      console.log(`   - Data points: ${data.data.length}`);
      
      return { value: volatilityPercent, fromAPI: true };
      
    } catch (error) {
      console.error(`❌ Failed to fetch real volatility for ${coinSymbol}:`, error);
      
      // Return reasonable fallback
      const fallbackVolatility = coinSymbol === 'BTC' ? 65 : 85;
      console.log(`📊 Using fallback volatility for ${coinSymbol}: ${fallbackVolatility}%`);
      
      return { value: fallbackVolatility, fromAPI: false };
    }
  }

  /**
   * Calculate standard deviation from historical prices using Glassnode price_usd_close endpoint
   */
  private async calculateStandardDeviationFromPrices(coinSymbol: string): Promise<{ value: number; dataPoints: number }> {
    try {
      console.log(`🔍 Fetching historical prices for ${coinSymbol} to calculate standard deviation...`);
      
      const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
        body: {
          metric: 'market/price_usd_close',
          asset: coinSymbol,
          resolution: '24h',
          // Get last 30 days of data
          since: Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)
        }
      });

      if (error || !data?.data || data.data.length < 2) {
        console.warn(`⚠️ Insufficient price data for ${coinSymbol}, using fallback calculation`);
        return { value: coinSymbol === 'BTC' ? 65 : 85, dataPoints: 0 };
      }

      const prices = data.data.map((point: any) => point.value || point.v);
      
      // Calculate daily returns
      const returns = [];
      for (let i = 1; i < prices.length; i++) {
        if (prices[i - 1] > 0) {
          returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
        }
      }

      if (returns.length < 2) {
        return { value: coinSymbol === 'BTC' ? 65 : 85, dataPoints: 0 };
      }

      // Calculate standard deviation
      const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
      const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (returns.length - 1);
      const dailyStdDev = Math.sqrt(variance);
      
      // Annualize (sqrt of 365 for daily data)
      const annualizedStdDev = dailyStdDev * Math.sqrt(365) * 100;
      
      console.log(`📊 Calculated Standard Deviation for ${coinSymbol}:`);
      console.log(`   - Price data points: ${prices.length}`);
      console.log(`   - Return data points: ${returns.length}`);
      console.log(`   - Daily std dev: ${(dailyStdDev * 100).toFixed(4)}%`);
      console.log(`   - Annualized std dev: ${annualizedStdDev.toFixed(2)}%`);
      
      return { 
        value: Math.min(200, Math.max(20, annualizedStdDev)), // Reasonable bounds
        dataPoints: prices.length 
      };
      
    } catch (error) {
      console.error(`❌ Failed to calculate standard deviation for ${coinSymbol}:`, error);
      return { value: coinSymbol === 'BTC' ? 65 : 85, dataPoints: 0 };
    }
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
}

export const advancedInvestmentCalculationService = new AdvancedInvestmentCalculationService();
export type { EnhancedInvestmentResult };

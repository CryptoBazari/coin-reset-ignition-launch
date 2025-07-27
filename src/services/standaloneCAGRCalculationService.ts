import { supabase } from '@/integrations/supabase/client';

export interface StandaloneCAGRResult {
  basic: number;
  adjusted: number;
  startPrice: number;
  endPrice: number;
  daysHeld: number;
  volatility90d: number;
  liquidityStatus: 'liquid' | 'moderate' | 'illiquid';
  dataPoints: number;
  dataSource: string;
  confidence: 'high' | 'medium' | 'low';
  calculationSteps: {
    step1_initialValue: number;
    step2_finalValue: number;
    step3_timeperiodYears: number;
    step4_growthRatio: number;
    step5_exponent: number;
    step6_cagrBase: number;
    step7_finalCAGR: number;
    step8_adjustedCAGR: number;
  };
  timeperiodYears: number;
  // Additional fields for backward compatibility
  cagr: number; // Maps to adjusted CAGR
  initialValue: number; // Maps to startPrice  
  finalValue: number; // Maps to endPrice
}

export class StandaloneCAGRCalculationService {
  
  async calculateStandaloneCAGR(
    coinId: string, 
    symbol: string, 
    yearsBack: number = 3
  ): Promise<StandaloneCAGRResult> {
    console.log(`🚀 Starting standalone CAGR calculation for ${symbol} (${coinId}), ${yearsBack} years back`);
    
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - yearsBack * 365.25 * 24 * 60 * 60 * 1000);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      console.log(`📅 Date range: ${startDateStr} to ${endDateStr}`);
      
      // Map coin symbol for Glassnode compatibility
      const glassnodeAsset = this.mapCoinToGlassnodeAsset(symbol);
      
      // Call the edge function with enhanced error handling
      const { data, error } = await supabase.functions.invoke('calculate-standalone-cagr', {
        body: {
          asset: glassnodeAsset,
          startDate: startDateStr,
          endDate: endDateStr
        }
      });
      
      if (error) {
        console.error('❌ Edge function error:', error);
        
        // Return graceful fallback instead of throwing
        return this.createFallbackResult(symbol, startDateStr, endDateStr, yearsBack, error.message);
      }
      
      if (!data) {
        console.warn('⚠️ No data returned from CAGR calculation, using fallback');
        return this.createFallbackResult(symbol, startDateStr, endDateStr, yearsBack, 'No data returned');
      }
      
      // Validate the returned data
      if (isNaN(data.basic) || isNaN(data.adjusted)) {
        console.warn('⚠️ Invalid CAGR values returned, using fallback');
        return this.createFallbackResult(symbol, startDateStr, endDateStr, yearsBack, 'Invalid calculation results');
      }
      
      console.log(`✅ Standalone CAGR calculation completed for ${symbol}:`);
      console.log(`   Basic CAGR: ${data.basic?.toFixed?.(2) || 'N/A'}%`);
      console.log(`   Adjusted CAGR: ${data.adjusted?.toFixed?.(2) || 'N/A'}%`);
      console.log(`   Liquidity: ${data.liquidityStatus || 'unknown'}`);
      console.log(`   Confidence: ${data.confidence || 'unknown'}`);
      console.log(`   Data Points: ${data.dataPoints || 0}`);
      
      // Transform result to include backward compatibility fields
      const result: StandaloneCAGRResult = {
        ...data,
        // Backward compatibility mappings
        cagr: data.adjusted || data.basic || 0, // Use adjusted CAGR as the main CAGR value, fallback to basic
        initialValue: data.startPrice || 0,
        finalValue: data.endPrice || 0
      };
      
      return result;
      
    } catch (error) {
      console.error(`❌ Standalone CAGR calculation failed for ${symbol}:`, error);
      
      // Return graceful fallback instead of throwing
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.createFallbackResult(symbol, '', '', yearsBack, errorMessage);
    }
  }
  
  // Enhanced fallback method for graceful degradation
  private createFallbackResult(
    symbol: string, 
    startDate: string, 
    endDate: string, 
    yearsBack: number, 
    errorMessage: string
  ): StandaloneCAGRResult {
    console.log(`🔄 Creating fallback CAGR result for ${symbol} due to: ${errorMessage}`);
    
    // Conservative fallback estimates based on historical crypto averages
    const estimatedCAGR = this.getHistoricalAverageCAGR(symbol);
    
    return {
      basic: estimatedCAGR,
      adjusted: estimatedCAGR * 0.8, // Slightly lower adjusted CAGR
      startPrice: 100, // Placeholder values
      endPrice: 100 * Math.pow(1 + estimatedCAGR / 100, yearsBack),
      daysHeld: Math.floor(yearsBack * 365.25),
      volatility90d: this.getEstimatedVolatility(symbol),
      liquidityStatus: this.getEstimatedLiquidity(symbol),
      dataPoints: 0,
      dataSource: 'fallback',
      confidence: 'low',
      calculationSteps: {
        step1_initialValue: 100,
        step2_finalValue: 100 * Math.pow(1 + estimatedCAGR / 100, yearsBack),
        step3_timeperiodYears: yearsBack,
        step4_growthRatio: Math.pow(1 + estimatedCAGR / 100, yearsBack),
        step5_exponent: 1 / yearsBack,
        step6_cagrBase: 1 + estimatedCAGR / 100,
        step7_finalCAGR: estimatedCAGR,
        step8_adjustedCAGR: estimatedCAGR * 0.8
      },
      timeperiodYears: yearsBack,
      // Backward compatibility
      cagr: estimatedCAGR,
      initialValue: 100,
      finalValue: 100 * Math.pow(1 + estimatedCAGR / 100, yearsBack)
    };
  }
  
  private getHistoricalAverageCAGR(symbol: string): number {
    const averages: Record<string, number> = {
      'BTC': 45, 'BITCOIN': 45,
      'ETH': 35, 'ETHEREUM': 35,
      'LTC': 15, 'LITECOIN': 15,
      'BCH': 10,
      'XRP': 5,
      'ADA': 20, 'CARDANO': 20,
      'DOT': 25, 'POLKADOT': 25,
      'LINK': 30, 'CHAINLINK': 30,
      'UNI': 40, 'UNISWAP': 40,
      'SOL': 50, 'SOLANA': 50,
      'AVAX': 30, 'AVALANCHE': 30,
      'MATIC': 25, 'POLYGON': 25
    };
    
    return averages[symbol.toUpperCase()] || 20; // Default 20% for unknown assets
  }
  
  private getEstimatedVolatility(symbol: string): number {
    const volatilities: Record<string, number> = {
      'BTC': 0.75, 'BITCOIN': 0.75,
      'ETH': 0.85, 'ETHEREUM': 0.85,
      'LTC': 0.90, 'LITECOIN': 0.90
    };
    
    return volatilities[symbol.toUpperCase()] || 1.0; // Default higher volatility for unknown assets
  }
  
  private getEstimatedLiquidity(symbol: string): 'liquid' | 'moderate' | 'illiquid' {
    const majorAssets = ['BTC', 'BITCOIN', 'ETH', 'ETHEREUM', 'LTC', 'LITECOIN'];
    const moderateAssets = ['BCH', 'XRP', 'ADA', 'CARDANO', 'DOT', 'POLKADOT', 'LINK', 'CHAINLINK'];
    
    if (majorAssets.includes(symbol.toUpperCase())) return 'liquid';
    if (moderateAssets.includes(symbol.toUpperCase())) return 'moderate';
    return 'illiquid';
  }
  
  private mapCoinToGlassnodeAsset(symbol: string): string {
    const mapping: Record<string, string> = {
      'BTC': 'btc',
      'BITCOIN': 'btc',
      'ETH': 'eth',
      'ETHEREUM': 'eth',
      'LTC': 'ltc',
      'LITECOIN': 'ltc',
      'BCH': 'bch',
      'XRP': 'xrp',
      'ADA': 'ada',
      'CARDANO': 'ada',
      'DOT': 'dot',
      'POLKADOT': 'dot',
      'LINK': 'link',
      'CHAINLINK': 'link',
      'UNI': 'uni',
      'UNISWAP': 'uni',
      'SOL': 'sol',
      'SOLANA': 'sol',
      'AVAX': 'avax',
      'AVALANCHE': 'avax',
      'MATIC': 'matic',
      'POLYGON': 'matic'
    };
    
    const upperSymbol = symbol.toUpperCase();
    return mapping[upperSymbol] || symbol.toLowerCase();
  }
}

export const standaloneCAGRCalculationService = new StandaloneCAGRCalculationService();
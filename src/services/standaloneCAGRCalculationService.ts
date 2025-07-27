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
      
      // Call the edge function
      const { data, error } = await supabase.functions.invoke('calculate-standalone-cagr', {
        body: {
          asset: glassnodeAsset,
          startDate: startDateStr,
          endDate: endDateStr
        }
      });
      
      if (error) {
        console.error('❌ Edge function error:', error);
        throw new Error(`CAGR calculation failed: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('No data returned from CAGR calculation');
      }
      
      console.log(`✅ Standalone CAGR calculation completed for ${symbol}:`);
      console.log(`   Basic CAGR: ${data.basic.toFixed(2)}%`);
      console.log(`   Adjusted CAGR: ${data.adjusted.toFixed(2)}%`);
      console.log(`   Liquidity: ${data.liquidityStatus}`);
      console.log(`   Confidence: ${data.confidence}`);
      console.log(`   Data Points: ${data.dataPoints}`);
      
      // Transform result to include backward compatibility fields
      const result: StandaloneCAGRResult = {
        ...data,
        // Backward compatibility mappings
        cagr: data.adjusted, // Use adjusted CAGR as the main CAGR value
        initialValue: data.startPrice,
        finalValue: data.endPrice
      };
      
      return result;
      
    } catch (error) {
      console.error(`❌ Standalone CAGR calculation failed for ${symbol}:`, error);
      throw error;
    }
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
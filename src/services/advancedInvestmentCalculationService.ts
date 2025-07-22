
import { supabase } from '@/integrations/supabase/client';
import { directGlassnodeCalculationService, DirectGlassnodeResult } from './directGlassnodeCalculationService';
import { bitcoinGlassNodeService } from './bitcoinGlassNodeService';
import type { InvestmentInputs } from '@/types/investment';

interface EnhancedInvestmentResult extends DirectGlassnodeResult {
  // All properties are already included from DirectGlassnodeResult
}

/**
 * Advanced Investment Calculation Service
 * NOW USES DIRECT GLASSNODE API - NO DATABASE DEPENDENCY
 */
class AdvancedInvestmentCalculationService {
  
  /**
   * Calculate investment analysis using DIRECT Glassnode API calls only
   */
  async calculateAdvancedInvestmentAnalysis(inputs: InvestmentInputs): Promise<EnhancedInvestmentResult> {
    console.log('🚀 Starting ADVANCED investment analysis with DIRECT API calls only...');
    console.log(`📊 Coin: ${inputs.coinId}, Amount: $${inputs.investmentAmount}`);
    console.log('✅ NO DATABASE DEPENDENCY - Using direct Glassnode API endpoints only');
    
    try {
      // Use the new direct API calculation service - NO database calls
      const directResult = await directGlassnodeCalculationService.calculateDirectInvestmentAnalysis(inputs);

      console.log('✅ ADVANCED investment analysis completed with direct API calls:');
      console.log(`   - Volatility: ${directResult.volatility.toFixed(2)}% (${directResult.dataQuality.volatilityFromAPI ? 'API' : 'Fallback'})`);
      console.log(`   - AVIV Ratio: ${directResult.avivRatio.toFixed(3)} (${directResult.dataQuality.avivFromAPI ? 'API' : 'Fallback'})`);
      console.log(`   - Standard Deviation: ${directResult.standardDeviation.toFixed(2)}% (${directResult.dataQuality.priceDataPoints} points)`);
      console.log(`   - NPV: $${directResult.npv.toFixed(2)}`);
      console.log(`   - IRR: ${directResult.irr.toFixed(2)}%`);
      console.log(`   - CAGR: ${directResult.cagr.toFixed(2)}%`);
      
      return directResult;
      
    } catch (error) {
      console.error('❌ Advanced investment calculation failed:', error);
      throw error;
    }
  }
}

export const advancedInvestmentCalculationService = new AdvancedInvestmentCalculationService();
export type { EnhancedInvestmentResult };

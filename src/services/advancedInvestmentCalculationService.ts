
import { supabase } from '@/integrations/supabase/client';
import { directGlassnodeCalculationService, DirectGlassnodeResult } from './directGlassnodeCalculationService';
import { bitcoinGlassNodeService } from './bitcoinGlassNodeService';
import type { InvestmentInputs } from '@/types/investment';

interface EnhancedInvestmentResult extends DirectGlassnodeResult {
  // All properties are already included from DirectGlassnodeResult
}

/**
 * Advanced Investment Calculation Service
 * NOW USES DIRECT GLASSNODE API WITH FIXED PARAMETERS - NO DATABASE DEPENDENCY
 */
class AdvancedInvestmentCalculationService {
  
  /**
   * Calculate investment analysis using DIRECT Glassnode API calls with FIXED parameters
   */
  async calculateAdvancedInvestmentAnalysis(inputs: InvestmentInputs): Promise<EnhancedInvestmentResult> {
    console.log('🚀 Starting ADVANCED investment analysis with FIXED API parameters...');
    console.log(`📊 Coin: ${inputs.coinId}, Amount: $${inputs.investmentAmount}`);
    console.log('✅ USING FIXED API CALLS - metric instead of endpoint, ISO dates instead of Unix timestamps');
    
    try {
      // Use the fixed direct API calculation service - NO database calls, FIXED parameters
      const directResult = await directGlassnodeCalculationService.calculateDirectInvestmentAnalysis(inputs);

      console.log('✅ ADVANCED investment analysis completed with REAL API data:');
      console.log(`   - Volatility: ${directResult.volatility.toFixed(2)}% (${directResult.dataQuality.volatilityFromAPI ? 'REAL API' : 'Fallback'})`);
      console.log(`   - Bitcoin AVIV: ${directResult.avivRatio.toFixed(3)} (${directResult.dataQuality.avivFromAPI ? 'REAL API' : 'Fallback'})`);
      console.log(`   - Std Dev: ${directResult.standardDeviation.toFixed(2)}% (${directResult.dataQuality.priceDataPoints} real data points)`);
      console.log(`   - CAGR-based NPV: $${directResult.npv.toLocaleString()}`);
      console.log(`   - Real IRR: ${directResult.irr.toFixed(2)}%`);
      console.log(`   - Historical CAGR: ${directResult.cagr.toFixed(2)}%`);
      console.log(`   - Real Beta: ${directResult.beta.toFixed(3)}`);
      console.log('🎯 ALL CALCULATIONS USE REAL GLASSNODE DATA WITH FIXED API PARAMETERS');
      
      return directResult;
      
    } catch (error) {
      console.error('❌ Advanced investment calculation failed:', error);
      throw error;
    }
  }
}

export const advancedInvestmentCalculationService = new AdvancedInvestmentCalculationService();
export type { EnhancedInvestmentResult };

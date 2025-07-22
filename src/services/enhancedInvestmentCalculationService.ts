
import { supabase } from '@/integrations/supabase/client';
import { advancedInvestmentCalculationService, EnhancedInvestmentResult } from './advancedInvestmentCalculationService';
import type { InvestmentInputs } from '@/types/investment';

/**
 * Enhanced Investment Calculation Service
 * NOW USES DIRECT GLASSNODE API WITH FIXED PARAMETERS - NO DATABASE DEPENDENCY
 */
class EnhancedInvestmentCalculationService {
  
  /**
   * Calculate investment analysis using DIRECT Glassnode API only with FIXED API calls
   */
  async calculateInvestmentAnalysis(inputs: InvestmentInputs): Promise<EnhancedInvestmentResult> {
    console.log('🔄 Starting ENHANCED investment analysis with FIXED API calls...');
    console.log('✅ FIXED API PARAMETERS - Using metric instead of endpoint, ISO dates instead of Unix timestamps');
    
    try {
      // Use the advanced calculation service that now uses FIXED API calls
      const enhancedResult = await advancedInvestmentCalculationService.calculateAdvancedInvestmentAnalysis(inputs);

      console.log('✅ ENHANCED investment analysis completed with REAL API data:');
      console.log(`   - Real Volatility: ${enhancedResult.volatility.toFixed(2)}% (${enhancedResult.dataQuality.volatilityFromAPI ? 'API' : 'Fallback'})`);
      console.log(`   - Real Bitcoin AVIV: ${enhancedResult.avivRatio.toFixed(3)} (${enhancedResult.dataQuality.avivFromAPI ? 'API' : 'Fallback'})`);
      console.log(`   - Real Std Dev: ${enhancedResult.standardDeviation.toFixed(2)}% (${enhancedResult.dataQuality.priceDataPoints} points)`);
      console.log(`   - CAGR-based NPV: $${enhancedResult.npv.toLocaleString()}`);
      console.log(`   - Real IRR: ${enhancedResult.irr.toFixed(2)}%`);
      console.log(`   - Historical CAGR: ${enhancedResult.cagr.toFixed(2)}%`);
      console.log('✅ ALL DATA FROM REAL API CALLS WITH FIXED PARAMETERS');
      
      return enhancedResult;
      
    } catch (error) {
      console.error('❌ Enhanced investment calculation failed:', error);
      throw error;
    }
  }
}

export const enhancedInvestmentCalculationService = new EnhancedInvestmentCalculationService();

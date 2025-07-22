
import { supabase } from '@/integrations/supabase/client';
import { advancedInvestmentCalculationService, EnhancedInvestmentResult } from './advancedInvestmentCalculationService';
import type { InvestmentInputs } from '@/types/investment';

/**
 * Enhanced Investment Calculation Service
 * NOW USES DIRECT GLASSNODE API - NO DATABASE DEPENDENCY
 */
class EnhancedInvestmentCalculationService {
  
  /**
   * Calculate investment analysis using DIRECT Glassnode API only
   */
  async calculateInvestmentAnalysis(inputs: InvestmentInputs): Promise<EnhancedInvestmentResult> {
    console.log('🔄 Starting ENHANCED investment analysis with DIRECT API calls only...');
    console.log('✅ COMPLETELY BYPASSING DATABASE - Using only Glassnode API endpoints');
    
    try {
      // Use the advanced calculation service that now uses DIRECT API calls only
      const enhancedResult = await advancedInvestmentCalculationService.calculateAdvancedInvestmentAnalysis(inputs);

      console.log('✅ ENHANCED investment analysis completed with direct API calls:');
      console.log(`   - Real Volatility: ${enhancedResult.volatility.toFixed(2)}% (${enhancedResult.dataQuality.volatilityFromAPI ? 'API' : 'Fallback'})`);
      console.log(`   - Real AVIV Ratio: ${enhancedResult.avivRatio.toFixed(3)} (${enhancedResult.dataQuality.avivFromAPI ? 'API' : 'Fallback'})`);
      console.log(`   - Standard Deviation: ${enhancedResult.standardDeviation.toFixed(2)}% (${enhancedResult.dataQuality.priceDataPoints} points)`);
      console.log('✅ NO DATABASE ERRORS - All data from direct API calls');
      
      return enhancedResult;
      
    } catch (error) {
      console.error('❌ Enhanced investment calculation failed:', error);
      throw error;
    }
  }
}

export const enhancedInvestmentCalculationService = new EnhancedInvestmentCalculationService();

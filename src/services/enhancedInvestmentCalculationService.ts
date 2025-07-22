
import { supabase } from '@/integrations/supabase/client';
import { advancedInvestmentCalculationService, EnhancedInvestmentResult } from './advancedInvestmentCalculationService';
import type { InvestmentInputs } from '@/types/investment';

/**
 * Enhanced Investment Calculation Service
 * Now uses the advanced service with real Glassnode volatility and AVIV data
 */
class EnhancedInvestmentCalculationService {
  
  /**
   * Calculate investment analysis using real Glassnode data
   */
  async calculateInvestmentAnalysis(inputs: InvestmentInputs): Promise<EnhancedInvestmentResult> {
    console.log('🔄 Starting ENHANCED investment analysis with REAL Glassnode volatility and AVIV data...');
    
    try {
      // Use the advanced calculation service that fetches real Glassnode data
      const advancedResult = await advancedInvestmentCalculationService.calculateAdvancedInvestmentAnalysis(inputs);

      console.log('✅ ENHANCED investment analysis completed with real Glassnode data:');
      console.log(`   - Real Volatility: ${advancedResult.volatility.toFixed(2)}% (${advancedResult.dataQuality.volatilityFromAPI ? 'API' : 'Fallback'})`);
      console.log(`   - Real AVIV Ratio: ${advancedResult.avivRatio.toFixed(3)} (${advancedResult.dataQuality.avivFromAPI ? 'API' : 'Fallback'})`);
      console.log(`   - Standard Deviation: ${advancedResult.standardDeviation.toFixed(2)}% (${advancedResult.dataQuality.priceDataPoints} points)`);
      
      return advancedResult;
      
    } catch (error) {
      console.error('❌ Enhanced investment calculation failed:', error);
      throw error;
    }
  }
}

export const enhancedInvestmentCalculationService = new EnhancedInvestmentCalculationService();

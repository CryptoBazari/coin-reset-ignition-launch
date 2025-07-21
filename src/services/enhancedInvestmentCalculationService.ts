import { supabase } from '@/integrations/supabase/client';
import { realDataCalculationService, RealDataCalculationResult } from './realDataCalculationService';
import type { InvestmentInputs } from '@/types/investment';

/**
 * Enhanced Investment Calculation Service
 * Now uses real database data instead of mock calculations
 */
class EnhancedInvestmentCalculationService {
  
  /**
   * Calculate investment analysis using real database data
   */
  async calculateInvestmentAnalysis(inputs: InvestmentInputs): Promise<RealDataCalculationResult> {
    console.log('🔄 Starting ENHANCED investment analysis with REAL data...');
    
    try {
      // Use the real data calculation service directly - no transformation needed
      const realResult = await realDataCalculationService.calculateRealInvestmentAnalysis(
        inputs.coinId,
        inputs.investmentAmount,
        inputs.investmentHorizon
      );

      console.log('✅ ENHANCED investment analysis completed with real data');
      return realResult;
      
    } catch (error) {
      console.error('❌ Enhanced investment calculation failed:', error);
      throw error;
    }
  }
  
  /**
   * Calculate risk factor based on real data analysis
   */
  private calculateRiskFactor(realResult: any): number {
    let riskScore = 50; // Base score
    
    // Adjust based on volatility
    if (realResult.financialMetrics.realVolatility > 80) riskScore += 30;
    else if (realResult.financialMetrics.realVolatility > 50) riskScore += 15;
    else if (realResult.financialMetrics.realVolatility < 30) riskScore -= 15;
    
    // Adjust based on probability of loss
    if (realResult.monteCarloProjection.probabilityOfLoss > 0.4) riskScore += 20;
    else if (realResult.monteCarloProjection.probabilityOfLoss < 0.2) riskScore -= 10;
    
    // Adjust based on beta
    if (realResult.financialMetrics.beta > 1.5) riskScore += 10;
    else if (realResult.financialMetrics.beta < 0.8) riskScore -= 10;
    
    return Math.max(1, Math.min(100, riskScore));
  }
  
  /**
   * Map recommendation from real data service to investment result format
   */
  private mapRecommendation(action: string): 'Buy' | 'Sell' | 'Hold' {
    switch (action.toLowerCase()) {
      case 'buy':
      case 'buy less':
        return 'Buy';
      case 'sell':
        return 'Sell';
      default:
        return 'Hold';
    }
  }
  
  /**
   * Get current price for a coin (simplified)
   */
  private async getCurrentPrice(coinId: string): Promise<number> {
    const { data } = await supabase
      .from('coins')
      .select('current_price')
      .eq('coin_id', coinId)
      .single();
      
    return data?.current_price || 50000; // Fallback price
  }
  
}

export const enhancedInvestmentCalculationService = new EnhancedInvestmentCalculationService();
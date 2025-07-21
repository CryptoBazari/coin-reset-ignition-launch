
import { useState, useCallback } from 'react';
import { realDataCalculationService, RealDataCalculationResult } from '@/services/realDataCalculationService';
import { useToast } from '@/hooks/use-toast';
import type { InvestmentInputs } from '@/types/investment';

export const useRealInvestmentAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const analyzeInvestment = useCallback(async (inputs: InvestmentInputs): Promise<RealDataCalculationResult | null> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🚀 Starting REAL investment analysis with inputs:', inputs);
      
      toast({
        title: "Analysis Started",
        description: "Calculating with real market data...",
      });

      const result = await realDataCalculationService.calculateRealInvestmentAnalysis(
        inputs.coin_id,
        inputs.investment_amount,
        inputs.investment_horizon
      );

      console.log('✅ REAL analysis completed:', result);
      
      toast({
        title: "Analysis Completed",
        description: `Real data analysis completed for ${inputs.coin_id.toUpperCase()} with ${result.dataQualityScore}% data quality`,
      });

      return result;
    } catch (err) {
      console.error('❌ REAL analysis failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    error,
    analyzeInvestment
  };
};

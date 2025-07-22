
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { comprehensiveGlassnodeService, type NPVCalculationInputs, type NPVResults } from '@/services/comprehensiveGlassnodeService';
import { useAuth } from '@/hooks/useAuth';

export function useNPVAnalysis() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<NPVResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const analyzeNPV = async (inputs: NPVCalculationInputs) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🚀 Starting NPV analysis for ${inputs.coinSymbol.toUpperCase()}`);
      
      // Fetch comprehensive Glassnode data
      const glassnodeData = await comprehensiveGlassnodeService.fetchComprehensiveData(inputs.coinSymbol);
      
      // Fetch benchmark data
      const benchmarkData = await comprehensiveGlassnodeService.fetchBenchmarkData(inputs.coinSymbol);
      
      // Calculate NPV
      const npvResults = comprehensiveGlassnodeService.calculateNPV(inputs, glassnodeData, benchmarkData);
      
      // Save results if user is logged in
      if (user) {
        await comprehensiveGlassnodeService.saveResults(npvResults, user.id);
      }
      
      setResults(npvResults);
      
      toast({
        title: "NPV Analysis Complete",
        description: `Analysis for ${inputs.coinSymbol.toUpperCase()} completed successfully with ${npvResults.metadata.confidenceScore}% confidence.`,
      });
      
      console.log('✅ NPV analysis completed successfully');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete NPV analysis';
      setError(errorMessage);
      
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      console.error('❌ NPV analysis failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults(null);
    setError(null);
  };

  return {
    loading,
    results,
    error,
    analyzeNPV,
    clearResults
  };
}

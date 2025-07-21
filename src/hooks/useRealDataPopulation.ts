
import { useState, useCallback } from 'react';
import { dataPopulationService, DataPopulationResult } from '@/services/dataPopulationService';
import { useToast } from '@/hooks/use-toast';

export const useRealDataPopulation = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DataPopulationResult | null>(null);
  const { toast } = useToast();

  const populateData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🚀 Starting manual data population from UI...');
      
      toast({
        title: "Data Population Started",
        description: "Populating database with real market data...",
      });

      const populationResult = await dataPopulationService.populateAllData();
      setResult(populationResult);

      if (populationResult.success) {
        toast({
          title: "Data Population Completed",
          description: populationResult.message,
        });
      } else {
        toast({
          title: "Data Population Issues",
          description: populationResult.message,
          variant: "destructive",
        });
      }

      return populationResult;
    } catch (error) {
      console.error('❌ Data population failed:', error);
      const errorResult = {
        success: false,
        message: `Data population failed: ${error.message}`,
        errors: [error.message]
      };
      setResult(errorResult);
      
      toast({
        title: "Data Population Failed",
        description: error.message,
        variant: "destructive",
      });
      
      return errorResult;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const checkDataStatus = useCallback(async () => {
    try {
      const status = await dataPopulationService.getDataStatus();
      return status;
    } catch (error) {
      console.error('Error checking data status:', error);
      return {
        isPopulated: false,
        lastUpdate: null,
        coinsWithRealData: 0,
        totalCoins: 0,
        dataQuality: 0
      };
    }
  }, []);

  return {
    loading,
    result,
    populateData,
    checkDataStatus
  };
};

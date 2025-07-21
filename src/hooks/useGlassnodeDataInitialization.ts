
import { useState, useCallback } from 'react';
import { glassnodeDataInitializer, InitializationResult } from '@/services/glassnodeDataInitializer';
import { useToast } from '@/hooks/use-toast';

export const useGlassnodeDataInitialization = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<InitializationResult[]>([]);
  const { toast } = useToast();

  const initializeAllData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🚀 Starting Glassnode data initialization');
      const initResults = await glassnodeDataInitializer.initializeAllCoins();
      setResults(initResults);
      
      const successCount = initResults.filter(r => r.success).length;
      const totalCount = initResults.length;
      
      if (successCount === totalCount) {
        toast({
          title: "✅ Data Initialization Complete",
          description: `Successfully initialized real Glassnode data for all ${totalCount} coins`,
        });
      } else {
        toast({
          title: "⚠️ Partial Data Initialization",
          description: `Initialized ${successCount}/${totalCount} coins successfully`,
          variant: "destructive"
        });
      }
      
      console.log(`✅ Initialization completed: ${successCount}/${totalCount} successful`);
      return initResults;
    } catch (error) {
      console.error('❌ Data initialization failed:', error);
      toast({
        title: "❌ Initialization Failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const initializeSingleCoin = useCallback(async (coinId: string) => {
    setLoading(true);
    try {
      console.log(`🚀 Initializing data for ${coinId}`);
      const result = await glassnodeDataInitializer.initializeSingleCoin(coinId);
      
      if (result.success) {
        toast({
          title: "✅ Coin Data Initialized",
          description: `Successfully initialized real data for ${coinId} with ${result.dataPoints} data points`,
        });
      } else {
        toast({
          title: "❌ Initialization Failed",
          description: `Failed to initialize ${coinId}: ${result.errors.join(', ')}`,
          variant: "destructive"
        });
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Failed to initialize ${coinId}:`, error);
      toast({
        title: "❌ Initialization Error",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const checkDataFreshness = useCallback(async (coinId: string) => {
    try {
      return await glassnodeDataInitializer.checkDataFreshness(coinId);
    } catch (error) {
      console.error(`❌ Failed to check data freshness for ${coinId}:`, error);
      return { hasData: false, lastUpdate: null, dataAge: Infinity };
    }
  }, []);

  return {
    loading,
    results,
    initializeAllData,
    initializeSingleCoin,
    checkDataFreshness
  };
};

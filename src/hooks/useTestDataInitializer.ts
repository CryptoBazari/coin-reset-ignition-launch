
import { useState } from 'react';
import { testDataDatabasePopulator } from '@/services/testDataDatabasePopulator';
import { useToast } from '@/hooks/use-toast';

export const useTestDataInitializer = () => {
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const { toast } = useToast();

  const initializeTestData = async () => {
    setLoading(true);
    try {
      console.log('🚀 Initializing test data system...');
      
      toast({
        title: "Initializing Test Data",
        description: "Setting up realistic cryptocurrency data for analysis...",
      });

      await testDataDatabasePopulator.populateTestData();
      
      setInitialized(true);
      
      toast({
        title: "✅ Test Data Ready",
        description: "Realistic cryptocurrency data loaded. CAGR calculations and analysis features are now available!",
      });
      
      console.log('✅ Test data system initialized successfully');
      
    } catch (error) {
      console.error('❌ Test data initialization failed:', error);
      
      toast({
        title: "❌ Initialization Failed", 
        description: error instanceof Error ? error.message : 'Failed to initialize test data',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    initializeTestData,
    loading,
    initialized
  };
};

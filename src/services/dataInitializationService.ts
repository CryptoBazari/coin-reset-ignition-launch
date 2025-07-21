
import { supabase } from '@/integrations/supabase/client';
import { realTimeDataService } from './realTimeDataService';

export interface InitializationStep {
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

class DataInitializationService {
  private steps: InitializationStep[] = [
    {
      name: 'coins_update',
      description: 'Update coins table with real market data',
      status: 'pending'
    },
    {
      name: 'price_history',
      description: 'Populate 36-month price history',
      status: 'pending'
    },
    {
      name: 'glass_node_metrics',
      description: 'Populate Glass Node metrics',
      status: 'pending'
    },
    {
      name: 'data_verification',
      description: 'Verify data integrity',
      status: 'pending'
    }
  ];

  async initializeCompleteDataPipeline(): Promise<{
    success: boolean;
    steps: InitializationStep[];
    summary: any;
  }> {
    console.log('🚀 Starting complete data pipeline initialization...');
    
    try {
      // Step 1: Update coins table
      this.updateStepStatus('coins_update', 'running');
      
      try {
        const { data: coinsResult, error: coinsError } = await supabase.functions.invoke(
          'update-coins-real-data',
          { body: {} }
        );
        
        if (coinsError) throw coinsError;
        
        this.updateStepStatus('coins_update', 'completed', coinsResult);
        console.log('✅ Coins table updated successfully');
      } catch (error) {
        this.updateStepStatus('coins_update', 'failed', null, error.message);
        console.error('❌ Coins update failed:', error);
      }

      // Wait before next step
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 2: Populate price history
      this.updateStepStatus('price_history', 'running');
      
      try {
        const { data: priceResult, error: priceError } = await supabase.functions.invoke(
          'bulk-populate-price-history',
          { body: {} }
        );
        
        if (priceError) throw priceError;
        
        this.updateStepStatus('price_history', 'completed', priceResult);
        console.log('✅ Price history populated successfully');
      } catch (error) {
        this.updateStepStatus('price_history', 'failed', null, error.message);
        console.error('❌ Price history population failed:', error);
      }

      // Wait before next step
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Step 3: Populate Glass Node metrics
      this.updateStepStatus('glass_node_metrics', 'running');
      
      try {
        const { data: glassNodeResult, error: glassNodeError } = await supabase.functions.invoke(
          'bulk-populate-glass-node-metrics',
          { body: {} }
        );
        
        if (glassNodeError) throw glassNodeError;
        
        this.updateStepStatus('glass_node_metrics', 'completed', glassNodeResult);
        console.log('✅ Glass Node metrics populated successfully');
      } catch (error) {
        this.updateStepStatus('glass_node_metrics', 'failed', null, error.message);
        console.error('❌ Glass Node metrics population failed:', error);
      }

      // Step 4: Verify data integrity
      this.updateStepStatus('data_verification', 'running');
      
      try {
        const dataQuality = await realTimeDataService.getDataQualityStatus();
        this.updateStepStatus('data_verification', 'completed', dataQuality);
        console.log('✅ Data verification completed');
      } catch (error) {
        this.updateStepStatus('data_verification', 'failed', null, error.message);
        console.error('❌ Data verification failed:', error);
      }

      // Generate summary
      const completedSteps = this.steps.filter(s => s.status === 'completed').length;
      const failedSteps = this.steps.filter(s => s.status === 'failed').length;
      const success = failedSteps === 0 && completedSteps === this.steps.length;

      const summary = {
        totalSteps: this.steps.length,
        completedSteps,
        failedSteps,
        success,
        dataQuality: this.steps.find(s => s.name === 'data_verification')?.result?.dataQualityScore || 0
      };

      console.log('📊 Data pipeline initialization summary:', summary);

      return {
        success,
        steps: [...this.steps],
        summary
      };

    } catch (error) {
      console.error('❌ Fatal error in data pipeline initialization:', error);
      return {
        success: false,
        steps: [...this.steps],
        summary: {
          totalSteps: this.steps.length,
          completedSteps: 0,
          failedSteps: this.steps.length,
          success: false,
          error: error.message
        }
      };
    }
  }

  private updateStepStatus(stepName: string, status: InitializationStep['status'], result?: any, error?: string) {
    const step = this.steps.find(s => s.name === stepName);
    if (step) {
      step.status = status;
      if (result) step.result = result;
      if (error) step.error = error;
    }
  }

  getSteps(): InitializationStep[] {
    return [...this.steps];
  }
}

export const dataInitializationService = new DataInitializationService();

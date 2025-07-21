
import { supabase } from '@/integrations/supabase/client';

export interface DataPopulationResult {
  success: boolean;
  message: string;
  details?: any;
  errors?: string[];
}

class DataPopulationService {
  
  /**
   * Manually trigger the complete data population pipeline
   */
  async populateAllData(): Promise<DataPopulationResult> {
    console.log('🚀 Starting manual data population...');
    
    try {
      const results = {
        coinsUpdated: 0,
        priceHistoryPopulated: 0,
        glassNodeMetricsPopulated: 0,
        errors: []
      };

      // Step 1: Update coins table with real current data
      console.log('Step 1: Updating coins table...');
      try {
        const { data: coinsResult, error: coinsError } = await supabase.functions.invoke(
          'update-coins-real-data',
          { body: {} }
        );
        
        if (coinsError) {
          results.errors.push(`Coins update failed: ${coinsError.message}`);
        } else {
          results.coinsUpdated = coinsResult?.updated || 0;
          console.log(`✅ Updated ${results.coinsUpdated} coins`);
        }
      } catch (error) {
        results.errors.push(`Coins update error: ${error.message}`);
      }

      // Wait 3 seconds before next step
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 2: Populate price history
      console.log('Step 2: Populating price history...');
      try {
        const { data: priceResult, error: priceError } = await supabase.functions.invoke(
          'bulk-populate-price-history',
          { body: {} }
        );
        
        if (priceError) {
          results.errors.push(`Price history failed: ${priceError.message}`);
        } else {
          results.priceHistoryPopulated = priceResult?.successful || 0;
          console.log(`✅ Populated price history for ${results.priceHistoryPopulated} coins`);
        }
      } catch (error) {
        results.errors.push(`Price history error: ${error.message}`);
      }

      // Wait 5 seconds before Glass Node requests
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Step 3: Populate Glass Node metrics
      console.log('Step 3: Populating Glass Node metrics...');
      try {
        const { data: glassNodeResult, error: glassNodeError } = await supabase.functions.invoke(
          'bulk-populate-glass-node-metrics',
          { body: {} }
        );
        
        if (glassNodeError) {
          results.errors.push(`Glass Node metrics failed: ${glassNodeError.message}`);
        } else {
          results.glassNodeMetricsPopulated = glassNodeResult?.successful || 0;
          console.log(`✅ Populated Glass Node metrics for ${results.glassNodeMetricsPopulated} coins`);
        }
      } catch (error) {
        results.errors.push(`Glass Node metrics error: ${error.message}`);
      }

      // Step 4: Verify data was actually stored
      console.log('Step 4: Verifying data storage...');
      const verification = await this.verifyDataPopulation();

      const success = results.errors.length === 0 && verification.hasData;
      
      return {
        success,
        message: success 
          ? `✅ Data population completed successfully! ${results.coinsUpdated} coins updated, ${results.priceHistoryPopulated} price histories, ${results.glassNodeMetricsPopulated} Glass Node metrics.`
          : `⚠️ Data population completed with ${results.errors.length} errors`,
        details: {
          results,
          verification,
          timestamp: new Date().toISOString()
        },
        errors: results.errors
      };

    } catch (error) {
      console.error('❌ Fatal error in data population:', error);
      return {
        success: false,
        message: 'Data population failed',
        details: { error: error.message },
        errors: [error.message]
      };
    }
  }

  /**
   * Verify that data was actually populated in the database
   */
  async verifyDataPopulation(): Promise<{
    hasData: boolean;
    coinsCount: number;
    priceHistoryCount: number;
    cointimeMetricsCount: number;
  }> {
    try {
      const [coinsResult, priceHistoryResult, cointimeResult] = await Promise.all([
        supabase.from('coins').select('*', { count: 'exact', head: true }),
        supabase.from('price_history_36m').select('*', { count: 'exact', head: true }),
        supabase.from('cointime_metrics').select('*', { count: 'exact', head: true })
      ]);

      const coinsCount = coinsResult.count || 0;
      const priceHistoryCount = priceHistoryResult.count || 0;
      const cointimeMetricsCount = cointimeResult.count || 0;

      return {
        hasData: coinsCount > 0 && (priceHistoryCount > 0 || cointimeMetricsCount > 0),
        coinsCount,
        priceHistoryCount,
        cointimeMetricsCount
      };
    } catch (error) {
      console.error('Error verifying data population:', error);
      return {
        hasData: false,
        coinsCount: 0,
        priceHistoryCount: 0,
        cointimeMetricsCount: 0
      };
    }
  }

  /**
   * Get real-time data status
   */
  async getDataStatus(): Promise<{
    isPopulated: boolean;
    lastUpdate: string | null;
    coinsWithRealData: number;
    totalCoins: number;
    dataQuality: number;
  }> {
    try {
      const { data: coins } = await supabase
        .from('coins')
        .select('coin_id, api_status, last_glass_node_update, current_price');

      const totalCoins = coins?.length || 0;
      const coinsWithRealData = coins?.filter(c => 
        c.api_status === 'healthy' && c.current_price > 0
      ).length || 0;

      const lastUpdate = coins?.reduce((latest, coin) => {
        if (coin.last_glass_node_update) {
          const updateTime = new Date(coin.last_glass_node_update).getTime();
          return updateTime > latest ? updateTime : latest;
        }
        return latest;
      }, 0);

      return {
        isPopulated: coinsWithRealData > 0,
        lastUpdate: lastUpdate ? new Date(lastUpdate).toISOString() : null,
        coinsWithRealData,
        totalCoins,
        dataQuality: totalCoins > 0 ? Math.round((coinsWithRealData / totalCoins) * 100) : 0
      };
    } catch (error) {
      console.error('Error getting data status:', error);
      return {
        isPopulated: false,
        lastUpdate: null,
        coinsWithRealData: 0,
        totalCoins: 0,
        dataQuality: 0
      };
    }
  }
}

export const dataPopulationService = new DataPopulationService();

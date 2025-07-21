
import { supabase } from '@/integrations/supabase/client';

export interface DataVerificationResult {
  isUsingRealData: boolean;
  dataQuality: number;
  missingComponents: string[];
  recommendations: string[];
  summary: string;
}

class DataVerificationService {
  
  async verifyRealDataUsage(): Promise<DataVerificationResult> {
    const missingComponents: string[] = [];
    const recommendations: string[] = [];
    let dataQuality = 0;
    
    try {
      // Check coins table
      const { data: coinsData, count: coinsCount } = await supabase
        .from('coins')
        .select('*', { count: 'exact' })
        .limit(1);
      
      if (!coinsCount || coinsCount < 50) {
        missingComponents.push('Insufficient coins data');
        recommendations.push('Run data population to add 100+ coins');
      } else {
        dataQuality += 30;
      }
      
      // Check price history
      const { count: priceHistoryCount } = await supabase
        .from('price_history_36m')
        .select('*', { count: 'exact', head: true });
      
      if (!priceHistoryCount || priceHistoryCount < 1000) {
        missingComponents.push('Missing price history data');
        recommendations.push('Populate 36-month price history for accurate calculations');
      } else {
        dataQuality += 40;
      }
      
      // Check Glass Node metrics
      const { count: metricsCount } = await supabase
        .from('cointime_metrics')
        .select('*', { count: 'exact', head: true });
      
      if (!metricsCount || metricsCount < 100) {
        missingComponents.push('Missing Glass Node metrics');
        recommendations.push('Fetch Glass Node metrics for advanced analysis');
      } else {
        dataQuality += 30;
      }
      
      // Check for recent updates
      const { data: recentUpdate } = await supabase
        .from('coins')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      const isRecent = recentUpdate && 
        new Date(recentUpdate.updated_at).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      if (!isRecent) {
        recommendations.push('Data is outdated, run refresh to get latest market data');
      }
      
      const isUsingRealData = dataQuality >= 70;
      
      let summary = '';
      if (isUsingRealData) {
        summary = `✅ System is using real data (${dataQuality}% quality)`;
      } else if (dataQuality > 0) {
        summary = `⚠️ System is partially using real data (${dataQuality}% quality)`;
      } else {
        summary = `❌ System is using estimated/fallback data (${dataQuality}% quality)`;
      }
      
      return {
        isUsingRealData,
        dataQuality,
        missingComponents,
        recommendations,
        summary
      };
      
    } catch (error) {
      console.error('Error verifying real data usage:', error);
      return {
        isUsingRealData: false,
        dataQuality: 0,
        missingComponents: ['Data verification failed'],
        recommendations: ['Check database connection and try again'],
        summary: '❌ Unable to verify data status'
      };
    }
  }
  
  async getDataPopulationStatus(): Promise<{
    coinsCount: number;
    priceHistoryCount: number;
    cointimeMetricsCount: number;
    lastUpdate: string | null;
    needsPopulation: boolean;
  }> {
    try {
      const [coinsResult, priceHistoryResult, cointimeResult] = await Promise.all([
        supabase.from('coins').select('*', { count: 'exact', head: true }),
        supabase.from('price_history_36m').select('*', { count: 'exact', head: true }),
        supabase.from('cointime_metrics').select('*', { count: 'exact', head: true })
      ]);

      const { data: lastUpdateData } = await supabase
        .from('coins')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      const coinsCount = coinsResult.count || 0;
      const priceHistoryCount = priceHistoryResult.count || 0;
      const cointimeMetricsCount = cointimeResult.count || 0;
      
      const needsPopulation = coinsCount < 50 || priceHistoryCount < 1000 || cointimeMetricsCount < 100;

      return {
        coinsCount,
        priceHistoryCount,
        cointimeMetricsCount,
        lastUpdate: lastUpdateData?.updated_at || null,
        needsPopulation
      };
    } catch (error) {
      console.error('Error getting data population status:', error);
      return {
        coinsCount: 0,
        priceHistoryCount: 0,
        cointimeMetricsCount: 0,
        lastUpdate: null,
        needsPopulation: true
      };
    }
  }
}

export const dataVerificationService = new DataVerificationService();

import { supabase } from '@/integrations/supabase/client';
import { realTimeMarketService } from './realTimeMarketService';
import { bitcoinGlassNodeService } from './bitcoinGlassNodeService';

interface RealDataResult {
  coinId: string;
  success: boolean;
  dataQualityScore: number;
  metricsStored: string[];
  errors: string[];
  realBeta?: number;
  realVolatility?: number;
  realAvivRatio?: number;
}

/**
 * Real Data Pipeline Service - Replaces all mock/estimated data with real API data
 */
class RealDataPipelineService {

  /**
   * Initialize real data pipeline for all supported coins
   */
  async initializeRealDataPipeline(): Promise<void> {
    console.log('🚀 Initializing REAL data pipeline - replacing all mock/estimated data');

    try {
      // 1. Trigger Glass Node discovery
      console.log('📡 Triggering Glass Node asset discovery...');
      await supabase.functions.invoke('schedule-glass-node-discovery', {
        body: { force: true, immediate: true }
      });

      // 2. Get list of supported coins
      const { data: coins } = await supabase
        .from('coins')
        .select('coin_id, name')
        .limit(10); // Start with first 10 coins

      if (!coins?.length) {
        console.warn('⚠️ No coins found in database');
        return;
      }

      console.log(`🔄 Processing ${coins.length} coins with REAL data pipeline`);

      // 3. Process each coin with real data
      for (const coin of coins) {
        await this.processRealDataForCoin(coin.coin_id);
        // Rate limiting - wait 2 seconds between coins
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      console.log('✅ Real data pipeline initialization complete');
    } catch (error) {
      console.error('❌ Failed to initialize real data pipeline:', error);
    }
  }

  /**
   * Process real data for a single coin
   */
  async processRealDataForCoin(coinId: string): Promise<RealDataResult> {
    const result: RealDataResult = {
      coinId,
      success: false,
      dataQualityScore: 0,
      metricsStored: [],
      errors: []
    };

    try {
      console.log(`🔄 Processing REAL data for ${coinId}`);

      // 1. Fetch real price history (36 months)
      const priceData = await this.fetchRealPriceHistory(coinId);
      if (priceData.success) {
        result.metricsStored.push(`real_price_history_${priceData.dataPoints}_points`);
        result.dataQualityScore = Math.max(result.dataQualityScore, priceData.qualityScore);
        console.log(`✅ Real price history: ${priceData.dataPoints} points`);
      } else {
        result.errors.push('Real price history failed');
      }

      // 2. Fetch real Glass Node metrics
      const glassNodeData = await this.fetchRealGlassNodeMetrics(coinId);
      if (glassNodeData.success) {
        result.metricsStored.push('real_glassnode_metrics');
        result.dataQualityScore = Math.max(result.dataQualityScore, glassNodeData.qualityScore);
        result.realAvivRatio = glassNodeData.avivRatio;
        console.log(`✅ Real Glass Node metrics: AVIV ${glassNodeData.avivRatio?.toFixed(3)}`);
      } else {
        result.errors.push('Real Glass Node metrics failed');
      }

      // 3. Calculate real financial metrics
      const calculatedData = await this.calculateRealFinancialMetrics(coinId);
      if (calculatedData.success) {
        result.metricsStored.push('real_calculated_metrics');
        result.dataQualityScore = Math.max(result.dataQualityScore, calculatedData.qualityScore);
        result.realBeta = calculatedData.beta;
        result.realVolatility = calculatedData.volatility;
        console.log(`✅ Real calculations: Beta ${calculatedData.beta?.toFixed(3)}, Vol ${calculatedData.volatility?.toFixed(1)}%`);
      } else {
        result.errors.push('Real calculations failed');
      }

      // 4. Update coin record with real data quality
      await this.updateCoinDataQuality(coinId, result.dataQualityScore, result.metricsStored);

      result.success = result.metricsStored.length > 0 && result.dataQualityScore > 50;
      
      console.log(`${result.success ? '✅' : '❌'} Processed ${coinId}: ${result.metricsStored.length} metrics, quality ${result.dataQualityScore}%`);

      return result;
    } catch (error) {
      console.error(`❌ Failed to process real data for ${coinId}:`, error);
      result.errors.push(error.message);
      return result;
    }
  }

  /**
   * Fetch real 36-month price history
   */
  private async fetchRealPriceHistory(coinId: string): Promise<{
    success: boolean;
    dataPoints: number;
    qualityScore: number;
  }> {
    try {
      console.log(`📈 Fetching REAL 36-month price history for ${coinId}`);

      // Use fetch-market-data edge function for real historical data
      const { data, error } = await supabase.functions.invoke('fetch-market-data', {
        body: { 
          coinId,
          days: 1095, // 36 months
          vs_currency: 'usd',
          interval: 'daily'
        }
      });

      if (error || !data?.prices) {
        console.warn(`⚠️ Failed to fetch real price data for ${coinId}:`, error);
        return { success: false, dataPoints: 0, qualityScore: 0 };
      }

      const dataPoints = data.prices?.length || 0;
      const qualityScore = Math.min(100, Math.max(50, (dataPoints / 1095) * 100)); // Quality based on completeness

      console.log(`✅ Fetched ${dataPoints} real price points for ${coinId}`);
      
      return {
        success: true,
        dataPoints,
        qualityScore: Math.round(qualityScore)
      };
    } catch (error) {
      console.error(`❌ Error fetching real price history for ${coinId}:`, error);
      return { success: false, dataPoints: 0, qualityScore: 0 };
    }
  }

  /**
   * Fetch real Glass Node metrics
   */
  private async fetchRealGlassNodeMetrics(coinId: string): Promise<{
    success: boolean;
    qualityScore: number;
    avivRatio?: number;
    activeSupply?: number;
    vaultedSupply?: number;
  }> {
    try {
      console.log(`🔍 Fetching REAL Glass Node metrics for ${coinId}`);

      // Use update-real-glass-node-data edge function
      const { data, error } = await supabase.functions.invoke('update-real-glass-node-data', {
        body: { coinId, forceUpdate: true }
      });

      if (error || !data?.success) {
        console.warn(`⚠️ Failed to fetch real Glass Node data for ${coinId}:`, error);
        return { success: false, qualityScore: 0 };
      }

      // Extract real metrics from Glass Node response
      const avivRatio = data.metrics?.avivRatio || data.avivRatio;
      const activeSupply = data.metrics?.activeSupply || data.activeSupply;
      const vaultedSupply = data.metrics?.vaultedSupply || data.vaultedSupply;

      const qualityScore = data.confidence >= 80 ? 95 : data.confidence >= 60 ? 75 : 50;

      console.log(`✅ Real Glass Node data for ${coinId}: AVIV ${avivRatio?.toFixed(3)}`);

      return {
        success: true,
        qualityScore,
        avivRatio,
        activeSupply,
        vaultedSupply
      };
    } catch (error) {
      console.error(`❌ Error fetching real Glass Node metrics for ${coinId}:`, error);
      return { success: false, qualityScore: 0 };
    }
  }

  /**
   * Calculate real financial metrics from actual data
   */
  private async calculateRealFinancialMetrics(coinId: string): Promise<{
    success: boolean;
    qualityScore: number;
    beta?: number;
    volatility?: number;
    cagr?: number;
    sharpeRatio?: number;
  }> {
    try {
      console.log(`📊 Calculating REAL financial metrics for ${coinId}`);

      // Use store-calculated-metrics edge function with real data
      const { data, error } = await supabase.functions.invoke('store-calculated-metrics', {
        body: { 
          coinId,
          useRealData: true,
          calculateBeta: true,
          calculateVolatility: true
        }
      });

      if (error || !data?.success) {
        console.warn(`⚠️ Failed to calculate real metrics for ${coinId}:`, error);
        return { success: false, qualityScore: 0 };
      }

      const metrics = data.metrics || {};
      const qualityScore = data.qualityScore || 0;

      console.log(`✅ Real calculations for ${coinId}: Beta ${metrics.beta?.toFixed(3)}, Vol ${metrics.volatility?.toFixed(1)}%`);

      return {
        success: true,
        qualityScore,
        beta: metrics.beta,
        volatility: metrics.volatility,
        cagr: metrics.cagr,
        sharpeRatio: metrics.sharpeRatio
      };
    } catch (error) {
      console.error(`❌ Error calculating real financial metrics for ${coinId}:`, error);
      return { success: false, qualityScore: 0 };
    }
  }

  /**
   * Update coin record with real data quality indicators
   */
  private async updateCoinDataQuality(coinId: string, qualityScore: number, metricsStored: string[]): Promise<void> {
    try {
      const isHighQuality = qualityScore >= 70;
      const isRealData = metricsStored.some(metric => metric.includes('real_'));

      await supabase
        .from('coins')
        .update({
          api_status: isRealData ? 'healthy' : 'degraded',
          beta_data_source: isRealData ? 'calculated' : 'estimated',
          beta_confidence: isHighQuality ? 'high' : qualityScore >= 40 ? 'medium' : 'low',
          last_glass_node_update: isRealData ? new Date().toISOString() : undefined,
          glass_node_supported: isRealData
        })
        .eq('coin_id', coinId);

      console.log(`✅ Updated ${coinId} data quality: ${qualityScore}% (${isRealData ? 'REAL' : 'estimated'})`);
    } catch (error) {
      console.error(`❌ Error updating coin data quality for ${coinId}:`, error);
    }
  }

  /**
   * Get real-time data quality status
   */
  async getDataQualityStatus(): Promise<{
    totalCoins: number;
    realDataCoins: number;
    estimatedDataCoins: number;
    averageQuality: number;
    highQualityCoins: number;
  }> {
    try {
      const { data: coins } = await supabase
        .from('coins')
        .select('coin_id, beta_confidence, beta_data_source, api_status');

      if (!coins?.length) {
        return {
          totalCoins: 0,
          realDataCoins: 0,
          estimatedDataCoins: 0,
          averageQuality: 0,
          highQualityCoins: 0
        };
      }

      const realDataCoins = coins.filter(c => 
        c.beta_data_source?.includes('calculated') || 
        c.api_status === 'healthy'
      ).length;
      const estimatedDataCoins = coins.length - realDataCoins;
      
      // Estimate quality based on existing fields
      const highQualityCoins = coins.filter(c => 
        c.beta_confidence === 'high' && c.api_status === 'healthy'
      ).length;
      
      const averageQuality = realDataCoins > 0 ? 
        ((realDataCoins / coins.length) * 80) + 20 : 30; // Estimate based on real data ratio

      console.log(`📊 Data Quality Status: ${realDataCoins}/${coins.length} using real data, estimated quality ${averageQuality.toFixed(1)}%`);

      return {
        totalCoins: coins.length,
        realDataCoins,
        estimatedDataCoins,
        averageQuality: Math.round(averageQuality),
        highQualityCoins
      };
    } catch (error) {
      console.error('❌ Error getting data quality status:', error);
      return {
        totalCoins: 0,
        realDataCoins: 0,
        estimatedDataCoins: 0,
        averageQuality: 0,
        highQualityCoins: 0
      };
    }
  }

  /**
   * Force update a specific coin with real data
   */
  async forceUpdateCoinRealData(coinId: string): Promise<RealDataResult> {
    console.log(`🔄 Force updating ${coinId} with REAL data`);
    return await this.processRealDataForCoin(coinId);
  }
}

export const realDataPipelineService = new RealDataPipelineService();
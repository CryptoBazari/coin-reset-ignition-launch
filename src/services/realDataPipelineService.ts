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
    console.log('🚀 Starting Real Data Pipeline Initialization...');
    
    try {
      // Step 1: Test Alpha Vantage API for beta calculation
      console.log('Step 1: Testing Alpha Vantage API for beta calculation...');
      const { data: alphaVantageTest, error: alphaError } = await supabase.functions.invoke(
        'test-alpha-vantage-api',
        { body: {} }
      );
      
      if (alphaError || !alphaVantageTest?.success) {
        console.warn('⚠️ Alpha Vantage API test failed:', alphaError);
      } else {
        console.log(`✅ Alpha Vantage API verified: ${alphaVantageTest.spyDataPoints} S&P 500 data points, Test beta: ${alphaVantageTest.testBeta} (${alphaVantageTest.betaValidation ? 'valid' : 'needs calibration'})`);
      }
      
      // Step 2: Verify Glass Node API connectivity
      console.log('Step 2: Verifying Glass Node API connectivity...');
      const { data: apiVerification, error: apiError } = await supabase.functions.invoke(
        'verify-glass-node-api',
        { body: {} }
      );
      
      if (apiError || !apiVerification?.success) {
        console.warn('⚠️ Glass Node API verification failed:', apiError);
      } else {
        console.log(`✅ Glass Node API verified: ${apiVerification.qualityScore}% quality, ${apiVerification.metricsAvailable}/${apiVerification.totalMetrics} metrics available`);
      }
      
      // Step 2: Trigger Glass Node discovery
      console.log('Step 2: Triggering Glass Node asset discovery...');
      const { data: discoveryData, error: discoveryError } = await supabase.functions.invoke(
        'discover-glass-node-assets',
        { body: { force: true } }
      );
      
      if (discoveryError) {
        console.error('Glass Node discovery failed:', discoveryError);
      } else {
        console.log(`✅ Glass Node discovery completed: ${discoveryData?.stats?.glass_node_available || 0} assets discovered`);
      }
      
      // Step 3: Get list of coins to process (prioritize by market cap and Glass Node support)
      const { data: coins, error: coinsError } = await supabase
        .from('coins')
        .select('id, coin_id, name, glass_node_supported, market_cap')
        .order('market_cap', { ascending: false })
        .limit(10); // Process top 10 coins by market cap first
      
      if (coinsError) {
        throw new Error(`Failed to fetch coins: ${coinsError.message}`);
      }
      
      console.log(`Step 4: Processing ${coins?.length || 0} coins with enhanced real data pipeline...`);
      console.log('🎯 Expected Results:');
      console.log('   - Bitcoin Beta: 1.2-1.8 (instead of 0.10)');
      console.log('   - Real Volatility: Calculated from actual price movements');
      console.log('   - Data Quality: 90-100% with real API data');
      console.log('   - CAGR/IRR: Based on 36 months of historical data');
      
      // Step 5: Process each coin with full real data pipeline
      let successCount = 0;
      for (const coin of coins || []) {
        console.log(`🔄 Processing ${coin.name} (${coin.coin_id})...`);
        try {
          const result = await this.processRealDataForCoin(coin.coin_id);
          if (result.success) {
            successCount++;
            console.log(`✅ ${coin.name}: Quality Score ${result.dataQualityScore}%`);
          } else {
            console.log(`⚠️ ${coin.name}: Partial success, Quality Score ${result.dataQualityScore}%`);
          }
        } catch (error) {
          console.error(`❌ Failed to process ${coin.name}:`, error);
        }
        
        // Rate limiting - wait 1 second between coins
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(`🎉 Real Data Pipeline Initialization Complete! ${successCount}/${coins?.length || 0} coins processed successfully.`);
      
    } catch (error) {
      console.error('❌ Real Data Pipeline Initialization Failed:', error);
      throw error;
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
      
      // Get coin symbol for API calls
      const symbol = coinId === 'bitcoin' ? 'BTC' : coinId.toUpperCase();

      // Use new edge function to fetch and store real price data
      const { data, error } = await supabase.functions.invoke('fetch-real-price-history', {
        body: { coinId, symbol }
      });

      if (error || !data?.success) {
        console.warn(`⚠️ Failed to fetch real price data for ${coinId}:`, error);
        return { success: false, dataPoints: 0, qualityScore: 0 };
      }

      console.log(`✅ Fetched and stored ${data.stored} real price points for ${coinId}, Quality: ${data.qualityScore}%`);
      
      return {
        success: data.success,
        dataPoints: data.stored || 0,
        qualityScore: data.qualityScore || 50
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

      // Use new edge function to calculate real beta and metrics
      const { data, error } = await supabase.functions.invoke('calculate-real-beta', {
        body: { coinId }
      });

      if (error || !data?.success) {
        console.warn(`⚠️ Failed to calculate real metrics for ${coinId}:`, error);
        return { success: false, qualityScore: 0 };
      }

      console.log(`✅ Real calculations for ${coinId}: Beta ${data.beta?.toFixed(3)}, Vol ${data.volatility?.toFixed(3)}`);

      return {
        success: data.success,
        qualityScore: data.qualityScore || 50,
        beta: data.beta,
        volatility: data.volatility,
        cagr: data.cagr,
        sharpeRatio: data.sharpeRatio
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
          beta_data_source: isRealData ? 'real' : 'estimated',
          beta_confidence: isHighQuality ? 'high' : qualityScore >= 40 ? 'medium' : 'low',
          last_glass_node_update: isRealData ? new Date().toISOString() : undefined,
          glass_node_supported: isRealData,
          data_quality_score: qualityScore,
          last_calculation_update: new Date().toISOString(),
          calculation_data_source: isRealData ? 'real' : 'estimated',
          confidence_level: isHighQuality ? 'high' : qualityScore >= 40 ? 'medium' : 'low'
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
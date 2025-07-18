import { supabase } from '@/integrations/supabase/client';

export interface PriceHistoryEntry {
  coinId: string;
  priceDate: string;
  priceUsd: number;
  volume24h?: number;
  marketCap?: number;
}

export interface CointimeData {
  coinId: string;
  avivRatio: number;
  activeSupplyPct: number;
  vaultedSupplyPct: number;
  dataSource: string;
  confidenceScore: number;
}

export interface CalculatedFinancialMetrics {
  coinId: string;
  realVolatility?: number;
  realBeta?: number;
  realCagr36m?: number;
  realStandardDeviation?: number;
  sharpeRatio?: number;
  dataPointsUsed: number;
  dataQualityScore: number;
  isEstimated: boolean;
}

class EnhancedDataPersistenceService {
  
  /**
   * Store price history data and return quality metrics
   */
  async storePriceHistoryBatch(entries: PriceHistoryEntry[]): Promise<{
    stored: number;
    qualityScore: number;
  }> {
    try {
      console.log(`🔄 Storing ${entries.length} price history entries`);
      
      // Store via edge function to handle new table structure
      const { data, error } = await supabase.functions.invoke('store-price-history', {
        body: { entries }
      });

      if (error) {
        console.error('❌ Failed to store price history:', error);
        return { stored: 0, qualityScore: 0 };
      }

      const result = data || { stored: 0, qualityScore: 0 };
      console.log(`✅ Stored ${result.stored} price entries, quality score: ${result.qualityScore}%`);
      
      return result;
    } catch (error) {
      console.error('❌ Error storing price history:', error);
      return { stored: 0, qualityScore: 0 };
    }
  }

  /**
   * Store cointime metrics and update coin quality
   */
  async storeCointimeMetrics(data: CointimeData): Promise<void> {
    try {
      console.log(`🔄 Storing cointime metrics for ${data.coinId}`);
      
      const { error } = await supabase.functions.invoke('store-cointime-metrics', {
        body: { metrics: data }
      });

      if (error) {
        console.error('❌ Failed to store cointime metrics:', error);
        return;
      }

      // Update main coins table with real data
      await this.updateCoinWithRealData(data.coinId, {
        avivRatio: data.avivRatio,
        activeSupply: data.activeSupplyPct,
        vaultedSupply: data.vaultedSupplyPct,
        dataSource: data.dataSource,
        confidenceLevel: data.confidenceScore >= 70 ? 'high' : data.confidenceScore >= 40 ? 'medium' : 'low'
      });

      console.log(`✅ Stored cointime metrics for ${data.coinId}`);
    } catch (error) {
      console.error('❌ Error storing cointime metrics:', error);
    }
  }

  /**
   * Store calculated financial metrics
   */
  async storeCalculatedMetrics(metrics: CalculatedFinancialMetrics): Promise<void> {
    try {
      console.log(`🔄 Storing calculated metrics for ${metrics.coinId}`);
      
      const { error } = await supabase.functions.invoke('store-calculated-metrics', {
        body: { metrics }
      });

      if (error) {
        console.error('❌ Failed to store calculated metrics:', error);
        return;
      }

      // Update main coins table with calculated values
      await this.updateCoinWithCalculatedMetrics(metrics.coinId, metrics);

      console.log(`✅ Stored calculated metrics for ${metrics.coinId}`);
    } catch (error) {
      console.error('❌ Error storing calculated metrics:', error);
    }
  }

  /**
   * Update coin record with real Glassnode data
   */
  private async updateCoinWithRealData(coinId: string, data: {
    avivRatio: number;
    activeSupply: number;
    vaultedSupply: number;
    dataSource: string;
    confidenceLevel: string;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('coins')
        .update({
          aviv_ratio: data.avivRatio,
          active_supply: data.activeSupply,
          vaulted_supply: data.vaultedSupply,
          glass_node_supported: true,
          api_status: 'healthy',
          last_glass_node_update: new Date().toISOString(),
          confidence_level: data.confidenceLevel,
          calculation_data_source: data.dataSource,
          data_quality_score: data.confidenceLevel === 'high' ? 85 : data.confidenceLevel === 'medium' ? 60 : 35
        })
        .eq('coin_id', coinId);

      if (error) {
        console.error('❌ Failed to update coin with real data:', error);
      }
    } catch (error) {
      console.error('❌ Error updating coin with real data:', error);
    }
  }

  /**
   * Update coin record with calculated metrics
   */
  private async updateCoinWithCalculatedMetrics(coinId: string, metrics: CalculatedFinancialMetrics): Promise<void> {
    try {
      const updates: any = {
        last_calculation_update: new Date().toISOString(),
        data_quality_score: metrics.dataQualityScore,
        calculation_data_source: metrics.isEstimated ? 'estimated' : 'calculated',
        confidence_level: metrics.dataQualityScore >= 70 ? 'high' : metrics.dataQualityScore >= 40 ? 'medium' : 'low'
      };

      if (metrics.realVolatility !== undefined) {
        updates.real_volatility_calculated = metrics.realVolatility;
        updates.volatility = metrics.realVolatility;
      }

      if (metrics.realBeta !== undefined) {
        updates.real_beta_calculated = metrics.realBeta;
        updates.beta = metrics.realBeta;
        updates.beta_data_source = 'calculated';
        updates.beta_confidence = metrics.dataQualityScore >= 70 ? 'high' : 'medium';
      }

      if (metrics.realCagr36m !== undefined) {
        updates.cagr_36m = metrics.realCagr36m;
      }

      if (metrics.realStandardDeviation !== undefined) {
        updates.standard_deviation = metrics.realStandardDeviation;
      }

      if (metrics.sharpeRatio !== undefined) {
        updates.sharpe_ratio = metrics.sharpeRatio;
      }

      const { error } = await supabase
        .from('coins')
        .update(updates)
        .eq('coin_id', coinId);

      if (error) {
        console.error('❌ Failed to update coin with calculated metrics:', error);
      } else {
        console.log(`✅ Updated ${coinId} with calculated metrics (quality: ${metrics.dataQualityScore}%)`);
      }
    } catch (error) {
      console.error('❌ Error updating coin with calculated metrics:', error);
    }
  }

  /**
   * Calculate data quality score based on multiple factors
   */
  calculateDataQualityScore(
    dataPoints: number,
    completeness: number,
    freshnessHours: number,
    apiStatus: string,
    isRealData: boolean = false
  ): number {
    let score = 0;

    // Base score for real vs estimated data
    score += isRealData ? 40 : 20;

    // Data points scoring (0-20 points)
    if (dataPoints >= 1000) score += 20;
    else if (dataPoints >= 500) score += 15;
    else if (dataPoints >= 100) score += 10;
    else if (dataPoints >= 30) score += 5;

    // Completeness scoring (0-20 points)
    score += Math.min(20, completeness * 0.2);

    // Freshness scoring (0-15 points)
    if (freshnessHours <= 1) score += 15;
    else if (freshnessHours <= 6) score += 12;
    else if (freshnessHours <= 24) score += 8;
    else if (freshnessHours <= 72) score += 4;

    // API status scoring (0-5 points)
    if (apiStatus === 'healthy') score += 5;
    else if (apiStatus === 'degraded') score += 3;

    return Math.min(100, Math.round(score));
  }

  /**
   * Log data quality for monitoring
   */
  async logDataQuality(coinId: string, metricType: string, qualityData: {
    dataSource: string;
    qualityScore: number;
    dataPoints: number;
    apiStatus: string;
    errorMessage?: string;
  }): Promise<void> {
    try {
      await supabase.functions.invoke('log-data-quality', {
        body: {
          coinId,
          metricType,
          ...qualityData
        }
      });
    } catch (error) {
      console.error('❌ Error logging data quality:', error);
    }
  }

  /**
   * Get data quality report for a coin
   */
  async getDataQualityReport(coinId: string): Promise<any> {
    try {
      const { data } = await supabase.functions.invoke('get-data-quality-report', {
        body: { coinId }
      });
      return data || {};
    } catch (error) {
      console.error('❌ Error fetching data quality report:', error);
      return {};
    }
  }

  /**
   * Calculate and store 36-month statistics
   */
  async calculate36MonthStatistics(coinId: string, priceHistory: PriceHistoryEntry[]): Promise<CalculatedFinancialMetrics | null> {
    try {
      if (priceHistory.length < 30) {
        console.warn(`⚠️ Insufficient data for ${coinId}: ${priceHistory.length} points`);
        return null;
      }

      console.log(`🔄 Calculating 36-month statistics for ${coinId} with ${priceHistory.length} data points`);

      // Calculate returns
      const returns = [];
      for (let i = 1; i < priceHistory.length; i++) {
        const todayPrice = priceHistory[i].priceUsd;
        const yesterdayPrice = priceHistory[i - 1].priceUsd;
        if (yesterdayPrice > 0) {
          returns.push((todayPrice - yesterdayPrice) / yesterdayPrice);
        }
      }

      if (returns.length === 0) return null;

      // Calculate volatility (standard deviation)
      const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
      const volatility = Math.sqrt(variance) * Math.sqrt(365) * 100; // Annualized

      // Calculate 36-month CAGR
      const startPrice = priceHistory[0].priceUsd;
      const endPrice = priceHistory[priceHistory.length - 1].priceUsd;
      const years = priceHistory.length / 365;
      const cagr = years > 0 ? (Math.pow(endPrice / startPrice, 1 / years) - 1) * 100 : 0;

      // Calculate Sharpe ratio (assuming risk-free rate of 5%)
      const riskFreeRate = 0.05;
      const excessReturn = (cagr / 100) - riskFreeRate;
      const sharpeRatio = volatility > 0 ? excessReturn / (volatility / 100) : 0;

      // Calculate data quality score
      const freshnessHours = (Date.now() - new Date(priceHistory[priceHistory.length - 1].priceDate).getTime()) / (1000 * 60 * 60);
      const completeness = (priceHistory.length / 1095) * 100; // Ideal: 36 months * 30.4 days
      const qualityScore = this.calculateDataQualityScore(
        priceHistory.length,
        completeness,
        freshnessHours,
        'healthy',
        true
      );

      const metrics: CalculatedFinancialMetrics = {
        coinId,
        realVolatility: volatility,
        realCagr36m: cagr,
        realStandardDeviation: volatility / 100,
        sharpeRatio,
        dataPointsUsed: priceHistory.length,
        dataQualityScore: qualityScore,
        isEstimated: false
      };

      // Store the calculated metrics
      await this.storeCalculatedMetrics(metrics);

      console.log(`✅ Calculated 36-month stats for ${coinId}: CAGR ${cagr.toFixed(2)}%, Volatility ${volatility.toFixed(2)}%, Quality ${qualityScore}%`);

      return metrics;
    } catch (error) {
      console.error('❌ Error calculating 36-month statistics:', error);
      return null;
    }
  }
}

export const enhancedDataPersistenceService = new EnhancedDataPersistenceService();

import { supabase } from '@/integrations/supabase/client';

export interface RealTimeAssetData {
  coin_id: string;
  name: string;
  symbol: string;
  current_price: number;
  market_cap: number;
  volatility: number;
  beta: number | null;
  sharpe_ratio: number | null;
  aviv_ratio: number | null;
  glass_node_supported: boolean;
  last_updated: string;
}

export interface RealTimePriceData {
  coin_id: string;
  price_date: string;
  price_usd: number;
  volume_24h: number;
  market_cap: number;
  data_source: string;
}

class RealTimeDataService {
  /**
   * Get real-time asset data from database
   */
  async getRealTimeAssets(): Promise<RealTimeAssetData[]> {
    try {
      const { data, error } = await supabase
        .from('coins')
        .select('*')
        .eq('api_status', 'healthy')
        .order('market_cap', { ascending: false });

      if (error) {
        console.error('Error fetching real-time assets:', error);
        return [];
      }

      return data?.map(coin => ({
        coin_id: coin.coin_id,
        name: coin.name,
        symbol: coin.coin_id.toUpperCase(),
        current_price: coin.current_price,
        market_cap: coin.market_cap || 0,
        volatility: coin.volatility || 0,
        beta: coin.beta,
        sharpe_ratio: coin.sharpe_ratio,
        aviv_ratio: coin.aviv_ratio,
        glass_node_supported: coin.glass_node_supported || false,
        last_updated: coin.updated_at || new Date().toISOString()
      })) || [];
    } catch (error) {
      console.error('Error in getRealTimeAssets:', error);
      return [];
    }
  }

  /**
   * Get price history for a specific coin
   */
  async getPriceHistory(coinId: string, days: number = 30): Promise<RealTimePriceData[]> {
    try {
      const { data, error } = await supabase
        .from('price_history_36m')
        .select('*')
        .eq('coin_id', coinId)
        .order('price_date', { ascending: false })
        .limit(days);

      if (error) {
        console.error('Error fetching price history:', error);
        return [];
      }

      return data?.map(price => ({
        coin_id: price.coin_id,
        price_date: price.price_date,
        price_usd: Number(price.price_usd),
        volume_24h: Number(price.volume_24h || 0),
        market_cap: Number(price.market_cap || 0),
        data_source: price.data_source
      })) || [];
    } catch (error) {
      console.error('Error in getPriceHistory:', error);
      return [];
    }
  }

  /**
   * Get Glass Node metrics for a coin
   */
  async getGlassNodeMetrics(coinId: string, days: number = 30) {
    try {
      const { data, error } = await supabase
        .from('cointime_metrics')
        .select('*')
        .eq('coin_id', coinId)
        .order('metric_date', { ascending: false })
        .limit(days);

      if (error) {
        console.error('Error fetching Glass Node metrics:', error);
        return [];
      }

      return data?.map(metric => ({
        coin_id: metric.coin_id,
        metric_date: metric.metric_date,
        aviv_ratio: metric.aviv_ratio,
        cointime_destroyed: metric.cointime_destroyed,
        cointime_created: metric.cointime_created,
        active_supply_pct: metric.active_supply_pct,
        vaulted_supply_pct: metric.vaulted_supply_pct,
        liquid_supply_pct: metric.liquid_supply_pct,
        confidence_score: metric.confidence_score,
        data_source: metric.data_source
      })) || [];
    } catch (error) {
      console.error('Error in getGlassNodeMetrics:', error);
      return [];
    }
  }

  /**
   * Get data quality status
   */
  async getDataQualityStatus() {
    try {
      const { data: coins } = await supabase
        .from('coins')
        .select('coin_id, api_status, glass_node_supported, last_glass_node_update');

      const { data: priceHistory } = await supabase
        .from('price_history_36m')
        .select('coin_id', { count: 'exact', head: true });

      const { data: glassNodeMetrics } = await supabase
        .from('cointime_metrics')
        .select('coin_id', { count: 'exact', head: true });

      const totalCoins = coins?.length || 0;
      const healthyCoins = coins?.filter(c => c.api_status === 'healthy').length || 0;
      const glassNodeSupported = coins?.filter(c => c.glass_node_supported).length || 0;

      return {
        totalCoins,
        healthyCoins,
        glassNodeSupported,
        priceHistoryRecords: priceHistory || 0,
        glassNodeMetricsRecords: glassNodeMetrics || 0,
        dataQualityScore: Math.round((healthyCoins / totalCoins) * 100) || 0
      };
    } catch (error) {
      console.error('Error getting data quality status:', error);
      return {
        totalCoins: 0,
        healthyCoins: 0,
        glassNodeSupported: 0,
        priceHistoryRecords: 0,
        glassNodeMetricsRecords: 0,
        dataQualityScore: 0
      };
    }
  }

  /**
   * Initialize real data pipeline
   */
  async initializeRealDataPipeline() {
    try {
      console.log('Initializing real data pipeline...');
      
      const { data, error } = await supabase.functions.invoke(
        'initialize-real-data-pipeline',
        { body: {} }
      );

      if (error) {
        console.error('Error initializing real data pipeline:', error);
        return { success: false, error: error.message };
      }

      console.log('Real data pipeline initialization result:', data);
      return data;
    } catch (error) {
      console.error('Error in initializeRealDataPipeline:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate real investment analysis using database data
   */
  async calculateRealInvestmentAnalysis(coinId: string, investmentAmount: number) {
    try {
      // Get coin data
      const { data: coin } = await supabase
        .from('coins')
        .select('*')
        .eq('coin_id', coinId)
        .single();

      if (!coin) {
        throw new Error('Coin not found');
      }

      // Get price history for calculations
      const priceHistory = await this.getPriceHistory(coinId, 365);
      
      if (priceHistory.length < 30) {
        throw new Error('Insufficient price history for analysis');
      }

      // Calculate real metrics
      const currentPrice = coin.current_price;
      const priceChanges = priceHistory.map((price, index) => {
        if (index === 0) return 0;
        return (price.price_usd - priceHistory[index - 1].price_usd) / priceHistory[index - 1].price_usd;
      }).filter(change => change !== 0);

      const volatility = this.calculateVolatility(priceChanges);
      const beta = coin.beta || 1.0;
      const sharpeRatio = coin.sharpe_ratio || 0;

      // Calculate expected returns based on historical performance
      const avgDailyReturn = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
      const annualizedReturn = (1 + avgDailyReturn) ** 365 - 1;

      // Calculate investment metrics
      const expectedValue = investmentAmount * (1 + annualizedReturn);
      const profit = expectedValue - investmentAmount;
      const roi = (profit / investmentAmount) * 100;

      // Calculate NPV and IRR
      const npv = this.calculateNPV(investmentAmount, expectedValue, 0.05); // 5% discount rate
      const irr = this.calculateIRR(investmentAmount, expectedValue);

      return {
        success: true,
        analysis: {
          coin_id: coinId,
          investment_amount: investmentAmount,
          current_price: currentPrice,
          expected_value: expectedValue,
          profit,
          roi,
          npv,
          irr,
          volatility,
          beta,
          sharpe_ratio: sharpeRatio,
          annualized_return: annualizedReturn * 100,
          data_quality: 'high',
          recommendation: this.getRecommendation(roi, volatility, sharpeRatio)
        }
      };
    } catch (error) {
      console.error('Error calculating real investment analysis:', error);
      return { success: false, error: error.message };
    }
  }

  private calculateVolatility(priceChanges: number[]): number {
    if (priceChanges.length === 0) return 0;
    
    const mean = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
    const variance = priceChanges.reduce((sum, change) => sum + Math.pow(change - mean, 2), 0) / priceChanges.length;
    
    return Math.sqrt(variance * 365); // Annualized volatility
  }

  private calculateNPV(investment: number, futureValue: number, discountRate: number): number {
    return futureValue / (1 + discountRate) - investment;
  }

  private calculateIRR(investment: number, futureValue: number): number {
    return (futureValue / investment) - 1;
  }

  private getRecommendation(roi: number, volatility: number, sharpeRatio: number): string {
    if (roi > 20 && volatility < 0.5 && sharpeRatio > 1) {
      return 'strong_buy';
    } else if (roi > 10 && volatility < 0.8) {
      return 'buy';
    } else if (roi > 0 && volatility < 1.2) {
      return 'hold';
    } else {
      return 'sell';
    }
  }
}

export const realTimeDataService = new RealTimeDataService();


import { supabase } from '@/integrations/supabase/client';
import { realTimeGlassNodeService } from './realTimeGlassNodeService';
import { bitcoinGlassNodeService } from './bitcoinGlassNodeService';

export interface InitializationResult {
  success: boolean;
  coinId: string;
  dataPoints: number;
  metricsPopulated: string[];
  errors: string[];
}

class GlassnodeDataInitializer {
  private readonly supportedCoins = [
    { coinId: 'bitcoin', symbol: 'BTC' },
    { coinId: 'ethereum', symbol: 'ETH' },
    { coinId: 'solana', symbol: 'SOL' },
    { coinId: 'cardano', symbol: 'ADA' },
    { coinId: 'chainlink', symbol: 'LINK' }
  ];

  async initializeAllCoins(): Promise<InitializationResult[]> {
    console.log('🚀 Starting comprehensive Glassnode data initialization');
    
    const results: InitializationResult[] = [];
    
    for (const coin of this.supportedCoins) {
      try {
        console.log(`📊 Initializing data for ${coin.coinId} (${coin.symbol})`);
        const result = await this.initializeCoinData(coin.coinId, coin.symbol);
        results.push(result);
      } catch (error) {
        console.error(`❌ Failed to initialize ${coin.coinId}:`, error);
        results.push({
          success: false,
          coinId: coin.coinId,
          dataPoints: 0,
          metricsPopulated: [],
          errors: [error.message]
        });
      }
    }
    
    console.log('✅ Glassnode data initialization completed');
    return results;
  }

  async initializeCoinData(coinId: string, symbol: string): Promise<InitializationResult> {
    const errors: string[] = [];
    const metricsPopulated: string[] = [];
    let totalDataPoints = 0;

    try {
      // 1. Fetch real-time Glassnode data (includes 36 months of price history)
      console.log(`🔄 Fetching real-time Glassnode data for ${symbol}`);
      const realTimeData = await realTimeGlassNodeService.fetchRealTimeData(coinId);
      
      if (realTimeData.priceHistory.length > 0) {
        // Store price history in database
        await this.storePriceHistory(coinId, realTimeData.priceHistory);
        metricsPopulated.push('price_history');
        totalDataPoints += realTimeData.priceHistory.length;
        console.log(`✅ Stored ${realTimeData.priceHistory.length} price points for ${coinId}`);
      }

      // 2. Store cointime metrics
      if (realTimeData.avivRatio > 0 || realTimeData.activeSupply > 0) {
        await this.storeCointimeMetrics(coinId, realTimeData);
        metricsPopulated.push('cointime_metrics');
        console.log(`✅ Stored cointime metrics for ${coinId}`);
      }

      // 3. Update coins table with real data
      await this.updateCoinData(coinId, symbol, realTimeData);
      metricsPopulated.push('coin_data');

      // 4. For Bitcoin, use specialized service for additional metrics
      if (symbol === 'BTC') {
        const bitcoinData = await bitcoinGlassNodeService.getBitcoinCointimeData();
        await this.storeBitcoinSpecificData(coinId, bitcoinData);
        metricsPopulated.push('bitcoin_specific');
        console.log(`✅ Stored Bitcoin-specific Glassnode data`);
      }

      return {
        success: true,
        coinId,
        dataPoints: totalDataPoints,
        metricsPopulated,
        errors
      };

    } catch (error) {
      console.error(`❌ Error initializing data for ${coinId}:`, error);
      errors.push(error.message);
      return {
        success: false,
        coinId,
        dataPoints: totalDataPoints,
        metricsPopulated,
        errors
      };
    }
  }

  private async storePriceHistory(coinId: string, priceHistory: Array<{ timestamp: number; price: number }>) {
    const priceEntries = priceHistory.map(point => ({
      coin_id: coinId,
      price_date: new Date(point.timestamp).toISOString().split('T')[0],
      price_usd: point.price,
      volume_24h: null,
      market_cap: null,
      data_source: 'glassnode'
    }));

    const { error } = await supabase
      .from('price_history_36m')
      .upsert(priceEntries, { onConflict: 'coin_id,price_date' });

    if (error) {
      throw new Error(`Failed to store price history: ${error.message}`);
    }
  }

  private async storeCointimeMetrics(coinId: string, data: any) {
    const { error } = await supabase
      .from('cointime_metrics')
      .upsert({
        coin_id: coinId,
        metric_date: new Date().toISOString().split('T')[0],
        aviv_ratio: data.avivRatio,
        active_supply_pct: data.activeSupply,
        vaulted_supply_pct: data.vaultedSupply,
        liquid_supply_pct: data.activeSupply,
        confidence_score: data.dataQuality,
        data_source: 'glassnode'
      }, { onConflict: 'coin_id,metric_date' });

    if (error) {
      throw new Error(`Failed to store cointime metrics: ${error.message}`);
    }
  }

  private async updateCoinData(coinId: string, symbol: string, data: any) {
    const { error } = await supabase
      .from('coins')
      .upsert({
        coin_id: coinId,
        name: this.getCoinName(symbol),
        current_price: data.priceHistory[data.priceHistory.length - 1]?.price || 0,
        cagr_36m: data.cagr36m,
        volatility: data.realizedVolatility,
        aviv_ratio: data.avivRatio,
        active_supply: data.activeSupply,
        vaulted_supply: data.vaultedSupply,
        glass_node_supported: true,
        premium_metrics_available: true,
        last_glass_node_update: new Date().toISOString(),
        glass_node_data_quality: data.dataQuality,
        api_status: 'healthy',
        beta_data_source: 'glassnode',
        beta_confidence: data.dataQuality > 70 ? 'high' : 'medium',
        updated_at: new Date().toISOString()
      }, { onConflict: 'coin_id' });

    if (error) {
      throw new Error(`Failed to update coin data: ${error.message}`);
    }
  }

  private async storeBitcoinSpecificData(coinId: string, bitcoinData: any) {
    // Store additional Bitcoin metrics if available
    const { error } = await supabase
      .from('cointime_metrics')
      .upsert({
        coin_id: coinId,
        metric_date: new Date().toISOString().split('T')[0],
        aviv_ratio: bitcoinData.avivRatio,
        cointime_destroyed: bitcoinData.cointimeDestroyed,
        liquid_supply_pct: bitcoinData.liquidSupply,
        confidence_score: 95, // Bitcoin has highest quality data
        data_source: 'glassnode_bitcoin'
      }, { onConflict: 'coin_id,metric_date' });

    if (error) {
      throw new Error(`Failed to store Bitcoin-specific data: ${error.message}`);
    }
  }

  private getCoinName(symbol: string): string {
    const names: Record<string, string> = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'SOL': 'Solana',
      'ADA': 'Cardano',
      'LINK': 'Chainlink'
    };
    return names[symbol] || symbol;
  }

  // Method to initialize data for a specific coin
  async initializeSingleCoin(coinId: string): Promise<InitializationResult> {
    const coin = this.supportedCoins.find(c => c.coinId === coinId);
    if (!coin) {
      throw new Error(`Unsupported coin: ${coinId}`);
    }
    
    return this.initializeCoinData(coin.coinId, coin.symbol);
  }

  // Method to check if data exists and is recent
  async checkDataFreshness(coinId: string): Promise<{ hasData: boolean; lastUpdate: string | null; dataAge: number }> {
    const { data } = await supabase
      .from('coins')
      .select('last_glass_node_update')
      .eq('coin_id', coinId)
      .single();

    if (!data || !data.last_glass_node_update) {
      return { hasData: false, lastUpdate: null, dataAge: Infinity };
    }

    const lastUpdate = new Date(data.last_glass_node_update);
    const now = new Date();
    const dataAge = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60); // hours

    return {
      hasData: true,
      lastUpdate: data.last_glass_node_update,
      dataAge
    };
  }
}

export const glassnodeDataInitializer = new GlassnodeDataInitializer();

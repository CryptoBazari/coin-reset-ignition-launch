
import { supabase } from '@/integrations/supabase/client';

interface DataFreshnessCheck {
  hasData: boolean;
  dataAge: number; // in hours
  lastUpdate: string | null;
  coinId: string;
}

class GlassnodeDataInitializer {
  private readonly supportedCoins = [
    'bitcoin', 'ethereum', 'solana', 'cardano', 'chainlink', 'avalanche'
  ];

  private readonly symbolMapping: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum', 
    'SOL': 'solana',
    'ADA': 'cardano',
    'LINK': 'chainlink',
    'AVAX': 'avalanche',
    // Handle lowercase versions
    'btc': 'bitcoin',
    'eth': 'ethereum',
    'sol': 'solana',
    'ada': 'cardano',
    'link': 'chainlink',
    'avax': 'avalanche'
  };

  /**
   * Map coin symbol to coinId
   */
  private mapSymbolToCoinId(input: string): string {
    return this.symbolMapping[input] || input.toLowerCase();
  }

  /**
   * Check if we have fresh data for a coin
   */
  async checkDataFreshness(coinInput: string): Promise<DataFreshnessCheck> {
    const coinId = this.mapSymbolToCoinId(coinInput);
    
    console.log(`🔍 Checking data freshness for: ${coinInput} → ${coinId}`);
    
    if (!this.supportedCoins.includes(coinId)) {
      console.warn(`❌ Unsupported coin: ${coinInput} (${coinId}). Supported coins: ${this.supportedCoins.join(', ')}`);
      return {
        hasData: false,
        dataAge: 999,
        lastUpdate: null,
        coinId: coinId
      };
    }

    try {
      // Check price history
      const { data: priceData } = await supabase
        .from('price_history_36m')
        .select('price_date, created_at')
        .eq('coin_id', coinId)
        .order('price_date', { ascending: false })
        .limit(1);

      // Check cointime metrics
      const { data: cointimeData } = await supabase
        .from('cointime_metrics')
        .select('metric_date, created_at')
        .eq('coin_id', coinId)
        .order('metric_date', { ascending: false })
        .limit(1);

      const hasData = (priceData && priceData.length > 0) || (cointimeData && cointimeData.length > 0);
      
      if (!hasData) {
        console.log(`📊 No data found for ${coinId}`);
        return {
          hasData: false,
          dataAge: 999,
          lastUpdate: null,
          coinId: coinId
        };
      }

      // Calculate data age from the most recent update
      const priceDate = priceData?.[0]?.created_at;
      const cointimeDate = cointimeData?.[0]?.created_at;
      
      const latestUpdate = [priceDate, cointimeDate]
        .filter(Boolean)
        .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0];

      const dataAge = latestUpdate 
        ? (Date.now() - new Date(latestUpdate).getTime()) / (1000 * 60 * 60)
        : 999;

      console.log(`✅ Data freshness for ${coinId}: ${dataAge.toFixed(1)} hours old`);
      
      return {
        hasData: true,
        dataAge,
        lastUpdate: latestUpdate || null,
        coinId: coinId
      };
      
    } catch (error) {
      console.error(`❌ Error checking data freshness for ${coinId}:`, error);
      return {
        hasData: false,
        dataAge: 999,
        lastUpdate: null,
        coinId: coinId
      };
    }
  }

  /**
   * Initialize data for a single coin
   */
  async initializeSingleCoin(coinInput: string): Promise<void> {
    const coinId = this.mapSymbolToCoinId(coinInput);
    
    console.log(`🚀 Initializing data for: ${coinInput} → ${coinId}`);
    
    if (!this.supportedCoins.includes(coinId)) {
      throw new Error(`Unsupported coin: ${coinInput} (${coinId}). Supported coins: ${this.supportedCoins.join(', ')}`);
    }

    try {
      // Initialize price history
      console.log(`📈 Fetching price history for ${coinId}...`);
      const { data: priceResult, error: priceError } = await supabase.functions.invoke('fetch-real-price-history', {
        body: { coinId }
      });

      if (priceError) {
        console.error(`❌ Price history initialization failed for ${coinId}:`, priceError);
        throw new Error(`Price history initialization failed: ${priceError.message}`);
      }

      // Initialize cointime metrics
      console.log(`🕐 Fetching cointime metrics for ${coinId}...`);
      const { data: cointimeResult, error: cointimeError } = await supabase.functions.invoke('store-cointime-metrics', {
        body: { coinId }
      });

      if (cointimeError) {
        console.error(`❌ Cointime metrics initialization failed for ${coinId}:`, cointimeError);
        // Don't throw here as cointime metrics might not be available for all coins
        console.warn(`⚠️ Cointime metrics not available for ${coinId}, continuing...`);
      }

      // Update coin metadata
      console.log(`🔄 Updating coin metadata for ${coinId}...`);
      const { error: updateError } = await supabase
        .from('coins')
        .update({
          last_glass_node_update: new Date().toISOString(),
          api_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('coin_id', coinId);

      if (updateError) {
        console.error(`❌ Failed to update coin metadata for ${coinId}:`, updateError);
      }

      console.log(`✅ Successfully initialized data for ${coinId}`);
      
    } catch (error) {
      console.error(`❌ Failed to initialize data for ${coinId}:`, error);
      throw error;
    }
  }

  /**
   * Initialize data for all supported coins
   */
  async initializeAllData(): Promise<void> {
    console.log('🚀 Initializing all Glassnode data...');
    
    const results = await Promise.allSettled(
      this.supportedCoins.map(coinId => this.initializeSingleCoin(coinId))
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    console.log(`✅ Initialization complete: ${successful} successful, ${failed} failed`);
    
    if (failed > 0) {
      console.warn(`⚠️ Some coins failed to initialize. Check logs for details.`);
    }
  }

  /**
   * Get supported coins list
   */
  getSupportedCoins(): string[] {
    return [...this.supportedCoins];
  }

  /**
   * Get symbol mapping
   */
  getSymbolMapping(): Record<string, string> {
    return { ...this.symbolMapping };
  }
}

export const glassnodeDataInitializer = new GlassnodeDataInitializer();

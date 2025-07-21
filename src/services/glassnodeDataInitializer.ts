
import { supabase } from '@/integrations/supabase/client';

interface DataFreshnessCheck {
  hasData: boolean;
  dataAge: number; // in hours
  lastUpdate: string | null;
  coinId: string;
}

export interface InitializationResult {
  coinId: string;
  success: boolean;
  dataPoints: number;
  errors: string[];
}

class GlassnodeDataInitializer {
  private supportedCoins: string[] = [];

  private readonly symbolMapping: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum', 
    'SOL': 'solana',
    'ADA': 'cardano',
    'LINK': 'chainlink',
    'AVAX': 'avalanche',
    'DOT': 'polkadot',
    'MATIC': 'polygon',
    'UNI': 'uniswap',
    'LTC': 'litecoin',
    'BCH': 'bitcoin-cash',
    'XLM': 'stellar',
    'AAVE': 'aave',
    'ATOM': 'cosmos',
    'ALGO': 'algorand',
    'VET': 'vechain',
    'THETA': 'theta',
    'FIL': 'filecoin',
    'TRX': 'tron',
    'EOS': 'eos',
    'XTZ': 'tezos',
    'NEO': 'neo',
    'IOTA': 'iota',
    'DASH': 'dash',
    'ZEC': 'zcash',
    'XMR': 'monero',
    'ETC': 'ethereum-classic',
    'DOGE': 'dogecoin',
    'SHIB': 'shiba-inu',
    'SAND': 'the-sandbox',
    'MANA': 'decentraland',
    'AXS': 'axie-infinity',
    'GALA': 'gala',
    'ENJ': 'enjin-coin',
    'CHZ': 'chiliz',
    'BAT': 'basic-attention-token',
    'ZRX': '0x',
    'COMP': 'compound',
    'MKR': 'maker',
    'SNX': 'synthetix',
    'YFI': 'yearn-finance',
    'SUSHI': 'sushi',
    'GRT': 'the-graph',
    'CRV': 'curve-dao-token',
    'USDT': 'tether',
    'USDC': 'usd-coin',
    'DAI': 'dai',
    'BUSD': 'binance-usd',
    'FRAX': 'frax',
    'TUSD': 'trueusd',
    'USDP': 'paxos-standard',
    'GUSD': 'gemini-dollar',
    'USDD': 'usdd',
    'LUSD': 'liquity-usd',
    // Handle lowercase versions
    'btc': 'bitcoin',
    'eth': 'ethereum',
    'sol': 'solana',
    'ada': 'cardano',
    'link': 'chainlink',
    'avax': 'avalanche',
    'dot': 'polkadot',
    'matic': 'polygon',
    'uni': 'uniswap',
    'ltc': 'litecoin'
  };

  constructor() {
    this.loadSupportedCoins();
  }

  /**
   * Load supported coins from database
   */
  private async loadSupportedCoins() {
    try {
      const { data: coins } = await supabase
        .from('coins')
        .select('coin_id')
        .eq('glass_node_supported', true);
      
      this.supportedCoins = coins?.map(coin => coin.coin_id) || [];
      console.log(`📊 Loaded ${this.supportedCoins.length} supported coins from database`);
    } catch (error) {
      console.error('Failed to load supported coins:', error);
      // Fallback to default list
      this.supportedCoins = [
        'bitcoin', 'ethereum', 'solana', 'cardano', 'chainlink', 'avalanche',
        'polkadot', 'polygon', 'uniswap', 'litecoin', 'bitcoin-cash', 'stellar'
      ];
    }
  }

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
    
    // Refresh supported coins list
    await this.loadSupportedCoins();
    
    if (!this.supportedCoins.includes(coinId)) {
      console.warn(`❌ Unsupported coin: ${coinInput} (${coinId}). Run asset discovery to add more coins.`);
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
  async initializeSingleCoin(coinInput: string): Promise<InitializationResult> {
    const coinId = this.mapSymbolToCoinId(coinInput);
    const errors: string[] = [];
    let dataPoints = 0;
    
    console.log(`🚀 Initializing data for: ${coinInput} → ${coinId}`);
    
    // Refresh supported coins list
    await this.loadSupportedCoins();
    
    if (!this.supportedCoins.includes(coinId)) {
      return {
        coinId,
        success: false,
        dataPoints: 0,
        errors: [`Unsupported coin: ${coinInput} (${coinId}). Run asset discovery to add more coins.`]
      };
    }

    try {
      // Initialize price history
      console.log(`📈 Fetching price history for ${coinId}...`);
      const { data: priceResult, error: priceError } = await supabase.functions.invoke('fetch-real-price-history', {
        body: { coinId }
      });

      if (priceError) {
        console.error(`❌ Price history initialization failed for ${coinId}:`, priceError);
        errors.push(`Price history failed: ${priceError.message}`);
      } else {
        dataPoints += priceResult?.dataPointsStored || 0;
      }

      // Initialize cointime metrics
      console.log(`🕐 Fetching cointime metrics for ${coinId}...`);
      const { data: cointimeResult, error: cointimeError } = await supabase.functions.invoke('store-cointime-metrics', {
        body: { coinId }
      });

      if (cointimeError) {
        console.error(`❌ Cointime metrics initialization failed for ${coinId}:`, cointimeError);
        errors.push(`Cointime metrics failed: ${cointimeError.message}`);
        console.warn(`⚠️ Cointime metrics not available for ${coinId}, continuing...`);
      } else {
        dataPoints += cointimeResult?.dataPointsStored || 0;
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
        errors.push(`Metadata update failed: ${updateError.message}`);
      }

      console.log(`✅ Successfully initialized data for ${coinId}`);
      
      return {
        coinId,
        success: errors.length === 0,
        dataPoints,
        errors
      };
      
    } catch (error) {
      console.error(`❌ Failed to initialize data for ${coinId}:`, error);
      return {
        coinId,
        success: false,
        dataPoints,
        errors: [...errors, error.message]
      };
    }
  }

  /**
   * Initialize data for all supported coins
   */
  async initializeAllCoins(): Promise<InitializationResult[]> {
    console.log('🚀 Initializing all Glassnode data...');
    
    // Refresh supported coins list
    await this.loadSupportedCoins();
    
    const results = await Promise.allSettled(
      this.supportedCoins.map(coinId => this.initializeSingleCoin(coinId))
    );

    const initResults: InitializationResult[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          coinId: this.supportedCoins[index],
          success: false,
          dataPoints: 0,
          errors: [result.reason?.message || 'Unknown error']
        };
      }
    });

    const successful = initResults.filter(r => r.success).length;
    const failed = initResults.filter(r => !r.success).length;

    console.log(`✅ Initialization complete: ${successful} successful, ${failed} failed`);
    
    return initResults;
  }

  /**
   * Initialize data for all supported coins (legacy method)
   */
  async initializeAllData(): Promise<void> {
    await this.initializeAllCoins();
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

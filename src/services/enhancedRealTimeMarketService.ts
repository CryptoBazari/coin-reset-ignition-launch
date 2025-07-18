
import { fetchGlassNodeMetric, GLASS_NODE_METRICS } from './glassNodeService';
import { realTimeMarketService, CoinData } from './realTimeMarketService';

interface GlassNodeCoinData extends CoinData {
  onChainMetrics?: {
    activeAddresses: number;
    exchangeInflow: number;
    exchangeOutflow: number;
    liquidSupply: number;
    illiquidSupply: number;
    cointimeDestroyed: number;
  };
}

class EnhancedRealTimeMarketService {
  private cache = new Map();
  private cacheExpiry = 300000; // 5 minutes cache for Glass Node data

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    return cached && (Date.now() - cached.timestamp) < this.cacheExpiry;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private getCache(key: string): any {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  async getEnhancedCoinData(coinId: string): Promise<GlassNodeCoinData | null> {
    const cacheKey = `enhanced-coin-${coinId}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      // Get basic coin data from existing service
      const basicData = await realTimeMarketService.getCoinData(coinId);
      if (!basicData) return null;

      // Get Glass Node on-chain metrics
      const coinSymbol = this.getCoinSymbol(coinId);
      const onChainMetrics = await this.getOnChainMetrics(coinSymbol);

      const enhancedData: GlassNodeCoinData = {
        ...basicData,
        onChainMetrics
      };

      this.setCache(cacheKey, enhancedData);
      return enhancedData;
    } catch (error) {
      console.error('Error fetching enhanced coin data:', error);
      // Fallback to basic data
      return await realTimeMarketService.getCoinData(coinId);
    }
  }

  async getGlassNodePriceHistory(coinId: string, days: number = 30): Promise<Array<[number, number]>> {
    const cacheKey = `glass-price-history-${coinId}-${days}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const coinSymbol = this.getCoinSymbol(coinId);
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const priceData = await fetchGlassNodeMetric(
        GLASS_NODE_METRICS.PRICE_USD,
        coinSymbol,
        since
      );

      const formattedData: Array<[number, number]> = priceData.map(point => [
        point.unix_timestamp * 1000, // Convert to milliseconds
        point.value
      ]);

      this.setCache(cacheKey, formattedData);
      return formattedData;
    } catch (error) {
      console.error('Error fetching Glass Node price history:', error);
      // Fallback to CoinGecko
      return await realTimeMarketService.getCoinPriceHistory(coinId, days);
    }
  }

  private async getOnChainMetrics(coinSymbol: string) {
    try {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
      
      const [
        activeAddresses,
        exchangeInflow,
        exchangeOutflow,
        liquidSupply,
        illiquidSupply,
        cointimeDestroyed
      ] = await Promise.all([
        fetchGlassNodeMetric(GLASS_NODE_METRICS.ACTIVE_ADDRESSES, coinSymbol, since),
        fetchGlassNodeMetric(GLASS_NODE_METRICS.EXCHANGE_INFLOW, coinSymbol, since),
        fetchGlassNodeMetric(GLASS_NODE_METRICS.EXCHANGE_OUTFLOW, coinSymbol, since),
        fetchGlassNodeMetric(GLASS_NODE_METRICS.LIQUID_SUPPLY, coinSymbol, since),
        fetchGlassNodeMetric(GLASS_NODE_METRICS.ILLIQUID_SUPPLY, coinSymbol, since),
        fetchGlassNodeMetric(GLASS_NODE_METRICS.COINTIME_DESTROYED, coinSymbol, since)
      ]);

      return {
        activeAddresses: this.getLatestValue(activeAddresses),
        exchangeInflow: this.getLatestValue(exchangeInflow),
        exchangeOutflow: this.getLatestValue(exchangeOutflow),
        liquidSupply: this.getLatestValue(liquidSupply),
        illiquidSupply: this.getLatestValue(illiquidSupply),
        cointimeDestroyed: this.getLatestValue(cointimeDestroyed)
      };
    } catch (error) {
      console.error('Error fetching on-chain metrics:', error);
      return {
        activeAddresses: 0,
        exchangeInflow: 0,
        exchangeOutflow: 0,
        liquidSupply: 0,
        illiquidSupply: 0,
        cointimeDestroyed: 0
      };
    }
  }

  private getLatestValue(data: any[]): number {
    return data.length > 0 ? data[data.length - 1].value : 0;
  }

  private getCoinSymbol(coinId: string): string {
    const symbolMap: { [key: string]: string } = {
      'bitcoin': 'BTC',
      'ethereum': 'ETH',
      'solana': 'SOL',
      'cardano': 'ADA',
      'BTC': 'BTC',
      'ETH': 'ETH',
      'SOL': 'SOL',
      'ADA': 'ADA'
    };
    
    return symbolMap[coinId] || 'BTC';
  }

  async getMultipleEnhancedCoinData(coinIds: string[]): Promise<GlassNodeCoinData[]> {
    const promises = coinIds.map(coinId => this.getEnhancedCoinData(coinId));
    const results = await Promise.all(promises);
    return results.filter(result => result !== null) as GlassNodeCoinData[];
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const enhancedRealTimeMarketService = new EnhancedRealTimeMarketService();
export type { GlassNodeCoinData };

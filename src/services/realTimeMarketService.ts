interface CoinData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  price_change_percentage_30d: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  ath: number;
  ath_change_percentage: number;
  atl: number;
  atl_change_percentage: number;
  last_updated: string;
}

interface MarketStats {
  total_market_cap: number;
  total_volume: number;
  market_cap_percentage: Record<string, number>;
  market_cap_change_percentage_24h_usd: number;
}

interface TrendingCoin {
  id: string;
  coin_id: number;
  name: string;
  symbol: string;
  market_cap_rank: number;
  thumb: string;
  small: string;
  large: string;
  slug: string;
  price_btc: number;
  score: number;
}

class RealTimeMarketService {
  private baseUrl = 'https://api.coingecko.com/api/v3';
  private cache = new Map();
  private cacheExpiry = 60000; // 1 minute cache

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

  async getCoinData(coinId: string): Promise<CoinData | null> {
    const cacheKey = `coin-${coinId}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`
      );
      
      if (!response.ok) throw new Error('Failed to fetch coin data');
      
      const data = await response.json();
      
      const coinData: CoinData = {
        id: data.id,
        symbol: data.symbol,
        name: data.name,
        current_price: data.market_data.current_price.usd,
        market_cap: data.market_data.market_cap.usd,
        market_cap_rank: data.market_cap_rank,
        price_change_percentage_24h: data.market_data.price_change_percentage_24h,
        price_change_percentage_7d: data.market_data.price_change_percentage_7d,
        price_change_percentage_30d: data.market_data.price_change_percentage_30d,
        circulating_supply: data.market_data.circulating_supply,
        total_supply: data.market_data.total_supply,
        max_supply: data.market_data.max_supply,
        ath: data.market_data.ath.usd,
        ath_change_percentage: data.market_data.ath_change_percentage.usd,
        atl: data.market_data.atl.usd,
        atl_change_percentage: data.market_data.atl_change_percentage.usd,
        last_updated: data.last_updated
      };

      this.setCache(cacheKey, coinData);
      return coinData;
    } catch (error) {
      console.error('Error fetching coin data:', error);
      return null;
    }
  }

  async getMultipleCoinData(coinIds: string[]): Promise<CoinData[]> {
    const cacheKey = `coins-${coinIds.sort().join(',')}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/coins/markets?vs_currency=usd&ids=${coinIds.join(',')}&order=market_cap_desc&per_page=250&page=1&sparkline=false`
      );
      
      if (!response.ok) throw new Error('Failed to fetch coins data');
      
      const data = await response.json();
      
      const coinsData: CoinData[] = data.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        current_price: coin.current_price,
        market_cap: coin.market_cap,
        market_cap_rank: coin.market_cap_rank,
        price_change_percentage_24h: coin.price_change_percentage_24h,
        price_change_percentage_7d: coin.price_change_percentage_7d_in_currency,
        price_change_percentage_30d: coin.price_change_percentage_30d_in_currency,
        circulating_supply: coin.circulating_supply,
        total_supply: coin.total_supply,
        max_supply: coin.max_supply,
        ath: coin.ath,
        ath_change_percentage: coin.ath_change_percentage,
        atl: coin.atl,
        atl_change_percentage: coin.atl_change_percentage,
        last_updated: coin.last_updated
      }));

      this.setCache(cacheKey, coinsData);
      return coinsData;
    } catch (error) {
      console.error('Error fetching multiple coins data:', error);
      return [];
    }
  }

  async getMarketStats(): Promise<MarketStats | null> {
    const cacheKey = 'market-stats';
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const response = await fetch(`${this.baseUrl}/global`);
      
      if (!response.ok) throw new Error('Failed to fetch market stats');
      
      const data = await response.json();
      
      const marketStats: MarketStats = {
        total_market_cap: data.data.total_market_cap.usd,
        total_volume: data.data.total_volume.usd,
        market_cap_percentage: data.data.market_cap_percentage,
        market_cap_change_percentage_24h_usd: data.data.market_cap_change_percentage_24h_usd
      };

      this.setCache(cacheKey, marketStats);
      return marketStats;
    } catch (error) {
      console.error('Error fetching market stats:', error);
      return null;
    }
  }

  async getTrendingCoins(): Promise<TrendingCoin[]> {
    const cacheKey = 'trending-coins';
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const response = await fetch(`${this.baseUrl}/search/trending`);
      
      if (!response.ok) throw new Error('Failed to fetch trending coins');
      
      const data = await response.json();
      
      const trendingCoins: TrendingCoin[] = data.coins.map((item: any) => ({
        id: item.item.id,
        coin_id: item.item.coin_id,
        name: item.item.name,
        symbol: item.item.symbol,
        market_cap_rank: item.item.market_cap_rank,
        thumb: item.item.thumb,
        small: item.item.small,
        large: item.item.large,
        slug: item.item.slug,
        price_btc: item.item.price_btc,
        score: item.item.score
      }));

      this.setCache(cacheKey, trendingCoins);
      return trendingCoins;
    } catch (error) {
      console.error('Error fetching trending coins:', error);
      return [];
    }
  }

  async getCoinPriceHistory(coinId: string, days: number = 30): Promise<Array<[number, number]>> {
    const cacheKey = `price-history-${coinId}-${days}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`
      );
      
      if (!response.ok) throw new Error('Failed to fetch price history');
      
      const data = await response.json();
      const priceHistory = data.prices || [];

      this.setCache(cacheKey, priceHistory);
      return priceHistory;
    } catch (error) {
      console.error('Error fetching price history:', error);
      return [];
    }
  }

  async searchCoins(query: string): Promise<Array<{id: string, name: string, symbol: string, thumb: string}>> {
    try {
      const response = await fetch(`${this.baseUrl}/search?query=${encodeURIComponent(query)}`);
      
      if (!response.ok) throw new Error('Failed to search coins');
      
      const data = await response.json();
      
      return data.coins.slice(0, 10).map((coin: any) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        thumb: coin.thumb
      }));
    } catch (error) {
      console.error('Error searching coins:', error);
      return [];
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  // WebSocket connection for real-time price updates
  createPriceWebSocket(coinIds: string[], callback: (data: any) => void): WebSocket | null {
    try {
      // Note: CoinGecko doesn't have a public WebSocket API
      // This is a placeholder for when you integrate with a service that provides WebSocket feeds
      // You could use services like Binance, Coinbase Pro, or a paid CoinGecko plan
      
      console.log('WebSocket functionality would be implemented here for real-time updates');
      return null;
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      return null;
    }
  }
}

export const realTimeMarketService = new RealTimeMarketService();
export type { CoinData, MarketStats, TrendingCoin };
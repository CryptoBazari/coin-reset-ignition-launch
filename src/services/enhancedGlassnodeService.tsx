import { supabase } from '@/integrations/supabase/client';

// Cache duration: 1 hour
const CACHE_DURATION = 60 * 60 * 1000;

interface GlassNodeDataPoint {
  t: number; // Unix timestamp
  v: number; // Value
}

interface CachedData {
  data: GlassNodeDataPoint[];
  timestamp: number;
  endpoint: string;
  coin: string;
}

export class EnhancedGlassnodeService {
  
  // Get 5 years ago timestamp
  private getFiveYearsAgoTimestamp(): number {
    return Math.floor((Date.now() - (5 * 365 * 24 * 60 * 60 * 1000)) / 1000);
  }

  // Get current timestamp
  private getCurrentTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  // Check if cached data is still valid
  private isCacheValid(cachedData: CachedData): boolean {
    return (Date.now() - cachedData.timestamp) < CACHE_DURATION;
  }

  // Save data to localStorage cache
  private saveToCache(endpoint: string, coin: string, data: GlassNodeDataPoint[]): void {
    try {
      const cacheData: CachedData = {
        data,
        timestamp: Date.now(),
        endpoint,
        coin
      };

      localStorage.setItem(`glassnode_${endpoint}_${coin}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Cache save error:', error);
    }
  }

  // Get data from localStorage cache
  private getFromCache(endpoint: string, coin: string): GlassNodeDataPoint[] | null {
    try {
      const cached = localStorage.getItem(`glassnode_${endpoint}_${coin}`);
      if (!cached) return null;

      const cachedData = JSON.parse(cached) as CachedData;
      if (this.isCacheValid(cachedData)) {
        console.log(`📦 Using cached data for ${endpoint}/${coin}`);
        return cachedData.data;
      }

      return null;
    } catch (error) {
      console.warn('Cache read error:', error);
      return null;
    }
  }

  // Fetch data from Glassnode via edge function
  private async fetchFromGlassnode(endpoint: string, coin: string): Promise<GlassNodeDataPoint[]> {
    console.log(`🔄 Fetching from Glassnode: ${endpoint} for ${coin}`);

    try {
      const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
        body: { 
          metric: endpoint,
          asset: coin,
          resolution: '1month' // Changed from '24h' to '1month' for monthly data
        }
      });

      if (error) {
        console.error(`❌ Edge function error for ${endpoint}/${coin}:`, error);
        throw new Error(`Edge function failed: ${error.message}`);
      }

      if (!data?.data || !Array.isArray(data.data)) {
        throw new Error('Invalid response format from edge function');
      }

      // Transform the data to match our interface
      const transformedData: GlassNodeDataPoint[] = data.data.map(point => ({
        t: point.unix_timestamp,
        v: point.value
      }));

      // Save to cache
      this.saveToCache(endpoint, coin, transformedData);
      
      console.log(`✅ Fetched ${transformedData.length} monthly data points for ${endpoint}/${coin}`);
      return transformedData;
    } catch (error) {
      console.error(`❌ Failed to fetch ${endpoint}/${coin}:`, error);
      throw new Error(`Failed to fetch data from Glassnode: ${error.message}`);
    }
  }

  // Get data with cache fallback
  private async getData(endpoint: string, coin: string): Promise<GlassNodeDataPoint[]> {
    // Try cache first
    const cachedData = this.getFromCache(endpoint, coin);
    if (cachedData) {
      return cachedData;
    }

    // Fetch from API via edge function
    return this.fetchFromGlassnode(endpoint, coin);
  }

  // Monthly closing prices for CAGR and projections
  async getMonthlyClosingPrices(coin: string): Promise<GlassNodeDataPoint[]> {
    return this.getData('market/price_usd_close', coin);
  }

  // OHLC data for volatility insights
  async getOHLCData(coin: string): Promise<GlassNodeDataPoint[]> {
    return this.getData('market/price_usd_ohlc', coin);
  }

  // Regional 30-day price changes
  async getRegionalPriceChanges(coin: string): Promise<{
    americas: GlassNodeDataPoint[];
    apac: GlassNodeDataPoint[];
    emea: GlassNodeDataPoint[];
  }> {
    const [americas, apac, emea] = await Promise.all([
      this.getData('market/amer_30d_price_change', coin),
      this.getData('market/apac_30d_price_change', coin),
      this.getData('market/emea_30d_price_change', coin)
    ]);

    return { americas, apac, emea };
  }

  // Realized volatility for beta calculation
  async getRealizedVolatility(coin: string): Promise<GlassNodeDataPoint[]> {
    return this.getData('market/realized_volatility_all', coin);
  }

  // Net realized profit/loss for refined returns
  async getNetRealizedProfitLoss(coin: string): Promise<GlassNodeDataPoint[]> {
    return this.getData('indicators/net_realized_profit_loss', coin);
  }

  // MVRV Z-Score for discount rate adjustment
  async getMVRVZScore(coin: string): Promise<GlassNodeDataPoint[]> {
    return this.getData('market/mvrv_z_score', coin);
  }

  // Price drawdown for stress testing
  async getPriceDrawdown(coin: string): Promise<GlassNodeDataPoint[]> {
    return this.getData('market/price_drawdown_relative', coin);
  }

  // Transfer volume for liquidity analysis
  async getTransferVolume(coin: string): Promise<GlassNodeDataPoint[]> {
    return this.getData('transactions/transfers_volume_mean', coin);
  }

  // Calculate CAGR from price history
  calculateCAGR(priceHistory: GlassNodeDataPoint[]): number {
    if (priceHistory.length < 2) return 0;

    const startPrice = priceHistory[0].v;
    const endPrice = priceHistory[priceHistory.length - 1].v;
    const years = (priceHistory[priceHistory.length - 1].t - priceHistory[0].t) / (365 * 24 * 60 * 60);

    if (startPrice <= 0 || endPrice <= 0 || years <= 0) return 0;

    return (Math.pow(endPrice / startPrice, 1 / years) - 1) * 100;
  }

  // Calculate monthly returns
  calculateMonthlyReturns(priceHistory: GlassNodeDataPoint[]): number[] {
    const returns: number[] = [];
    
    for (let i = 1; i < priceHistory.length; i++) {
      const prevPrice = priceHistory[i - 1].v;
      const currentPrice = priceHistory[i].v;
      
      if (prevPrice > 0) {
        returns.push((currentPrice - prevPrice) / prevPrice);
      }
    }
    
    return returns;
  }

  // Calculate annualized volatility
  calculateAnnualizedVolatility(returns: number[]): number {
    if (returns.length < 2) return 0;

    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (returns.length - 1);
    const monthlyStdDev = Math.sqrt(variance);
    
    // Annualize (12 months)
    return monthlyStdDev * Math.sqrt(12) * 100;
  }

  // Calculate maximum drawdown
  calculateMaxDrawdown(priceHistory: GlassNodeDataPoint[]): number {
    let maxDrawdown = 0;
    let peak = priceHistory[0]?.v || 0;

    for (const point of priceHistory) {
      if (point.v > peak) {
        peak = point.v;
      }

      const drawdown = (peak - point.v) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown * 100;
  }

  // Average regional price changes
  calculateAverageRegionalChange(regional: {
    americas: GlassNodeDataPoint[];
    apac: GlassNodeDataPoint[];
    emea: GlassNodeDataPoint[];
  }): number[] {
    const maxLength = Math.max(
      regional.americas.length,
      regional.apac.length,
      regional.emea.length
    );

    const averages: number[] = [];

    for (let i = 0; i < maxLength; i++) {
      const values: number[] = [];
      
      if (regional.americas[i]) values.push(regional.americas[i].v);
      if (regional.apac[i]) values.push(regional.apac[i].v);
      if (regional.emea[i]) values.push(regional.emea[i].v);

      if (values.length > 0) {
        averages.push(values.reduce((sum, val) => sum + val, 0) / values.length);
      }
    }

    return averages;
  }
}

// Export singleton instance
export const enhancedGlassnodeService = new EnhancedGlassnodeService();

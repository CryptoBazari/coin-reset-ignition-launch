import { supabase } from '@/integrations/supabase/client';

export interface BitcoinGlassNodeData {
  avivRatio: number;
  realizedVolatility: number;
  mvrvZScore: number;
  priceDrawdown: number;
  netRealizedPL: number;
  price: number;
  lastUpdated: string;
  dataQuality: {
    avivFromAPI: boolean;
    volatilityFromAPI: boolean;
    mvrvFromAPI: boolean;
    apiCallsSuccessful: number;
    apiCallsFailed: number;
  };
}

class BitcoinGlassNodeService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheExpiry = 300000; // 5 minutes

  async fetchBitcoinAvivRatio(): Promise<{ value: number; fromAPI: boolean }> {
    try {
      console.log('🔍 Fetching REAL Bitcoin AVIV ratio from Glass Node API');
      
      const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
        body: { 
          metric: 'indicators/aviv',
          asset: 'BTC',
          resolution: '24h'
        }
      });

      if (error) {
        console.error('❌ Failed to fetch Bitcoin AVIV ratio:', error);
        throw new Error(`AVIV API call failed: ${error.message}`);
      }

      if (!data?.data || data.data.length === 0) {
        console.error('❌ No AVIV data returned from API');
        throw new Error('No AVIV data available from Glassnode');
      }

      const latestData = data.data[data.data.length - 1];
      const avivRatio = latestData?.value || latestData?.v;
      
      if (typeof avivRatio !== 'number' || avivRatio <= 0) {
        throw new Error(`Invalid AVIV ratio received: ${avivRatio}`);
      }
      
      console.log(`📊 REAL Bitcoin AVIV Ratio from API: ${avivRatio.toFixed(3)}`);
      console.log(`📊 Data points received: ${data.data.length}`);
      console.log(`📊 Latest timestamp: ${new Date(latestData.timestamp).toISOString()}`);
      
      return { value: avivRatio, fromAPI: true };
    } catch (error) {
      console.error('❌ Error fetching Bitcoin AVIV ratio:', error);
      throw error; // Don't fallback, let caller handle the error
    }
  }

  async fetchBitcoinRealizedVolatility(): Promise<{ value: number; fromAPI: boolean }> {
    try {
      console.log('🔍 Fetching REAL Bitcoin volatility from Glass Node API');
      
      const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
        body: { 
          metric: 'market/realized_volatility_all',
          asset: 'BTC',
          resolution: '24h'
        }
      });

      if (error) {
        console.error('❌ Failed to fetch Bitcoin volatility:', error);
        throw new Error(`Volatility API call failed: ${error.message}`);
      }

      if (!data?.data || data.data.length === 0) {
        console.error('❌ No volatility data returned from API');
        throw new Error('No volatility data available from Glassnode');
      }

      const latestData = data.data[data.data.length - 1];
      const volatility = latestData?.value || latestData?.v;
      
      if (typeof volatility !== 'number' || volatility < 0) {
        throw new Error(`Invalid volatility received: ${volatility}`);
      }
      
      // Glassnode returns volatility as decimal (e.g., 0.65 = 65%)
      // Convert to percentage for display but keep reasonable bounds
      const volatilityPercent = volatility * 100;
      
      console.log(`📊 REAL Bitcoin Volatility from API:`);
      console.log(`   - Raw API value: ${volatility.toFixed(4)}`);
      console.log(`   - As percentage: ${volatilityPercent.toFixed(2)}%`);
      console.log(`   - Data points received: ${data.data.length}`);
      console.log(`   - Latest timestamp: ${new Date(latestData.timestamp).toISOString()}`);
      
      // Validate reasonable volatility range for Bitcoin (20-150%)
      if (volatilityPercent < 5 || volatilityPercent > 200) {
        console.warn(`⚠️ Unusual Bitcoin volatility: ${volatilityPercent.toFixed(2)}%`);
      }
      
      return { value: volatilityPercent, fromAPI: true };
    } catch (error) {
      console.error('❌ Error fetching Bitcoin volatility:', error);
      throw error; // Don't fallback, let caller handle the error
    }
  }

  async fetchBitcoinMVRVZScore(): Promise<{ value: number; fromAPI: boolean }> {
    try {
      console.log('🔍 Fetching Bitcoin MVRV Z-Score from Glass Node API');
      
      const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
        body: { 
          metric: 'market/mvrv_z_score',
          asset: 'BTC',
          resolution: '24h'
        }
      });

      if (error) throw error;

      const latestData = data?.data?.[data.data.length - 1];
      const mvrvZScore = latestData?.value || latestData?.v || 0;
      
      console.log(`📊 Bitcoin MVRV Z-Score: ${mvrvZScore.toFixed(3)}`);
      return { value: mvrvZScore, fromAPI: true };
    } catch (error) {
      console.error('❌ Error fetching Bitcoin MVRV Z-Score:', error);
      throw error;
    }
  }

  async fetchBitcoinPriceDrawdown(): Promise<{ value: number; fromAPI: boolean }> {
    try {
      console.log('🔍 Fetching Bitcoin price drawdown from Glass Node API');
      
      const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
        body: { 
          metric: 'market/price_drawdown_relative',
          asset: 'BTC',
          resolution: '24h'
        }
      });

      if (error) throw error;

      const latestData = data?.data?.[data.data.length - 1];
      const drawdown = Math.abs(latestData?.value || latestData?.v || 0);
      
      console.log(`📊 Bitcoin Price Drawdown: ${drawdown.toFixed(3)}`);
      return { value: drawdown, fromAPI: true };
    } catch (error) {
      console.error('❌ Error fetching Bitcoin price drawdown:', error);
      throw error;
    }
  }

  async fetchBitcoinPrice(): Promise<{ value: number; fromAPI: boolean }> {
    try {
      console.log('🔍 Fetching Bitcoin price from Glass Node API');
      
      const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
        body: { 
          metric: 'market/price_usd_close',
          asset: 'BTC',
          resolution: '24h'
        }
      });

      if (error) throw error;

      const latestData = data?.data?.[data.data.length - 1];
      const price = latestData?.value || latestData?.v || 50000;
      
      console.log(`📊 Bitcoin Price: $${price.toFixed(2)}`);
      return { value: price, fromAPI: true };
    } catch (error) {
      console.error('❌ Error fetching Bitcoin price:', error);
      throw error;
    }
  }

  async getBitcoinRealData(): Promise<BitcoinGlassNodeData> {
    const cacheKey = 'bitcoin-real-data';
    
    if (this.isCacheValid(cacheKey)) {
      console.log('📦 Using cached Bitcoin real data');
      return this.cache.get(cacheKey)!.data;
    }

    console.log('🔄 Fetching comprehensive REAL Bitcoin data from Glassnode...');
    
    const results = await Promise.allSettled([
      this.fetchBitcoinAvivRatio(),
      this.fetchBitcoinRealizedVolatility(),
      this.fetchBitcoinMVRVZScore(),
      this.fetchBitcoinPriceDrawdown(),
      this.fetchBitcoinPrice()
    ]);

    let apiCallsSuccessful = 0;
    let apiCallsFailed = 0;

    // Process AVIV ratio
    const avivResult = results[0];
    let avivRatio = 1.0;
    let avivFromAPI = false;
    if (avivResult.status === 'fulfilled') {
      avivRatio = avivResult.value.value;
      avivFromAPI = avivResult.value.fromAPI;
      apiCallsSuccessful++;
    } else {
      console.error('❌ AVIV ratio fetch failed:', avivResult.reason);
      apiCallsFailed++;
    }

    // Process volatility
    const volatilityResult = results[1];
    let realizedVolatility = 65.0; // Default for Bitcoin
    let volatilityFromAPI = false;
    if (volatilityResult.status === 'fulfilled') {
      realizedVolatility = volatilityResult.value.value;
      volatilityFromAPI = volatilityResult.value.fromAPI;
      apiCallsSuccessful++;
    } else {
      console.error('❌ Volatility fetch failed:', volatilityResult.reason);
      apiCallsFailed++;
    }

    // Process MVRV Z-Score
    const mvrvResult = results[2];
    let mvrvZScore = 0;
    let mvrvFromAPI = false;
    if (mvrvResult.status === 'fulfilled') {
      mvrvZScore = mvrvResult.value.value;
      mvrvFromAPI = mvrvResult.value.fromAPI;
      apiCallsSuccessful++;
    } else {
      console.error('❌ MVRV Z-Score fetch failed:', mvrvResult.reason);
      apiCallsFailed++;
    }

    // Process price drawdown
    const drawdownResult = results[3];
    let priceDrawdown = 0.2;
    if (drawdownResult.status === 'fulfilled') {
      priceDrawdown = drawdownResult.value.value;
      apiCallsSuccessful++;
    } else {
      console.error('❌ Price drawdown fetch failed:', drawdownResult.reason);
      apiCallsFailed++;
    }

    // Process price
    const priceResult = results[4];
    let price = 50000;
    if (priceResult.status === 'fulfilled') {
      price = priceResult.value.value;
      apiCallsSuccessful++;
    } else {
      console.error('❌ Price fetch failed:', priceResult.reason);
      apiCallsFailed++;
    }

    const bitcoinData: BitcoinGlassNodeData = {
      avivRatio,
      realizedVolatility,
      mvrvZScore,
      priceDrawdown,
      netRealizedPL: 0, // Can be added later
      price,
      lastUpdated: new Date().toISOString(),
      dataQuality: {
        avivFromAPI,
        volatilityFromAPI,
        mvrvFromAPI,
        apiCallsSuccessful,
        apiCallsFailed
      }
    };

    this.setCache(cacheKey, bitcoinData);
    
    console.log('✅ Bitcoin real data fetch completed');
    console.log(`📊 API Success Rate: ${apiCallsSuccessful}/${apiCallsSuccessful + apiCallsFailed}`);
    console.log(`📊 AVIV Ratio: ${avivRatio.toFixed(3)} (${avivFromAPI ? 'REAL API' : 'FALLBACK'})`);
    console.log(`📊 Volatility: ${realizedVolatility.toFixed(2)}% (${volatilityFromAPI ? 'REAL API' : 'FALLBACK'})`);
    
    return bitcoinData;
  }

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

  clearCache(): void {
    this.cache.clear();
  }
}

export const bitcoinGlassNodeService = new BitcoinGlassNodeService();

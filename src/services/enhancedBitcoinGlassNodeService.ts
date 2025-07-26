
import { supabase } from '@/integrations/supabase/client';
import { mockGlassNodeService } from './mockGlassNodeService';

export interface BitcoinGlassNodeData {
  avivRatio: number;
  cointimeDestroyed: number;
  liquidSupply: number;
  price: number;
  cointimePrice: number;
  cointimeRatio: number;
  lastUpdated: string;
  dataSource: 'glassnode' | 'test_data';
}

class EnhancedBitcoinGlassNodeService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheExpiry = 300000; // 5 minutes

  async fetchBitcoinAvivRatio(): Promise<{ value: number; source: string }> {
    try {
      console.log('🔍 Fetching Bitcoin AVIV ratio...');
      
      // Try Glassnode API first
      try {
        const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
          body: { 
            metric: 'indicators/aviv',
            asset: 'BTC',
            resolution: '24h'
          }
        });

        if (!error && data?.data?.[data.data.length - 1]) {
          const avivRatio = data.data[data.data.length - 1].value || 1.0;
          console.log(`📊 Bitcoin AVIV Ratio (Glassnode): ${avivRatio.toFixed(3)}`);
          return { value: avivRatio, source: 'glassnode' };
        }
      } catch (glassnodeError) {
        console.log('⚠️ Glassnode API unavailable, using test data');
      }

      // Fallback to test data
      const testData = mockGlassNodeService.getTestData('BTC');
      if (testData) {
        console.log(`📊 Bitcoin AVIV Ratio (Test Data): ${testData.avivRatio.toFixed(3)}`);
        return { value: testData.avivRatio, source: 'test_data' };
      }

      console.log('📊 Using fallback AVIV ratio');
      return { value: 1.0, source: 'fallback' };
      
    } catch (error) {
      console.error('❌ Error fetching Bitcoin AVIV ratio:', error);
      return { value: 1.0, source: 'error_fallback' };
    }
  }

  async fetchBitcoinCointimeDestroyed(): Promise<{ value: number; source: string }> {
    try {
      console.log('🔍 Fetching Bitcoin cointime destroyed...');
      
      // Try Glassnode API first
      try {
        const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
          body: { 
            metric: 'indicators/coin_blocks_destroyed',
            asset: 'BTC',
            resolution: '24h'
          }
        });

        if (!error && data?.data?.[data.data.length - 1]) {
          const cointimeDestroyed = data.data[data.data.length - 1].value || 0;
          console.log(`📊 Bitcoin Cointime Destroyed (Glassnode): ${cointimeDestroyed.toFixed(0)}`);
          return { value: cointimeDestroyed, source: 'glassnode' };
        }
      } catch (glassnodeError) {
        console.log('⚠️ Glassnode API unavailable, using test data');
      }

      // Fallback to test data
      const testData = mockGlassNodeService.getTestData('BTC');
      if (testData) {
        const mockResponse = await mockGlassNodeService.fetchCointimeDestroyed('BTC');
        const cointimeDestroyed = mockResponse.data[0]?.v || 0;
        console.log(`📊 Bitcoin Cointime Destroyed (Test Data): ${cointimeDestroyed.toFixed(0)}`);
        return { value: cointimeDestroyed, source: 'test_data' };
      }

      return { value: 0, source: 'fallback' };
      
    } catch (error) {
      console.error('❌ Error fetching Bitcoin cointime destroyed:', error);
      return { value: 0, source: 'error_fallback' };
    }
  }

  async fetchBitcoinLiquidSupply(): Promise<{ value: number; source: string }> {
    try {
      console.log('🔍 Fetching Bitcoin liquid supply...');
      
      // Try Glassnode API first
      try {
        const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
          body: { 
            metric: 'supply/liquid_sum',
            asset: 'BTC',
            resolution: '24h'
          }
        });

        if (!error && data?.data?.[data.data.length - 1]) {
          const liquidSupply = data.data[data.data.length - 1].value || 0;
          console.log(`📊 Bitcoin Liquid Supply (Glassnode): ${liquidSupply.toFixed(0)}`);
          return { value: liquidSupply, source: 'glassnode' };
        }
      } catch (glassnodeError) {
        console.log('⚠️ Glassnode API unavailable, using test data');
      }

      // Fallback to test data
      const testData = mockGlassNodeService.getTestData('BTC');
      if (testData) {
        console.log(`📊 Bitcoin Liquid Supply (Test Data): ${testData.liquidSupply.toFixed(0)}`);
        return { value: testData.liquidSupply, source: 'test_data' };
      }

      return { value: 0, source: 'fallback' };
      
    } catch (error) {
      console.error('❌ Error fetching Bitcoin liquid supply:', error);
      return { value: 0, source: 'error_fallback' };
    }
  }

  async fetchBitcoinPrice(): Promise<{ value: number; source: string }> {
    try {
      console.log('🔍 Fetching Bitcoin price...');
      
      // Try Glassnode API first  
      try {
        const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
          body: { 
            metric: 'market/price_usd_close',
            asset: 'BTC',
            resolution: '24h'
          }
        });

        if (!error && data?.data?.[data.data.length - 1]) {
          const price = data.data[data.data.length - 1].value || 50000;
          console.log(`📊 Bitcoin Price (Glassnode): $${price.toFixed(2)}`);
          return { value: price, source: 'glassnode' };
        }
      } catch (glassnodeError) {
        console.log('⚠️ Glassnode API unavailable, using test data');
      }

      // Fallback to test data
      const testData = mockGlassNodeService.getTestData('BTC');
      if (testData) {
        console.log(`📊 Bitcoin Price (Test Data): $${testData.currentPrice.toFixed(2)}`);
        return { value: testData.currentPrice, source: 'test_data' };
      }

      return { value: 50000, source: 'fallback' };
      
    } catch (error) {
      console.error('❌ Error fetching Bitcoin price:', error);
      return { value: 50000, source: 'error_fallback' };
    }
  }

  async getBitcoinCointimeData(): Promise<BitcoinGlassNodeData> {
    const cacheKey = 'bitcoin-cointime-data-enhanced';
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    try {
      console.log('🔄 Fetching comprehensive Bitcoin cointime data...');
      
      const [avivResult, cointimeResult, liquidSupplyResult, priceResult] = await Promise.all([
        this.fetchBitcoinAvivRatio(),
        this.fetchBitcoinCointimeDestroyed(),
        this.fetchBitcoinLiquidSupply(),
        this.fetchBitcoinPrice()
      ]);

      // Determine primary data source
      const sources = [avivResult.source, cointimeResult.source, liquidSupplyResult.source, priceResult.source];
      const dataSource = sources.includes('glassnode') ? 'glassnode' : 'test_data';

      // Calculate cointime metrics
      const cointimePrice = cointimeResult.value > 0 ? priceResult.value / cointimeResult.value : 0;
      const cointimeRatio = avivResult.value;

      const bitcoinData: BitcoinGlassNodeData = {
        avivRatio: avivResult.value,
        cointimeDestroyed: cointimeResult.value,
        liquidSupply: liquidSupplyResult.value,
        price: priceResult.value,
        cointimePrice,
        cointimeRatio,
        lastUpdated: new Date().toISOString(),
        dataSource
      };

      this.setCache(cacheKey, bitcoinData);
      
      console.log('✅ Bitcoin cointime data fetched successfully');
      console.log(`📊 Data Source: ${dataSource}, AVIV: ${avivResult.value.toFixed(3)}, Price: $${priceResult.value.toFixed(2)}`);
      
      return bitcoinData;
    } catch (error) {
      console.error('❌ Failed to fetch Bitcoin cointime data:', error);
      return this.getFallbackBitcoinData();
    }
  }

  private getFallbackBitcoinData(): BitcoinGlassNodeData {
    console.log('⚠️ Using fallback Bitcoin data');
    return {
      avivRatio: 1.0,
      cointimeDestroyed: 0,
      liquidSupply: 0,
      price: 50000,
      cointimePrice: 0,
      cointimeRatio: 1.0,
      lastUpdated: new Date().toISOString(),
      dataSource: 'test_data'
    };
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

export const enhancedBitcoinGlassNodeService = new EnhancedBitcoinGlassNodeService();

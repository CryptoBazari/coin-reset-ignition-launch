
import { supabase } from '@/integrations/supabase/client';

export interface BitcoinGlassNodeData {
  avivRatio: number;
  cointimeDestroyed: number;
  liquidSupply: number;
  price: number;
  stockToFlowRatio: number;
  cointimeRatio: number;
  lastUpdated: string;
}

class BitcoinGlassNodeService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheExpiry = 300000; // 5 minutes

  async fetchBitcoinAvivRatio(): Promise<number> {
    try {
      console.log('🔍 Fetching Bitcoin AVIV ratio from Glass Node API');
      
      const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
        body: { 
          metric: 'indicators/aviv',
          asset: 'BTC',
          resolution: '24h'
        }
      });

      if (error) {
        console.error('❌ Failed to fetch Bitcoin AVIV ratio:', error);
        return 1.0; // Fallback value
      }

      const latestData = data?.data?.[data.data.length - 1];
      const avivRatio = latestData?.value || 1.0;
      
      console.log(`📊 Bitcoin AVIV Ratio: ${avivRatio.toFixed(3)}`);
      return avivRatio;
    } catch (error) {
      console.error('❌ Error fetching Bitcoin AVIV ratio:', error);
      return 1.0; // Fallback
    }
  }

  async fetchBitcoinCointimeDestroyed(): Promise<number> {
    try {
      console.log('🔍 Fetching Bitcoin cointime destroyed from Glass Node API');
      
      const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
        body: { 
          metric: 'indicators/coin_blocks_destroyed',
          asset: 'BTC',
          resolution: '24h'
        }
      });

      if (error) {
        console.error('❌ Failed to fetch Bitcoin cointime destroyed:', error);
        return 0;
      }

      const latestData = data?.data?.[data.data.length - 1];
      const cointimeDestroyed = latestData?.value || 0;
      
      console.log(`📊 Bitcoin Cointime Destroyed: ${cointimeDestroyed.toFixed(0)}`);
      return cointimeDestroyed;
    } catch (error) {
      console.error('❌ Error fetching Bitcoin cointime destroyed:', error);
      return 0;
    }
  }

  async fetchBitcoinLiquidSupply(): Promise<number> {
    try {
      console.log('🔍 Fetching Bitcoin liquid supply from Glass Node API');
      
      const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
        body: { 
          metric: 'supply/liquid_sum',
          asset: 'BTC',
          resolution: '24h'
        }
      });

      if (error) {
        console.error('❌ Failed to fetch Bitcoin liquid supply:', error);
        return 0;
      }

      const latestData = data?.data?.[data.data.length - 1];
      const liquidSupply = latestData?.value || 0;
      
      console.log(`📊 Bitcoin Liquid Supply: ${liquidSupply.toFixed(0)}`);
      return liquidSupply;
    } catch (error) {
      console.error('❌ Error fetching Bitcoin liquid supply:', error);
      return 0;
    }
  }

  async fetchBitcoinPrice(): Promise<number> {
    try {
      console.log('🔍 Fetching Bitcoin price from Glass Node API');
      
      const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
        body: { 
          metric: 'market/price_usd_close',
          asset: 'BTC',
          resolution: '24h'
        }
      });

      if (error) {
        console.error('❌ Failed to fetch Bitcoin price:', error);
        return 50000; // Fallback price
      }

      const latestData = data?.data?.[data.data.length - 1];
      const price = latestData?.value || 50000;
      
      console.log(`📊 Bitcoin Price: $${price.toFixed(2)}`);
      return price;
    } catch (error) {
      console.error('❌ Error fetching Bitcoin price:', error);
      return 50000; // Fallback
    }
  }

  async fetchBitcoinStockToFlowRatio(): Promise<number> {
    try {
      console.log('🔍 Fetching Bitcoin Stock-to-Flow ratio from Glass Node API');
      
      const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
        body: { 
          metric: 'indicators/stock_to_flow_ratio',
          asset: 'BTC',
          resolution: '24h'
        }
      });

      if (error) {
        console.error('❌ Failed to fetch Bitcoin Stock-to-Flow ratio:', error);
        return 0; // Fallback value
      }

      const latestData = data?.data?.[data.data.length - 1];
      const stockToFlowRatio = latestData?.value || 0;
      
      console.log(`📊 Bitcoin Stock-to-Flow Ratio: ${stockToFlowRatio.toFixed(2)}`);
      return stockToFlowRatio;
    } catch (error) {
      console.error('❌ Error fetching Bitcoin Stock-to-Flow ratio:', error);
      return 0; // Fallback
    }
  }

  async getBitcoinCointimeData(): Promise<BitcoinGlassNodeData> {
    const cacheKey = 'bitcoin-cointime-data';
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    try {
      console.log('🔄 Fetching comprehensive Bitcoin cointime data...');
      
      const [avivRatio, cointimeDestroyed, liquidSupply, price, stockToFlowRatio] = await Promise.all([
        this.fetchBitcoinAvivRatio(),
        this.fetchBitcoinCointimeDestroyed(),
        this.fetchBitcoinLiquidSupply(),
        this.fetchBitcoinPrice(),
        this.fetchBitcoinStockToFlowRatio()
      ]);

      // Calculate cointime metrics using Bitcoin data
      const cointimeRatio = avivRatio; // AVIV ratio is essentially the cointime ratio

      const bitcoinData: BitcoinGlassNodeData = {
        avivRatio,
        cointimeDestroyed,
        liquidSupply,
        price,
        stockToFlowRatio,
        cointimeRatio,
        lastUpdated: new Date().toISOString()
      };

      this.setCache(cacheKey, bitcoinData);
      
      console.log('✅ Bitcoin cointime data fetched successfully');
      console.log(`📊 AVIV Ratio: ${avivRatio.toFixed(3)}, Stock-to-Flow Ratio: ${stockToFlowRatio.toFixed(2)}`);
      
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
      stockToFlowRatio: 0,
      cointimeRatio: 1.0,
      lastUpdated: new Date().toISOString()
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

export const bitcoinGlassNodeService = new BitcoinGlassNodeService();

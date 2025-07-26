import { supabase } from '@/integrations/supabase/client';
import { enhancedBitcoinGlassNodeService } from './enhancedBitcoinGlassNodeService';

export interface BitcoinGlassNodeData {
  avivRatio: number;
  cointimeDestroyed: number;
  liquidSupply: number;
  price: number;
  cointimePrice: number;
  cointimeRatio: number;
  lastUpdated: string;
}

class BitcoinGlassNodeService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheExpiry = 300000; // 5 minutes

  async fetchBitcoinAvivRatio(): Promise<number> {
    const result = await enhancedBitcoinGlassNodeService.fetchBitcoinAvivRatio();
    return result.value;
  }

  async fetchBitcoinCointimeDestroyed(): Promise<number> {
    const result = await enhancedBitcoinGlassNodeService.fetchBitcoinCointimeDestroyed();
    return result.value;
  }

  async fetchBitcoinLiquidSupply(): Promise<number> {
    const result = await enhancedBitcoinGlassNodeService.fetchBitcoinLiquidSupply();
    return result.value;
  }

  async fetchBitcoinPrice(): Promise<number> {
    const result = await enhancedBitcoinGlassNodeService.fetchBitcoinPrice();
    return result.value;
  }

  async getBitcoinCointimeData(): Promise<BitcoinGlassNodeData> {
    // Use enhanced service but maintain interface compatibility
    const enhancedData = await enhancedBitcoinGlassNodeService.getBitcoinCointimeData();
    
    return {
      avivRatio: enhancedData.avivRatio,
      cointimeDestroyed: enhancedData.cointimeDestroyed,
      liquidSupply: enhancedData.liquidSupply,
      price: enhancedData.price,
      cointimePrice: enhancedData.cointimePrice,
      cointimeRatio: enhancedData.cointimeRatio,
      lastUpdated: enhancedData.lastUpdated
    };
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

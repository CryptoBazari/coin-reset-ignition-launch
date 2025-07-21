import { supabase } from '@/integrations/supabase/client';
import { getOnChainAnalysis, fetchGlassNodeMetric, GLASS_NODE_METRICS } from '@/services/glassNodeService';
import { fetchCoinPrices } from '@/services/coinMarketCapService';
import type { CoinData, EnhancedCoinData } from '@/types/investment';

interface CointimeMetrics {
  avivRatio: number;
  activeSupply: number;
  vaultedSupply: number;
  liveliness: number;
  vaultedness: number;
  realizedCap: number;
  activeCap: number;
  investorCap: number;
}

interface OnChainData {
  transactionVolume: number;
  networkValue: number;
  activeAddresses: number;
  networkGrowth: number;
}

interface TechnicalIndicators {
  nvtRatio: number;
  sopr: number;
  puellMultiple: number;
  mvrv: number;
}

interface PriceHistory {
  daily: Array<{ timestamp: number; price: number; volume: number }>;
  volatility30d: number;
  volatility90d: number;
}

class EnhancedInvestmentDataService {
  private cache = new Map();
  private cacheExpiry = 300000; // 5 minutes

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

  async fetchEnhancedCoinData(coinId: string): Promise<EnhancedCoinData> {
    const cacheKey = `enhanced-coin-${coinId}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      // 1. Get base coin data from database
      const { data: coinDataRaw, error: coinError } = await supabase
        .from('coins')
        .select('*')
        .eq('coin_id', coinId)
        .single();

      if (coinError || !coinDataRaw) {
        throw new Error(`Coin ${coinId} not found in database`);
      }

      // 2. Get live price data from CoinMarketCap
      const livePriceData = await this.getLivePriceData(coinId);

      // 3. Get live Glass Node metrics
      const liveMetrics = await this.getLiveGlassNodeMetrics(coinId);

      // 4. Get on-chain activity data
      const onChainData = await this.getOnChainActivity(coinId);

      // 5. Get technical indicators
      const technicalIndicators = await this.getTechnicalIndicators(coinId);

      // 6. Get enhanced price history
      const priceHistory = await this.getEnhancedPriceHistory(coinId);

      // 7. Combine all data sources
      const enhancedCoinData: EnhancedCoinData = {
        // Base data from database
        id: coinDataRaw.id,
        coin_id: coinDataRaw.coin_id,
        name: coinDataRaw.name,
        basket: coinDataRaw.basket,
        
        // Live price data from CoinMarketCap
        current_price: livePriceData.current_price,
        market_cap: livePriceData.market_cap,
        
        // Static fallback data (updated periodically)
        price_history: coinDataRaw.price_history,
        cagr_36m: coinDataRaw.cagr_36m,
        fundamentals_score: coinDataRaw.fundamentals_score,
        staking_yield: coinDataRaw.staking_yield,
        
        // Enhanced with live Glass Node data
        volatility: priceHistory.volatility30d,
        aviv_ratio: liveMetrics.avivRatio,
        active_supply: liveMetrics.activeSupply,
        vaulted_supply: liveMetrics.vaultedSupply,
        cointime_inflation: this.calculateCointimeInflation(liveMetrics),
        
        // Enhanced risk metrics from database
        beta: coinDataRaw.beta,
        beta_last_calculated: coinDataRaw.beta_last_calculated,
        beta_data_source: coinDataRaw.beta_data_source,
        beta_confidence: coinDataRaw.beta_confidence,
        standard_deviation: coinDataRaw.standard_deviation,
        sharpe_ratio: coinDataRaw.sharpe_ratio,
        
        // New live data fields
        liveMetrics,
        onChainData,
        technicalIndicators,
        priceHistory
      };

      this.setCache(cacheKey, enhancedCoinData);
      return enhancedCoinData;

    } catch (error) {
      console.error(`Failed to fetch enhanced data for ${coinId}:`, error);
      
      // Fallback to basic data if Glass Node fails
      return this.fallbackToBasicData(coinId);
    }
  }

  private async getLivePriceData(coinId: string) {
    try {
      const symbolMap: Record<string, string> = {
        'BTC': 'BTC',
        'ETH': 'ETH',
        'SOL': 'SOL',
        'ADA': 'ADA',
        'LINK': 'LINK',
        'UNI': 'UNI',
        'AAVE': 'AAVE',
        'AVAX': 'AVAX'
      };

      const symbol = symbolMap[coinId];
      if (!symbol) {
        throw new Error(`No symbol mapping for ${coinId}`);
      }

      const priceData = await fetchCoinPrices([symbol]);
      const coinPrice = priceData.find(coin => coin.symbol === symbol);

      if (!coinPrice) {
        throw new Error(`Price data not found for ${symbol}`);
      }

      return {
        current_price: coinPrice.current_price,
        market_cap: coinPrice.market_cap,
        price_change_24h: coinPrice.price_change_24h,
        price_change_7d: coinPrice.price_change_7d || 0,
        price_change_30d: coinPrice.price_change_30d || 0
      };
    } catch (error) {
      console.error('Failed to get live price data:', error);
      throw error;
    }
  }

  private async getLiveGlassNodeMetrics(coinId: string): Promise<CointimeMetrics> {
    try {
      // Map coinId to Glass Node asset symbol
      const assetMap: Record<string, string> = {
        'BTC': 'BTC',
        'ETH': 'ETH',
        // Add other supported assets
      };

      const asset = assetMap[coinId];
      if (!asset) {
        console.log(`Glass Node asset mapping not found for ${coinId}, using fallback`);
        return this.getFallbackCointimeMetrics();
      }

      // Get market cap and realized cap data
      const marketCapData = await fetchGlassNodeMetric(GLASS_NODE_METRICS.MARKET_CAP, asset);
      const activeAddressesData = await fetchGlassNodeMetric(GLASS_NODE_METRICS.ACTIVE_ADDRESSES, asset);
      const liquidSupplyData = await fetchGlassNodeMetric(GLASS_NODE_METRICS.LIQUID_SUPPLY, asset);
      const illiquidSupplyData = await fetchGlassNodeMetric(GLASS_NODE_METRICS.ILLIQUID_SUPPLY, asset);

      // Get latest values
      const latestMarketCap = marketCapData[marketCapData.length - 1]?.value || 0;
      const latestActiveAddresses = activeAddressesData[activeAddressesData.length - 1]?.value || 0;
      const latestLiquidSupply = liquidSupplyData[liquidSupplyData.length - 1]?.value || 0;
      const latestIlliquidSupply = illiquidSupplyData[illiquidSupplyData.length - 1]?.value || 0;

      // Calculate derived metrics
      const totalSupply = latestLiquidSupply + latestIlliquidSupply;
      const activeSupply = totalSupply > 0 ? (latestLiquidSupply / totalSupply) * 100 : 50;
      const vaultedSupply = totalSupply > 0 ? (latestIlliquidSupply / totalSupply) * 100 : 50;
      const liveliness = activeSupply / 100;
      const vaultedness = 1 - liveliness;

      return {
        avivRatio: 1.2, // Placeholder - would need realized cap calculation
        activeSupply,
        vaultedSupply,
        liveliness,
        vaultedness,
        realizedCap: latestMarketCap * 0.8, // Approximation
        activeCap: latestMarketCap * liveliness,
        investorCap: latestMarketCap * vaultedness
      };
    } catch (error) {
      console.error(`Failed to get Glass Node metrics for ${coinId}:`, error);
      return this.getFallbackCointimeMetrics();
    }
  }

  private getFallbackCointimeMetrics(): CointimeMetrics {
    return {
      avivRatio: 1.0,
      activeSupply: 50,
      vaultedSupply: 50,
      liveliness: 0.5,
      vaultedness: 0.5,
      realizedCap: 0,
      activeCap: 0,
      investorCap: 0
    };
  }

  private async getOnChainActivity(coinId: string): Promise<OnChainData> {
    try {
      const assetMap: Record<string, string> = {
        'BTC': 'BTC',
        'ETH': 'ETH'
      };

      const asset = assetMap[coinId];
      if (!asset) {
        return {
          transactionVolume: 0,
          networkValue: 0,
          activeAddresses: 0,
          networkGrowth: 0
        };
      }

      const activeAddressesData = await fetchGlassNodeMetric(GLASS_NODE_METRICS.ACTIVE_ADDRESSES, asset);
      const exchangeInflowData = await fetchGlassNodeMetric(GLASS_NODE_METRICS.EXCHANGE_INFLOW, asset);

      // Calculate network growth rate from last 30 days
      const networkGrowth = this.calculateGrowthRate(activeAddressesData.slice(-30));

      return {
        transactionVolume: exchangeInflowData[exchangeInflowData.length - 1]?.value || 0,
        networkValue: 0, // Would need additional calculation
        activeAddresses: activeAddressesData[activeAddressesData.length - 1]?.value || 0,
        networkGrowth
      };
    } catch (error) {
      console.error('Failed to get on-chain activity:', error);
      return {
        transactionVolume: 0,
        networkValue: 0,
        activeAddresses: 0,
        networkGrowth: 0
      };
    }
  }

  private async getTechnicalIndicators(coinId: string): Promise<TechnicalIndicators> {
    try {
      // For now, return placeholder values as Glass Node premium metrics
      // would require specific API calls for NVT, SOPR, etc.
      return {
        nvtRatio: 0,
        sopr: 1,
        puellMultiple: 1,
        mvrv: 1
      };
    } catch (error) {
      console.error('Failed to get technical indicators:', error);
      return {
        nvtRatio: 0,
        sopr: 1,
        puellMultiple: 1,
        mvrv: 1
      };
    }
  }

  private async getEnhancedPriceHistory(coinId: string): Promise<PriceHistory> {
    try {
      const assetMap: Record<string, string> = {
        'BTC': 'BTC',
        'ETH': 'ETH'
      };

      const asset = assetMap[coinId];
      if (!asset) {
        return {
          daily: [],
          volatility30d: 50,
          volatility90d: 50
        };
      }

      const priceData = await fetchGlassNodeMetric(GLASS_NODE_METRICS.PRICE_USD, asset);
      
      // Use last 90 days of data
      const recentData = priceData.slice(-90);
      
      // Transform to required format
      const daily = recentData.map(point => ({
        timestamp: point.unix_timestamp,
        price: point.value,
        volume: 0 // Would need separate volume endpoint
      }));

      // Calculate volatilities
      const volatility30d = this.calculateVolatility(recentData.slice(-30));
      const volatility90d = this.calculateVolatility(recentData);

      return {
        daily,
        volatility30d,
        volatility90d
      };
    } catch (error) {
      console.error('Failed to get price history:', error);
      return {
        daily: [],
        volatility30d: 50,
        volatility90d: 50
      };
    }
  }

  private calculateCointimeInflation(metrics: CointimeMetrics): number {
    // Cointime-adjusted inflation rate formula from ARK/Glass Node paper
    const nominalInflation = 1.64; // Current Bitcoin inflation rate
    const activeVaultedRatio = metrics.vaultedSupply > 0 ? metrics.activeSupply / metrics.vaultedSupply : 1;
    
    return nominalInflation * activeVaultedRatio;
  }

  private calculateGrowthRate(data: Array<{ timestamp: string; value: number; unix_timestamp: number }>): number {
    if (data.length < 2) return 0;
    
    const latest = data[data.length - 1].value;
    const previous = data[0].value;
    
    return previous > 0 ? ((latest - previous) / previous) * 100 : 0;
  }

  private calculateVolatility(priceData: Array<{ value: number }>): number {
    if (priceData.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < priceData.length; i++) {
      const returnRate = (priceData[i].value - priceData[i-1].value) / priceData[i-1].value;
      returns.push(returnRate);
    }
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * Math.sqrt(365) * 100; // Annualized volatility percentage
  }

  private async fallbackToBasicData(coinId: string): Promise<EnhancedCoinData> {
    // Fallback implementation using database data only
    const { data: coinDataRaw } = await supabase
      .from('coins')
      .select('*')
      .eq('coin_id', coinId)
      .single();

    if (!coinDataRaw) {
      throw new Error(`No fallback data available for ${coinId}`);
    }

    return {
      ...coinDataRaw,
      liveMetrics: {
        avivRatio: coinDataRaw.aviv_ratio || 1.0,
        activeSupply: coinDataRaw.active_supply || 50,
        vaultedSupply: coinDataRaw.vaulted_supply || 50,
        liveliness: 0.5,
        vaultedness: 0.5,
        realizedCap: 0,
        activeCap: 0,
        investorCap: 0
      },
      onChainData: {
        transactionVolume: 0,
        networkValue: 0,
        activeAddresses: 0,
        networkGrowth: 0
      },
      technicalIndicators: {
        nvtRatio: 0,
        sopr: 1,
        puellMultiple: 1,
        mvrv: 1
      },
      priceHistory: {
        daily: [],
        volatility30d: coinDataRaw.volatility || 50,
        volatility90d: coinDataRaw.volatility || 50
      }
    } as EnhancedCoinData;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const enhancedInvestmentDataService = new EnhancedInvestmentDataService();
export type { EnhancedCoinData, CointimeMetrics, OnChainData, TechnicalIndicators, PriceHistory };
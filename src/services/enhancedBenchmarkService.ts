
import { supabase } from '@/integrations/supabase/client';

export interface BenchmarkData {
  name: string;
  symbol: string;
  currentValue: number;
  cagr36m: number;
  priceHistory: Array<{ date: string; price: number }>;
  volatility: number;
  lastUpdated: string;
}

class EnhancedBenchmarkService {
  private cache = new Map<string, { data: BenchmarkData; timestamp: number }>();
  private cacheExpiry = 3600000; // 1 hour

  async getBenchmarkForCoin(coinId: string): Promise<BenchmarkData> {
    // Bitcoin uses S&P 500 as benchmark, all others use Bitcoin
    const benchmarkSymbol = coinId.toLowerCase() === 'bitcoin' || coinId.toLowerCase() === 'btc' ? 'SP500' : 'BTC';
    
    console.log(`🎯 Getting benchmark for ${coinId}: ${benchmarkSymbol}`);
    
    if (benchmarkSymbol === 'SP500') {
      return await this.getSP500Benchmark();
    } else {
      return await this.getBitcoinBenchmark();
    }
  }

  private async getSP500Benchmark(): Promise<BenchmarkData> {
    const cacheKey = 'sp500-benchmark';
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    try {
      console.log('📈 Fetching S&P 500 benchmark data...');
      
      // Fetch from database first
      const { data: dbData, error } = await supabase
        .from('benchmarks')
        .select('*')
        .eq('benchmark_id', 'SP500')
        .single();

      if (!error && dbData) {
        const benchmarkData: BenchmarkData = {
          name: 'S&P 500',
          symbol: 'SP500',
          currentValue: dbData.current_value,
          cagr36m: dbData.cagr_36m,
          priceHistory: [], // Could be expanded to fetch real data
          volatility: 16, // Historical S&P 500 volatility ~16%
          lastUpdated: dbData.updated_at
        };

        this.setCache(cacheKey, benchmarkData);
        console.log(`✅ S&P 500 benchmark: ${benchmarkData.cagr36m.toFixed(2)}% CAGR`);
        return benchmarkData;
      }

      // Fallback to estimated S&P 500 data
      const fallbackData: BenchmarkData = {
        name: 'S&P 500',
        symbol: 'SP500',
        currentValue: 4500,
        cagr36m: 10.5, // Historical S&P 500 average
        priceHistory: [],
        volatility: 16,
        lastUpdated: new Date().toISOString()
      };

      console.log('⚠️ Using fallback S&P 500 data');
      return fallbackData;
    } catch (error) {
      console.error('❌ Failed to fetch S&P 500 benchmark:', error);
      return {
        name: 'S&P 500',
        symbol: 'SP500',
        currentValue: 4500,
        cagr36m: 10.5,
        priceHistory: [],
        volatility: 16,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  private async getBitcoinBenchmark(): Promise<BenchmarkData> {
    const cacheKey = 'bitcoin-benchmark';
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    try {
      console.log('₿ Fetching Bitcoin benchmark data...');
      
      // Fetch from database first
      const { data: dbData, error } = await supabase
        .from('benchmarks')
        .select('*')
        .eq('benchmark_id', 'BTC')
        .single();

      if (!error && dbData) {
        const benchmarkData: BenchmarkData = {
          name: 'Bitcoin',
          symbol: 'BTC',
          currentValue: dbData.current_value,
          cagr36m: dbData.cagr_36m,
          priceHistory: [],
          volatility: 80, // Bitcoin historical volatility ~80%
          lastUpdated: dbData.updated_at
        };

        this.setCache(cacheKey, benchmarkData);
        console.log(`✅ Bitcoin benchmark: ${benchmarkData.cagr36m.toFixed(2)}% CAGR`);
        return benchmarkData;
      }

      // Fallback: fetch real Bitcoin data from Glass Node
      const { data: priceData, error: priceError } = await supabase.functions.invoke('fetch-glassnode-data', {
        body: { 
          metric: 'market/price_usd_close',
          asset: 'BTC',
          resolution: '24h'
        }
      });

      if (!priceError && priceData?.data?.length > 0) {
        const currentPrice = priceData.data[priceData.data.length - 1].value;
        const oldPrice = priceData.data[0].value;
        const years = 3;
        const cagr = (Math.pow(currentPrice / oldPrice, 1/years) - 1) * 100;

        const benchmarkData: BenchmarkData = {
          name: 'Bitcoin',
          symbol: 'BTC',
          currentValue: currentPrice,
          cagr36m: cagr,
          priceHistory: [],
          volatility: 80,
          lastUpdated: new Date().toISOString()
        };

        this.setCache(cacheKey, benchmarkData);
        console.log(`✅ Bitcoin benchmark (real data): ${cagr.toFixed(2)}% CAGR`);
        return benchmarkData;
      }

      // Final fallback
      const fallbackData: BenchmarkData = {
        name: 'Bitcoin',
        symbol: 'BTC',
        currentValue: 50000,
        cagr36m: 40, // Historical Bitcoin average
        priceHistory: [],
        volatility: 80,
        lastUpdated: new Date().toISOString()
      };

      console.log('⚠️ Using fallback Bitcoin benchmark data');
      return fallbackData;
    } catch (error) {
      console.error('❌ Failed to fetch Bitcoin benchmark:', error);
      return {
        name: 'Bitcoin',
        symbol: 'BTC',
        currentValue: 50000,
        cagr36m: 40,
        priceHistory: [],
        volatility: 80,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    return cached && (Date.now() - cached.timestamp) < this.cacheExpiry;
  }

  private setCache(key: string, data: BenchmarkData): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const enhancedBenchmarkService = new EnhancedBenchmarkService();

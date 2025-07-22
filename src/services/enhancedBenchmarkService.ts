
import { supabase } from '@/integrations/supabase/client';

export interface BenchmarkData {
  name: string;
  symbol: string;
  currentValue: number;
  cagr36m: number;
  priceHistory: Array<{ date: string; price: number }>;
  volatility: number;
  monthlyReturns: number[];
  lastUpdated: string;
}

class EnhancedBenchmarkService {
  private cache = new Map<string, { data: BenchmarkData; timestamp: number }>();
  private cacheExpiry = 300000; // 5 minutes - shorter cache for debugging

  async getBenchmarkForCoin(coinId: string): Promise<BenchmarkData> {
    // Bitcoin uses S&P 500 as benchmark, all others use Bitcoin
    const benchmarkSymbol = coinId.toLowerCase() === 'bitcoin' || coinId.toLowerCase() === 'btc' ? 'SP500' : 'BTC';
    
    console.log(`🎯 Getting benchmark for ${coinId}: ${benchmarkSymbol} (FORCING FRESH API CALLS)`);
    
    if (benchmarkSymbol === 'SP500') {
      return await this.getSP500Benchmark();
    } else {
      return await this.getBitcoinBenchmark();
    }
  }

  private async getSP500Benchmark(): Promise<BenchmarkData> {
    const cacheKey = 'sp500-benchmark';
    
    // SKIP CACHE TEMPORARILY - Force fresh API call
    console.log('⚠️ SKIPPING S&P 500 CACHE - Forcing fresh API call');

    try {
      console.log('📈 Fetching S&P 500 benchmark data from Alpha Vantage (FORCED)...');
      
      // Check database ONLY for current value, not monthly returns
      const { data: dbData, error } = await supabase
        .from('benchmarks')
        .select('*')
        .eq('benchmark_id', 'SP500')
        .single();

      // Always fetch from Alpha Vantage for monthly returns
      console.log('🔄 Calling Alpha Vantage API for S&P 500 monthly data...');
      const { data: spyData, error: spyError } = await supabase.functions.invoke('fetch-sp500-data');

      if (!spyError && spyData?.monthlyReturns?.length > 0) {
        console.log(`✅ S&P 500 API SUCCESS: ${spyData.monthlyReturns.length} monthly returns`);
        console.log(`📊 First 5 S&P 500 returns:`, spyData.monthlyReturns.slice(0, 5));
        console.log(`📊 Last 5 S&P 500 returns:`, spyData.monthlyReturns.slice(-5));
        
        const benchmarkData: BenchmarkData = {
          name: 'S&P 500',
          symbol: 'SP500',
          currentValue: dbData?.current_value || spyData.data[spyData.data.length - 1]?.close || 4500,
          cagr36m: (spyData.cagr || 0.085) * 100,
          priceHistory: spyData.data || [],
          volatility: (spyData.volatility || 0.16) * 100,
          monthlyReturns: spyData.monthlyReturns,
          lastUpdated: new Date().toISOString()
        };

        this.setCache(cacheKey, benchmarkData);
        console.log(`✅ S&P 500 benchmark REAL DATA: ${benchmarkData.cagr36m.toFixed(2)}% CAGR, ${benchmarkData.monthlyReturns.length} monthly returns`);
        return benchmarkData;
      }

      console.error('❌ S&P 500 API call failed:', { spyError, dataLength: spyData?.monthlyReturns?.length });
      
      // Use database fallback ONLY if API completely fails
      if (!error && dbData) {
        console.log('⚠️ Using S&P 500 database fallback');
        const benchmarkData: BenchmarkData = {
          name: 'S&P 500',
          symbol: 'SP500',
          currentValue: dbData.current_value,
          cagr36m: dbData.cagr_36m,
          priceHistory: [],
          volatility: 16,
          monthlyReturns: [], // Empty - will cause calculation to fail appropriately
          lastUpdated: dbData.updated_at
        };
        return benchmarkData;
      }

      throw new Error('Both API and database failed for S&P 500');

    } catch (error) {
      console.error('❌ Complete S&P 500 failure:', error);
      
      // Only return fallback data as absolute last resort
      const fallbackData: BenchmarkData = {
        name: 'S&P 500',
        symbol: 'SP500',
        currentValue: 4500,
        cagr36m: 8.5,
        priceHistory: [],
        volatility: 16,
        monthlyReturns: [], // Empty array to signal failure
        lastUpdated: new Date().toISOString()
      };

      console.log('⚠️ Using S&P 500 EMPTY fallback - Beta calculation will fail appropriately');
      return fallbackData;
    }
  }

  private async getBitcoinBenchmark(): Promise<BenchmarkData> {
    const cacheKey = 'bitcoin-benchmark';
    
    // SKIP CACHE TEMPORARILY - Force fresh API call
    console.log('⚠️ SKIPPING Bitcoin CACHE - Forcing fresh API call');

    try {
      console.log('₿ Fetching Bitcoin benchmark data from Glassnode (FORCED)...');
      
      // Check database ONLY for current value, not monthly returns
      const { data: dbData, error } = await supabase
        .from('benchmarks')
        .select('*')
        .eq('benchmark_id', 'BTC')
        .single();

      // Always fetch Bitcoin monthly data from Glassnode
      console.log('🔄 Calling Glassnode API for Bitcoin monthly data...');
      const { data: priceData, error: priceError } = await supabase.functions.invoke('fetch-glassnode-data', {
        body: { 
          metric: 'market/price_usd_close',
          asset: 'BTC',
          resolution: '1month'
        }
      });

      if (!priceError && priceData?.data?.length > 0) {
        const prices = priceData.data.slice(-36); // Last 36 months
        const currentPrice = prices[prices.length - 1].value;
        const oldPrice = prices[0].value;
        const years = 3;
        const cagr = (Math.pow(currentPrice / oldPrice, 1/years) - 1) * 100;

        // Calculate monthly returns
        const monthlyReturns = [];
        for (let i = 1; i < prices.length; i++) {
          const prevPrice = prices[i - 1].value;
          const currentPricePoint = prices[i].value;
          if (prevPrice > 0) {
            monthlyReturns.push((currentPricePoint - prevPrice) / prevPrice);
          }
        }

        console.log(`✅ Bitcoin API SUCCESS: ${monthlyReturns.length} monthly returns`);
        console.log(`📊 First 5 Bitcoin returns:`, monthlyReturns.slice(0, 5));
        console.log(`📊 Last 5 Bitcoin returns:`, monthlyReturns.slice(-5));

        const benchmarkData: BenchmarkData = {
          name: 'Bitcoin',
          symbol: 'BTC',
          currentValue: dbData?.current_value || currentPrice,
          cagr36m: dbData?.cagr_36m || cagr,
          priceHistory: prices.map(p => ({
            date: new Date(p.unix_timestamp * 1000).toISOString().split('T')[0],
            price: p.value
          })),
          volatility: 80,
          monthlyReturns: monthlyReturns,
          lastUpdated: new Date().toISOString()
        };

        this.setCache(cacheKey, benchmarkData);
        console.log(`✅ Bitcoin benchmark REAL DATA: ${cagr.toFixed(2)}% CAGR, ${monthlyReturns.length} monthly returns`);
        return benchmarkData;
      }

      console.error('❌ Bitcoin API call failed:', { priceError, dataLength: priceData?.data?.length });

      // Use database fallback ONLY if API completely fails
      if (!error && dbData) {
        console.log('⚠️ Using Bitcoin database fallback');
        const benchmarkData: BenchmarkData = {
          name: 'Bitcoin',
          symbol: 'BTC',
          currentValue: dbData.current_value,
          cagr36m: dbData.cagr_36m,
          priceHistory: [],
          volatility: 80,
          monthlyReturns: [], // Empty - will cause calculation to fail appropriately
          lastUpdated: dbData.updated_at
        };
        return benchmarkData;
      }

      throw new Error('Both API and database failed for Bitcoin');

    } catch (error) {
      console.error('❌ Complete Bitcoin failure:', error);
      
      // Only return fallback data as absolute last resort
      const fallbackData: BenchmarkData = {
        name: 'Bitcoin',
        symbol: 'BTC',
        currentValue: 50000,
        cagr36m: 40,
        priceHistory: [],
        volatility: 80,
        monthlyReturns: [], // Empty array to signal failure
        lastUpdated: new Date().toISOString()
      };

      console.log('⚠️ Using Bitcoin EMPTY fallback - Beta calculation will fail appropriately');
      return fallbackData;
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
    console.log('🗑️ Benchmark cache cleared - forcing fresh API calls');
  }
}

export const enhancedBenchmarkService = new EnhancedBenchmarkService();

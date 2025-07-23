import { supabase } from '@/integrations/supabase/client';

export interface BetaCalculationResult {
  beta: number;
  correlation: number;
  confidence: 'low' | 'medium' | 'high';
  dataPoints: number;
  benchmarkUsed: string;
  assetReturns: number[];
  benchmarkReturns: number[];
  lastCalculated: string;
  dataQualityScore: number;
}

export interface MonthlyPriceData {
  date: string;
  price: number;
}

class GlassnodeBetaCalculationService {
  private cache = new Map<string, { data: BetaCalculationResult; timestamp: number }>();
  private cacheExpiry = 86400000; // 24 hours

  /**
   * Step 1: Determine the Asset and Benchmark
   * - BTC → S&P 500 benchmark
   * - Altcoins → BTC benchmark
   */
  private determineBenchmark(asset: string): { benchmarkSymbol: string; useGlassnode: boolean; useFred: boolean } {
    const normalizedAsset = asset.toLowerCase();
    
    if (normalizedAsset === 'btc' || normalizedAsset === 'bitcoin') {
      return { benchmarkSymbol: 'SP500', useGlassnode: false, useFred: true };
    }
    
    return { benchmarkSymbol: 'BTC', useGlassnode: true, useFred: false };
  }

  /**
   * Step 2: Fetch Historical Closing Prices Using APIs
   * Uses Unix timestamps for 3-6 year period (exact 36 months)
   */
  async calculateBeta(coinId: string): Promise<BetaCalculationResult> {
    const cacheKey = `beta-${coinId}`;
    
    if (this.isCacheValid(cacheKey)) {
      console.log(`📊 Using cached beta for ${coinId}`);
      return this.cache.get(cacheKey)!.data;
    }

    try {
      console.log(`🔄 Calculating beta for ${coinId} using Glassnode + FRED APIs...`);
      
      // Step 1: Determine benchmark
      const { benchmarkSymbol, useGlassnode, useFred } = this.determineBenchmark(coinId);
      console.log(`📋 Asset: ${coinId}, Benchmark: ${benchmarkSymbol}, Glassnode: ${useGlassnode}, FRED: ${useFred}`);

      // Calculate 36-month period (from 3 years ago to now)
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setFullYear(startDate.getFullYear() - 3);
      
      const startUnix = Math.floor(startDate.getTime() / 1000);
      const endUnix = Math.floor(endDate.getTime() / 1000);
      
      console.log(`📅 Period: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
      console.log(`📅 Unix range: ${startUnix} to ${endUnix}`);

      // Step 2.1: Fetch Asset Prices (always from Glassnode)
      const assetPrices = await this.fetchGlassnodeData(coinId, startUnix, endUnix);
      if (!assetPrices || assetPrices.length < 36) {
        throw new Error(`Insufficient asset data: got ${assetPrices?.length || 0} points, need 36+`);
      }

      // Step 2.2: Fetch Benchmark Prices
      let benchmarkPrices: MonthlyPriceData[];
      if (useFred) {
        benchmarkPrices = await this.fetchFredData('SP500', startDate, endDate);
      } else {
        benchmarkPrices = await this.fetchGlassnodeData('btc', startUnix, endUnix);
      }

      if (!benchmarkPrices || benchmarkPrices.length < 36) {
        throw new Error(`Insufficient benchmark data: got ${benchmarkPrices?.length || 0} points, need 36+`);
      }

      // Align data by dates and aggregate to monthly
      const { alignedAsset, alignedBenchmark } = this.alignAndAggregateToMonthly(assetPrices, benchmarkPrices);
      
      if (alignedAsset.length < 36 || alignedBenchmark.length < 36) {
        throw new Error(`Insufficient aligned data: Asset ${alignedAsset.length}, Benchmark ${alignedBenchmark.length}`);
      }

      // Step 3: Calculate Monthly Returns
      const assetReturns = this.calculateReturns(alignedAsset);
      const benchmarkReturns = this.calculateReturns(alignedBenchmark);

      if (assetReturns.length !== benchmarkReturns.length || assetReturns.length < 35) {
        throw new Error(`Return alignment failed: Asset ${assetReturns.length}, Benchmark ${benchmarkReturns.length}`);
      }

      // Steps 4-8: Calculate Beta using CAPM formula
      const betaResult = this.calculateBetaFromReturns(assetReturns, benchmarkReturns, benchmarkSymbol, coinId);
      
      this.setCache(cacheKey, betaResult);
      console.log(`✅ Beta calculated for ${coinId}: ${betaResult.beta.toFixed(3)} vs ${benchmarkSymbol}`);
      
      return betaResult;
    } catch (error) {
      console.error(`❌ Beta calculation failed for ${coinId}:`, error);
      throw error;
    }
  }

  /**
   * Step 2.1: Fetch data from Glassnode API
   */
  private async fetchGlassnodeData(asset: string, startUnix: number, endUnix: number): Promise<MonthlyPriceData[]> {
    try {
      console.log(`🌐 Fetching Glassnode data for ${asset}...`);
      
      const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
        body: {
          metric: 'market/price_usd_close',
          asset: asset.toLowerCase(),
          resolution: '24h',
          since: startUnix,
          until: endUnix
        }
      });

      if (error) {
        throw new Error(`Glassnode API error: ${error.message}`);
      }

      if (!data.success || !data.data || data.data.length === 0) {
        throw new Error(`No Glassnode data received for ${asset}`);
      }

      console.log(`✅ Fetched ${data.data.length} Glassnode data points for ${asset}`);
      
      return data.data.map((point: any) => ({
        date: new Date(point.t * 1000).toISOString().split('T')[0],
        price: point.v
      }));
    } catch (error) {
      console.error(`❌ Glassnode fetch failed for ${asset}:`, error);
      throw error;
    }
  }

  /**
   * Step 2.2: Fetch S&P 500 data from FRED API
   */
  private async fetchFredData(seriesId: string, startDate: Date, endDate: Date): Promise<MonthlyPriceData[]> {
    try {
      console.log(`🌐 Fetching FRED data for ${seriesId}...`);
      
      const { data, error } = await supabase.functions.invoke('fetch-sp500-data', {
        body: {
          series_id: seriesId,
          observation_start: startDate.toISOString().split('T')[0],
          observation_end: endDate.toISOString().split('T')[0]
        }
      });

      if (error) {
        throw new Error(`FRED API error: ${error.message}`);
      }

      if (!data.success || !data.data || data.data.length === 0) {
        throw new Error(`No FRED data received for ${seriesId}`);
      }

      console.log(`✅ Fetched ${data.data.length} FRED data points for ${seriesId}`);
      
      return data.data.map((point: any) => ({
        date: point.date,
        price: parseFloat(point.value)
      })).filter((point: MonthlyPriceData) => !isNaN(point.price));
    } catch (error) {
      console.error(`❌ FRED fetch failed for ${seriesId}:`, error);
      throw error;
    }
  }

  /**
   * Align data by dates and aggregate to monthly end-of-month
   */
  private alignAndAggregateToMonthly(
    assetData: MonthlyPriceData[], 
    benchmarkData: MonthlyPriceData[]
  ): { alignedAsset: MonthlyPriceData[]; alignedBenchmark: MonthlyPriceData[] } {
    console.log(`📊 Aligning and aggregating data to monthly...`);
    
    // Group by month and take end-of-month prices
    const groupByMonth = (data: MonthlyPriceData[]) => {
      const grouped = new Map<string, MonthlyPriceData[]>();
      
      data.forEach(point => {
        const monthKey = point.date.substring(0, 7); // YYYY-MM
        if (!grouped.has(monthKey)) {
          grouped.set(monthKey, []);
        }
        grouped.get(monthKey)!.push(point);
      });

      // Get end-of-month prices (last trading day of each month)
      return Array.from(grouped.entries())
        .map(([month, prices]) => {
          const sortedPrices = prices.sort((a, b) => a.date.localeCompare(b.date));
          return {
            date: month + '-01', // Standardize to first of month
            price: sortedPrices[sortedPrices.length - 1].price // Last price of month
          };
        })
        .sort((a, b) => a.date.localeCompare(b.date));
    };

    const monthlyAsset = groupByMonth(assetData);
    const monthlyBenchmark = groupByMonth(benchmarkData);

    // Find common months
    const assetMonths = new Set(monthlyAsset.map(p => p.date.substring(0, 7)));
    const benchmarkMonths = new Set(monthlyBenchmark.map(p => p.date.substring(0, 7)));
    const commonMonths = Array.from(assetMonths).filter(month => benchmarkMonths.has(month)).sort();

    console.log(`📅 Found ${commonMonths.length} common months for alignment`);

    const alignedAsset = monthlyAsset.filter(p => commonMonths.includes(p.date.substring(0, 7)));
    const alignedBenchmark = monthlyBenchmark.filter(p => commonMonths.includes(p.date.substring(0, 7)));

    return { alignedAsset, alignedBenchmark };
  }

  /**
   * Step 3: Calculate Monthly Returns
   * Formula: R_t = (Close_t - Close_{t-1}) / Close_{t-1}
   */
  private calculateReturns(prices: MonthlyPriceData[]): number[] {
    console.log(`📊 Calculating returns from ${prices.length} price points...`);
    
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      const currentPrice = prices[i].price;
      const previousPrice = prices[i - 1].price;
      
      if (previousPrice > 0) {
        const monthlyReturn = (currentPrice - previousPrice) / previousPrice;
        returns.push(monthlyReturn);
      }
    }
    
    console.log(`📊 Calculated ${returns.length} monthly returns`);
    return returns;
  }

  /**
   * Steps 4-8: Calculate Beta using CAPM
   * β = Covariance(Asset Returns, Benchmark Returns) / Variance(Benchmark Returns)
   */
  private calculateBetaFromReturns(
    assetReturns: number[], 
    benchmarkReturns: number[], 
    benchmarkSymbol: string,
    coinId: string
  ): BetaCalculationResult {
    console.log(`📊 Calculating beta from ${assetReturns.length} return pairs...`);
    
    const n = assetReturns.length;
    
    // Step 4: Calculate Overall Means
    const assetMean = assetReturns.reduce((sum, r) => sum + r, 0) / n;
    const benchmarkMean = benchmarkReturns.reduce((sum, r) => sum + r, 0) / n;
    
    console.log(`📊 Asset mean return: ${(assetMean * 100).toFixed(2)}% monthly`);
    console.log(`📊 Benchmark mean return: ${(benchmarkMean * 100).toFixed(2)}% monthly`);

    // Step 5: Calculate Deviations and Steps 6-7: Covariance and Variance
    let covariance = 0;
    let benchmarkVariance = 0;
    let assetVariance = 0;

    for (let i = 0; i < n; i++) {
      const assetDeviation = assetReturns[i] - assetMean;
      const benchmarkDeviation = benchmarkReturns[i] - benchmarkMean;
      
      covariance += assetDeviation * benchmarkDeviation;
      benchmarkVariance += benchmarkDeviation * benchmarkDeviation;
      assetVariance += assetDeviation * assetDeviation;
    }

    // Sample covariance and variance (n-1)
    covariance /= (n - 1);
    benchmarkVariance /= (n - 1);
    assetVariance /= (n - 1);

    // Step 8: Calculate Beta
    if (benchmarkVariance <= 0) {
      throw new Error('Benchmark variance is zero or negative');
    }

    const beta = covariance / benchmarkVariance;
    
    // Calculate correlation for validation
    const correlation = covariance / (Math.sqrt(assetVariance) * Math.sqrt(benchmarkVariance));
    
    // Determine confidence based on data quality
    let confidence: 'low' | 'medium' | 'high' = 'low';
    if (n >= 36 && Math.abs(correlation) > 0.7) confidence = 'high';
    else if (n >= 24 && Math.abs(correlation) > 0.5) confidence = 'medium';
    
    // Calculate data quality score
    const dataQualityScore = Math.min(100, 
      (n / 36 * 50) + // 50% weight for data completeness
      (Math.abs(correlation) * 30) + // 30% weight for correlation strength
      (20) // 20% base score
    );

    console.log(`📊 Beta: ${beta.toFixed(3)}, Correlation: ${correlation.toFixed(3)}, Quality: ${dataQualityScore.toFixed(1)}%`);

    return {
      beta,
      correlation,
      confidence,
      dataPoints: n,
      benchmarkUsed: benchmarkSymbol,
      assetReturns,
      benchmarkReturns,
      lastCalculated: new Date().toISOString(),
      dataQualityScore: Math.round(dataQualityScore)
    };
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    return cached && (Date.now() - cached.timestamp) < this.cacheExpiry;
  }

  private setCache(key: string, data: BetaCalculationResult): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const glassnodeBetaCalculationService = new GlassnodeBetaCalculationService();
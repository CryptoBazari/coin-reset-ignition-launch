import { supabase } from "@/integrations/supabase/client";

interface ComprehensiveBetaResult {
  asset: string;
  beta: number;
  beta_unadjusted: number;
  calculation_window: number;
  volatility_30d: number;
  median_daily_volume: number;
  liquidity_adjustment_factor: number;
  data_points: number;
  window_start_date: string;
  window_end_date: string;
  benchmark: string;
  benchmark_source: string;
  methodology: string;
  confidence_level: 'high' | 'medium' | 'low';
  data_quality_score: number;
  provisional_estimate?: boolean;
  liquidity_warning?: boolean;
  volume_completeness_warning?: boolean;
}

interface PriceVolumeData {
  date: string;
  price: number;
  volume: number;
}

interface AlignedData {
  date: string;
  asset_price: number;
  asset_volume: number;
  benchmark_price: number;
}

interface ReturnData {
  date: string;
  asset_return: number;
  benchmark_return: number;
}

class ComprehensiveBetaWorkflowService {
  private cache: Map<string, ComprehensiveBetaResult> = new Map();
  private readonly CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

  async calculateComprehensiveBeta(coinSymbol: string): Promise<ComprehensiveBetaResult> {
    const cacheKey = `comprehensive_beta_${coinSymbol.toLowerCase()}`;
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      console.log(`Starting comprehensive beta calculation for ${coinSymbol}`);
      
      // Phase 1: Determine benchmark and data sources
      const { benchmark, benchmarkSource, useGlassnode } = this.determineBenchmark(coinSymbol);
      
      // Phase 2: Fetch data
      const [assetData, benchmarkData, volumeData] = await Promise.all([
        this.fetchAssetPriceData(coinSymbol),
        this.fetchBenchmarkData(benchmark, benchmarkSource),
        this.fetchAssetVolumeData(coinSymbol)
      ]);

      if (!assetData.length || !benchmarkData.length) {
        throw new Error('Insufficient data for calculation');
      }

      // Phase 3: Align data
      const alignedData = this.alignDataSources(assetData, benchmarkData, volumeData);
      
      if (alignedData.length < 180) {
        console.warn(`⚠️ Insufficient aligned data for reliable beta calculation (${alignedData.length} points)`);
        return this.getProvisionalEstimate(coinSymbol, benchmark, benchmarkSource);
      }

      console.log(`📊 Proceeding with ${alignedData.length} aligned data points for beta calculation`);

      // Phase 4: Calculate returns
      const returns = this.calculateLogReturns(alignedData);
      
      // Phase 5: Adaptive window selection
      const { selectedWindow, volatility30d } = this.selectAdaptiveWindow(returns);
      const windowedReturns = returns.slice(-selectedWindow);
      
      // Phase 6: Calculate base beta
      const { beta: baseBeta, covariance, variance } = this.calculateBaseBeta(windowedReturns);
      
      // Phase 7: Apply liquidity adjustment
      const medianVolume = this.calculateMedianVolume(alignedData.slice(-30));
      const adjustmentFactor = this.calculateLiquidityAdjustment(medianVolume);
      const adjustedBeta = baseBeta * adjustmentFactor;
      
      // Phase 8: Quality assessment and warnings
      const confidenceLevel = this.assessConfidenceLevel(windowedReturns.length, variance, volatility30d);
      const { dataQualityScore, volumeWarning } = this.calculateDataQualityScoreWithWarnings(alignedData, windowedReturns);
      const liquidityWarning = medianVolume < 1e6; // Warn if extremely low liquidity

      const result: ComprehensiveBetaResult = {
        asset: coinSymbol.toUpperCase(),
        beta: Math.round(adjustedBeta * 1000) / 1000,
        beta_unadjusted: Math.round(baseBeta * 1000) / 1000,
        calculation_window: selectedWindow,
        volatility_30d: Math.round(volatility30d * 10000) / 10000,
        median_daily_volume: medianVolume,
        liquidity_adjustment_factor: Math.round(adjustmentFactor * 1000) / 1000,
        data_points: windowedReturns.length,
        window_start_date: windowedReturns[0]?.date || '',
        window_end_date: windowedReturns[windowedReturns.length - 1]?.date || '',
        benchmark: benchmark.toUpperCase(),
        benchmark_source: benchmarkSource,
        methodology: "Log returns, sample covariance (n-1)",
        confidence_level: confidenceLevel,
        data_quality_score: Math.round(dataQualityScore * 100) / 100,
        liquidity_warning: liquidityWarning,
        volume_completeness_warning: volumeWarning
      };

      // Cache result
      this.cache.set(cacheKey, result);
      
      return result;

    } catch (error) {
      console.error('Error in comprehensive beta calculation:', error);
      return this.getProvisionalEstimate(coinSymbol, 'btc', 'fallback');
    }
  }

  private determineBenchmark(coinSymbol: string): { benchmark: string; benchmarkSource: string; useGlassnode: boolean } {
    const symbol = coinSymbol.toLowerCase();
    
    if (symbol === 'btc' || symbol === 'bitcoin') {
      return { benchmark: 'sp500', benchmarkSource: 'FRED', useGlassnode: false };
    } else {
      return { benchmark: 'btc', benchmarkSource: 'Glassnode', useGlassnode: true };
    }
  }

  private async fetchAssetPriceData(coinSymbol: string): Promise<PriceVolumeData[]> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 400 * 24 * 60 * 60 * 1000); // 400 days ago
    
    // Convert to Unix timestamps (seconds)
    const sinceUnix = Math.floor(startDate.getTime() / 1000);
    const untilUnix = Math.floor(endDate.getTime() / 1000);

    console.log(`🔍 Fetching price data for ${coinSymbol} from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    console.log(`📊 Unix timestamps: since=${sinceUnix}, until=${untilUnix}`);
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
        body: {
          metric: 'market/price_usd_close',
          asset: coinSymbol.toUpperCase(), // Use uppercase for consistency
          since: sinceUnix,
          until: untilUnix,
          disableSampling: true // Get all daily data points
        }
      });

      if (error) {
        console.error('❌ Error fetching price data:', error);
        return [];
      }

      if (!data?.data || data.data.length === 0) {
        console.warn(`⚠️ No price data returned for ${coinSymbol}`);
        return [];
      }

      console.log(`✅ Received ${data.data.length} price data points for ${coinSymbol}`);
      
      return data.data.map((item: any) => ({
        date: new Date(item.t * 1000).toISOString().split('T')[0], // Convert Unix timestamp to date string
        price: item.v,
        volume: 0 // Will be filled by volume data
      }));
    } catch (error) {
      console.error('Error fetching asset price data:', error);
      return [];
    }
  }

  private async fetchAssetVolumeData(coinSymbol: string): Promise<Array<{date: string; volume: number}>> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 400 * 24 * 60 * 60 * 1000);
    
    // Convert to Unix timestamps (seconds)
    const sinceUnix = Math.floor(startDate.getTime() / 1000);
    const untilUnix = Math.floor(endDate.getTime() / 1000);

    console.log(`📊 Fetching volume data for ${coinSymbol}`);
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-glassnode-volume', {
        body: {
          asset: coinSymbol.toLowerCase(),
          since: sinceUnix,
          until: untilUnix
        }
      });

      if (error) {
        console.error('❌ Error fetching volume data:', error);
        return [];
      }

      if (!data?.data || data.data.length === 0) {
        console.warn(`⚠️ No volume data returned for ${coinSymbol}`);
        return [];
      }

      console.log(`✅ Received ${data.data.length} volume data points for ${coinSymbol}`);
      
      return data.data.map((item: any) => ({
        date: new Date(item.timestamp * 1000).toISOString().split('T')[0], // Convert Unix timestamp to date string
        volume: item.value || 0
      }));
    } catch (error) {
      console.error('Error fetching volume data:', error);
      return [];
    }
  }

  private async fetchBenchmarkData(benchmark: string, source: string): Promise<PriceVolumeData[]> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 400 * 24 * 60 * 60 * 1000);

    try {
      if (source === 'FRED') {
        const sp500Data = await this.fetchSP500Data(startDate, endDate);
        if (sp500Data.length < 180) {
          // Fallback to 60/40 portfolio if S&P 500 insufficient
          console.warn('S&P 500 data insufficient, attempting 60/40 fallback');
          return await this.fetch6040PortfolioData(startDate, endDate);
        }
        return sp500Data;
      } else {
        const btcData = await this.fetchAssetPriceData('btc');
        if (btcData.length < 180 && benchmark !== 'eth') {
          // Fallback to ETH for altcoins if BTC insufficient
          console.warn('BTC data insufficient, falling back to ETH');
          return await this.fetchAssetPriceData('eth');
        }
        return btcData;
      }
    } catch (error) {
      console.error(`Error fetching benchmark data for ${benchmark}:`, error);
      // Ultimate fallback: return empty array to trigger provisional estimate
      return [];
    }
  }

  private async fetchSP500Data(startDate: Date, endDate: Date): Promise<PriceVolumeData[]> {
    console.log(`📈 Fetching S&P 500 data from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    try {
      const { data, error } = await supabase.functions.invoke('fetch-fred-data', {
        body: {
          seriesId: 'SP500',
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      });

      if (error) {
        console.error('❌ Error fetching S&P 500 data:', error);
        return [];
      }

      if (!data?.data || data.data.length === 0) {
        console.warn('⚠️ No S&P 500 data returned');
        return [];
      }

      console.log(`✅ Received ${data.data.length} S&P 500 data points`);
      
      return data.data.map((item: any) => ({
        date: item.date,
        price: parseFloat(item.value),
        volume: 0 // Not applicable for S&P 500
      })).filter((item: any) => !isNaN(item.price));
    } catch (error) {
      console.error('Error fetching S&P 500 data:', error);
      return [];
    }
  }

  private async fetch6040PortfolioData(startDate: Date, endDate: Date): Promise<PriceVolumeData[]> {
    try {
      // Fetch both stocks (SP500) and bonds (DGS10 - 10-year treasury)
      const [stocksData, bondsData] = await Promise.all([
        this.fetchSP500Data(startDate, endDate),
        this.fetchFredSeries('DGS10', startDate, endDate)
      ]);

      if (stocksData.length === 0 || bondsData.length === 0) {
        throw new Error('Insufficient data for 60/40 portfolio construction');
      }

      // Create 60/40 weighted index (60% stocks, 40% bonds)
      const stocksMap = new Map(stocksData.map(s => [s.date, s.price]));
      const bondsMap = new Map(bondsData.map(b => [b.date, b.price]));
      
      const portfolio6040: PriceVolumeData[] = [];
      
      for (const [date, stockPrice] of stocksMap) {
        const bondPrice = bondsMap.get(date);
        if (bondPrice) {
          // Simplified 60/40 weighting
          const portfolioValue = (stockPrice * 0.6) + (bondPrice * 0.4);
          portfolio6040.push({
            date,
            price: portfolioValue,
            volume: 0
          });
        }
      }

      console.log(`Constructed 60/40 portfolio with ${portfolio6040.length} data points`);
      return portfolio6040;
    } catch (error) {
      console.error('Error constructing 60/40 portfolio:', error);
      return [];
    }
  }

  private async fetchFredSeries(seriesId: string, startDate: Date, endDate: Date): Promise<PriceVolumeData[]> {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-fred-data', {
        body: {
          seriesId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          limit: 1000
        }
      });

      if (error) throw new Error(`Failed to fetch FRED series ${seriesId}: ${error.message}`);
      
      return data.data.map((item: any) => ({
        date: item.date,
        price: parseFloat(item.value),
        volume: 0
      })).filter((item: any) => !isNaN(item.price));
    } catch (error) {
      console.error(`Error fetching FRED series ${seriesId}:`, error);
      return [];
    }
  }

  private alignDataSources(
    assetData: PriceVolumeData[], 
    benchmarkData: PriceVolumeData[], 
    volumeData: Array<{date: string; volume: number}>
  ): AlignedData[] {
    // Create volume lookup
    const volumeMap = new Map(volumeData.map(v => [v.date, v.volume]));
    
    // Create benchmark lookup with forward-filling (max 2 days)
    const benchmarkMap = new Map<string, number>();
    let lastValidPrice: number | null = null;
    let gapDays = 0;
    
    for (const benchmark of benchmarkData.sort((a, b) => a.date.localeCompare(b.date))) {
      if (benchmark.price > 0) {
        benchmarkMap.set(benchmark.date, benchmark.price);
        lastValidPrice = benchmark.price;
        gapDays = 0;
      } else if (lastValidPrice && gapDays < 2) {
        // Forward-fill for up to 2 days
        benchmarkMap.set(benchmark.date, lastValidPrice);
        gapDays++;
      } else {
        gapDays++;
      }
    }
    
    // Calendar-aware alignment: use trading days for S&P 500, daily for crypto
    const aligned: AlignedData[] = [];
    let consecutiveMissingDays = 0;
    
    for (const asset of assetData.sort((a, b) => a.date.localeCompare(b.date))) {
      const benchmarkPrice = benchmarkMap.get(asset.date);
      
      if (benchmarkPrice && asset.price > 0) {
        // Reset consecutive missing counter on successful alignment
        consecutiveMissingDays = 0;
        
        aligned.push({
          date: asset.date,
          asset_price: asset.price,
          asset_volume: volumeMap.get(asset.date) || 0,
          benchmark_price: benchmarkPrice
        });
      } else {
        consecutiveMissingDays++;
        // Reject if >2 consecutive missing days
        if (consecutiveMissingDays > 2) {
          console.warn(`Data quality issue: >2 consecutive missing days around ${asset.date}`);
        }
      }
    }
    
    // Validate freshness: ensure most recent data is within 48 hours
    if (aligned.length > 0) {
      const latestDate = new Date(aligned[aligned.length - 1].date);
      const hoursSinceLatest = (Date.now() - latestDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLatest > 48) {
        console.warn(`Data freshness warning: Latest data is ${hoursSinceLatest.toFixed(1)} hours old`);
      }
    }
    
    return aligned;
  }

  private calculateLogReturns(alignedData: AlignedData[]): ReturnData[] {
    const returns: ReturnData[] = [];
    
    for (let i = 1; i < alignedData.length; i++) {
      const prev = alignedData[i - 1];
      const curr = alignedData[i];
      
      if (prev.asset_price > 0 && curr.asset_price > 0 && 
          prev.benchmark_price > 0 && curr.benchmark_price > 0) {
        returns.push({
          date: curr.date,
          asset_return: Math.log(curr.asset_price / prev.asset_price),
          benchmark_return: Math.log(curr.benchmark_price / prev.benchmark_price)
        });
      }
    }
    
    return returns;
  }

  private selectAdaptiveWindow(returns: ReturnData[]): { selectedWindow: number; volatility30d: number } {
    // Calculate 30-day volatility
    const recent30 = returns.slice(-30);
    if (recent30.length < 30) {
      console.warn('Insufficient data for 30-day volatility calculation');
    }
    
    const assetReturns = recent30.map(r => r.asset_return);
    const mean = assetReturns.reduce((sum, r) => sum + r, 0) / assetReturns.length;
    const variance = assetReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (assetReturns.length - 1);
    const volatility30d = Math.sqrt(variance);
    
    // Reject if volatility > 2.0 (extremely volatile)
    if (volatility30d > 2.0) {
      throw new Error(`Volatility too high for reliable calculation: ${volatility30d.toFixed(4)}`);
    }
    
    // Select window based on volatility (exact thresholds from specification)
    let selectedWindow: number;
    if (volatility30d > 0.05) {
      selectedWindow = 90; // High volatility - shorter window
    } else if (volatility30d < 0.015) {
      selectedWindow = 360; // Low volatility - longer window
    } else {
      selectedWindow = 180; // Medium volatility - standard window
    }
    
    // Ensure we don't exceed available data
    selectedWindow = Math.min(selectedWindow, returns.length);
    
    return { selectedWindow, volatility30d };
  }

  private calculateBaseBeta(returns: ReturnData[]): { beta: number; covariance: number; variance: number } {
    const n = returns.length;
    
    // Calculate means
    const assetMean = returns.reduce((sum, r) => sum + r.asset_return, 0) / n;
    const benchmarkMean = returns.reduce((sum, r) => sum + r.benchmark_return, 0) / n;
    
    // Calculate covariance and variance
    let covariance = 0;
    let variance = 0;
    
    for (const r of returns) {
      const assetDev = r.asset_return - assetMean;
      const benchmarkDev = r.benchmark_return - benchmarkMean;
      covariance += assetDev * benchmarkDev;
      variance += benchmarkDev * benchmarkDev;
    }
    
    covariance /= (n - 1);
    variance /= (n - 1);
    
    // Validate variance
    if (variance < 1e-6) {
      throw new Error('Benchmark variance too low for reliable calculation');
    }
    
    const beta = covariance / variance;
    
    // Clip beta to reasonable range
    const clippedBeta = Math.max(-3, Math.min(5, beta));
    
    return { beta: clippedBeta, covariance, variance };
  }

  private calculateMedianVolume(recentData: AlignedData[]): number {
    const volumes = recentData.map(d => d.asset_volume).filter(v => v > 0).sort((a, b) => a - b);
    
    if (volumes.length === 0) return 0;
    
    const middle = Math.floor(volumes.length / 2);
    return volumes.length % 2 === 0 
      ? (volumes[middle - 1] + volumes[middle]) / 2 
      : volumes[middle];
  }

  private calculateLiquidityAdjustment(medianVolume: number): number {
    if (medianVolume < 1e7) { // Low liquidity
      return 1.2;
    } else if (medianVolume > 1e9) { // High liquidity
      return 0.9;
    } else {
      return 1.0; // Normal liquidity
    }
  }

  private assessConfidenceLevel(dataPoints: number, variance: number, volatility: number): 'high' | 'medium' | 'low' {
    if (dataPoints >= 300 && variance > 1e-5 && volatility < 0.1) {
      return 'high';
    } else if (dataPoints >= 180 && variance > 1e-6 && volatility < 0.2) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private calculateDataQualityScoreWithWarnings(alignedData: AlignedData[], returns: ReturnData[]): { dataQualityScore: number; volumeWarning: boolean } {
    const completeness = Math.min(1.0, alignedData.length / 365);
    const returnQuality = returns.length / Math.max(1, alignedData.length);
    
    // Check volume data quality (30-day completeness)
    const recent30Volume = alignedData.slice(-30);
    const volumeCompleteness = recent30Volume.filter(d => d.asset_volume > 0).length / Math.max(1, recent30Volume.length);
    const volumeWarning = volumeCompleteness < 0.8;
    
    if (volumeWarning) {
      console.warn(`Volume data warning: Only ${(volumeCompleteness * 100).toFixed(1)}% complete in last 30 days`);
    }
    
    // Data recency score
    const latestDate = new Date(alignedData[alignedData.length - 1]?.date || '1970-01-01');
    const hoursOld = (Date.now() - latestDate.getTime()) / (1000 * 60 * 60);
    const recencyScore = Math.max(0, 1 - hoursOld / (48 * 7));
    
    const dataQualityScore = Math.min(1.0, (completeness + returnQuality + volumeCompleteness + recencyScore) / 4);
    
    return { dataQualityScore, volumeWarning };
  }

  // Keep the old method for backward compatibility
  private calculateDataQualityScore(alignedData: AlignedData[], returns: ReturnData[]): number {
    return this.calculateDataQualityScoreWithWarnings(alignedData, returns).dataQualityScore;
  }

  private getProvisionalEstimate(coinSymbol: string, benchmark: string, source: string): ComprehensiveBetaResult {
    // Sector-based estimates
    const sectorBetas: { [key: string]: number } = {
      'btc': 0.4,
      'eth': 1.1,
      'usdt': 0.0,
      'usdc': 0.0,
      'bnb': 1.0,
      'ada': 1.3,
      'sol': 1.5,
      'dot': 1.2,
      'link': 1.4
    };
    
    const estimatedBeta = sectorBetas[coinSymbol.toLowerCase()] || 1.5;
    
    return {
      asset: coinSymbol.toUpperCase(),
      beta: estimatedBeta,
      beta_unadjusted: estimatedBeta,
      calculation_window: 0,
      volatility_30d: 0,
      median_daily_volume: 0,
      liquidity_adjustment_factor: 1.0,
      data_points: 0,
      window_start_date: '',
      window_end_date: '',
      benchmark: benchmark.toUpperCase(),
      benchmark_source: source,
      methodology: "Sector-based estimate",
      confidence_level: 'low',
      data_quality_score: 0,
      provisional_estimate: true
    };
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    const now = Date.now();
    const cacheTime = parseInt(key.split('_').pop() || '0');
    return (now - cacheTime) < this.CACHE_DURATION;
  }
}

export const comprehensiveBetaWorkflowService = new ComprehensiveBetaWorkflowService();
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
        return this.getProvisionalEstimate(coinSymbol, benchmark, benchmarkSource);
      }

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
      
      // Phase 8: Quality assessment
      const confidenceLevel = this.assessConfidenceLevel(windowedReturns.length, variance, volatility30d);
      const dataQualityScore = this.calculateDataQualityScore(alignedData, windowedReturns);

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
        data_quality_score: Math.round(dataQualityScore * 100) / 100
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
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
        body: {
          metric: 'price_usd_close',
          asset: coinSymbol.toLowerCase(),
          since: Math.floor(startDate.getTime() / 1000),
          until: Math.floor(endDate.getTime() / 1000)
        }
      });

      if (error) throw new Error(`Failed to fetch asset price data: ${error.message}`);
      
      return data.data.map((item: any) => ({
        date: item.date,
        price: item.value,
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
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-glassnode-volume', {
        body: {
          asset: coinSymbol.toLowerCase(),
          since: Math.floor(startDate.getTime() / 1000),
          until: Math.floor(endDate.getTime() / 1000)
        }
      });

      if (error) throw new Error(`Failed to fetch volume data: ${error.message}`);
      
      return data.data.map((item: any) => ({
        date: item.date,
        volume: item.volume || 0
      }));
    } catch (error) {
      console.error('Error fetching volume data:', error);
      return [];
    }
  }

  private async fetchBenchmarkData(benchmark: string, source: string): Promise<PriceVolumeData[]> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 400 * 24 * 60 * 60 * 1000);

    if (source === 'FRED') {
      return this.fetchSP500Data(startDate, endDate);
    } else {
      return this.fetchAssetPriceData('btc');
    }
  }

  private async fetchSP500Data(startDate: Date, endDate: Date): Promise<PriceVolumeData[]> {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-sp500-data', {
        body: {
          series_id: 'SP500',
          observation_start: startDate.toISOString().split('T')[0],
          observation_end: endDate.toISOString().split('T')[0]
        }
      });

      if (error) throw new Error(`Failed to fetch S&P 500 data: ${error.message}`);
      
      return data.map((item: any) => ({
        date: item.date,
        price: parseFloat(item.value),
        volume: 0 // Not applicable for S&P 500
      })).filter((item: any) => !isNaN(item.price));
    } catch (error) {
      console.error('Error fetching S&P 500 data:', error);
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
    
    // Create benchmark lookup
    const benchmarkMap = new Map(benchmarkData.map(b => [b.date, b.price]));
    
    // Align on asset dates and join with benchmark
    const aligned: AlignedData[] = [];
    
    for (const asset of assetData) {
      const benchmarkPrice = benchmarkMap.get(asset.date);
      if (benchmarkPrice && asset.price > 0) {
        aligned.push({
          date: asset.date,
          asset_price: asset.price,
          asset_volume: volumeMap.get(asset.date) || 0,
          benchmark_price: benchmarkPrice
        });
      }
    }
    
    return aligned.sort((a, b) => a.date.localeCompare(b.date));
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
    const assetReturns = recent30.map(r => r.asset_return);
    const mean = assetReturns.reduce((sum, r) => sum + r, 0) / assetReturns.length;
    const variance = assetReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (assetReturns.length - 1);
    const volatility30d = Math.sqrt(variance);
    
    // Select window based on volatility
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

  private calculateDataQualityScore(alignedData: AlignedData[], returns: ReturnData[]): number {
    const completeness = alignedData.length / 365; // Data completeness over a year
    const returnQuality = returns.length / alignedData.length; // Return calculation success rate
    const volumeCompleteness = alignedData.filter(d => d.asset_volume > 0).length / alignedData.length;
    
    return Math.min(1.0, (completeness + returnQuality + volumeCompleteness) / 3);
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
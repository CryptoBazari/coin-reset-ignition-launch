import { supabase } from '@/integrations/supabase/client';

export interface BetaCalculationResult {
  beta: number;
  coinSymbol: string;
  benchmarkSymbol: string;
  dataPoints: number;
  coinMeanReturn: number;
  benchmarkMeanReturn: number;
  covariance: number;
  benchmarkVariance: number;
  startDate: string;
  endDate: string;
  calculationDate: string;
  confidence: 'high' | 'medium' | 'low';
  annualizedVolatility?: number;
}

interface PriceData {
  date: string;
  price: number;
}

interface AlignedData {
  date: string;
  coinPrice: number;
  benchmarkPrice: number;
}

interface ReturnData {
  date: string;
  coinReturn: number;
  benchmarkReturn: number;
}

export class ComprehensiveBetaCalculationService {
  private readonly GLASSNODE_BASE_URL = 'https://cljbwjglmvdpusmfyslh.supabase.co/functions/v1';
  private readonly FRED_BASE_URL = 'https://cljbwjglmvdpusmfyslh.supabase.co/functions/v1';

  /**
   * Step 1: Determine the Selected Coin and Benchmark
   */
  private determineBenchmark(coinSymbol: string): { benchmark: string; coinDataSource: string; benchmarkDataSource: string } {
    const upperCoin = coinSymbol.toUpperCase();
    
    if (upperCoin === 'BTC' || upperCoin === 'BITCOIN') {
      return {
        benchmark: 'S&P 500',
        coinDataSource: 'glassnode',
        benchmarkDataSource: 'fred'
      };
    } else {
      return {
        benchmark: 'BTC',
        coinDataSource: 'glassnode',
        benchmarkDataSource: 'glassnode'
      };
    }
  }

  /**
   * Step 2: Fetch and Align Historical Daily Closing Prices Over Past 3 Years
   */
  private async fetchGlassnodeData(asset: string, startDate: string, endDate: string): Promise<PriceData[]> {
    try {
      const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
      
      const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
        body: {
          endpoint: '/v1/metrics/market/price_usd_close',
          params: {
            a: asset.toLowerCase(),
            i: '24h',
            c: 'usd',
            s: startTimestamp,
            u: endTimestamp,
            timestamp_format: 'unix'
          }
        }
      });

      if (error) throw error;

      return data.map((item: any) => ({
        date: new Date(item.t * 1000).toISOString().split('T')[0],
        price: parseFloat(item.v)
      })).filter((item: PriceData) => item.price > 0);
    } catch (error) {
      console.error(`Error fetching Glassnode data for ${asset}:`, error);
      throw error;
    }
  }

  private async fetchSP500Data(startDate: string, endDate: string): Promise<PriceData[]> {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-sp500-data', {
        body: {
          startDate,
          endDate
        }
      });

      if (error) throw error;

      return data.map((item: any) => ({
        date: item.date,
        price: parseFloat(item.value)
      })).filter((item: PriceData) => item.price > 0);
    } catch (error) {
      console.error('Error fetching S&P 500 data:', error);
      throw error;
    }
  }

  private alignPriceData(coinData: PriceData[], benchmarkData: PriceData[]): AlignedData[] {
    const coinMap = new Map(coinData.map(item => [item.date, item.price]));
    const benchmarkMap = new Map(benchmarkData.map(item => [item.date, item.price]));
    
    const aligned: AlignedData[] = [];
    
    // Use benchmark dates as master (especially important for S&P 500 trading days)
    for (const benchmarkItem of benchmarkData) {
      const coinPrice = coinMap.get(benchmarkItem.date);
      
      if (coinPrice !== undefined) {
        aligned.push({
          date: benchmarkItem.date,
          coinPrice,
          benchmarkPrice: benchmarkItem.price
        });
      }
    }
    
    // Sort by date ascending
    return aligned.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Step 3: Calculate Daily Returns from Aligned Prices
   */
  private calculateReturns(alignedData: AlignedData[]): ReturnData[] {
    const returns: ReturnData[] = [];
    
    for (let i = 1; i < alignedData.length; i++) {
      const current = alignedData[i];
      const previous = alignedData[i - 1];
      
      const coinReturn = (current.coinPrice - previous.coinPrice) / previous.coinPrice;
      const benchmarkReturn = (current.benchmarkPrice - previous.benchmarkPrice) / previous.benchmarkPrice;
      
      returns.push({
        date: current.date,
        coinReturn,
        benchmarkReturn
      });
    }
    
    return returns;
  }

  /**
   * Step 4: Calculate Overall Means of Returns
   */
  private calculateMeans(returns: ReturnData[]): { coinMean: number; benchmarkMean: number } {
    const n = returns.length;
    
    const coinSum = returns.reduce((sum, item) => sum + item.coinReturn, 0);
    const benchmarkSum = returns.reduce((sum, item) => sum + item.benchmarkReturn, 0);
    
    return {
      coinMean: coinSum / n,
      benchmarkMean: benchmarkSum / n
    };
  }

  /**
   * Steps 5-8: Calculate Deviations, Covariance, Variance, and Beta
   */
  private calculateBetaFromReturns(returns: ReturnData[], coinMean: number, benchmarkMean: number): { beta: number; covariance: number; benchmarkVariance: number } {
    const n = returns.length;
    
    let covarianceSum = 0;
    let benchmarkVarianceSum = 0;
    
    for (const returnData of returns) {
      // Step 5: Calculate deviations
      const coinDeviation = returnData.coinReturn - coinMean;
      const benchmarkDeviation = returnData.benchmarkReturn - benchmarkMean;
      
      // Step 6: Accumulate covariance components
      covarianceSum += coinDeviation * benchmarkDeviation;
      
      // Step 7: Accumulate variance components
      benchmarkVarianceSum += benchmarkDeviation * benchmarkDeviation;
    }
    
    // Use sample statistics (divide by n-1)
    const covariance = covarianceSum / (n - 1);
    const benchmarkVariance = benchmarkVarianceSum / (n - 1);
    
    // Step 8: Calculate beta
    if (benchmarkVariance === 0) {
      throw new Error('Benchmark variance is zero - cannot calculate beta');
    }
    
    const beta = covariance / benchmarkVariance;
    
    return { beta, covariance, benchmarkVariance };
  }

  /**
   * Step 9: Validate and Output
   */
  private validateResults(dataPoints: number, beta: number, covariance: number): 'high' | 'medium' | 'low' {
    // Minimum data points for reliable calculation
    if (dataPoints < 30) return 'low';
    if (dataPoints < 250) return 'medium';
    
    // Check for reasonable beta range
    if (Math.abs(beta) > 10) return 'low';
    
    // Check for meaningful covariance
    if (Math.abs(covariance) < 1e-8) return 'low';
    
    return 'high';
  }

  private calculateAnnualizedVolatility(returns: ReturnData[], meanReturn: number): number {
    const n = returns.length;
    let varianceSum = 0;
    
    for (const returnData of returns) {
      const deviation = returnData.coinReturn - meanReturn;
      varianceSum += deviation * deviation;
    }
    
    const dailyVariance = varianceSum / (n - 1);
    const dailyVolatility = Math.sqrt(dailyVariance);
    
    // Annualize assuming 252 trading days
    return dailyVolatility * Math.sqrt(252);
  }

  /**
   * Main calculation method implementing all 9 steps
   */
  async calculateComprehensiveBeta(coinSymbol: string): Promise<BetaCalculationResult> {
    try {
      // Step 1: Determine benchmark
      const { benchmark, coinDataSource, benchmarkDataSource } = this.determineBenchmark(coinSymbol);
      
      // Define 3-year period
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - (3 * 365 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
      
      console.log(`Calculating beta for ${coinSymbol} vs ${benchmark} from ${startDate} to ${endDate}`);
      
      // Step 2: Fetch and align data
      let coinData: PriceData[];
      let benchmarkData: PriceData[];
      
      if (coinDataSource === 'glassnode') {
        const asset = coinSymbol.toLowerCase() === 'btc' ? 'btc' : 
                     coinSymbol.toLowerCase() === 'ethereum' ? 'eth' : 
                     coinSymbol.toLowerCase();
        coinData = await this.fetchGlassnodeData(asset, startDate, endDate);
      } else {
        throw new Error(`Unsupported coin data source: ${coinDataSource}`);
      }
      
      if (benchmarkDataSource === 'fred') {
        benchmarkData = await this.fetchSP500Data(startDate, endDate);
      } else if (benchmarkDataSource === 'glassnode') {
        benchmarkData = await this.fetchGlassnodeData('btc', startDate, endDate);
      } else {
        throw new Error(`Unsupported benchmark data source: ${benchmarkDataSource}`);
      }
      
      const alignedData = this.alignPriceData(coinData, benchmarkData);
      
      if (alignedData.length < 30) {
        throw new Error(`Insufficient aligned data points: ${alignedData.length}. Need at least 30.`);
      }
      
      // Step 3: Calculate returns
      const returns = this.calculateReturns(alignedData);
      
      // Step 4: Calculate means
      const { coinMean, benchmarkMean } = this.calculateMeans(returns);
      
      // Steps 5-8: Calculate beta
      const { beta, covariance, benchmarkVariance } = this.calculateBetaFromReturns(returns, coinMean, benchmarkMean);
      
      // Step 9: Validate
      const confidence = this.validateResults(returns.length, beta, covariance);
      const annualizedVolatility = this.calculateAnnualizedVolatility(returns, coinMean);
      
      const result: BetaCalculationResult = {
        beta: Math.round(beta * 1000) / 1000, // Round to 3 decimals
        coinSymbol: coinSymbol.toUpperCase(),
        benchmarkSymbol: benchmark,
        dataPoints: returns.length,
        coinMeanReturn: coinMean,
        benchmarkMeanReturn: benchmarkMean,
        covariance,
        benchmarkVariance,
        startDate,
        endDate,
        calculationDate: new Date().toISOString(),
        confidence,
        annualizedVolatility
      };
      
      console.log(`Beta calculation complete: ${result.coinSymbol} vs ${result.benchmarkSymbol} = ${result.beta} (${result.dataPoints} observations)`);
      
      return result;
      
    } catch (error) {
      console.error('Beta calculation failed:', error);
      throw error;
    }
  }

  /**
   * Batch calculate beta for multiple coins
   */
  async calculateBetaForMultipleCoins(coinSymbols: string[]): Promise<BetaCalculationResult[]> {
    const results: BetaCalculationResult[] = [];
    
    for (const coinSymbol of coinSymbols) {
      try {
        const result = await this.calculateComprehensiveBeta(coinSymbol);
        results.push(result);
      } catch (error) {
        console.error(`Failed to calculate beta for ${coinSymbol}:`, error);
        // Continue with other coins
      }
    }
    
    return results;
  }
}

export const comprehensiveBetaCalculationService = new ComprehensiveBetaCalculationService();
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
  
  /**
   * Enhanced symbol mapping for all supported cryptocurrencies
   */
  private getGlassnodeAssetSymbol(coinSymbol: string): string {
    const upperCoin = coinSymbol.toUpperCase();
    
    // Map common coin IDs/symbols to Glassnode asset symbols
    const symbolMap: Record<string, string> = {
      'BITCOIN': 'BTC',
      'BTC': 'BTC',
      'ETHEREUM': 'ETH', 
      'ETH': 'ETH',
      'SOLANA': 'SOL',
      'SOL': 'SOL',
      'CARDANO': 'ADA',
      'ADA': 'ADA',
      'LITECOIN': 'LTC',
      'LTC': 'LTC',
      'BITCOIN-CASH': 'BCH',
      'BCH': 'BCH',
      'CHAINLINK': 'LINK',
      'LINK': 'LINK',
      'UNISWAP': 'UNI',
      'UNI': 'UNI',
      'AAVE': 'AAVE',
      'COMPOUND': 'COMP',
      'COMP': 'COMP',
      'MAKER': 'MKR',
      'MKR': 'MKR'
    };
    
    const mappedSymbol = symbolMap[upperCoin] || upperCoin;
    console.log(`🔄 Mapped ${coinSymbol} to Glassnode asset: ${mappedSymbol}`);
    
    return mappedSymbol;
  }

  /**
   * Step 1: Determine the Selected Coin and Benchmark
   * Logic: BTC uses S&P 500 as benchmark, all other coins use BTC as benchmark
   */
  private determineBenchmark(coinSymbol: string): { benchmark: string; coinDataSource: string; benchmarkDataSource: string } {
    // Input validation: ensure coinSymbol is string and uppercase
    if (typeof coinSymbol !== 'string') {
      throw new TypeError('coinSymbol must be a string');
    }
    
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
   * Step 2: Fetch Historical Daily Closing Prices for Past 3 Years
   * Logic: Use dynamic 3-year period to always get current market conditions
   */
  private async fetchGlassnodeData(asset: string, startDate: string, endDate: string): Promise<PriceData[]> {
    try {
      console.log(`📊 Fetching Glassnode data for ${asset} from ${startDate} to ${endDate}`);
      
      const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
        body: {
          metric: 'market/price_usd_close',
          asset: asset.toUpperCase(),
          resolution: '24h',
          since: startDate,
          until: endDate
        }
      });

      if (error) {
        console.error('Glassnode API error:', error);
        throw error;
      }

      console.log('Raw Glassnode response:', data);

      // Handle different response formats - ensure we get an array
      let responseData: any[] = [];
      if (Array.isArray(data)) {
        responseData = data;
      } else if (data?.data && Array.isArray(data.data)) {
        responseData = data.data;
      } else if (data?.result && Array.isArray(data.result)) {
        responseData = data.result;
      } else {
        console.error('Invalid response format:', data);
        throw new Error(`Expected array response from Glassnode API, got: ${typeof data}`);
      }

      // Process data with proper type conversion to float64 equivalent
      const processedData = responseData
        .map((item: any) => {
          // Convert timestamp to date string (YYYY-MM-DD format)
          const date = item.timestamp ? 
            new Date(item.timestamp).toISOString().split('T')[0] :
            new Date(item.t * 1000).toISOString().split('T')[0];
          
          // Convert price to float with proper precision
          const price = parseFloat(item.value || item.v);
          
          return { date, price };
        })
        .filter((item: PriceData) => {
          // Validate: price must be positive float to prevent division errors
          return !isNaN(item.price) && item.price > 0 && typeof item.price === 'number';
        })
        .sort((a, b) => a.date.localeCompare(b.date)); // Sort chronologically

      console.log(`✅ Processed ${processedData.length} valid data points for ${asset}`);
      
      // Validate minimum data points
      if (processedData.length < 30) {
        throw new Error(`Insufficient data points for ${asset}: ${processedData.length}. Need at least 30.`);
      }
      
      return processedData;
    } catch (error) {
      console.error(`Error fetching Glassnode data for ${asset}:`, error);
      throw error;
    }
  }

  private async fetchSP500Data(startDate: string, endDate: string): Promise<PriceData[]> {
    try {
      console.log(`📊 Fetching S&P 500 data from ${startDate} to ${endDate}`);
      
      const { data, error } = await supabase.functions.invoke('fetch-sp500-data', {
        body: {
          series_id: 'SP500',
          observation_start: startDate,
          observation_end: endDate
        }
      });

      if (error) {
        console.error('S&P 500 API error:', error);
        throw error;
      }

      // Handle different response formats - ensure we get an array
      let responseData: any[] = [];
      if (Array.isArray(data)) {
        responseData = data;
      } else if (data?.data && Array.isArray(data.data)) {
        responseData = data.data;
      } else if (data?.observations && Array.isArray(data.observations)) {
        responseData = data.observations;
      } else {
        console.error('Invalid S&P 500 response format:', data);
        throw new Error('Expected array response from S&P 500 API');
      }

      const processedData = responseData
        .map((item: any) => ({
          date: item.date,
          price: parseFloat(item.value)
        }))
        .filter((item: PriceData) => {
          // Validate: price must be positive float
          return !isNaN(item.price) && item.price > 0 && typeof item.price === 'number';
        })
        .sort((a, b) => a.date.localeCompare(b.date));

      console.log(`✅ Processed ${processedData.length} valid S&P 500 data points`);
      
      if (processedData.length < 30) {
        throw new Error(`Insufficient S&P 500 data points: ${processedData.length}. Need at least 30.`);
      }
      
      return processedData;
    } catch (error) {
      console.error('Error fetching S&P 500 data:', error);
      throw error;
    }
  }

  /**
   * Align price data using strict inner join (matching manual methodology)
   * Logic: Only include dates where both assets have valid data (no forward-fill)
   */
  private alignPriceData(coinData: PriceData[], benchmarkData: PriceData[]): AlignedData[] {
    console.log(`🔄 Aligning ${coinData.length} coin prices with ${benchmarkData.length} benchmark prices using strict inner join`);
    
    // Create lookup maps for efficient matching
    const coinMap = new Map(coinData.map(item => [item.date, item.price]));
    const benchmarkMap = new Map(benchmarkData.map(item => [item.date, item.price]));
    
    const aligned: AlignedData[] = [];
    
    // Get all unique dates from both datasets
    const allDates = new Set([...coinData.map(d => d.date), ...benchmarkData.map(d => d.date)]);
    
    // Only include dates where both assets have data (strict inner join)
    for (const date of allDates) {
      const coinPrice = coinMap.get(date);
      const benchmarkPrice = benchmarkMap.get(date);
      
      // Both prices must exist and be valid numbers
      if (coinPrice !== undefined && benchmarkPrice !== undefined && 
          typeof coinPrice === 'number' && typeof benchmarkPrice === 'number' &&
          coinPrice > 0 && benchmarkPrice > 0) {
        aligned.push({
          date,
          coinPrice,
          benchmarkPrice
        });
      }
    }
    
    // Sort by date ascending
    aligned.sort((a, b) => a.date.localeCompare(b.date));
    
    console.log(`✅ Successfully aligned ${aligned.length} data points with strict inner join`);
    console.log(`📊 Date range: ${aligned[0]?.date} to ${aligned[aligned.length - 1]?.date}`);
    
    // More stringent validation to match manual methodology (expecting ~998 data points)
    if (aligned.length < 900) {
      console.warn(`⚠️ Low aligned data points: ${aligned.length}. Expected around 998 for 36-month period.`);
    }
    
    if (aligned.length < 30) {
      throw new Error(`Insufficient aligned data points: ${aligned.length}. Need at least 30.`);
    }
    
    return aligned;
  }

  /**
   * Step 1: Calculate Daily Returns from Aligned Prices
   * Logic: Returns normalize to percentages for comparable changes
   * Formula: return_t = (price_{t+1} - price_t) / price_t
   */
  private calculateReturns(alignedData: AlignedData[]): ReturnData[] {
    console.log(`📈 Calculating returns from ${alignedData.length} price observations`);
    
    const returns: ReturnData[] = [];
    const n_prices = alignedData.length; // int
    
    // Validate input data
    if (n_prices < 2) {
      throw new Error('Need at least 2 price observations to calculate returns');
    }
    
    // Calculate returns for consecutive rows (t=1 to n_prices-1)
    for (let i = 1; i < n_prices; i++) {
      const current = alignedData[i];
      const previous = alignedData[i - 1];
      
      // Validate: prices must be positive to prevent division errors
      if (previous.coinPrice <= 0 || previous.benchmarkPrice <= 0) {
        throw new Error(`Invalid price data at index ${i-1}: prices must be positive`);
      }
      
      // Calculate coin return: (price_t - price_{t-1}) / price_{t-1}
      const coinChange = current.coinPrice - previous.coinPrice; // float64
      const coinReturn = coinChange / previous.coinPrice; // float64
      
      // Calculate benchmark return with same formula
      const benchmarkChange = current.benchmarkPrice - previous.benchmarkPrice; // float64
      const benchmarkReturn = benchmarkChange / previous.benchmarkPrice; // float64
      
      // Validate: returns should be finite numbers
      if (!isFinite(coinReturn) || !isFinite(benchmarkReturn)) {
        console.warn(`Skipping invalid return at ${current.date}: coin=${coinReturn}, benchmark=${benchmarkReturn}`);
        continue;
      }
      
      returns.push({
        date: current.date,
        coinReturn,
        benchmarkReturn
      });
    }
    
    const n_returns = returns.length; // int
    console.log(`✅ Calculated ${n_returns} return observations`);
    
    // Validate minimum returns for reliable statistics (expecting ~998 for manual methodology)
    if (n_returns < 30) {
      throw new Error(`Insufficient return observations: ${n_returns}. Need at least 30.`);
    }
    
    console.log(`📈 Return validation: Expected ~998 observations, got ${n_returns} (${((n_returns/998)*100).toFixed(1)}% of expected)`);
    
    // Log first few returns for debugging alignment with manual calculation
    if (n_returns > 0) {
      console.log(`📊 First return: Date=${returns[0].date}, Coin=${returns[0].coinReturn.toFixed(6)}, Benchmark=${returns[0].benchmarkReturn.toFixed(6)}`);
    }
    
    return returns;
  }

  /**
   * Step 2: Calculate Overall Means of Returns
   * Logic: Means average returns over n_returns observations for centering deviations
   * Formula: mean = sum(returns) / n_returns
   */
  private calculateMeans(returns: ReturnData[]): { coinMean: number; benchmarkMean: number } {
    const n_returns = returns.length; // int
    console.log(`📊 Calculating means from ${n_returns} return observations`);
    
    if (n_returns === 0) {
      throw new Error('Cannot calculate means from empty returns array');
    }
    
    // Calculate coin mean: sum all coin returns and divide by count
    let totalCoinSum = 0.0; // float64
    let totalBenchmarkSum = 0.0; // float64
    
    for (const returnData of returns) {
      totalCoinSum += returnData.coinReturn; // float64 addition
      totalBenchmarkSum += returnData.benchmarkReturn; // float64 addition
    }
    
    const coinMean = totalCoinSum / n_returns; // float64 division
    const benchmarkMean = totalBenchmarkSum / n_returns; // float64 division
    
    // Validate: means should be finite and typically small for daily returns
    if (!isFinite(coinMean) || !isFinite(benchmarkMean)) {
      throw new Error('Calculated means are not finite numbers');
    }
    
    console.log(`✅ Calculated means - Coin: ${coinMean.toFixed(8)} (${(coinMean*100).toFixed(6)}% daily), Benchmark: ${benchmarkMean.toFixed(8)} (${(benchmarkMean*100).toFixed(6)}% daily)`);
    
    return { coinMean, benchmarkMean };
  }

  /**
   * Steps 3-6: Calculate Deviations, Covariance, Variance, and Beta
   * Logic: Sequential calculation with type validation at each step
   */
  private calculateBetaFromReturns(
    returns: ReturnData[], 
    coinMean: number, 
    benchmarkMean: number
  ): { beta: number; covariance: number; benchmarkVariance: number } {
    
    const n_returns = returns.length; // int
    console.log(`🧮 Calculating beta from ${n_returns} returns with sample statistics (n-1)`);
    
    if (n_returns < 2) {
      throw new Error('Need at least 2 returns to calculate beta');
    }
    
    // Step 3: Calculate deviations and accumulate covariance/variance components
    let covarianceSum = 0.0; // float64 - sum of products for covariance
    let benchmarkVarianceSum = 0.0; // float64 - sum of squares for variance
    
    for (const returnData of returns) {
      // Step 3: Calculate deviations from means
      const coinDeviation = returnData.coinReturn - coinMean; // float64
      const benchmarkDeviation = returnData.benchmarkReturn - benchmarkMean; // float64
      
      // Step 4: Accumulate covariance components (products of deviations)
      const product = coinDeviation * benchmarkDeviation; // float64
      covarianceSum += product; // float64 addition
      
      // Step 5: Accumulate variance components (squares of benchmark deviations)
      const square = benchmarkDeviation * benchmarkDeviation; // float64
      benchmarkVarianceSum += square; // float64 addition
    }
    
    // Use sample statistics (divide by n-1) for unbiased estimates
    const denominator = n_returns - 1; // int
    if (denominator <= 0) {
      throw new Error('Insufficient degrees of freedom for sample statistics');
    }
    
    // Step 4: Calculate covariance
    const covariance = covarianceSum / denominator; // float64
    
    // Step 5: Calculate benchmark variance
    const benchmarkVariance = benchmarkVarianceSum / denominator; // float64
    
    // Validate: variance must be positive for beta calculation
    if (benchmarkVariance <= 0) {
      throw new Error('Benchmark variance is zero or negative - cannot calculate beta');
    }
    
    // Step 6: Calculate beta = covariance / variance
    const beta = covariance / benchmarkVariance; // float64
    
    // Validate: beta should be finite
    if (!isFinite(beta)) {
      throw new Error('Calculated beta is not a finite number');
    }
    
    console.log(`✅ Beta calculation completed:`);
    console.log(`   📊 Observations: ${n_returns}`);
    console.log(`   📈 Covariance: ${covariance.toFixed(8)}`);
    console.log(`   📉 Benchmark Variance: ${benchmarkVariance.toFixed(8)}`);
    console.log(`   🎯 Beta: ${beta.toFixed(6)} (rounded to ${Math.round(beta * 1000) / 1000})`);
    
    return { 
      beta: Math.round(beta * 1000) / 1000, // Round to 3 decimals for output
      covariance, 
      benchmarkVariance 
    };
  }

  /**
   * Step 7: Validate and Output Results
   * Logic: Ensure data quality and assign confidence levels
   */
  private validateResults(dataPoints: number, beta: number, covariance: number): 'high' | 'medium' | 'low' {
    console.log(`🔍 Validating results - Data points: ${dataPoints}, Beta: ${beta}`);
    
    // Adjusted thresholds based on expected ~998 observations from manual methodology
    if (dataPoints < 30) return 'low';
    if (dataPoints < 900) return 'medium'; // Expect high confidence for ~998 observations
    
    // Check for reasonable beta range (cryptos typically 0.5-5.0)
    if (Math.abs(beta) > 10) {
      console.warn(`Beta ${beta} is outside typical range - flagging as low confidence`);
      return 'low';
    }
    
    // Check for meaningful covariance
    if (Math.abs(covariance) < 1e-8) {
      console.warn(`Covariance ${covariance} is very small - flagging as low confidence`);
      return 'low';
    }
    
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
   * Main calculation method implementing all steps with detailed methodology
   */
  async calculateComprehensiveBeta(coinSymbol: string): Promise<BetaCalculationResult> {
    try {
      console.log(`🚀 Starting comprehensive beta calculation for ${coinSymbol}`);
      
      // Input validation
      if (typeof coinSymbol !== 'string') {
        throw new TypeError('coinSymbol must be a string');
      }
      
      // Step 1: Determine benchmark
      const { benchmark, coinDataSource, benchmarkDataSource } = this.determineBenchmark(coinSymbol);
      
      // Use dynamic 3-year period from current date
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - (3 * 365 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
      
      console.log(`📅 Period: ${startDate} to ${endDate}, Benchmark: ${benchmark}`);
      
      // Step 2: Fetch and align data
      let coinData: PriceData[];
      let benchmarkData: PriceData[];
      
      // Fetch coin data with improved symbol mapping
      if (coinDataSource === 'glassnode') {
        const asset = this.getGlassnodeAssetSymbol(coinSymbol);
        coinData = await this.fetchGlassnodeData(asset, startDate, endDate);
      } else {
        throw new Error(`Unsupported coin data source: ${coinDataSource}`);
      }
      
      // Fetch benchmark data
      if (benchmarkDataSource === 'fred') {
        benchmarkData = await this.fetchSP500Data(startDate, endDate);
      } else if (benchmarkDataSource === 'glassnode') {
        benchmarkData = await this.fetchGlassnodeData('btc', startDate, endDate);
      } else {
        throw new Error(`Unsupported benchmark data source: ${benchmarkDataSource}`);
      }
      
      // Align data on common dates
      const alignedData = this.alignPriceData(coinData, benchmarkData);
      
      // Step 1: Calculate returns
      const returns = this.calculateReturns(alignedData);
      
      // Step 2: Calculate means
      const { coinMean, benchmarkMean } = this.calculateMeans(returns);
      
      // Steps 3-6: Calculate beta
      const { beta, covariance, benchmarkVariance } = this.calculateBetaFromReturns(returns, coinMean, benchmarkMean);
      
      // Step 7: Validate and finalize
      const confidence = this.validateResults(returns.length, beta, covariance);
      const annualizedVolatility = this.calculateAnnualizedVolatility(returns, coinMean);
      
      const result: BetaCalculationResult = {
        beta,
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
      
      console.log(`🎯 Beta calculation complete: ${result.coinSymbol} vs ${result.benchmarkSymbol} = ${result.beta} (confidence: ${result.confidence}, ${result.dataPoints} observations)`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Beta calculation failed:', error);
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
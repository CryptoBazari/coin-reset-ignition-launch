import { supabase } from '@/integrations/supabase/client';
import { symbolMappingService } from './symbolMappingService';

// Interface for CAGR calculation result with all sub-calculations
export interface CAGRCalculationResult {
  // Final result
  cagr: number; // float64 - final CAGR rate (e.g., 0.15 for 15%)
  cagrPercent: number; // float64 - CAGR as percentage for display
  
  // Input data
  beginningDate: string; // str - earliest date (YYYY-MM-DD)
  beginningPrice: number; // float64 - price on beginning date
  endingDate: string; // str - latest date (YYYY-MM-DD)
  endingPrice: number; // float64 - price on ending date
  
  // Sub-calculations with exact data types as specified
  totalDays: number; // int - total days including both ends
  numYears: number; // float64 - fractional years (total_days / 365.25)
  growthRatio: number; // float64 - ending_price / beginning_price
  exponent: number; // float64 - 1 / num_years
  annualizedGrowth: number; // float64 - growth_ratio ** exponent
  
  // Metadata
  dataPoints: number; // int - number of price data points used
  dataQuality: number; // int - quality score 0-100
  dataSource: string; // str - source of price data
  calculatedAt: string; // str - ISO timestamp of calculation
  coinId: string; // str - coin identifier
  
  // Validation flags
  isValid: boolean; // bool - whether calculation is valid
  hasMinimumData: boolean; // bool - at least 2 data points
  hasCompletePeriod: boolean; // bool - no significant gaps
  warnings: string[]; // array of warning messages
}

// Interface for raw price data from database
interface PriceDataPoint {
  price_date: string; // str - date in YYYY-MM-DD format
  price_usd: number; // float64 - closing price
  data_source: string; // str - source identifier
}

export class ComprehensiveCAGRCalculationService {
  
  /**
   * Calculate comprehensive CAGR from daily price history data
   * Following the exact 7-step methodology provided
   */
  async calculateComprehensiveCAGR(coinId: string, maxDays: number = 1095): Promise<CAGRCalculationResult> {
    console.log(`🔄 Starting comprehensive CAGR calculation for ${coinId}...`);
    
    try {
      // Step 0: Gather and Prepare Daily Price Data
      const priceData = await this.gatherAndPrepareDailyPriceData(coinId, maxDays);
      
      if (priceData.length < 2) {
        throw new Error(`Insufficient data: Only ${priceData.length} price points available, minimum 2 required`);
      }
      
      // Step 1: Extract Beginning and Ending Values
      const { beginningDate, beginningPrice, endingDate, endingPrice } = this.extractBeginningAndEndingValues(priceData);
      
      // Step 2: Calculate Number of Years (Fractional)
      const { totalDays, numYears } = this.calculateNumberOfYears(beginningDate, endingDate);
      
      // Step 3: Calculate the Growth Ratio
      const growthRatio = this.calculateGrowthRatio(endingPrice, beginningPrice);
      
      // Step 4: Calculate the Exponent (Inverse of Years)
      const exponent = this.calculateExponent(numYears);
      
      // Step 5: Raise Growth Ratio to the Exponent
      const annualizedGrowth = this.raiseGrowthRatioToExponent(growthRatio, exponent);
      
      // Step 6: Subtract 1 to Get CAGR Rate
      const cagr = this.subtractOneToGetCAGRRate(annualizedGrowth);
      
      // Step 7: Validate and Output
      const result = this.validateAndOutput({
        cagr,
        cagrPercent: cagr * 100,
        beginningDate,
        beginningPrice,
        endingDate,
        endingPrice,
        totalDays,
        numYears,
        growthRatio,
        exponent,
        annualizedGrowth,
        dataPoints: priceData.length,
        dataSource: priceData[0]?.data_source || 'unknown',
        coinId
      });
      
      console.log(`✅ CAGR calculation completed: ${(result.cagrPercent).toFixed(2)}% over ${result.numYears.toFixed(2)} years`);
      return result;
      
    } catch (error) {
      console.error(`❌ CAGR calculation failed for ${coinId}:`, error);
      
      // Return error result
      return {
        cagr: 0,
        cagrPercent: 0,
        beginningDate: '',
        beginningPrice: 0,
        endingDate: '',
        endingPrice: 0,
        totalDays: 0,
        numYears: 0,
        growthRatio: 0,
        exponent: 0,
        annualizedGrowth: 0,
        dataPoints: 0,
        dataQuality: 0,
        dataSource: 'error',
        calculatedAt: new Date().toISOString(),
        coinId,
        isValid: false,
        hasMinimumData: false,
        hasCompletePeriod: false,
        warnings: [error instanceof Error ? error.message : 'Unknown calculation error']
      };
    }
  }
  
  /**
   * Step 0: Gather and Prepare Daily Price Data
   * Logic: Load the time series data (daily dates and closing prices) to identify the full period
   */
  private async gatherAndPrepareDailyPriceData(coinId: string, maxDays: number): Promise<PriceDataPoint[]> {
    console.log(`📊 Gathering daily price data for ${coinId} (max ${maxDays} days)...`);
    
    // Check if coin is supported by Glassnode using symbol mapping service
    const isSupported = symbolMappingService.isGlassNodeSupported(coinId);
    const glassnodeAsset = symbolMappingService.getGlassNodeAsset(coinId);
    
    if (isSupported && glassnodeAsset) {
      // For Glassnode supported coins, fetch daily data directly from API
      console.log(`🟢 Fetching daily Glassnode data for ${coinId} (mapped to ${glassnodeAsset})...`);
      
      try {
        const { data: glassnodeData, error: glassnodeError } = await supabase.functions.invoke(
          'fetch-glassnode-data',
          {
            body: {
              metric: 'market/price_usd_close',
              asset: glassnodeAsset,
              since: Math.floor((Date.now() - (maxDays * 24 * 60 * 60 * 1000)) / 1000),
              until: Math.floor(Date.now() / 1000),
              disableSampling: true // Get daily data
            }
          }
        );
        
        if (glassnodeError) {
          console.warn(`⚠️ Glassnode API failed: ${glassnodeError.message}, falling back to database`);
        } else if (glassnodeData && Array.isArray(glassnodeData) && glassnodeData.length > 0) {
          // Transform Glassnode data to PriceDataPoint format
          console.log(`🔧 Transforming ${glassnodeData.length} Glassnode data points...`);
          const validatedData: PriceDataPoint[] = glassnodeData
            .filter((point: any) => point.value && point.value > 0)
            .map((point: any) => ({
              price_date: new Date(point.unix_timestamp * 1000).toISOString().split('T')[0], // Convert timestamp to YYYY-MM-DD
              price_usd: parseFloat(point.value.toString()),
              data_source: 'glassnode'
            }))
            .sort((a, b) => a.price_date.localeCompare(b.price_date)); // Sort ascending by date
          
          if (validatedData.length >= 2) {
            console.log(`📈 Loaded ${validatedData.length} daily Glassnode price points from ${validatedData[0]?.price_date} to ${validatedData[validatedData.length - 1]?.price_date}`);
            return validatedData;
          }
        }
      } catch (error) {
        console.warn(`⚠️ Glassnode API error: ${error}, falling back to database`);
      }
    }
    
    // Fallback to database for non-Glassnode coins or if API fails
    console.log(`🔄 Falling back to database for ${coinId}...`);
    const { data, error } = await supabase
      .from('price_history_36m')
      .select('price_date, price_usd, data_source')
      .eq('coin_id', coinId)
      .order('price_date', { ascending: true })
      .limit(maxDays);
    
    if (error) {
      throw new Error(`Failed to fetch price data: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      throw new Error('No price data available');
    }
    
    // Validate and convert data types
    const validatedData: PriceDataPoint[] = data
      .filter(point => point.price_usd && point.price_usd > 0) // Ensure positive prices
      .map(point => ({
        price_date: point.price_date,
        price_usd: parseFloat(point.price_usd.toString()), // Convert to float64
        data_source: point.data_source || 'unknown'
      }));
    
    console.log(`📈 Loaded ${validatedData.length} valid price points from ${validatedData[0]?.price_date} to ${validatedData[validatedData.length - 1]?.price_date}`);
    
    return validatedData;
  }
  
  /**
   * Step 1: Extract Beginning and Ending Values
   * Logic: Identify the first (beginning) and last (ending) price and dates from the sorted data
   */
  private extractBeginningAndEndingValues(priceData: PriceDataPoint[]): {
    beginningDate: string;
    beginningPrice: number;
    endingDate: string;
    endingPrice: number;
  } {
    const beginningPoint = priceData[0];
    const endingPoint = priceData[priceData.length - 1];
    
    const beginningDate = beginningPoint.price_date; // str
    const beginningPrice = beginningPoint.price_usd; // float64
    const endingDate = endingPoint.price_date; // str
    const endingPrice = endingPoint.price_usd; // float64
    
    // Validate
    if (beginningDate >= endingDate) {
      throw new Error('Invalid date range: beginning date must be before ending date');
    }
    
    if (beginningPrice <= 0 || endingPrice <= 0) {
      throw new Error('Invalid prices: all prices must be positive');
    }
    
    console.log(`📅 Period: ${beginningDate} ($${beginningPrice.toFixed(2)}) to ${endingDate} ($${endingPrice.toFixed(2)})`);
    
    return { beginningDate, beginningPrice, endingDate, endingPrice };
  }
  
  /**
   * Step 2: Calculate Number of Years (Fractional)
   * Logic: Compute the exact time span in years, using days for precision
   * Formula: num_years (float64) = total_days / 365.25
   */
  private calculateNumberOfYears(beginningDate: string, endingDate: string): {
    totalDays: number;
    numYears: number;
  } {
    const startDate = new Date(beginningDate);
    const endDate = new Date(endingDate);
    
    // Calculate total_days = (ending_date - beginning_date).days + 1 (include both ends)
    const timeDiff = endDate.getTime() - startDate.getTime();
    const totalDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1; // int - add 1 for inclusive period
    
    // num_years = total_days / 365.25 (float64 - accounts for leap years)
    const numYears = totalDays / 365.25; // float64
    
    // Validate
    if (numYears <= 0) {
      throw new Error('Invalid time period: number of years must be positive');
    }
    
    console.log(`⏱️ Time period: ${totalDays} days = ${numYears.toFixed(4)} years`);
    
    return { totalDays, numYears };
  }
  
  /**
   * Step 3: Calculate the Growth Ratio
   * Logic: Determine the overall multiplication factor from beginning to ending price
   * Formula: growth_ratio (float64) = ending_price / beginning_price
   */
  private calculateGrowthRatio(endingPrice: number, beginningPrice: number): number {
    const growthRatio = endingPrice / beginningPrice; // float64
    
    // Validate
    if (growthRatio <= 0) {
      throw new Error('Invalid growth ratio: must be positive');
    }
    
    console.log(`📊 Growth ratio: ${endingPrice.toFixed(2)} / ${beginningPrice.toFixed(2)} = ${growthRatio.toFixed(4)}`);
    
    return growthRatio;
  }
  
  /**
   * Step 4: Calculate the Exponent (Inverse of Years)
   * Logic: Prepare for geometric mean by taking the inverse of num_years
   * Formula: exponent (float64) = 1 / num_years
   */
  private calculateExponent(numYears: number): number {
    const exponent = 1.0 / numYears; // float64
    
    // Validate
    if (exponent <= 0) {
      throw new Error('Invalid exponent: must be positive');
    }
    
    console.log(`🔢 Exponent: 1 / ${numYears.toFixed(4)} = ${exponent.toFixed(6)}`);
    
    return exponent;
  }
  
  /**
   * Step 5: Raise Growth Ratio to the Exponent
   * Logic: Compute the annualized growth factor (nth root of total growth)
   * Formula: annualized_growth (float64) = growth_ratio ** exponent
   */
  private raiseGrowthRatioToExponent(growthRatio: number, exponent: number): number {
    const annualizedGrowth = Math.pow(growthRatio, exponent); // float64
    
    // Validate
    if (annualizedGrowth <= 0) {
      throw new Error('Invalid annualized growth: must be positive');
    }
    
    console.log(`🎯 Annualized growth: ${growthRatio.toFixed(4)} ^ ${exponent.toFixed(6)} = ${annualizedGrowth.toFixed(6)}`);
    
    return annualizedGrowth;
  }
  
  /**
   * Step 6: Subtract 1 to Get CAGR Rate
   * Logic: Convert factor to rate
   * Formula: cagr (float64) = annualized_growth - 1
   */
  private subtractOneToGetCAGRRate(annualizedGrowth: number): number {
    const cagr = annualizedGrowth - 1.0; // float64
    
    console.log(`📈 CAGR: ${annualizedGrowth.toFixed(6)} - 1 = ${cagr.toFixed(6)} (${(cagr * 100).toFixed(2)}%)`);
    
    return cagr;
  }
  
  /**
   * Step 7: Validate and Output
   * Logic: Confirm and interpret results
   */
  private validateAndOutput(calculationData: Partial<CAGRCalculationResult>): CAGRCalculationResult {
    const warnings: string[] = [];
    
    // Validate CAGR is finite
    if (!isFinite(calculationData.cagr || 0)) {
      warnings.push('CAGR calculation resulted in invalid number');
    }
    
    // Check for short periods
    if ((calculationData.numYears || 0) < 1) {
      warnings.push('Time period is less than 1 year - interpret as short-term growth rate');
    }
    
    // Calculate data quality score
    const dataQuality = this.calculateDataQualityScore(
      calculationData.dataPoints || 0,
      calculationData.numYears || 0,
      warnings.length
    );
    
    const result: CAGRCalculationResult = {
      cagr: calculationData.cagr || 0,
      cagrPercent: calculationData.cagrPercent || 0,
      beginningDate: calculationData.beginningDate || '',
      beginningPrice: calculationData.beginningPrice || 0,
      endingDate: calculationData.endingDate || '',
      endingPrice: calculationData.endingPrice || 0,
      totalDays: calculationData.totalDays || 0,
      numYears: calculationData.numYears || 0,
      growthRatio: calculationData.growthRatio || 0,
      exponent: calculationData.exponent || 0,
      annualizedGrowth: calculationData.annualizedGrowth || 0,
      dataPoints: calculationData.dataPoints || 0,
      dataQuality,
      dataSource: calculationData.dataSource || 'unknown',
      calculatedAt: new Date().toISOString(),
      coinId: calculationData.coinId || '',
      isValid: warnings.length === 0 && isFinite(calculationData.cagr || 0),
      hasMinimumData: (calculationData.dataPoints || 0) >= 2,
      hasCompletePeriod: (calculationData.numYears || 0) > 0,
      warnings
    };
    
    // Log final results
    console.log(`✅ CAGR Calculation Summary:`);
    console.log(`   📊 CAGR: ${result.cagrPercent.toFixed(2)}% over ${result.numYears.toFixed(2)} years`);
    console.log(`   📈 Growth: ${result.growthRatio.toFixed(2)}x total return`);
    console.log(`   📅 Period: ${result.beginningDate} to ${result.endingDate}`);
    console.log(`   🎯 Data Quality: ${result.dataQuality}% (${result.dataPoints} points)`);
    
    return result;
  }
  
  /**
   * Calculate data quality score based on various factors
   */
  private calculateDataQualityScore(dataPoints: number, numYears: number, warningCount: number): number {
    let score = 100;
    
    // Deduct for insufficient data points
    const expectedDailyPoints = numYears * 365;
    const dataCompleteness = Math.min(dataPoints / expectedDailyPoints, 1);
    score *= dataCompleteness;
    
    // Deduct for short time periods
    if (numYears < 1) {
      score *= 0.7; // 30% penalty for < 1 year
    } else if (numYears < 2) {
      score *= 0.85; // 15% penalty for < 2 years
    }
    
    // Deduct for warnings
    score *= Math.pow(0.9, warningCount);
    
    return Math.round(Math.max(0, Math.min(100, score)));
  }
}

// Export singleton instance
export const comprehensiveCAGRCalculationService = new ComprehensiveCAGRCalculationService();
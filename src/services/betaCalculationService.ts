// =============================================================================
// PHASE 3: BETA CALCULATION SERVICE - MONTHLY DATA
// Professional beta calculation using monthly returns for stability
// =============================================================================

import { supabase } from '@/integrations/supabase/client';
import { calculateStandardDeviation } from '@/utils/financialCalculations';

export interface BetaResult {
  beta: number;
  confidence: 'low' | 'medium' | 'high';
  source: 'estimated' | 'calculated' | 'api' | 'database';
  lastCalculated?: string;
  correlation?: number;
  rSquared?: number;
  dataFrequency?: 'monthly' | 'daily';
}

export interface PriceData {
  date: string;
  price: number;
}

export class BetaCalculationService {
  private static instance: BetaCalculationService;
  private cacheExpiryHours = 24; // Cache beta calculations for 24 hours

  static getInstance(): BetaCalculationService {
    if (!BetaCalculationService.instance) {
      BetaCalculationService.instance = new BetaCalculationService();
    }
    return BetaCalculationService.instance;
  }

  /**
   * Get beta for a coin with monthly data processing
   */
  async getBetaForCoin(coinId: string): Promise<BetaResult> {
    try {
      // 1. Check database cache first
      const cachedBeta = await this.getCachedBeta(coinId);
      if (cachedBeta && this.isCacheValid(cachedBeta.lastCalculated)) {
        return {
          beta: cachedBeta.beta,
          confidence: cachedBeta.confidence as 'low' | 'medium' | 'high',
          source: 'database',
          lastCalculated: cachedBeta.lastCalculated,
          correlation: cachedBeta.correlation,
          rSquared: cachedBeta.rSquared,
          dataFrequency: 'monthly'
        };
      }

      // 2. Try to calculate from available monthly price data
      const calculatedBeta = await this.calculateMonthlyBetaFromPriceData(coinId);
      if (calculatedBeta) {
        // Cache the calculated result
        await this.cacheBetaResult(coinId, calculatedBeta);
        return calculatedBeta;
      }

      // 3. Fallback to estimated values
      return this.getEstimatedBeta(coinId);

    } catch (error) {
      console.error(`Error getting monthly beta for ${coinId}:`, error);
      return this.getEstimatedBeta(coinId);
    }
  }

  /**
   * Calculate beta from monthly price data using regression analysis
   */
  private async calculateMonthlyBetaFromPriceData(coinId: string): Promise<BetaResult | null> {
    try {
      // Get coin data
      const { data: coinData } = await supabase
        .from('coins')
        .select('basket, price_history')
        .eq('coin_id', coinId)
        .single();

      if (!coinData?.price_history) {
        return null;
      }

      // Get daily price history and convert to monthly
      const { data: dailyPrices } = await supabase
        .from('price_history_36m')
        .select('price_date, price_usd')
        .eq('coin_id', coinId)
        .order('price_date', { ascending: true });

      if (!dailyPrices || dailyPrices.length < 365) {
        return null;
      }

      // Aggregate to monthly prices
      const monthlyPrices = this.aggregateToMonthlyPrices(dailyPrices);
      
      if (monthlyPrices.length < 24) {
        console.log(`Insufficient monthly data for ${coinId}: ${monthlyPrices.length} months`);
        return null;
      }

      // Calculate monthly returns for the coin
      const coinMonthlyReturns = this.calculateMonthlyReturns(monthlyPrices);
      
      // Get Bitcoin monthly returns as market proxy
      const bitcoinMonthlyReturns = await this.getBitcoinMonthlyReturns(monthlyPrices.length);
      
      if (!bitcoinMonthlyReturns || coinMonthlyReturns.length !== bitcoinMonthlyReturns.length) {
        return null;
      }

      // Calculate beta using monthly regression
      const beta = this.calculateBetaRegression(coinMonthlyReturns, bitcoinMonthlyReturns);
      const correlation = this.calculateCorrelation(coinMonthlyReturns, bitcoinMonthlyReturns);
      const rSquared = Math.pow(correlation, 2);

      // Determine confidence based on monthly R-squared and data quality
      let confidence: 'low' | 'medium' | 'high' = 'low';
      if (rSquared > 0.6 && monthlyPrices.length > 36) {
        confidence = 'high';
      } else if (rSquared > 0.4 && monthlyPrices.length > 24) {
        confidence = 'medium';
      }

      console.log(`Monthly beta calculated for ${coinId}: ${beta.toFixed(3)} (R²: ${rSquared.toFixed(3)}, ${monthlyPrices.length} months)`);

      return {
        beta,
        confidence,
        source: 'calculated',
        lastCalculated: new Date().toISOString(),
        correlation,
        rSquared,
        dataFrequency: 'monthly'
      };

    } catch (error) {
      console.error('Error calculating monthly beta from price data:', error);
      return null;
    }
  }

  /**
   * Aggregate daily prices to monthly (end-of-month prices)
   */
  private aggregateToMonthlyPrices(
    dailyPrices: Array<{price_date: string, price_usd: number}>
  ): Array<{date: string, price: number}> {
    const monthlyPrices: Array<{date: string, price: number}> = [];
    const pricesByMonth = new Map<string, Array<{price_date: string, price_usd: number}>>();
    
    // Group prices by month
    for (const priceData of dailyPrices) {
      const date = new Date(priceData.price_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!pricesByMonth.has(monthKey)) {
        pricesByMonth.set(monthKey, []);
      }
      pricesByMonth.get(monthKey)!.push(priceData);
    }
    
    // Get end-of-month price for each month
    for (const [monthKey, monthPrices] of pricesByMonth) {
      // Sort by date and take the last price of the month
      monthPrices.sort((a, b) => new Date(a.price_date).getTime() - new Date(b.price_date).getTime());
      const endOfMonthPrice = monthPrices[monthPrices.length - 1];
      
      monthlyPrices.push({
        date: monthKey + '-01',
        price: endOfMonthPrice.price_usd
      });
    }
    
    return monthlyPrices.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Calculate monthly returns from price data
   */
  private calculateMonthlyReturns(priceData: Array<{date: string, price: number}>): number[] {
    const returns: number[] = [];
    for (let i = 1; i < priceData.length; i++) {
      const prevPrice = priceData[i - 1].price;
      const currentPrice = priceData[i].price;
      
      if (prevPrice > 0) {
        returns.push((currentPrice - prevPrice) / prevPrice);
      }
    }
    return returns;
  }

  /**
   * Calculate beta using monthly linear regression (covariance / variance)
   */
  private calculateBetaRegression(assetReturns: number[], marketReturns: number[]): number {
    const n = assetReturns.length;
    
    // Calculate means
    const assetMean = assetReturns.reduce((sum, ret) => sum + ret, 0) / n;
    const marketMean = marketReturns.reduce((sum, ret) => sum + ret, 0) / n;
    
    // Calculate covariance and market variance
    let covariance = 0;
    let marketVariance = 0;
    
    for (let i = 0; i < n; i++) {
      const assetDiff = assetReturns[i] - assetMean;
      const marketDiff = marketReturns[i] - marketMean;
      
      covariance += assetDiff * marketDiff;
      marketVariance += marketDiff * marketDiff;
    }
    
    covariance /= (n - 1);
    marketVariance /= (n - 1);
    
    return marketVariance !== 0 ? covariance / marketVariance : 1.0;
  }

  /**
   * Calculate correlation coefficient for monthly returns
   */
  private calculateCorrelation(assetReturns: number[], marketReturns: number[]): number {
    const assetStdDev = calculateStandardDeviation(assetReturns);
    const marketStdDev = calculateStandardDeviation(marketReturns);
    
    if (assetStdDev === 0 || marketStdDev === 0) return 0;
    
    const n = assetReturns.length;
    const assetMean = assetReturns.reduce((sum, ret) => sum + ret, 0) / n;
    const marketMean = marketReturns.reduce((sum, ret) => sum + ret, 0) / n;
    
    let covariance = 0;
    for (let i = 0; i < n; i++) {
      covariance += (assetReturns[i] - assetMean) * (marketReturns[i] - marketMean);
    }
    
    covariance /= (n - 1);
    return covariance / (assetStdDev * marketStdDev);
  }

  /**
   * Get Bitcoin monthly returns for comparison
   */
  private async getBitcoinMonthlyReturns(length: number): Promise<number[] | null> {
    try {
      const { data: btcDailyPrices } = await supabase
        .from('price_history_36m')
        .select('price_date, price_usd')
        .eq('coin_id', 'bitcoin')
        .order('price_date', { ascending: true });

      if (!btcDailyPrices || btcDailyPrices.length < length * 30) {
        return null;
      }

      // Convert to monthly prices
      const btcMonthlyPrices = this.aggregateToMonthlyPrices(btcDailyPrices);
      
      if (btcMonthlyPrices.length < length) {
        return null;
      }

      // Take the most recent months matching the requested length
      const relevantPrices = btcMonthlyPrices.slice(-length);
      return this.calculateMonthlyReturns(relevantPrices);
    } catch (error) {
      console.error('Error fetching Bitcoin monthly returns:', error);
      return null;
    }
  }

  private async getCachedBeta(coinId: string) {
    const { data } = await supabase
      .from('coins')
      .select('beta, beta_confidence, beta_last_calculated')
      .eq('coin_id', coinId)
      .single();

    if (data?.beta) {
      return {
        beta: data.beta,
        confidence: data.beta_confidence || 'low',
        lastCalculated: data.beta_last_calculated,
        correlation: null,
        rSquared: null
      };
    }

    return null;
  }

  private async cacheBetaResult(coinId: string, betaResult: BetaResult) {
    try {
      await supabase
        .from('coins')
        .update({
          beta: betaResult.beta,
          beta_confidence: betaResult.confidence,
          beta_last_calculated: betaResult.lastCalculated,
          beta_data_source: betaResult.source
        })
        .eq('coin_id', coinId);
    } catch (error) {
      console.error('Error caching monthly beta result:', error);
    }
  }

  private isCacheValid(lastCalculated: string | null): boolean {
    if (!lastCalculated) return false;
    
    const lastCalcDate = new Date(lastCalculated);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastCalcDate.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff < this.cacheExpiryHours;
  }

  private getEstimatedBeta(coinId: string): BetaResult {
    // Professional beta estimates based on monthly analysis
    const betaEstimates: Record<string, number> = {
      'BTC': 1.0,
      'ETH': 1.4,
      'SOL': 1.6,
      'ADA': 1.3,
      'DOT': 1.3,
      'LINK': 1.4,
      'AVAX': 1.6,
      'MATIC': 1.5,
      'ATOM': 1.4,
      'ALGO': 1.2,
      'XRP': 1.3,
      'LTC': 1.1,
      'BCH': 1.2,
      'XLM': 1.4,
      'NEAR': 1.5,
      'APT': 1.7,
    };

    const beta = betaEstimates[coinId];
    
    if (beta) {
      return {
        beta,
        confidence: 'medium',
        source: 'estimated',
        lastCalculated: new Date().toISOString(),
        dataFrequency: 'monthly'
      };
    }

    return {
      beta: 1.5,
      confidence: 'low',
      source: 'estimated',
      lastCalculated: new Date().toISOString(),
      dataFrequency: 'monthly'
    };
  }

  async updateAllBetas(): Promise<void> {
    try {
      const { data: coins } = await supabase
        .from('coins')
        .select('coin_id');

      if (!coins) return;

      const updatePromises = coins.map(coin => 
        this.getBetaForCoin(coin.coin_id)
      );

      await Promise.all(updatePromises);
      console.log(`Updated monthly betas for ${coins.length} coins`);
    } catch (error) {
      console.error('Error updating all monthly betas:', error);
    }
  }
}

// Export singleton instance
export const betaCalculationService = BetaCalculationService.getInstance();

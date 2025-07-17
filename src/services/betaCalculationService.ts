// =============================================================================
// PHASE 3: BETA CALCULATION SERVICE
// Professional beta calculation and risk metrics
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
   * Get beta for a coin with intelligent caching and fallback
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
          rSquared: cachedBeta.rSquared
        };
      }

      // 2. Try to calculate from available price data
      const calculatedBeta = await this.calculateBetaFromPriceData(coinId);
      if (calculatedBeta) {
        // Cache the calculated result
        await this.cacheBetaResult(coinId, calculatedBeta);
        return calculatedBeta;
      }

      // 3. Fallback to estimated values
      return this.getEstimatedBeta(coinId);

    } catch (error) {
      console.error(`Error getting beta for ${coinId}:`, error);
      return this.getEstimatedBeta(coinId);
    }
  }

  /**
   * Calculate beta from price data using regression analysis
   */
  private async calculateBetaFromPriceData(coinId: string): Promise<BetaResult | null> {
    try {
      // Get coin data to determine basket
      const { data: coinData } = await supabase
        .from('coins')
        .select('basket, price_history')
        .eq('coin_id', coinId)
        .single();

      if (!coinData?.price_history) {
        return null;
      }

      // Extract price data (assuming price_history is an array of {date, price})
      const priceHistory: PriceData[] = Array.isArray(coinData.price_history) 
        ? (coinData.price_history as unknown as PriceData[])
        : [];

      if (priceHistory.length < 30) {
        // Need at least 30 data points for reliable beta
        return null;
      }

      // Calculate returns for the coin
      const coinReturns = this.calculateReturns(priceHistory);
      
      // Get Bitcoin returns as market proxy (you'd need Bitcoin price data)
      const bitcoinReturns = await this.getBitcoinReturns(priceHistory.length);
      
      if (!bitcoinReturns || coinReturns.length !== bitcoinReturns.length) {
        return null;
      }

      // Calculate beta using regression
      const beta = this.calculateBetaRegression(coinReturns, bitcoinReturns);
      const correlation = this.calculateCorrelation(coinReturns, bitcoinReturns);
      const rSquared = Math.pow(correlation, 2);

      // Determine confidence based on R-squared and data quality
      let confidence: 'low' | 'medium' | 'high' = 'low';
      if (rSquared > 0.7 && priceHistory.length > 90) {
        confidence = 'high';
      } else if (rSquared > 0.5 && priceHistory.length > 60) {
        confidence = 'medium';
      }

      return {
        beta,
        confidence,
        source: 'calculated',
        lastCalculated: new Date().toISOString(),
        correlation,
        rSquared
      };

    } catch (error) {
      console.error('Error calculating beta from price data:', error);
      return null;
    }
  }

  /**
   * Calculate beta using linear regression (covariance / variance)
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
   * Calculate correlation coefficient
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
   * Calculate returns from price data
   */
  private calculateReturns(priceData: PriceData[]): number[] {
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
   * Get Bitcoin returns for comparison (simplified - you'd fetch actual data)
   */
  private async getBitcoinReturns(length: number): Promise<number[] | null> {
    try {
      // In a real implementation, you'd fetch Bitcoin price data
      // For now, we'll use a simplified approach
      const { data: btcData } = await supabase
        .from('coins')
        .select('price_history')
        .eq('coin_id', 'BTC')
        .single();

      if (!btcData?.price_history) {
        return null;
      }

      const priceHistory: PriceData[] = Array.isArray(btcData.price_history) 
        ? (btcData.price_history as unknown as PriceData[])
        : [];

      if (priceHistory.length < length) {
        return null;
      }

      return this.calculateReturns(priceHistory.slice(-length));
    } catch (error) {
      console.error('Error fetching Bitcoin returns:', error);
      return null;
    }
  }

  /**
   * Get cached beta from database
   */
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

  /**
   * Cache beta result in database
   */
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
      console.error('Error caching beta result:', error);
    }
  }

  /**
   * Check if cached beta is still valid
   */
  private isCacheValid(lastCalculated: string | null): boolean {
    if (!lastCalculated) return false;
    
    const lastCalcDate = new Date(lastCalculated);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastCalcDate.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff < this.cacheExpiryHours;
  }

  /**
   * Get estimated beta values based on coin and basket
   */
  private getEstimatedBeta(coinId: string): BetaResult {
    // Professional beta estimates based on market analysis
    const betaEstimates: Record<string, number> = {
      // Bitcoin
      'BTC': 1.0,
      
      // Blue Chip (established altcoins)
      'ETH': 1.4,   // Ethereum - established but more volatile than Bitcoin
      'SOL': 1.6,   // Solana - higher volatility, emerging ecosystem
      'ADA': 1.3,   // Cardano - more stable than most altcoins
      'DOT': 1.3,   // Polkadot - similar risk profile to ADA
      'LINK': 1.4,  // Chainlink - oracle dependency creates volatility
      'AVAX': 1.6,  // Avalanche - newer ecosystem, higher beta
      'MATIC': 1.5, // Polygon - scaling solution, moderate volatility
      'ATOM': 1.4,  // Cosmos - interoperability play, moderate risk
      'ALGO': 1.2,  // Algorand - more stable technical approach
      
      // Additional blue chips
      'XRP': 1.3,   // Ripple - regulatory uncertainty
      'LTC': 1.1,   // Litecoin - Bitcoin derivative, lower volatility
      'BCH': 1.2,   // Bitcoin Cash - Bitcoin fork with moderate risk
      'XLM': 1.4,   // Stellar - payments focus, moderate volatility
      'NEAR': 1.5,  // NEAR Protocol - emerging ecosystem
      'APT': 1.7,   // Aptos - newer layer 1, higher volatility
      
      // Default values by basket type
      'BLUE_CHIP_DEFAULT': 1.5,
      'SMALL_CAP_DEFAULT': 2.5,
      'BITCOIN_DEFAULT': 1.0
    };

    const beta = betaEstimates[coinId];
    
    if (beta) {
      return {
        beta,
        confidence: 'medium',
        source: 'estimated',
        lastCalculated: new Date().toISOString()
      };
    }

    // Fallback to basket defaults
    return {
      beta: betaEstimates['BLUE_CHIP_DEFAULT'], // Most conservative fallback
      confidence: 'low',
      source: 'estimated',
      lastCalculated: new Date().toISOString()
    };
  }

  /**
   * Update beta for all coins (batch operation)
   */
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
      console.log(`Updated betas for ${coins.length} coins`);
    } catch (error) {
      console.error('Error updating all betas:', error);
    }
  }
}

// Export singleton instance
export const betaCalculationService = BetaCalculationService.getInstance();
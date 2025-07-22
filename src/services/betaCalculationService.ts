
// =============================================================================
// PHASE 3: BETA CALCULATION SERVICE - MONTHLY DATA
// Professional beta calculation using monthly returns for stability
// =============================================================================

import { supabase } from '@/integrations/supabase/client';
import { calculateStandardDeviation } from '@/utils/financialCalculations';
import { enhancedBenchmarkService } from './enhancedBenchmarkService';
import { enhancedGlassnodeService } from './enhancedGlassnodeService';

export interface BetaResult {
  beta: number;
  confidence: 'low' | 'medium' | 'high';
  source: 'estimated' | 'calculated' | 'api' | 'database';
  lastCalculated?: string;
  correlation?: number;
  rSquared?: number;
  dataFrequency?: 'monthly' | 'daily';
  benchmarkUsed?: string;
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
      console.log(`🎯 Calculating Beta for ${coinId.toUpperCase()}`);
      
      // 1. Check database cache first
      const cachedBeta = await this.getCachedBeta(coinId);
      if (cachedBeta && this.isCacheValid(cachedBeta.lastCalculated)) {
        console.log(`📦 Using cached Beta for ${coinId}: ${cachedBeta.beta.toFixed(3)}`);
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
      const calculatedBeta = await this.calculateBetaFromEnhancedServices(coinId);
      if (calculatedBeta) {
        // Cache the calculated result
        await this.cacheBetaResult(coinId, calculatedBeta);
        return calculatedBeta;
      }

      // 3. Fallback to estimated values
      return this.getEstimatedBeta(coinId);

    } catch (error) {
      console.error(`Error getting Beta for ${coinId}:`, error);
      return this.getEstimatedBeta(coinId);
    }
  }

  /**
   * Calculate beta using enhanced services for both crypto and benchmark data
   */
  private async calculateBetaFromEnhancedServices(coinId: string): Promise<BetaResult | null> {
    try {
      console.log(`📊 Calculating Beta from enhanced services for ${coinId}`);
      
      // Get coin symbol for Glassnode
      const coinSymbol = this.getCoinSymbol(coinId);
      
      // Get crypto monthly returns from Glassnode
      const cryptoMonthlyPrices = await enhancedGlassnodeService.getMonthlyClosingPrices(coinSymbol);
      if (!cryptoMonthlyPrices || cryptoMonthlyPrices.length < 24) {
        console.log(`Insufficient crypto data for ${coinId}: ${cryptoMonthlyPrices?.length || 0} months`);
        return null;
      }

      const cryptoMonthlyReturns = enhancedGlassnodeService.calculateMonthlyReturns(cryptoMonthlyPrices);
      
      // Get benchmark data using enhanced service
      const benchmarkData = await enhancedBenchmarkService.getBenchmarkForCoin(coinId);
      if (!benchmarkData.monthlyReturns || benchmarkData.monthlyReturns.length < 24) {
        console.log(`Insufficient benchmark data for ${coinId}: ${benchmarkData.monthlyReturns?.length || 0} months`);
        return null;
      }

      // Align data to same time period
      const minLength = Math.min(cryptoMonthlyReturns.length, benchmarkData.monthlyReturns.length);
      const alignedCryptoReturns = cryptoMonthlyReturns.slice(-minLength);
      const alignedBenchmarkReturns = benchmarkData.monthlyReturns.slice(-minLength);

      console.log(`📈 Data alignment: ${minLength} months, crypto: ${alignedCryptoReturns.length}, benchmark: ${alignedBenchmarkReturns.length}`);
      console.log(`🎯 Benchmark: ${benchmarkData.name}`);

      // Calculate beta using regression
      const beta = this.calculateBetaRegression(alignedCryptoReturns, alignedBenchmarkReturns);
      const correlation = this.calculateCorrelation(alignedCryptoReturns, alignedBenchmarkReturns);
      const rSquared = Math.pow(correlation, 2);

      // Determine confidence based on R-squared and data quality
      let confidence: 'low' | 'medium' | 'high' = 'low';
      if (rSquared > 0.6 && minLength > 36) {
        confidence = 'high';
      } else if (rSquared > 0.4 && minLength > 24) {
        confidence = 'medium';
      }

      console.log(`✅ Dynamic Beta calculated for ${coinId}: ${beta.toFixed(3)} (R²: ${rSquared.toFixed(3)}, ${minLength} months, ${confidence} confidence)`);

      return {
        beta,
        confidence,
        source: 'calculated',
        lastCalculated: new Date().toISOString(),
        correlation,
        rSquared,
        dataFrequency: 'monthly',
        benchmarkUsed: benchmarkData.name
      };

    } catch (error) {
      console.error('Error calculating Beta from enhanced services:', error);
      return null;
    }
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
    
    const beta = marketVariance !== 0 ? covariance / marketVariance : 1.0;
    console.log(`🔢 Beta regression: cov=${covariance.toFixed(6)}, var=${marketVariance.toFixed(6)}, beta=${beta.toFixed(3)}`);
    
    return beta;
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
   * Get coin symbol for Glassnode API
   */
  private getCoinSymbol(coinId: string): string {
    const symbolMap: { [key: string]: string } = {
      'bitcoin': 'btc',
      'ethereum': 'eth',
      'solana': 'sol',
      'cardano': 'ada',
      'litecoin': 'ltc',
      'btc': 'btc',
      'eth': 'eth',
      'sol': 'sol',
      'ada': 'ada',
      'ltc': 'ltc'
    };
    
    return symbolMap[coinId.toLowerCase()] || 'btc';
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
        
      console.log(`💾 Cached Beta result for ${coinId}: ${betaResult.beta.toFixed(3)}`);
    } catch (error) {
      console.error('Error caching Beta result:', error);
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
      'bitcoin': 1.0,
      'btc': 1.0,
      'ethereum': 1.4,
      'eth': 1.4,
      'solana': 1.6,
      'sol': 1.6,
      'cardano': 1.3,
      'ada': 1.3,
      'litecoin': 1.1,
      'ltc': 1.1,
    };

    const beta = betaEstimates[coinId.toLowerCase()];
    
    if (beta) {
      console.log(`📊 Using estimated Beta for ${coinId}: ${beta.toFixed(1)}`);
      return {
        beta,
        confidence: 'medium',
        source: 'estimated',
        lastCalculated: new Date().toISOString(),
        dataFrequency: 'monthly'
      };
    }

    console.log(`⚠️ Using default Beta for ${coinId}: 1.5`);
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

      console.log(`🔄 Updating Betas for ${coins.length} coins...`);
      
      const updatePromises = coins.map(coin => 
        this.getBetaForCoin(coin.coin_id)
      );

      await Promise.all(updatePromises);
      console.log(`✅ Updated Betas for ${coins.length} coins`);
    } catch (error) {
      console.error('Error updating all Betas:', error);
    }
  }
}

// Export singleton instance
export const betaCalculationService = BetaCalculationService.getInstance();

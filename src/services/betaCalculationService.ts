
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
  private cacheExpiryHours = 1; // Reduced cache time to force fresh calculations

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
      console.log(`🎯 Calculating Beta for ${coinId.toUpperCase()} - FORCING FRESH CALCULATION`);
      
      // TEMPORARILY DISABLE CACHE - Force fresh calculation every time
      console.log(`⚠️ CACHE DISABLED - Forcing fresh API-based calculation`);
      
      // Try to calculate from available monthly price data using REAL APIs
      const calculatedBeta = await this.calculateBetaFromEnhancedServices(coinId);
      if (calculatedBeta) {
        // Cache the calculated result
        await this.cacheBetaResult(coinId, calculatedBeta);
        return calculatedBeta;
      }

      // Only fallback if APIs completely fail
      console.log(`❌ API calculation failed for ${coinId}, using fallback`);
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
      console.log(`📊 Calculating Beta from REAL API data for ${coinId}`);
      
      // Get coin symbol for Glassnode
      const coinSymbol = this.getCoinSymbol(coinId);
      
      // Get crypto monthly returns from Glassnode API
      console.log(`🔄 Fetching ${coinSymbol} monthly prices from Glassnode...`);
      const cryptoMonthlyPrices = await enhancedGlassnodeService.getMonthlyClosingPrices(coinSymbol);
      if (!cryptoMonthlyPrices || cryptoMonthlyPrices.length < 24) {
        console.log(`❌ Insufficient crypto data for ${coinId}: ${cryptoMonthlyPrices?.length || 0} months`);
        return null;
      }

      const cryptoMonthlyReturns = enhancedGlassnodeService.calculateMonthlyReturns(cryptoMonthlyPrices);
      console.log(`📈 Crypto monthly returns calculated: ${cryptoMonthlyReturns.length} months`);
      
      // Get benchmark data using enhanced service - FORCE API FETCH
      console.log(`🎯 Fetching benchmark data for ${coinId} (FORCING API CALL)...`);
      const benchmarkData = await enhancedBenchmarkService.getBenchmarkForCoin(coinId);
      
      // CRITICAL CHECK: Verify we have REAL monthly returns, not fallback
      if (!benchmarkData.monthlyReturns || benchmarkData.monthlyReturns.length < 24) {
        console.log(`❌ Insufficient benchmark data for ${coinId}: ${benchmarkData.monthlyReturns?.length || 0} months`);
        console.log(`🔍 Benchmark data:`, {
          name: benchmarkData.name,
          monthlyReturnsLength: benchmarkData.monthlyReturns?.length || 0,
          cagr: benchmarkData.cagr36m
        });
        return null;
      }

      // Log the actual benchmark data we're using
      console.log(`📊 BENCHMARK DATA VERIFICATION for ${benchmarkData.name}:`);
      console.log(`   - Monthly returns count: ${benchmarkData.monthlyReturns.length}`);
      console.log(`   - First 5 returns:`, benchmarkData.monthlyReturns.slice(0, 5));
      console.log(`   - Last 5 returns:`, benchmarkData.monthlyReturns.slice(-5));
      console.log(`   - CAGR: ${benchmarkData.cagr36m.toFixed(2)}%`);

      // Align data to same time period
      const minLength = Math.min(cryptoMonthlyReturns.length, benchmarkData.monthlyReturns.length);
      const alignedCryptoReturns = cryptoMonthlyReturns.slice(-minLength);
      const alignedBenchmarkReturns = benchmarkData.monthlyReturns.slice(-minLength);

      console.log(`📈 REAL DATA ALIGNMENT: ${minLength} months`);
      console.log(`   - Crypto returns: ${alignedCryptoReturns.length} points`);
      console.log(`   - Benchmark returns: ${alignedBenchmarkReturns.length} points`);
      console.log(`   - Benchmark: ${benchmarkData.name}`);

      // Calculate beta using regression with REAL data
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

      console.log(`✅ REAL API-BASED Beta calculated for ${coinId}:`);
      console.log(`   - Beta: ${beta.toFixed(3)}`);
      console.log(`   - R²: ${rSquared.toFixed(3)}`);
      console.log(`   - Data points: ${minLength} months`);
      console.log(`   - Confidence: ${confidence}`);
      console.log(`   - Benchmark: ${benchmarkData.name}`);

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
      console.error('❌ Error calculating Beta from enhanced services:', error);
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
    console.log(`🔢 Beta regression calculation:`);
    console.log(`   - Covariance: ${covariance.toFixed(6)}`);
    console.log(`   - Market variance: ${marketVariance.toFixed(6)}`);
    console.log(`   - Beta: ${beta.toFixed(3)}`);
    
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
      .select('beta, beta_confidence, beta_last_calculated, beta_data_source')
      .eq('coin_id', coinId)
      .single();

    // Ignore cached values if they're just estimates - force real calculation
    if (data?.beta && data.beta_data_source === 'calculated') {
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
        
      console.log(`💾 Cached REAL Beta result for ${coinId}: ${betaResult.beta.toFixed(3)} (${betaResult.source})`);
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
    // ONLY use as absolute fallback when APIs fail
    console.log(`⚠️ FALLBACK: Using estimated Beta for ${coinId} - APIs failed`);
    
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

    const beta = betaEstimates[coinId.toLowerCase()] || 1.5;
    
    return {
      beta,
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

      console.log(`🔄 Updating Betas for ${coins.length} coins with REAL API data...`);
      
      const updatePromises = coins.map(coin => 
        this.getBetaForCoin(coin.coin_id)
      );

      await Promise.all(updatePromises);
      console.log(`✅ Updated Betas for ${coins.length} coins with REAL calculations`);
    } catch (error) {
      console.error('Error updating all Betas:', error);
    }
  }
}

// Export singleton instance
export const betaCalculationService = BetaCalculationService.getInstance();

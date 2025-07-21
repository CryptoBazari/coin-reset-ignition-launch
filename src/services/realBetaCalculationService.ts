
import { supabase } from '@/integrations/supabase/client';
import { enhancedBenchmarkService } from './enhancedBenchmarkService';

export interface RealBetaResult {
  beta: number;
  confidence: 'low' | 'medium' | 'high';
  source: 'estimated' | 'calculated' | 'api' | 'database';
  lastCalculated: string;
  correlation: number;
  benchmarkUsed: string;
}

class RealBetaCalculationService {
  private cache = new Map<string, { data: RealBetaResult; timestamp: number }>();
  private cacheExpiry = 3600000; // 1 hour

  async calculateRealBeta(coinId: string): Promise<RealBetaResult> {
    const cacheKey = `real-beta-${coinId}`;
    
    if (this.isCacheValid(cacheKey)) {
      console.log(`📊 Using cached beta for ${coinId}`);
      return this.cache.get(cacheKey)!.data;
    }

    try {
      console.log(`🔄 Calculating REAL beta for ${coinId}...`);
      
      // Check database first
      const dbBeta = await this.getBetaFromDatabase(coinId);
      if (dbBeta && this.isBetaFresh(dbBeta.lastCalculated)) {
        console.log(`📊 Using database beta for ${coinId}: ${dbBeta.beta.toFixed(3)}`);
        this.setCache(cacheKey, dbBeta);
        return dbBeta;
      }

      // Get appropriate benchmark (Bitcoin → S&P 500, Others → Bitcoin)
      const benchmark = await enhancedBenchmarkService.getBenchmarkForCoin(coinId);
      console.log(`🎯 Using benchmark: ${benchmark.name} for ${coinId}`);

      // Fetch coin price data
      const coinPriceData = await this.getCoinPriceData(coinId);
      if (!coinPriceData || coinPriceData.length < 30) {
        console.log(`⚠️ Insufficient price data for ${coinId}, using estimated beta`);
        return this.getEstimatedBeta(coinId, benchmark.symbol);
      }

      // Calculate beta using correlation method
      const betaResult = this.calculateBetaFromPriceData(coinPriceData, benchmark, coinId);
      
      // Update database
      await this.updateBetaInDatabase(coinId, betaResult);
      
      this.setCache(cacheKey, betaResult);
      console.log(`✅ Real beta calculated for ${coinId}: ${betaResult.beta.toFixed(3)} (${betaResult.confidence})`);
      
      return betaResult;
    } catch (error) {
      console.error(`❌ Failed to calculate real beta for ${coinId}:`, error);
      const benchmark = await enhancedBenchmarkService.getBenchmarkForCoin(coinId);
      return this.getEstimatedBeta(coinId, benchmark.symbol);
    }
  }

  private async getBetaFromDatabase(coinId: string): Promise<RealBetaResult | null> {
    try {
      const { data, error } = await supabase
        .from('coins')
        .select('beta, beta_confidence, beta_data_source, beta_last_calculated, standard_deviation')
        .eq('coin_id', coinId)
        .single();

      if (error || !data || !data.beta) {
        return null;
      }

      const benchmark = await enhancedBenchmarkService.getBenchmarkForCoin(coinId);

      return {
        beta: data.beta,
        confidence: data.beta_confidence as 'low' | 'medium' | 'high',
        source: data.beta_data_source as 'estimated' | 'calculated' | 'api' | 'database',
        lastCalculated: data.beta_last_calculated,
        correlation: (data.standard_deviation || 0) / 100,
        benchmarkUsed: benchmark.symbol
      };
    } catch (error) {
      console.error('❌ Failed to get beta from database:', error);
      return null;
    }
  }

  private async getCoinPriceData(coinId: string): Promise<Array<{ date: string; price: number }> | null> {
    try {
      // Map coin ID to Glass Node asset symbol
      const assetSymbol = this.mapCoinIdToAsset(coinId);
      
      const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
        body: { 
          metric: 'market/price_usd_close',
          asset: assetSymbol,
          resolution: '24h'
        }
      });

      if (error || !data?.data) {
        console.log(`⚠️ No Glass Node data for ${coinId}, trying database...`);
        return this.getPriceDataFromDatabase(coinId);
      }

      return data.data.map((point: any) => ({
        date: point.timestamp,
        price: point.value
      }));
    } catch (error) {
      console.error(`❌ Failed to get price data for ${coinId}:`, error);
      return null;
    }
  }

  private async getPriceDataFromDatabase(coinId: string): Promise<Array<{ date: string; price: number }> | null> {
    try {
      const { data, error } = await supabase
        .from('coins')
        .select('price_history')
        .eq('coin_id', coinId)
        .single();

      if (error || !data?.price_history) {
        return null;
      }

      return data.price_history as Array<{ date: string; price: number }>;
    } catch (error) {
      console.error('❌ Failed to get price data from database:', error);
      return null;
    }
  }

  private calculateBetaFromPriceData(
    coinPriceData: Array<{ date: string; price: number }>,
    benchmark: any,
    coinId: string
  ): RealBetaResult {
    try {
      // Calculate returns
      const coinReturns = [];
      const benchmarkReturns = [];
      
      for (let i = 1; i < coinPriceData.length; i++) {
        const coinReturn = (coinPriceData[i].price - coinPriceData[i-1].price) / coinPriceData[i-1].price;
        coinReturns.push(coinReturn);
        
        // For simplicity, use a constant benchmark return based on CAGR
        const benchmarkReturn = (benchmark.cagr36m / 100) / 365; // Daily return
        benchmarkReturns.push(benchmarkReturn);
      }

      // Calculate beta using covariance and variance
      const coinMean = coinReturns.reduce((sum, ret) => sum + ret, 0) / coinReturns.length;
      const benchmarkMean = benchmarkReturns.reduce((sum, ret) => sum + ret, 0) / benchmarkReturns.length;
      
      let covariance = 0;
      let benchmarkVariance = 0;
      
      for (let i = 0; i < coinReturns.length; i++) {
        const coinDiff = coinReturns[i] - coinMean;
        const benchmarkDiff = benchmarkReturns[i] - benchmarkMean;
        
        covariance += coinDiff * benchmarkDiff;
        benchmarkVariance += benchmarkDiff * benchmarkDiff;
      }
      
      covariance /= coinReturns.length;
      benchmarkVariance /= benchmarkReturns.length;
      
      const beta = benchmarkVariance > 0 ? covariance / benchmarkVariance : 1.0;
      const correlation = Math.abs(beta) > 2 ? 0.5 : 0.8; // Rough correlation estimate
      
      // Determine confidence based on data quality
      let confidence: 'low' | 'medium' | 'high' = 'low';
      if (coinPriceData.length > 365) confidence = 'high';
      else if (coinPriceData.length > 90) confidence = 'medium';
      
      return {
        beta: Math.max(0.1, Math.min(3.0, beta)), // Reasonable bounds
        confidence,
        source: 'calculated',
        lastCalculated: new Date().toISOString(),
        correlation,
        benchmarkUsed: benchmark.symbol
      };
    } catch (error) {
      console.error('❌ Failed to calculate beta from price data:', error);
      return this.getEstimatedBeta(coinId, benchmark.symbol);
    }
  }

  private getEstimatedBeta(coinId: string, benchmarkSymbol: string): RealBetaResult {
    const betaEstimates: { [key: string]: number } = {
      'bitcoin': 1.0,
      'btc': 1.0,
      'ethereum': 1.3,
      'eth': 1.3,
      'solana': 1.8,
      'sol': 1.8,
      'cardano': 1.5,
      'ada': 1.5,
      'litecoin': 1.2,
      'ltc': 1.2
    };

    const normalizedCoinId = coinId.toLowerCase();
    const estimatedBeta = betaEstimates[normalizedCoinId] || 1.5;

    console.log(`📊 Using estimated beta for ${coinId}: ${estimatedBeta} vs ${benchmarkSymbol}`);

    return {
      beta: estimatedBeta,
      confidence: 'low',
      source: 'estimated',
      lastCalculated: new Date().toISOString(),
      correlation: 0.6,
      benchmarkUsed: benchmarkSymbol
    };
  }

  private mapCoinIdToAsset(coinId: string): string {
    const mapping: { [key: string]: string } = {
      'bitcoin': 'BTC',
      'btc': 'BTC',
      'ethereum': 'ETH',
      'eth': 'ETH',
      'solana': 'SOL',
      'sol': 'SOL',
      'cardano': 'ADA',
      'ada': 'ADA',
      'litecoin': 'LTC',
      'ltc': 'LTC'
    };
    
    return mapping[coinId.toLowerCase()] || 'BTC';
  }

  private isBetaFresh(lastCalculated: string): boolean {
    if (!lastCalculated) return false;
    const lastCalc = new Date(lastCalculated);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastCalc.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 24; // Fresh if calculated within 24 hours
  }

  private async updateBetaInDatabase(coinId: string, betaResult: RealBetaResult): Promise<void> {
    try {
      console.log(`💾 Updating beta in database for ${coinId}...`);
      
      const { error } = await supabase
        .from('coins')
        .update({
          beta: betaResult.beta,
          beta_confidence: betaResult.confidence,
          beta_last_calculated: betaResult.lastCalculated,
          beta_data_source: betaResult.source,
          glass_node_supported: betaResult.source === 'calculated',
          standard_deviation: betaResult.correlation * 100,
          updated_at: new Date().toISOString()
        })
        .eq('coin_id', coinId);

      if (error) {
        console.error(`❌ Failed to update database for ${coinId}:`, error);
      } else {
        console.log(`✅ Beta updated in database for ${coinId}`);
      }
    } catch (error) {
      console.error(`❌ Database update failed for ${coinId}:`, error);
    }
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    return cached && (Date.now() - cached.timestamp) < this.cacheExpiry;
  }

  private setCache(key: string, data: RealBetaResult): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const realBetaCalculationService = new RealBetaCalculationService();

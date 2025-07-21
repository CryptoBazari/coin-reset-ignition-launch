import { supabase } from '@/integrations/supabase/client';
import { enhancedBenchmarkService } from './enhancedBenchmarkService';

export interface RealBetaResult {
  beta: number;
  confidence: 'low' | 'medium' | 'high';
  source: 'estimated' | 'calculated' | 'api' | 'database';
  lastCalculated: string;
  correlation: number;
  benchmarkUsed: string;
  dataPoints?: number;
  dataFrequency?: 'daily' | 'monthly';
}

class RealBetaCalculationService {
  private cache = new Map<string, { data: RealBetaResult; timestamp: number }>();
  private cacheExpiry = 3600000; // 1 hour

  async calculateRealBeta(coinId: string): Promise<RealBetaResult> {
    const cacheKey = `real-beta-${coinId}`;
    
    if (this.isCacheValid(cacheKey)) {
      console.log(`📊 Using cached monthly beta for ${coinId}`);
      return this.cache.get(cacheKey)!.data;
    }

    try {
      console.log(`🔄 Calculating REAL monthly beta for ${coinId}...`);
      
      // Check database first
      const dbBeta = await this.getBetaFromDatabase(coinId);
      if (dbBeta && this.isBetaFresh(dbBeta.lastCalculated)) {
        console.log(`📊 Using database monthly beta for ${coinId}: ${dbBeta.beta.toFixed(3)}`);
        this.setCache(cacheKey, dbBeta);
        return dbBeta;
      }

      // Call the edge function for monthly beta calculation
      const { data, error } = await supabase.functions.invoke('calculate-real-beta', {
        body: { coinId }
      });

      if (error) {
        console.error(`❌ Edge function error for ${coinId}:`, error);
        throw error;
      }

      if (!data.success) {
        console.error(`❌ Beta calculation failed for ${coinId}:`, data.error);
        throw new Error(data.error);
      }

      // Get appropriate benchmark
      const benchmark = await enhancedBenchmarkService.getBenchmarkForCoin(coinId);
      
      const betaResult: RealBetaResult = {
        beta: data.beta,
        confidence: data.qualityScore >= 80 ? 'high' : data.qualityScore >= 60 ? 'medium' : 'low',
        source: 'calculated',
        lastCalculated: new Date().toISOString(),
        correlation: data.correlation,
        benchmarkUsed: benchmark.symbol,
        dataPoints: data.dataPoints,
        dataFrequency: 'monthly'
      };
      
      this.setCache(cacheKey, betaResult);
      console.log(`✅ Monthly beta calculated for ${coinId}: ${betaResult.beta.toFixed(3)} (${betaResult.confidence}) over ${data.dataPoints} months`);
      
      return betaResult;
    } catch (error) {
      console.error(`❌ Failed to calculate monthly beta for ${coinId}:`, error);
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
        benchmarkUsed: benchmark.symbol,
        dataFrequency: 'monthly'
      };
    } catch (error) {
      console.error('❌ Failed to get beta from database:', error);
      return null;
    }
  }

  private async getCoinMonthlyPriceData(coinId: string): Promise<Array<{ date: string; price: number }> | null> {
    try {
      // Get price history and aggregate to monthly
      const { data, error } = await supabase
        .from('price_history_36m')
        .select('price_date, price_usd')
        .eq('coin_id', coinId)
        .order('price_date', { ascending: true });

      if (error || !data) {
        console.log(`⚠️ No price data for ${coinId}`);
        return null;
      }

      // Aggregate to monthly prices (end-of-month)
      const monthlyPrices = this.aggregateToMonthlyPrices(data);
      
      if (monthlyPrices.length < 24) {
        console.log(`⚠️ Insufficient monthly data for ${coinId}: ${monthlyPrices.length} months`);
        return null;
      }

      return monthlyPrices;
    } catch (error) {
      console.error(`❌ Failed to get monthly price data for ${coinId}:`, error);
      return null;
    }
  }

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

  private calculateMonthlyBetaFromPriceData(
    coinMonthlyPrices: Array<{ date: string; price: number }>,
    benchmark: any,
    coinId: string
  ): RealBetaResult {
    try {
      // Calculate monthly returns
      const coinReturns = [];
      
      for (let i = 1; i < coinMonthlyPrices.length; i++) {
        const monthlyReturn = (coinMonthlyPrices[i].price - coinMonthlyPrices[i-1].price) / coinMonthlyPrices[i-1].price;
        coinReturns.push(monthlyReturn);
      }

      // For simplicity, use benchmark monthly return based on CAGR
      const benchmarkMonthlyReturn = (benchmark.cagr36m / 100) / 12; // Monthly return
      const benchmarkReturns = new Array(coinReturns.length).fill(benchmarkMonthlyReturn);

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
      
      covariance /= (coinReturns.length - 1);
      benchmarkVariance /= (benchmarkReturns.length - 1);
      
      const beta = benchmarkVariance > 0 ? covariance / benchmarkVariance : 1.0;
      const correlation = Math.abs(beta) > 2 ? 0.5 : 0.8;
      
      // Determine confidence based on monthly data quality
      let confidence: 'low' | 'medium' | 'high' = 'low';
      if (coinMonthlyPrices.length > 36) confidence = 'high';
      else if (coinMonthlyPrices.length > 24) confidence = 'medium';
      
      return {
        beta: Math.max(0.1, Math.min(3.0, beta)),
        confidence,
        source: 'calculated',
        lastCalculated: new Date().toISOString(),
        correlation,
        benchmarkUsed: benchmark.symbol,
        dataPoints: coinMonthlyPrices.length,
        dataFrequency: 'monthly'
      };
    } catch (error) {
      console.error('❌ Failed to calculate monthly beta from price data:', error);
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

    console.log(`📊 Using estimated monthly beta for ${coinId}: ${estimatedBeta} vs ${benchmarkSymbol}`);

    return {
      beta: estimatedBeta,
      confidence: 'low',
      source: 'estimated',
      lastCalculated: new Date().toISOString(),
      correlation: 0.6,
      benchmarkUsed: benchmarkSymbol,
      dataFrequency: 'monthly'
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
    return hoursDiff < 24;
  }

  private async updateBetaInDatabase(coinId: string, betaResult: RealBetaResult): Promise<void> {
    try {
      console.log(`💾 Updating monthly beta in database for ${coinId}...`);
      
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
        console.log(`✅ Monthly beta updated in database for ${coinId}`);
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

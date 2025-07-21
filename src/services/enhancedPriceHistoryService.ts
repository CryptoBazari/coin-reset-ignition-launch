import { supabase } from '@/integrations/supabase/client';
import { fetchCoinPrices } from './coinMarketCapService';

export interface PriceHistoryData {
  id: string;
  coin_id: string;
  price_date: string;
  price_usd: number;
  volume_24h: number | null;
  market_cap: number | null;
  data_source: string;
  created_at: string;
}

export interface PriceReturn {
  date: string;
  price: number;
  dailyReturn: number;
}

class EnhancedPriceHistoryService {
  async getPriceHistory(coinId: string, days: number = 365): Promise<PriceHistoryData[]> {
    const { data, error } = await supabase
      .from('price_history_36m')
      .select('*')
      .eq('coin_id', coinId)
      .order('price_date', { ascending: false })
      .limit(days);

    if (error) {
      console.error('Error fetching price history:', error);
      return [];
    }

    return data || [];
  }

  async calculateDailyReturns(coinId: string, days: number = 365): Promise<PriceReturn[]> {
    const priceHistory = await this.getPriceHistory(coinId, days);
    
    if (priceHistory.length < 2) return [];

    const returns: PriceReturn[] = [];
    
    for (let i = 1; i < priceHistory.length; i++) {
      const current = priceHistory[i-1];
      const previous = priceHistory[i];
      
      const dailyReturn = previous.price_usd > 0 
        ? (current.price_usd - previous.price_usd) / previous.price_usd
        : 0;

      returns.push({
        date: current.price_date,
        price: current.price_usd,
        dailyReturn
      });
    }

    return returns.reverse(); // Return in chronological order
  }

  async calculateBeta(coinId: string, benchmarkCoinId: string = 'bitcoin', days: number = 365): Promise<number | null> {
    try {
      const [coinReturns, benchmarkReturns] = await Promise.all([
        this.calculateDailyReturns(coinId, days),
        this.calculateDailyReturns(benchmarkCoinId, days)
      ]);

      if (coinReturns.length < 30 || benchmarkReturns.length < 30) {
        return null;
      }

      // Align dates and calculate covariance and variance
      const alignedData = this.alignReturnData(coinReturns, benchmarkReturns);
      
      if (alignedData.length < 30) return null;

      const coinMean = alignedData.reduce((sum, d) => sum + d.coinReturn, 0) / alignedData.length;
      const benchmarkMean = alignedData.reduce((sum, d) => sum + d.benchmarkReturn, 0) / alignedData.length;

      let covariance = 0;
      let benchmarkVariance = 0;

      alignedData.forEach(d => {
        const coinDiff = d.coinReturn - coinMean;
        const benchmarkDiff = d.benchmarkReturn - benchmarkMean;
        
        covariance += coinDiff * benchmarkDiff;
        benchmarkVariance += benchmarkDiff * benchmarkDiff;
      });

      covariance /= alignedData.length;
      benchmarkVariance /= alignedData.length;

      return benchmarkVariance > 0 ? covariance / benchmarkVariance : null;
    } catch (error) {
      console.error('Error calculating beta:', error);
      return null;
    }
  }

  private alignReturnData(coinReturns: PriceReturn[], benchmarkReturns: PriceReturn[]) {
    const benchmarkMap = new Map(benchmarkReturns.map(r => [r.date, r.dailyReturn]));
    
    return coinReturns
      .filter(coinReturn => benchmarkMap.has(coinReturn.date))
      .map(coinReturn => ({
        date: coinReturn.date,
        coinReturn: coinReturn.dailyReturn,
        benchmarkReturn: benchmarkMap.get(coinReturn.date)!
      }));
  }

  async calculateVolatility(coinId: string, days: number = 365): Promise<number | null> {
    const returns = await this.calculateDailyReturns(coinId, days);
    
    if (returns.length < 30) return null;

    const mean = returns.reduce((sum, r) => sum + r.dailyReturn, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r.dailyReturn - mean, 2), 0) / returns.length;
    
    // Annualized volatility
    return Math.sqrt(variance * 252);
  }

  async calculateSharpeRatio(coinId: string, riskFreeRate: number = 0.05, days: number = 365): Promise<number | null> {
    const returns = await this.calculateDailyReturns(coinId, days);
    
    if (returns.length < 30) return null;

    const meanReturn = returns.reduce((sum, r) => sum + r.dailyReturn, 0) / returns.length;
    const annualizedReturn = meanReturn * 252;
    
    const volatility = await this.calculateVolatility(coinId, days);
    
    if (!volatility || volatility === 0) return null;

    return (annualizedReturn - riskFreeRate) / volatility;
  }

  async getLatestPrice(coinId: string): Promise<number | null> {
    const { data, error } = await supabase
      .from('price_history_36m')
      .select('price_usd')
      .eq('coin_id', coinId)
      .order('price_date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return data.price_usd;
  }

  async storePriceHistory(coinId: string, priceData: {
    date: string;
    price: number;
    volume?: number;
    marketCap?: number;
  }[]): Promise<void> {
    const records = priceData.map(data => ({
      coin_id: coinId,
      price_date: data.date,
      price_usd: data.price,
      volume_24h: data.volume || null,
      market_cap: data.marketCap || null,
      data_source: 'coinmarketcap'
    }));

    const { error } = await supabase
      .from('price_history_36m')
      .upsert(records, { 
        onConflict: 'coin_id,price_date',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Error storing price history:', error);
      throw error;
    }
  }
}

export const enhancedPriceHistoryService = new EnhancedPriceHistoryService();
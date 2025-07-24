import { supabase } from '@/integrations/supabase/client';

export interface MonthlyPriceData {
  date: string;
  price: number;
  volume: number;
  market_cap: number;
}

export interface HistoricalDataResult {
  success: boolean;
  data: MonthlyPriceData[];
  dataQuality: number;
  source: 'database' | 'coinmarketcap' | 'glassnode';
}

class EnhancedHistoricalDataService {
  private readonly MONTHS_REQUIRED = 36;

  async getHistoricalData(coinId: string, symbol: string): Promise<HistoricalDataResult> {
    console.log(`📊 Fetching historical data for ${symbol} (${coinId})`);
    
    // First, try to get data from our database
    const dbResult = await this.getDataFromDatabase(coinId);
    if (dbResult.success && dbResult.data.length >= 24) { // At least 2 years
      console.log(`✅ Using cached database data: ${dbResult.data.length} months`);
      return dbResult;
    }

    // If no sufficient database data, fetch from CoinMarketCap via edge function
    console.log(`🔄 Fetching fresh data from CoinMarketCap for ${symbol}`);
    const cmcResult = await this.fetchViaEdgeFunction(symbol);
    
    if (cmcResult.success) {
      // Store in database for future use
      await this.storeHistoricalData(coinId, cmcResult.data);
      return cmcResult;
    }

    // Fallback to whatever we have
    return dbResult.data.length > 0 ? dbResult : { success: false, data: [], dataQuality: 0, source: 'database' };
  }

  private async getDataFromDatabase(coinId: string): Promise<HistoricalDataResult> {
    try {
      const { data, error } = await supabase
        .from('price_history_36m')
        .select('price_date, price_usd, volume_24h, market_cap')
        .eq('coin_id', coinId)
        .order('price_date', { ascending: true });

      if (error) throw error;

      const monthlyData = this.convertToMonthlyData(data || []);
      const dataQuality = this.calculateDataQuality(monthlyData.length, this.MONTHS_REQUIRED);

      return {
        success: monthlyData.length > 0,
        data: monthlyData,
        dataQuality,
        source: 'database'
      };
    } catch (error) {
      console.error('Database fetch error:', error);
      return { success: false, data: [], dataQuality: 0, source: 'database' };
    }
  }

  private async fetchViaEdgeFunction(symbol: string): Promise<HistoricalDataResult> {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - this.MONTHS_REQUIRED);

      const { data, error } = await supabase.functions.invoke('fetch-historical-price-data', {
        body: {
          symbol,
          timeStart: startDate.toISOString(),
          timeEnd: endDate.toISOString(),
          interval: 'monthly'
        }
      });

      if (error) throw error;

      if (!data.success || !data.data.quotes) {
        throw new Error('No historical data returned from edge function');
      }

      const monthlyData = this.processEdgeFunctionResponse(data.data.quotes);
      const dataQuality = this.calculateDataQuality(monthlyData.length, this.MONTHS_REQUIRED);

      return {
        success: monthlyData.length > 0,
        data: monthlyData,
        dataQuality,
        source: 'coinmarketcap'
      };
    } catch (error) {
      console.error('Edge function fetch error:', error);
      return { success: false, data: [], dataQuality: 0, source: 'coinmarketcap' };
    }
  }

  private convertToMonthlyData(dailyData: any[]): MonthlyPriceData[] {
    const monthlyData: MonthlyPriceData[] = [];
    const monthlyGroups = new Map<string, any[]>();

    // Group daily data by month
    dailyData.forEach(item => {
      const date = new Date(item.price_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyGroups.has(monthKey)) {
        monthlyGroups.set(monthKey, []);
      }
      monthlyGroups.get(monthKey)!.push(item);
    });

    // Calculate monthly averages
    monthlyGroups.forEach((items, monthKey) => {
      const avgPrice = items.reduce((sum, item) => sum + Number(item.price_usd), 0) / items.length;
      const avgVolume = items.reduce((sum, item) => sum + Number(item.volume_24h || 0), 0) / items.length;
      const avgMarketCap = items.reduce((sum, item) => sum + Number(item.market_cap || 0), 0) / items.length;

      monthlyData.push({
        date: `${monthKey}-01`,
        price: avgPrice,
        volume: avgVolume,
        market_cap: avgMarketCap
      });
    });

    return monthlyData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private processEdgeFunctionResponse(quotes: any[]): MonthlyPriceData[] {
    return quotes.map(quote => ({
      date: quote.timestamp.split('T')[0],
      price: quote.price,
      volume: quote.volume_24h || 0,
      market_cap: quote.market_cap || 0
    }));
  }

  private async storeHistoricalData(coinId: string, data: MonthlyPriceData[]): Promise<void> {
    try {
      const insertData = data.map(item => ({
        coin_id: coinId,
        price_date: item.date,
        price_usd: item.price,
        volume_24h: item.volume,
        market_cap: item.market_cap
      }));

      const { error } = await supabase
        .from('price_history_36m')
        .upsert(insertData, { 
          onConflict: 'coin_id,price_date',
          ignoreDuplicates: false 
        });

      if (error) throw error;
      console.log(`✅ Stored ${data.length} historical data points for ${coinId}`);
    } catch (error) {
      console.error('Error storing historical data:', error);
    }
  }

  private calculateDataQuality(actualPoints: number, requiredPoints: number): number {
    const completeness = Math.min(actualPoints / requiredPoints, 1);
    return Math.round(completeness * 100);
  }

  calculateRealCAGR(data: MonthlyPriceData[]): number {
    if (data.length < 2) return 0;
    
    // Step 1: Initial Value (IV)
    const initialValue = data[0].price;
    
    // Step 2: Final Value (FV) 
    const finalValue = data[data.length - 1].price;
    
    // Step 3: Time period in years (n)
    const initialDate = new Date(data[0].date);
    const finalDate = new Date(data[data.length - 1].date);
    const timeperiodYears = (finalDate.getTime() - initialDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    
    if (initialValue <= 0 || finalValue <= 0 || timeperiodYears <= 0) return 0;
    
    // Step 4: Growth Ratio (FV / IV)
    const growthRatio = finalValue / initialValue;
    
    // Step 5: Exponent (1/n)
    const exponent = 1 / timeperiodYears;
    
    // Step 6: CAGR Base (Growth Ratio^Exponent)
    const cagrBase = Math.pow(growthRatio, exponent);
    
    // Step 7: Final CAGR ((Base - 1) * 100)
    const cagr = (cagrBase - 1) * 100;
    
    console.log(`📊 CAGR Calculation: Initial=$${initialValue.toLocaleString()}, Final=$${finalValue.toLocaleString()}, Years=${timeperiodYears.toFixed(2)}, CAGR=${cagr.toFixed(2)}%`);
    
    // Validate CAGR is reasonable (between -95% and 1000%)
    return Math.max(-95, Math.min(1000, cagr));
  }

  calculateRealVolatility(data: MonthlyPriceData[]): number {
    if (data.length < 2) return 50;
    
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      const currentPrice = data[i].price;
      const previousPrice = data[i - 1].price;
      
      if (previousPrice > 0) {
        returns.push((currentPrice - previousPrice) / previousPrice);
      }
    }
    
    if (returns.length === 0) return 50;
    
    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(12) * 100; // Annualized
    
    // Validate volatility is reasonable (between 5% and 200%)
    return Math.max(5, Math.min(200, volatility));
  }

  calculateMonthlyReturns(data: MonthlyPriceData[]): number[] {
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      const currentPrice = data[i].price;
      const previousPrice = data[i - 1].price;
      
      if (previousPrice > 0) {
        returns.push((currentPrice - previousPrice) / previousPrice);
      }
    }
    return returns;
  }
}

export const enhancedHistoricalDataService = new EnhancedHistoricalDataService();

import { supabase } from '@/integrations/supabase/client';

export interface RealTimeCAGRResult {
  cagr: number;
  initialValue: number;
  finalValue: number;
  timeperiodYears: number;
  dataPoints: number;
  dataSource: 'glassnode' | 'database';
  calculationSteps: {
    step1_initialValue: number;
    step2_finalValue: number;
    step3_timeperiodYears: number;
    step4_growthRatio: number;
    step5_exponent: number;
    step6_cagrBase: number;
    step7_finalCAGR: number;
  };
  confidence: 'high' | 'medium' | 'low';
}

class RealTimeCAGRCalculationService {
  
  /**
   * Calculate CAGR using the exact formula: CAGR = (Final Value / Initial Value)^(1/n) - 1
   * Uses real Glassnode API data for Bitcoin and database/CoinMarketCap for altcoins
   */
  async calculateRealTimeCAGR(
    coinId: string, 
    symbol: string, 
    yearsBack: number = 3
  ): Promise<RealTimeCAGRResult> {
    console.log(`🔢 Starting real-time CAGR calculation for ${symbol} (${yearsBack} years)`);
    
    // Try to get fresh Glassnode data first (for supported coins)
    if (this.isGlassNodeSupported(symbol)) {
      try {
        const glassnodeResult = await this.calculateCAGRFromGlassNode(symbol, yearsBack);
        console.log(`✅ Using fresh Glassnode data for ${symbol} CAGR calculation`);
        return glassnodeResult;
      } catch (error) {
        console.warn(`⚠️ Glassnode fetch failed for ${symbol}, falling back to database:`, error);
      }
    }
    
    // Fallback to database data
    const databaseResult = await this.calculateCAGRFromDatabase(coinId, yearsBack);
    console.log(`✅ Using database data for ${symbol} CAGR calculation`);
    return databaseResult;
  }
  
  /**
   * Calculate CAGR using fresh Glassnode API data
   */
  private async calculateCAGRFromGlassNode(
    symbol: string, 
    yearsBack: number
  ): Promise<RealTimeCAGRResult> {
    console.log(`🌐 Fetching fresh Glassnode price data for ${symbol}`);
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - yearsBack);
    
    // Fetch daily price data from Glassnode via Supabase function
    const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
      body: {
        metric: 'market/price_usd_close',
        asset: symbol,
        since: Math.floor(startDate.getTime() / 1000),
        until: Math.floor(endDate.getTime() / 1000),
        resolution: '24h'
      }
    });
    
    if (error) throw error;
    if (!data || !Array.isArray(data) || data.length < 2) {
      throw new Error(`Insufficient Glassnode data for ${symbol}`);
    }
    
    console.log(`📊 Received ${data.length} daily price points from Glassnode for ${symbol}`);
    
    // Sort by timestamp to ensure correct order
    const sortedData = data.sort((a, b) => a.t - b.t);
    
    // Extract initial and final values
    const initialValue = sortedData[0].v;
    const finalValue = sortedData[sortedData.length - 1].v;
    
    // Calculate exact time period in years
    const initialDate = new Date(sortedData[0].t * 1000);
    const finalDate = new Date(sortedData[sortedData.length - 1].t * 1000);
    const timeperiodYears = (finalDate.getTime() - initialDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    
    console.log(`📈 ${symbol} Initial Value: $${initialValue.toLocaleString()}, Final Value: $${finalValue.toLocaleString()}, Period: ${timeperiodYears.toFixed(2)} years`);
    
    // Apply the exact CAGR formula: CAGR = (Final Value / Initial Value)^(1/n) - 1
    const calculationSteps = this.performCAGRCalculation(initialValue, finalValue, timeperiodYears);
    
    const confidence = this.determineConfidence(data.length, timeperiodYears, 'glassnode');
    
    return {
      cagr: calculationSteps.step7_finalCAGR,
      initialValue,
      finalValue,
      timeperiodYears,
      dataPoints: data.length,
      dataSource: 'glassnode',
      calculationSteps,
      confidence
    };
  }
  
  /**
   * Calculate CAGR using database data
   */
  private async calculateCAGRFromDatabase(
    coinId: string, 
    yearsBack: number
  ): Promise<RealTimeCAGRResult> {
    console.log(`💾 Fetching database price data for ${coinId}`);
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - yearsBack);
    
    // Fetch historical data from database
    const { data, error } = await supabase
      .from('price_history_36m')
      .select('price_date, price_usd')
      .eq('coin_id', coinId)
      .gte('price_date', startDate.toISOString().split('T')[0])
      .lte('price_date', endDate.toISOString().split('T')[0])
      .order('price_date', { ascending: true });
    
    if (error) throw error;
    if (!data || data.length < 2) {
      throw new Error(`Insufficient database data for ${coinId}`);
    }
    
    console.log(`📊 Received ${data.length} price points from database for ${coinId}`);
    
    // Extract initial and final values
    const initialValue = Number(data[0].price_usd);
    const finalValue = Number(data[data.length - 1].price_usd);
    
    // Calculate exact time period in years
    const initialDate = new Date(data[0].price_date);
    const finalDate = new Date(data[data.length - 1].price_date);
    const timeperiodYears = (finalDate.getTime() - initialDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    
    console.log(`📈 ${coinId} Initial Value: $${initialValue.toLocaleString()}, Final Value: $${finalValue.toLocaleString()}, Period: ${timeperiodYears.toFixed(2)} years`);
    
    // Apply the exact CAGR formula: CAGR = (Final Value / Initial Value)^(1/n) - 1
    const calculationSteps = this.performCAGRCalculation(initialValue, finalValue, timeperiodYears);
    
    const confidence = this.determineConfidence(data.length, timeperiodYears, 'database');
    
    return {
      cagr: calculationSteps.step7_finalCAGR,
      initialValue,
      finalValue,
      timeperiodYears,
      dataPoints: data.length,
      dataSource: 'database',
      calculationSteps,
      confidence
    };
  }
  
  /**
   * Perform step-by-step CAGR calculation using the exact formula:
   * CAGR = (Final Value / Initial Value)^(1/n) - 1
   */
  private performCAGRCalculation(
    initialValue: number, 
    finalValue: number, 
    timeperiodYears: number
  ) {
    console.log(`🧮 Performing step-by-step CAGR calculation:`);
    
    // Step 1: Initial Value
    const step1_initialValue = initialValue;
    console.log(`   Step 1 - Initial Value: $${step1_initialValue.toLocaleString()}`);
    
    // Step 2: Final Value  
    const step2_finalValue = finalValue;
    console.log(`   Step 2 - Final Value: $${step2_finalValue.toLocaleString()}`);
    
    // Step 3: Time period in years
    const step3_timeperiodYears = timeperiodYears;
    console.log(`   Step 3 - Time Period: ${step3_timeperiodYears.toFixed(3)} years`);
    
    // Step 4: Growth Ratio (Final Value / Initial Value)
    const step4_growthRatio = step2_finalValue / step1_initialValue;
    console.log(`   Step 4 - Growth Ratio: ${step4_growthRatio.toFixed(6)}`);
    
    // Step 5: Exponent (1/n)
    const step5_exponent = 1 / step3_timeperiodYears;
    console.log(`   Step 5 - Exponent (1/n): ${step5_exponent.toFixed(6)}`);
    
    // Step 6: CAGR Base (Growth Ratio^Exponent)
    const step6_cagrBase = Math.pow(step4_growthRatio, step5_exponent);
    console.log(`   Step 6 - CAGR Base: ${step6_cagrBase.toFixed(6)}`);
    
    // Step 7: Final CAGR ((Base - 1) * 100)
    const step7_finalCAGR = (step6_cagrBase - 1) * 100;
    console.log(`   Step 7 - Final CAGR: ${step7_finalCAGR.toFixed(2)}%`);
    
    return {
      step1_initialValue,
      step2_finalValue,
      step3_timeperiodYears,
      step4_growthRatio,
      step5_exponent,
      step6_cagrBase,
      step7_finalCAGR
    };
  }
  
  /**
   * Determine confidence level based on data quality
   */
  private determineConfidence(
    dataPoints: number, 
    timeperiodYears: number, 
    dataSource: string
  ): 'high' | 'medium' | 'low' {
    let score = 0;
    
    // Data points score (40%)
    if (dataPoints >= 1000) score += 40;
    else if (dataPoints >= 500) score += 30;
    else if (dataPoints >= 100) score += 20;
    else score += 10;
    
    // Time period score (30%)
    if (timeperiodYears >= 3) score += 30;
    else if (timeperiodYears >= 2) score += 20;
    else if (timeperiodYears >= 1) score += 10;
    else score += 5;
    
    // Data source score (30%)
    if (dataSource === 'glassnode') score += 30;
    else if (dataSource === 'database') score += 20;
    else score += 10;
    
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }
  
  /**
   * Check if a coin is supported by Glassnode
   */
  private isGlassNodeSupported(symbol: string): boolean {
    const supportedCoins = ['BTC', 'ETH', 'LTC'];
    return supportedCoins.includes(symbol.toUpperCase());
  }
}

export const realTimeCAGRCalculationService = new RealTimeCAGRCalculationService();
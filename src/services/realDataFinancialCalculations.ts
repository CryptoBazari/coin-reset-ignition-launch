
import { fetchGlassNodeMetric, GLASS_NODE_METRICS } from './glassNodeService';
import { bitcoinGlassNodeService } from './bitcoinGlassNodeService';
import { fetchCoinPrices } from './coinMarketCapService';

export interface RealFinancialMetrics {
  npv: number;
  cagr: number;
  irr: number;
  roi: number;
  beta: number;
  volatility: number;
  sharpeRatio: number;
  confidenceScore: number;
  dataSource: 'glassnode' | 'coinmarketcap' | 'hybrid';
}

export class RealDataFinancialCalculations {
  
  async calculateRealMetrics(
    coinId: string,
    symbol: string,
    investmentAmount: number,
    timeHorizon: number,
    isGlassNodeSupported: boolean
  ): Promise<RealFinancialMetrics> {
    console.log(`📊 Calculating real financial metrics for ${symbol}`);
    
    if (isGlassNodeSupported) {
      return this.calculateWithGlassNode(symbol, investmentAmount, timeHorizon);
    } else {
      return this.calculateWithCoinMarketCap(coinId, symbol, investmentAmount, timeHorizon);
    }
  }

  private async calculateWithGlassNode(
    symbol: string,
    investmentAmount: number,
    timeHorizon: number
  ): Promise<RealFinancialMetrics> {
    console.log(`🔍 Using Glassnode data for ${symbol} financial calculations`);
    
    try {
      // Get 36 months of price data
      const since = new Date(Date.now() - 36 * 30 * 24 * 60 * 60 * 1000);
      const [priceData, volatilityData] = await Promise.all([
        fetchGlassNodeMetric(GLASS_NODE_METRICS.PRICE_USD, symbol, since),
        fetchGlassNodeMetric(GLASS_NODE_METRICS.REALIZED_VOLATILITY, symbol, since)
      ]);

      const currentPrice = priceData[priceData.length - 1]?.value || 0;
      const historicalPrices = priceData.map(p => p.value);
      
      // Calculate real CAGR from 36 months of data
      const cagr = this.calculateRealCAGR(historicalPrices, 36);
      
      // Calculate real volatility
      const volatility = this.getLatestValue(volatilityData) || this.calculateHistoricalVolatility(historicalPrices);
      
      // Calculate other metrics
      const roi = this.calculateROI(currentPrice, cagr, timeHorizon);
      const npv = this.calculateNPV(investmentAmount, currentPrice, cagr, timeHorizon);
      const irr = this.calculateIRR(investmentAmount, currentPrice, cagr, timeHorizon);
      const beta = this.calculateBeta(historicalPrices);
      const sharpeRatio = this.calculateSharpeRatio(cagr, volatility);

      console.log(`✅ Glassnode metrics calculated - CAGR: ${cagr.toFixed(1)}%, Volatility: ${volatility.toFixed(1)}%`);

      return {
        npv,
        cagr,
        irr,
        roi,
        beta,
        volatility,
        sharpeRatio,
        confidenceScore: 85, // High confidence with Glassnode data
        dataSource: 'glassnode'
      };
    } catch (error) {
      console.error(`❌ Glassnode calculation failed for ${symbol}:`, error);
      throw error;
    }
  }

  private async calculateWithCoinMarketCap(
    coinId: string,
    symbol: string,
    investmentAmount: number,
    timeHorizon: number
  ): Promise<RealFinancialMetrics> {
    console.log(`⚠️ Using CoinMarketCap data for ${symbol} financial calculations`);
    
    try {
      const coinPrices = await fetchCoinPrices([symbol]);
      const coinData = coinPrices[0];
      
      if (!coinData) {
        throw new Error(`No price data available for ${symbol}`);
      }

      const currentPrice = coinData.current_price;
      
      // Estimate metrics from available price changes
      const cagr = this.estimateCAGRFromPriceChanges(coinData);
      const volatility = this.estimateVolatilityFromPriceChanges(coinData);
      
      // Calculate other metrics
      const roi = this.calculateROI(currentPrice, cagr, timeHorizon);
      const npv = this.calculateNPV(investmentAmount, currentPrice, cagr, timeHorizon);
      const irr = this.calculateIRR(investmentAmount, currentPrice, cagr, timeHorizon);
      const beta = this.estimateBeta(volatility);
      const sharpeRatio = this.calculateSharpeRatio(cagr, volatility);

      console.log(`⚠️ CoinMarketCap metrics calculated - Estimated CAGR: ${cagr.toFixed(1)}%, Volatility: ${volatility.toFixed(1)}%`);

      return {
        npv,
        cagr,
        irr,
        roi,
        beta,
        volatility,
        sharpeRatio,
        confidenceScore: 45, // Lower confidence with limited data
        dataSource: 'coinmarketcap'
      };
    } catch (error) {
      console.error(`❌ CoinMarketCap calculation failed for ${symbol}:`, error);
      throw error;
    }
  }

  private calculateRealCAGR(prices: number[], months: number): number {
    if (prices.length < 2) return 0;
    
    const startPrice = prices[0];
    const endPrice = prices[prices.length - 1];
    const years = months / 12;
    
    return (Math.pow(endPrice / startPrice, 1 / years) - 1) * 100;
  }

  private calculateHistoricalVolatility(prices: number[]): number {
    if (prices.length < 2) return 50;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * Math.sqrt(365) * 100; // Annualized volatility
  }

  private calculateNPV(investmentAmount: number, currentPrice: number, cagr: number, timeHorizon: number): number {
    const expectedReturn = cagr / 100;
    const discountRate = 0.1; // 10% discount rate
    
    let npv = -investmentAmount;
    const coinQuantity = investmentAmount / currentPrice;
    
    for (let year = 1; year <= timeHorizon; year++) {
      const futurePrice = currentPrice * Math.pow(1 + expectedReturn, year);
      const futureValue = coinQuantity * futurePrice;
      npv += futureValue / Math.pow(1 + discountRate, year);
    }
    
    return npv;
  }

  private calculateIRR(investmentAmount: number, currentPrice: number, cagr: number, timeHorizon: number): number {
    const expectedReturn = cagr / 100;
    const coinQuantity = investmentAmount / currentPrice;
    const futurePrice = currentPrice * Math.pow(1 + expectedReturn, timeHorizon);
    const futureValue = coinQuantity * futurePrice;
    
    return (Math.pow(futureValue / investmentAmount, 1 / timeHorizon) - 1) * 100;
  }

  private calculateROI(currentPrice: number, cagr: number, timeHorizon: number): number {
    const expectedReturn = cagr / 100;
    const futurePrice = currentPrice * Math.pow(1 + expectedReturn, timeHorizon);
    return ((futurePrice - currentPrice) / currentPrice) * 100;
  }

  private calculateBeta(prices: number[]): number {
    if (prices.length < 30) return 1.0;
    
    // Simplified beta calculation - in a real implementation, 
    // this would correlate with market index returns
    const volatility = this.calculateHistoricalVolatility(prices);
    return Math.min(2.0, Math.max(0.5, volatility / 50));
  }

  private calculateSharpeRatio(cagr: number, volatility: number): number {
    const riskFreeRate = 5; // 5% risk-free rate
    const excessReturn = cagr - riskFreeRate;
    return volatility > 0 ? excessReturn / volatility : 0;
  }

  private estimateCAGRFromPriceChanges(coinData: any): number {
    const change24h = coinData.price_change_percentage_24h || 0;
    const change7d = coinData.price_change_7d || 0;
    const change30d = coinData.price_change_30d || 0;
    
    // Annualize the best available data
    if (change30d !== 0) {
      return (change30d / 30) * 365;
    } else if (change7d !== 0) {
      return (change7d / 7) * 365;
    } else {
      return change24h * 365;
    }
  }

  private estimateVolatilityFromPriceChanges(coinData: any): number {
    const change24h = Math.abs(coinData.price_change_percentage_24h || 0);
    const change7d = Math.abs(coinData.price_change_7d || 0);
    const change30d = Math.abs(coinData.price_change_30d || 0);
    
    const avgChange = (change24h + change7d + change30d) / 3;
    return Math.max(20, Math.min(120, avgChange * 8));
  }

  private estimateBeta(volatility: number): number {
    return Math.min(2.0, Math.max(0.5, volatility / 60));
  }

  private getLatestValue(data: Array<{ value: number }>): number | null {
    return data.length > 0 ? data[data.length - 1].value : null;
  }
}

export const realDataFinancialCalculations = new RealDataFinancialCalculations();

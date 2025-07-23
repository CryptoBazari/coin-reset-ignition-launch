import { supabase } from '@/integrations/supabase/client';
import { bitcoinGlassNodeService } from './bitcoinGlassNodeService';
import { symbolMappingService } from './symbolMappingService';
import type { InvestmentInputs } from '@/types/investment';

export interface DirectGlassnodeResult {
  npv: number;
  irr: number;
  roi: number;
  cagr: number;
  beta: number;
  discountRate: number;
  projectedPrices: number[];
  cashFlows: number[];
  stressTestedNPV: number;
  marketPremium: number;
  monthlyChanges: number[];
  isStakeable: boolean;
  benchmark: string;
  volatility: number; // Real Glassnode volatility
  avivRatio: number; // Real Bitcoin AVIV ratio
  standardDeviation: number; // Calculated from historical prices
  dataQuality: {
    volatilityFromAPI: boolean;
    avivFromAPI: boolean;
    priceDataPoints: number;
    historicalYears: number;
    isReliable: boolean;
    marketDataPoints: number;
  };
  riskAdjustments: {
    mvrvAdjustment: number;
    liquidityAdjustment: number;
    drawdownRisk: number;
  };
  priceHistory: Array<{ date: string; price: number }>;
  marketPriceHistory: Array<{ date: string; price: number }>;
  riskFreeRate: number;
  marketCAGR: number;
  terminalValue?: number;
}

/**
 * Direct Glassnode Calculation Service
 * Implements exact NPV flow as specified with 3-6 year constraint
 */
class DirectGlassnodeCalculationService {
  
  /**
   * Calculate investment analysis using exact specification
   */
  async calculateDirectInvestmentAnalysis(inputs: InvestmentInputs): Promise<DirectGlassnodeResult> {
    console.log('🚀 Starting NPV calculation with 3-6 year constraint...');
    console.log(`📊 Asset: ${inputs.coinId}, Investment: $${inputs.investmentAmount}, Horizon: ${inputs.investmentHorizon} years`);
    
    try {
      // Step 1: Gather Input Data with 3-6 year constraint
      const coinSymbol = this.normalizeCoinSymbol(inputs.coinId);
      const investmentHorizon = inputs.investmentHorizon || 5;
      const initialInvestment = inputs.investmentAmount;
      const riskFreeRate = 0.045; // 4.5% risk-free rate (user input)
      const longTermGrowth = 0.03; // 3% long-term growth for terminal value
      
      // Fetch 3-6 year historical data for asset
      const assetData = await this.fetchConstrainedPriceHistory(coinSymbol, 5);
      console.log(`📈 Asset data: ${assetData.priceHistory.length} points over ${assetData.actualYears.toFixed(2)} years (${assetData.isReliable ? 'RELIABLE' : 'UNRELIABLE'})`);
      
      // Fetch 3-6 year historical data for Bitcoin (market benchmark)
      const marketData = await this.fetchConstrainedPriceHistory('BTC', 5);
      console.log(`📊 Market data: ${marketData.priceHistory.length} points over ${marketData.actualYears.toFixed(2)} years`);
      
      // Get current price
      const currentPrice = assetData.priceHistory[assetData.priceHistory.length - 1]?.price || 50000;
      console.log(`💰 Current Price: $${currentPrice.toLocaleString()}`);
      
      // Step 2: Calculate Asset CAGR (3-6 years)
      const assetCAGR = this.calculatePreciseCAGR(assetData.priceHistory);
      console.log(`📈 Asset CAGR: ${assetCAGR.toFixed(2)}% over ${assetData.actualYears.toFixed(2)} years`);
      
      // Step 3: Calculate Market CAGR (Bitcoin benchmark)
      const marketCAGR = this.calculatePreciseCAGR(marketData.priceHistory);
      console.log(`📊 Market (Bitcoin) CAGR: ${marketCAGR.toFixed(2)}% over ${marketData.actualYears.toFixed(2)} years`);
      
      // Step 4: Project Cash Flows using CF_t = Current Value × (1 + CAGR)^t
      const projectedPrices = this.projectFuturePrices(currentPrice, assetCAGR, investmentHorizon);
      const cashFlows = this.generateNPVCashFlows(initialInvestment, projectedPrices, longTermGrowth, riskFreeRate);
      console.log(`💰 Cash flows: ${cashFlows.map(cf => `$${cf.toLocaleString()}`).join(', ')}`);
      
      // Step 5: Calculate Beta using real correlation
      const beta = this.calculateRealBeta(assetData.priceHistory, marketData.priceHistory);
      console.log(`🎯 Real Beta: ${beta.toFixed(3)}`);
      
      // Step 6: Calculate CAPM Discount Rate: r = rf + Beta × (rm - rf)
      const marketPremium = marketCAGR / 100 - riskFreeRate;
      const discountRate = riskFreeRate + beta * marketPremium;
      console.log(`📊 CAPM Discount Rate: ${(discountRate * 100).toFixed(2)}% (rf: ${(riskFreeRate * 100).toFixed(1)}% + β: ${beta.toFixed(3)} × market premium: ${(marketPremium * 100).toFixed(2)}%)`);
      
      // Step 8: Calculate Final NPV
      const npv = this.calculateNPVFromSpec(cashFlows, discountRate);
      console.log(`💰 Final NPV: $${npv.toLocaleString()}`);
      
      // Calculate other metrics
      const irr = this.calculateIRR(cashFlows);
      const roi = ((projectedPrices[projectedPrices.length - 1] - currentPrice) / currentPrice) * 100;
      const volatility = this.calculateAnnualizedVolatility(assetData.priceHistory);
      
      // Get additional data
      const { avivRatio, avivFromAPI } = await this.fetchGlassnodeAvivRatio();
      const standardDeviation = this.calculateStandardDeviation(assetData.priceHistory.map(p => p.price));
      
      const result: DirectGlassnodeResult = {
        npv,
        irr,
        roi,
        cagr: assetCAGR,
        beta,
        discountRate: discountRate * 100,
        projectedPrices,
        cashFlows,
        stressTestedNPV: npv * 0.8,
        marketPremium: marketPremium * 100,
        monthlyChanges: this.calculateMonthlyChanges(assetData.priceHistory),
        isStakeable: this.isStakeableCoin(coinSymbol),
        benchmark: 'Bitcoin',
        volatility,
        avivRatio,
        standardDeviation,
        dataQuality: {
          volatilityFromAPI: false,
          avivFromAPI,
          priceDataPoints: assetData.priceHistory.length,
          historicalYears: assetData.actualYears,
          isReliable: assetData.isReliable,
          marketDataPoints: marketData.priceHistory.length
        },
        riskAdjustments: this.calculateRiskAdjustments(volatility, avivRatio),
        priceHistory: assetData.priceHistory,
        marketPriceHistory: marketData.priceHistory,
        riskFreeRate: riskFreeRate * 100,
        marketCAGR,
        terminalValue: cashFlows.length > 1 ? this.calculateTerminalValue(cashFlows[cashFlows.length - 1], longTermGrowth, discountRate, investmentHorizon) : undefined
      };
      
      console.log('✅ NPV calculation completed per specification:');
      console.log(`   - NPV: $${npv.toLocaleString()} (${npv > 0 ? 'PROFITABLE' : 'NOT PROFITABLE'})`);
      console.log(`   - Data Quality: ${assetData.isReliable ? 'RELIABLE' : 'UNRELIABLE - flagged'} (${assetData.actualYears.toFixed(2)} years)`);
      console.log(`   - CAPM Discount Rate: ${(discountRate * 100).toFixed(2)}%`);
      
      return result;
      
    } catch (error) {
      console.error('❌ NPV calculation failed:', error);
      throw new Error(`NPV calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Fetch historical price data with 3-6 year constraint
   */
  private async fetchConstrainedPriceHistory(asset: string, yearsBack: number = 5): Promise<{
    priceHistory: Array<{date: string, price: number}>,
    actualYears: number,
    isReliable: boolean
  }> {
    try {
      // Constrain to 3-6 years as per specification
      const constrainedYears = Math.max(3, Math.min(6, yearsBack));
      console.log(`🔗 Fetching ${constrainedYears} years of price history for ${asset}...`);
      
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - constrainedYears);
      const sinceDate = startDate.toISOString();
      const untilDate = new Date().toISOString();
      
      const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
        body: {
          metric: 'market/price_usd_close',
          asset: asset,
          since: sinceDate,
          until: untilDate
        }
      });

      if (error || !data?.data || !Array.isArray(data.data)) {
        console.warn(`⚠️ API failed for ${asset}, using fallback`);
        return this.generateConstrainedFallbackHistory(constrainedYears);
      }
      
      const priceHistory = data.data.map((item: any) => ({
        date: new Date(item.unix_timestamp * 1000).toISOString().split('T')[0],
        price: item.value
      })).filter(item => !isNaN(item.price) && item.price > 0);
      
      // Sort chronologically
      priceHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      if (priceHistory.length < 2) {
        return this.generateConstrainedFallbackHistory(constrainedYears);
      }
      
      // Calculate precise actual years
      const firstDate = new Date(priceHistory[0].date);
      const lastDate = new Date(priceHistory[priceHistory.length - 1].date);
      const actualYears = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      
      // Data quality validation: must be at least 3 years with sufficient data points
      const minimumDataPoints = 365 * 3 * 0.8; // Allow for weekends/holidays
      const isReliable = actualYears >= 3.0 && priceHistory.length >= minimumDataPoints;
      
      if (!isReliable) {
        console.warn(`⚠️ Data quality warning for ${asset}: ${actualYears.toFixed(2)} years, ${priceHistory.length} points - FLAGGED AS UNRELIABLE`);
      }
      
      return {
        priceHistory,
        actualYears,
        isReliable
      };
      
    } catch (error) {
      console.error(`❌ Failed to fetch price history for ${asset}:`, error);
      return this.generateConstrainedFallbackHistory(yearsBack);
    }
  }
  
  /**
   * Calculate precise CAGR using exact formula
   */
  private calculatePreciseCAGR(priceHistory: Array<{date: string, price: number}>): number {
    if (priceHistory.length < 2) return 15; // Fallback
    
    const beginningValue = priceHistory[0].price;
    const endingValue = priceHistory[priceHistory.length - 1].price;
    
    if (beginningValue <= 0) return 15; // Avoid division by zero
    
    // Calculate precise time period in years
    const startDate = new Date(priceHistory[0].date);
    const endDate = new Date(priceHistory[priceHistory.length - 1].date);
    const exactYears = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    
    if (exactYears <= 0) return 15;
    
    // CAGR = (Ending Value / Beginning Value)^(1/n) - 1
    const ratio = endingValue / beginningValue;
    const cagr = (Math.pow(ratio, 1 / exactYears) - 1) * 100;
    
    console.log(`📊 CAGR calculation: $${beginningValue.toLocaleString()} → $${endingValue.toLocaleString()} over ${exactYears.toFixed(3)} years = ${cagr.toFixed(2)}%`);
    
    return cagr;
  }
  
  /**
   * Project future prices using CF_t = Current Value × (1 + CAGR)^t
   */
  private projectFuturePrices(currentPrice: number, cagrPercent: number, horizonYears: number): number[] {
    console.log('📈 Projecting future prices using CAGR formula...');
    const cagr = cagrPercent / 100; // Convert to decimal
    const projectedPrices = [currentPrice]; // Include current price at t=0
    
    for (let t = 1; t <= horizonYears; t++) {
      // CF_t = Current Value × (1 + CAGR)^t
      const projectedPrice = currentPrice * Math.pow(1 + cagr, t);
      projectedPrices.push(projectedPrice);
    }
    
    console.log(`📊 Projected prices: ${projectedPrices.map((p, i) => `Year ${i}: $${p.toLocaleString()}`).join(', ')}`);
    return projectedPrices;
  }
  
  /**
   * Generate NPV cash flows per specification
   */
  private generateNPVCashFlows(initialInvestment: number, projectedPrices: number[], longTermGrowth: number, discountRate: number): number[] {
    console.log('💰 Generating NPV cash flows...');
    
    // Initial investment as negative cash flow (C_0)
    const cashFlows = [-initialInvestment];
    
    // For crypto NPV, we use sale proceeds at each year as cash flows
    for (let t = 1; t < projectedPrices.length; t++) {
      if (t < projectedPrices.length - 1) {
        // Intermediate years: no cash flow (holding period)
        cashFlows.push(0);
      } else {
        // Final year: sale proceeds
        let finalCashFlow = projectedPrices[t];
        
        // Optional: Add terminal value if specified
        if (longTermGrowth > 0 && longTermGrowth < discountRate) {
          const terminalValue = this.calculateTerminalValue(finalCashFlow, longTermGrowth, discountRate, t);
          finalCashFlow += terminalValue;
          console.log(`📊 Added terminal value: $${terminalValue.toLocaleString()}`);
        }
        
        cashFlows.push(finalCashFlow);
      }
    }
    
    return cashFlows;
  }
  
  /**
   * Calculate Beta using real correlation formula
   */
  private calculateRealBeta(assetPrices: Array<{date: string, price: number}>, marketPrices: Array<{date: string, price: number}>): number {
    if (assetPrices.length < 2 || marketPrices.length < 2) {
      return 1.2; // Default fallback
    }
    
    console.log('🎯 Calculating real Beta using correlation...');
    
    // Calculate daily returns for asset and market
    const assetReturns = this.calculateDailyReturns(assetPrices.map(p => p.price));
    const marketReturns = this.calculateDailyReturns(marketPrices.map(p => p.price));
    
    // Align data (use shorter series)
    const minLength = Math.min(assetReturns.length, marketReturns.length);
    const alignedAssetReturns = assetReturns.slice(0, minLength);
    const alignedMarketReturns = marketReturns.slice(0, minLength);
    
    if (alignedAssetReturns.length < 30) {
      console.warn('⚠️ Insufficient data for Beta calculation');
      return 1.2;
    }
    
    // Calculate covariance and variance
    const assetMean = alignedAssetReturns.reduce((sum, r) => sum + r, 0) / alignedAssetReturns.length;
    const marketMean = alignedMarketReturns.reduce((sum, r) => sum + r, 0) / alignedMarketReturns.length;
    
    let covariance = 0;
    let marketVariance = 0;
    
    for (let i = 0; i < alignedAssetReturns.length; i++) {
      const assetDev = alignedAssetReturns[i] - assetMean;
      const marketDev = alignedMarketReturns[i] - marketMean;
      covariance += assetDev * marketDev;
      marketVariance += marketDev * marketDev;
    }
    
    covariance /= (alignedAssetReturns.length - 1);
    marketVariance /= (alignedMarketReturns.length - 1);
    
    if (marketVariance === 0) {
      console.warn('⚠️ Zero market variance');
      return 1.2;
    }
    
    // Beta = Covariance(Asset, Market) / Variance(Market)
    const beta = covariance / marketVariance;
    
    // Constrain beta to reasonable range
    const constrainedBeta = Math.max(0.1, Math.min(3.0, beta));
    
    console.log(`🎯 Beta calculation: Cov=${covariance.toFixed(6)}, Var=${marketVariance.toFixed(6)}, Beta=${constrainedBeta.toFixed(3)}`);
    
    return constrainedBeta;
  }
  
  /**
   * Calculate NPV using exact specification formula
   */
  private calculateNPVFromSpec(cashFlows: number[], discountRate: number): number {
    console.log('📊 Calculating NPV using specification formula...');
    
    let npv = 0;
    
    for (let t = 0; t < cashFlows.length; t++) {
      const discountFactor = Math.pow(1 + discountRate, t);
      const presentValue = cashFlows[t] / discountFactor;
      npv += presentValue;
      
      console.log(`   t=${t}: CF=$${cashFlows[t].toLocaleString()}, PV=$${presentValue.toLocaleString()}`);
    }
    
    console.log(`📊 Total NPV: $${npv.toLocaleString()}`);
    return npv;
  }

  private normalizeCoinSymbol(coinId: string): string {
    const symbol = coinId.toUpperCase();
    const symbolMappings: Record<string, string> = {
      'BITCOIN': 'BTC',
      'ETHEREUM': 'ETH',
      'LITECOIN': 'LTC',
      'BITCOIN-CASH': 'BCH',
      'CHAINLINK': 'LINK',
      'SOLANA': 'SOL',
      'CARDANO': 'ADA'
    };
    return symbolMappings[symbol] || symbol;
  }

  private async fetchGlassnodeAvivRatio(): Promise<{avivRatio: number, avivFromAPI: boolean}> {
    try {
      const sinceDate = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)).toISOString();
      const untilDate = new Date().toISOString();
      
      const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
        body: {
          metric: 'indicators/aviv',
          asset: 'BTC',
          since: sinceDate,
          until: untilDate
        }
      });

      if (error || !data?.data || !Array.isArray(data.data) || data.data.length === 0) {
        throw new Error('No AVIV data');
      }
      
      const latestAviv = data.data[data.data.length - 1]?.value;
      if (typeof latestAviv !== 'number') {
        throw new Error('Invalid AVIV data');
      }
      
      return { avivRatio: latestAviv, avivFromAPI: true };
      
    } catch (error) {
      console.error('❌ Failed to fetch AVIV ratio:', error);
      return { avivRatio: 1.2, avivFromAPI: false };
    }
  }

  private generateConstrainedFallbackHistory(years: number): {
    priceHistory: Array<{date: string, price: number}>,
    actualYears: number,
    isReliable: boolean
  } {
    console.log(`⚠️ Generating ${years}-year fallback price history`);
    const history = [];
    const now = new Date();
    const basePrice = 50000;
    const days = years * 365;
    
    for (let i = days; i >= 0; i -= 1) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dateStr = date.toISOString().split('T')[0];
      const volatility = (Math.random() - 0.5) * 0.02; // ±1% daily
      const trendGrowth = Math.pow(1.15, (days - i) / days) - 1; // 15% annual growth
      const price = basePrice * (1 + trendGrowth + volatility);
      history.push({ date: dateStr, price });
    }
    
    return {
      priceHistory: history,
      actualYears: years,
      isReliable: false // Fallback data is always unreliable
    };
  }

  private calculateDailyReturns(prices: number[]): number[] {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      if (prices[i-1] > 0) {
        returns.push((prices[i] - prices[i-1]) / prices[i-1]);
      }
    }
    return returns;
  }

  private calculateIRR(cashFlows: number[]): number {
    let rate = 0.1;
    for (let iteration = 0; iteration < 100; iteration++) {
      let npv = 0;
      let dnpv = 0;
      
      for (let i = 0; i < cashFlows.length; i++) {
        const factor = Math.pow(1 + rate, i);
        npv += cashFlows[i] / factor;
        dnpv -= i * cashFlows[i] / (factor * (1 + rate));
      }
      
      if (Math.abs(npv) < 0.01) break;
      if (dnpv === 0) break;
      rate = rate - npv / dnpv;
      
      if (rate < -0.99) rate = -0.99;
      if (rate > 10) rate = 10;
    }
    
    return rate * 100;
  }

  private calculateAnnualizedVolatility(priceHistory: Array<{date: string, price: number}>): number {
    const returns = this.calculateDailyReturns(priceHistory.map(p => p.price));
    if (returns.length < 2) return 65;
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance * 365) * 100;
  }

  private calculateStandardDeviation(prices: number[]): number {
    return this.calculateAnnualizedVolatility(prices.map((price, i) => ({ date: '', price })));
  }

  private calculateMonthlyChanges(priceHistory: Array<{date: string, price: number}>): number[] {
    if (priceHistory.length < 2) return [];
    
    console.log('📊 Calculating real monthly changes from price history');
    const monthlyChanges = [];
    let lastMonthPrice = priceHistory[0].price;
    let currentMonth = new Date(priceHistory[0].date).getMonth();
    
    for (let i = 1; i < priceHistory.length; i++) {
      const currentDate = new Date(priceHistory[i].date);
      const month = currentDate.getMonth();
      
      if (month !== currentMonth) {
        const change = ((priceHistory[i].price - lastMonthPrice) / lastMonthPrice) * 100;
        monthlyChanges.push(change);
        lastMonthPrice = priceHistory[i].price;
        currentMonth = month;
      }
    }
    
    console.log(`📈 Monthly changes: ${monthlyChanges.map(c => `${c.toFixed(1)}%`).join(', ')}`);
    return monthlyChanges;
  }

  private calculateTerminalValue(finalCashFlow: number, growthRate: number, discountRate: number, finalYear: number): number {
    const nextYearCashFlow = finalCashFlow * (1 + growthRate);
    const terminalValue = nextYearCashFlow / (discountRate - growthRate);
    return terminalValue / Math.pow(1 + discountRate, finalYear);
  }

  private calculateRiskAdjustments(volatility: number, avivRatio: number): {
    mvrvAdjustment: number;
    liquidityAdjustment: number;
    drawdownRisk: number;
  } {
    return {
      mvrvAdjustment: avivRatio > 1.5 ? -0.1 : 0.05,
      liquidityAdjustment: volatility > 80 ? -0.05 : 0.02,
      drawdownRisk: volatility / 100 * 0.5
    };
  }

  private isStakeableCoin(symbol: string): boolean {
    const stakeableCoins = ['ETH', 'ADA', 'DOT', 'ATOM', 'SOL'];
    return stakeableCoins.includes(symbol);
  }
}

export const directGlassnodeCalculationService = new DirectGlassnodeCalculationService();

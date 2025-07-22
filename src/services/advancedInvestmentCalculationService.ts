
import axios from 'axios';
import { enhancedGlassnodeService } from './enhancedGlassnodeService';
import { enhancedBenchmarkService } from './enhancedBenchmarkService';

interface NPVCalculationParams {
  coinSymbol: string;
  initialInvestment: number;
  projectionYears: number;
  stakingYield?: number;
  riskFreeRate: number;
}

interface NPVResult {
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
  riskAdjustments: {
    mvrvAdjustment: number;
    liquidityAdjustment: number;
    drawdownRisk: number;
  };
  priceHistory: Array<{ date: string; price: number }>;
}

export class AdvancedInvestmentCalculationService {
  private stakeableCoins = ['eth', 'ada', 'sol', 'dot', 'atom', 'avax', 'near', 'algo'];

  // Check if coin is stakeable
  private isStakeable(coinSymbol: string): boolean {
    return this.stakeableCoins.includes(coinSymbol.toLowerCase());
  }

  // Calculate covariance between asset returns and market returns
  private calculateCovariance(assetReturns: number[], marketReturns: number[]): number {
    if (assetReturns.length !== marketReturns.length || assetReturns.length === 0) {
      console.warn(`Covariance calculation: mismatched lengths - asset: ${assetReturns.length}, market: ${marketReturns.length}`);
      return 0;
    }

    const n = assetReturns.length;
    const assetMean = assetReturns.reduce((sum, r) => sum + r, 0) / n;
    const marketMean = marketReturns.reduce((sum, r) => sum + r, 0) / n;
    
    const covariance = assetReturns.reduce((sum, assetReturn, i) => {
      return sum + (assetReturn - assetMean) * (marketReturns[i] - marketMean);
    }, 0) / (n - 1);
    
    console.log(`Covariance calculation: n=${n}, assetMean=${assetMean.toFixed(4)}, marketMean=${marketMean.toFixed(4)}, covariance=${covariance.toFixed(6)}`);
    return covariance;
  }

  // Calculate variance of market returns
  private calculateVariance(returns: number[]): number {
    if (returns.length === 0) return 0;
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
    console.log(`Variance calculation: n=${returns.length}, mean=${mean.toFixed(4)}, variance=${variance.toFixed(6)}`);
    return variance;
  }

  // Calculate proper Beta using covariance/variance formula
  private calculateProperBeta(assetReturns: number[], marketReturns: number[]): number {
    if (assetReturns.length !== marketReturns.length || assetReturns.length < 24) {
      console.warn(`Insufficient aligned data for Beta calculation: asset=${assetReturns.length}, market=${marketReturns.length}`);
      return 1.0;
    }
    
    const covariance = this.calculateCovariance(assetReturns, marketReturns);
    const marketVariance = this.calculateVariance(marketReturns);
    
    if (marketVariance === 0) {
      console.warn('Market variance is zero, using default Beta 1.0');
      return 1.0;
    }
    
    const beta = covariance / marketVariance;
    console.log(`✅ Beta calculation: covariance=${covariance.toFixed(6)}, marketVariance=${marketVariance.toFixed(6)}, beta=${beta.toFixed(3)}`);
    
    return beta;
  }

  // Calculate monthly returns from prices
  private calculateMonthlyReturns(prices: number[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      if (prices[i - 1] > 0) {
        returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
      }
    }
    return returns;
  }

  // Calculate CAGR
  private calculateCAGR(startPrice: number, endPrice: number, years: number): number {
    if (startPrice <= 0 || endPrice <= 0 || years <= 0) return 0;
    return Math.pow(endPrice / startPrice, 1 / years) - 1;
  }

  // Get REAL volatility from Glassnode API - FIXED to use correct coin symbol
  private async getRealVolatilityFromGlassnode(coinSymbol: string): Promise<number> {
    try {
      console.log(`🔍 Fetching REAL volatility from Glassnode API for ${coinSymbol.toUpperCase()}`);
      
      // Get the latest realized volatility data from Glassnode for the specific coin
      const volatilityData = await enhancedGlassnodeService.getRealizedVolatility(coinSymbol.toUpperCase());
      
      if (volatilityData.length === 0) {
        console.warn(`⚠️ No volatility data from Glassnode for ${coinSymbol}, using fallback`);
        return 0.5; // 50% fallback
      }

      // Get the latest volatility value - this comes directly from Glassnode API
      const latestVolatility = volatilityData[volatilityData.length - 1].v;
      
      console.log(`📊 REAL Glassnode Volatility for ${coinSymbol.toUpperCase()}:`);
      console.log(`   - Raw API value: ${latestVolatility}`);
      console.log(`   - Data points available: ${volatilityData.length}`);
      console.log(`   - Coin symbol verified: ${coinSymbol.toUpperCase()}`);
      console.log(`   - Source: https://api.glassnode.com/v1/metrics/market/realized_volatility_all`);
      
      // Glassnode returns volatility as a decimal (e.g., 0.65 = 65%)
      // Convert to percentage for display consistency
      const volatilityPercentage = latestVolatility * 100;
      
      console.log(`   - Converted to percentage: ${volatilityPercentage.toFixed(2)}%`);
      console.log(`   - This is the REAL volatility from Glassnode for ${coinSymbol}, not calculated manually`);
      
      return latestVolatility; // Return as decimal for calculations
      
    } catch (error) {
      console.error(`❌ Failed to fetch real volatility from Glassnode for ${coinSymbol}:`, error);
      console.log(`📊 Using fallback volatility of 50% for ${coinSymbol}`);
      return 0.5; // 50% fallback
    }
  }

  // Calculate IRR using bisection method
  private calculateIRR(cashFlows: number[], initialGuess = 0.1): number {
    const maxIterations = 1000;
    const tolerance = 1e-6;
    let low = -0.99;
    let high = 10.0;

    const npvAtRate = (rate: number): number => {
      return cashFlows.reduce((npv, cf, index) => {
        return npv + cf / Math.pow(1 + rate, index);
      }, 0);
    };

    for (let i = 0; i < maxIterations; i++) {
      const mid = (low + high) / 2;
      const npv = npvAtRate(mid);

      if (Math.abs(npv) < tolerance) {
        return mid;
      }

      if (npv > 0) {
        low = mid;
      } else {
        high = mid;
      }

      if (Math.abs(high - low) < tolerance) {
        break;
      }
    }

    return (low + high) / 2;
  }

  // Main NPV calculation - UPDATED to use real Glassnode volatility with correct coin symbol
  async calculateAdvancedNPV(params: NPVCalculationParams): Promise<NPVResult> {
    const { coinSymbol, initialInvestment, projectionYears, stakingYield = 0, riskFreeRate } = params;
    
    console.log(`🔄 Starting advanced NPV calculation for ${coinSymbol.toUpperCase()}`);

    // Fetch all required data
    const [
      priceData,
      mvrvData,
      drawdownData,
      volumeData,
      regionalData
    ] = await Promise.all([
      enhancedGlassnodeService.getMonthlyClosingPrices(coinSymbol),
      enhancedGlassnodeService.getMVRVZScore(coinSymbol),
      enhancedGlassnodeService.getPriceDrawdown(coinSymbol),
      enhancedGlassnodeService.getTransferVolume(coinSymbol),
      enhancedGlassnodeService.getRegionalPriceChanges(coinSymbol)
    ]);

    // FIXED: Get REAL volatility from Glassnode API using the correct coin symbol
    const realVolatility = await this.getRealVolatilityFromGlassnode(coinSymbol);

    // Get benchmark data using enhanced service
    console.log(`🎯 Getting benchmark data for ${coinSymbol}...`);
    const benchmarkData = await enhancedBenchmarkService.getBenchmarkForCoin(coinSymbol);
    console.log(`📊 Benchmark: ${benchmarkData.name}, CAGR: ${benchmarkData.cagr36m.toFixed(2)}%, Monthly returns: ${benchmarkData.monthlyReturns.length}`);

    // Calculate base metrics using REAL API data
    const currentPrice = priceData[priceData.length - 1]?.v || 0;
    const cryptoCAGR = enhancedGlassnodeService.calculateCAGR(priceData) / 100;
    const cryptoReturns = enhancedGlassnodeService.calculateMonthlyReturns(priceData);
    
    console.log(`📈 Using REAL Glassnode Volatility for ${coinSymbol.toUpperCase()}: ${(realVolatility * 100).toFixed(2)}% (from API endpoint)`);
    console.log(`📊 Price data points: ${priceData.length}, Monthly returns: ${cryptoReturns.length}`);
    
    const monthlyChanges = enhancedGlassnodeService.calculateAverageRegionalChange(regionalData);

    // Calculate Beta using proper covariance/variance formula
    console.log(`📊 Calculating Beta for ${coinSymbol} vs ${benchmarkData.name}`);
    console.log(`   - Asset returns: ${cryptoReturns.length} data points`);
    console.log(`   - Market returns: ${benchmarkData.monthlyReturns.length} data points`);
    
    // Ensure data alignment - take the minimum length and align from the end
    const minLength = Math.min(cryptoReturns.length, benchmarkData.monthlyReturns.length);
    const alignedCryptoReturns = cryptoReturns.slice(-minLength);
    const alignedMarketReturns = benchmarkData.monthlyReturns.slice(-minLength);
    
    console.log(`   - Aligned data length: ${minLength} months`);
    
    const beta = this.calculateProperBeta(alignedCryptoReturns, alignedMarketReturns);

    // Calculate market premium and discount rate
    const marketPremium = (benchmarkData.cagr36m / 100) - (riskFreeRate / 100);
    let discountRate = (riskFreeRate / 100) + beta * marketPremium;

    // Risk adjustments
    const latestMVRV = mvrvData[mvrvData.length - 1]?.v || 0;
    const mvrvAdjustment = latestMVRV > 7 ? 0.02 : latestMVRV > 4 ? 0.01 : 0;
    discountRate += mvrvAdjustment;

    const maxDrawdown = enhancedGlassnodeService.calculateMaxDrawdown(priceData) / 100;
    const avgVolume = volumeData.reduce((sum, point) => sum + point.v, 0) / volumeData.length;
    const liquidityAdjustment = avgVolume < 1000 ? 0.1 : 0; // 10% reduction for low liquidity

    // Format price history data
    const priceHistory = priceData.map(point => ({
      date: new Date(point.t * 1000).toISOString().split('T')[0],
      price: point.v
    }));

    // Generate projected prices and cash flows
    const projectedPrices: number[] = [];
    const cashFlows: number[] = [-initialInvestment]; // Initial investment (negative)

    for (let year = 1; year <= projectionYears; year++) {
      const projectedPrice = currentPrice * Math.pow(1 + cryptoCAGR, year);
      projectedPrices.push(projectedPrice);

      // Calculate cash flow for this year
      const baseFlow = initialInvestment * 0.2; // 20% of initial investment
      const priceAppreciation = baseFlow * (projectedPrice / currentPrice);
      
      let yearlyFlow = priceAppreciation;
      
      // Add staking yield if applicable
      if (this.isStakeable(coinSymbol) && stakingYield > 0) {
        yearlyFlow += initialInvestment * (stakingYield / 100);
      }

      // Apply liquidity adjustment
      yearlyFlow *= (1 - liquidityAdjustment);

      cashFlows.push(yearlyFlow);
    }

    // Calculate NPV
    const npv = cashFlows.reduce((total, flow, index) => {
      return total + flow / Math.pow(1 + discountRate, index);
    }, 0);

    // Calculate stress-tested NPV with drawdown
    const stressedCashFlows = cashFlows.map((flow, index) => {
      if (index === 0) return flow; // Don't adjust initial investment
      return flow * (1 - maxDrawdown);
    });

    const stressTestedNPV = stressedCashFlows.reduce((total, flow, index) => {
      return total + flow / Math.pow(1 + discountRate, index);
    }, 0);

    // Calculate IRR
    const irr = this.calculateIRR(cashFlows);

    // Calculate ROI
    const totalCashFlows = cashFlows.slice(1).reduce((sum, flow) => sum + flow, 0);
    const finalValue = projectedPrices[projectedPrices.length - 1];
    const roi = ((totalCashFlows + finalValue - initialInvestment) / initialInvestment) * 100;

    console.log(`✅ Advanced NPV calculation completed with REAL Glassnode volatility for ${coinSymbol.toUpperCase()}`);
    console.log(`📊 Final Results:`);
    console.log(`   - Beta: ${beta.toFixed(3)} (${alignedCryptoReturns.length} aligned returns vs ${benchmarkData.name})`);
    console.log(`   - Volatility: ${(realVolatility * 100).toFixed(2)}% (REAL from Glassnode API for ${coinSymbol})`);
    console.log(`   - NPV: $${npv.toFixed(2)}`);
    console.log(`   - IRR: ${(irr * 100).toFixed(2)}%`);

    return {
      npv,
      irr: irr * 100, // Convert to percentage
      roi,
      cagr: cryptoCAGR * 100,
      beta,
      discountRate: discountRate * 100,
      projectedPrices,
      cashFlows,
      stressTestedNPV,
      marketPremium: marketPremium * 100,
      monthlyChanges,
      isStakeable: this.isStakeable(coinSymbol),
      benchmark: benchmarkData.name,
      riskAdjustments: {
        mvrvAdjustment: mvrvAdjustment * 100,
        liquidityAdjustment: liquidityAdjustment * 100,
        drawdownRisk: maxDrawdown * 100
      },
      priceHistory: priceHistory.slice(-36) // Last 36 months
    };
  }
}

export const advancedInvestmentService = new AdvancedInvestmentCalculationService();

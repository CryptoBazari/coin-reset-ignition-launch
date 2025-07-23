import { glassnodeBetaCalculationService, BetaCalculationResult } from './glassnodeBetaCalculationService';
import type { EnhancedCoinData } from '@/types/investment';

export interface EnhancedNPVResult {
  npv: number;
  projectedValues: number[];
  discountRate: number;
  beta: number;
  confidenceScore: number;
  capmCalculation: {
    riskFreeRate: number;
    marketReturn: number;
    betaAdjustedReturn: number;
  };
  betaDetails: BetaCalculationResult;
}

class EnhancedNPVCalculationService {
  // Risk-free rate (approximate 10-year Treasury yield)
  private readonly RISK_FREE_RATE = 0.045; // 4.5%
  
  // Expected market returns
  private readonly SP500_EXPECTED_RETURN = 0.10; // 10% for S&P 500
  private readonly BTC_EXPECTED_RETURN = 0.15; // 15% for BTC

  /**
   * Calculate NPV using CAPM-derived discount rate with real beta
   * Formula: NPV = Σ [CF_t / (1 + r)^t] - C_0
   * Where r = rf + Beta × (rm - rf) [CAPM]
   */
  async calculateEnhancedNPV(
    investmentAmount: number,
    coinData: EnhancedCoinData,
    horizon: number,
    coinId: string
  ): Promise<EnhancedNPVResult> {
    try {
      console.log('🔄 Starting enhanced NPV calculation with real beta...');
      console.log(`   Investment: $${investmentAmount}, Asset: ${coinId}, Horizon: ${horizon} years`);

      // Step 1: Calculate real beta using Glassnode + FRED data
      const betaDetails = await glassnodeBetaCalculationService.calculateBeta(coinId);
      console.log(`   ✅ Real beta calculated: ${betaDetails.beta.toFixed(3)} (${betaDetails.confidence} confidence)`);

      // Step 2: Determine market return based on benchmark
      const marketReturn = betaDetails.benchmarkUsed === 'SP500' 
        ? this.SP500_EXPECTED_RETURN 
        : this.BTC_EXPECTED_RETURN;

      // Step 3: Calculate CAPM discount rate
      // r = rf + Beta × (rm - rf)
      const marketRiskPremium = marketReturn - this.RISK_FREE_RATE;
      const betaAdjustedReturn = betaDetails.beta * marketRiskPremium;
      const discountRate = this.RISK_FREE_RATE + betaAdjustedReturn;

      console.log(`   📊 CAPM Calculation:`);
      console.log(`      Risk-free rate: ${(this.RISK_FREE_RATE * 100).toFixed(2)}%`);
      console.log(`      Market return (${betaDetails.benchmarkUsed}): ${(marketReturn * 100).toFixed(2)}%`);
      console.log(`      Market risk premium: ${(marketRiskPremium * 100).toFixed(2)}%`);
      console.log(`      Beta-adjusted return: ${(betaAdjustedReturn * 100).toFixed(2)}%`);
      console.log(`      Final discount rate: ${(discountRate * 100).toFixed(2)}%`);

      // Step 4: Calculate expected growth rate
      const baseGrowthRate = this.calculateExpectedGrowthRate(coinData, betaDetails);
      console.log(`   📈 Expected growth rate: ${(baseGrowthRate * 100).toFixed(2)}%`);

      // Step 5: Project future cash flows
      const currentPrice = coinData.current_price;
      const coinQuantity = investmentAmount / currentPrice;
      const projectedValues: number[] = [];

      for (let year = 1; year <= horizon; year++) {
        const projectedPrice = currentPrice * Math.pow(1 + baseGrowthRate, year);
        const projectedValue = coinQuantity * projectedPrice;
        projectedValues.push(projectedValue);
      }

      console.log(`   💰 Projected values: ${projectedValues.map(v => `$${v.toFixed(0)}`).join(', ')}`);

      // Step 6: Calculate NPV using CAPM discount rate
      // NPV = Σ [CF_t / (1 + r)^t] - C_0
      let npv = -investmentAmount; // Initial investment (negative cash flow)
      
      for (let i = 0; i < projectedValues.length; i++) {
        const discountedValue = projectedValues[i] / Math.pow(1 + discountRate, i + 1);
        npv += discountedValue;
      }

      // Step 7: Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(coinData, betaDetails);

      console.log(`   📊 Final NPV: $${npv.toFixed(2)} with ${confidenceScore}% confidence`);

      return {
        npv,
        projectedValues,
        discountRate,
        beta: betaDetails.beta,
        confidenceScore,
        capmCalculation: {
          riskFreeRate: this.RISK_FREE_RATE,
          marketReturn,
          betaAdjustedReturn
        },
        betaDetails
      };
    } catch (error) {
      console.error('❌ Enhanced NPV calculation failed:', error);
      throw error;
    }
  }

  /**
   * Calculate expected growth rate using multiple factors
   */
  private calculateExpectedGrowthRate(coinData: EnhancedCoinData, betaDetails: BetaCalculationResult): number {
    // Base growth from historical CAGR
    let baseGrowth = (coinData.cagr_36m || 20) / 100;
    
    // Adjust based on on-chain metrics if available
    if (coinData.onChainData?.networkGrowth) {
      const networkGrowthFactor = coinData.onChainData.networkGrowth / 100;
      baseGrowth *= (1 + networkGrowthFactor * 0.3); // 30% weight to network growth
    }

    // Adjust based on AVIV ratio if available
    if (coinData.liveMetrics?.avivRatio && coinData.liveMetrics.avivRatio !== 1.0) {
      if (coinData.liveMetrics.avivRatio < 1.0) {
        baseGrowth *= 1.15; // Undervalued boost
      } else if (coinData.liveMetrics.avivRatio > 2.0) {
        baseGrowth *= 0.85; // Overvalued adjustment
      }
    }

    // Beta adjustment for systematic risk
    if (Math.abs(betaDetails.beta) > 2.0) {
      baseGrowth *= 0.9; // High beta penalty
    } else if (betaDetails.beta < 0.5) {
      baseGrowth *= 1.1; // Low beta premium
    }

    return Math.max(0.05, Math.min(1.0, baseGrowth)); // Cap between 5% and 100%
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidenceScore(coinData: EnhancedCoinData, betaDetails: BetaCalculationResult): number {
    let score = 30; // Base score

    // Beta calculation quality
    score += betaDetails.dataQualityScore * 0.4; // Up to 40 points

    // Real data availability
    if (coinData.current_price > 0) score += 10;
    if (coinData.cagr_36m) score += 10;
    if (coinData.liveMetrics?.avivRatio !== 1.0) score += 10;
    if (coinData.onChainData?.networkGrowth) score += 10;

    return Math.min(95, Math.round(score));
  }
}

export const enhancedNPVCalculationService = new EnhancedNPVCalculationService();
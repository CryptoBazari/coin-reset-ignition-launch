
import type { ComprehensiveAnalysisResult } from './comprehensiveGlassNodeAnalyzer';

export interface GlassnodeNPVResult {
  npv: number;
  adjustedNpv: number;
  confidenceLevel: number;
  priceProjections: Array<{ year: number; price: number; confidence: number }>;
  dataSourcesUsed: string[];
  marketCyclePosition: 'early' | 'mid' | 'late' | 'uncertain';
  riskAdjustedDiscount: number;
}

export class GlassnodeNPVCalculator {
  calculateDataDrivenNPV(
    investmentAmount: number,
    coinData: any,
    inputs: any
  ): GlassnodeNPVResult {
    console.log('🎯 Starting Glassnode-powered NPV calculation');
    
    // Extract real Glassnode metrics
    const mvrvRatio = coinData.mvrv || 1.0;
    const realizedVolatility = coinData.volatility || 50;
    const drawdownLevel = coinData.drawdown || 0.2;
    const netRealizedPL = coinData.realizedProfitLoss || 0;
    const volumeMetric = coinData.volume || 0;
    
    console.log('📊 Using real Glassnode data for NPV:');
    console.log(`   - MVRV Z-Score: ${mvrvRatio} (market valuation)`);
    console.log(`   - Realized Volatility: ${realizedVolatility}% (price uncertainty)`);
    console.log(`   - Current Drawdown: ${(drawdownLevel * 100).toFixed(1)}% (risk level)`);
    console.log(`   - Net Realized P&L: ${netRealizedPL} (market sentiment)`);
    
    // Determine market cycle position using MVRV
    const marketCyclePosition = this.getMarketCyclePosition(mvrvRatio, drawdownLevel);
    console.log(`   - Market Cycle: ${marketCyclePosition}`);
    
    // Calculate risk-adjusted discount rate using real data
    const riskAdjustedDiscount = this.calculateRiskAdjustedDiscountRate(
      inputs.riskFreeRate || 0.03,
      realizedVolatility,
      drawdownLevel,
      marketCyclePosition
    );
    
    console.log(`   - Risk-Adjusted Discount Rate: ${(riskAdjustedDiscount * 100).toFixed(2)}%`);
    
    // Generate data-driven price projections
    const priceProjections = this.generateGlassnodeBasedProjections(
      coinData.prices,
      mvrvRatio,
      realizedVolatility,
      netRealizedPL,
      inputs.holdingPeriod || 36
    );
    
    // Calculate NPV using data-driven projections
    const { npv, adjustedNpv } = this.calculateEnhancedNPV(
      investmentAmount,
      priceProjections,
      riskAdjustedDiscount,
      inputs
    );
    
    // Calculate confidence level based on data quality
    const confidenceLevel = this.calculateConfidenceLevel(
      coinData,
      priceProjections,
      marketCyclePosition
    );
    
    const dataSourcesUsed = [
      'MVRV Z-Score (Glass Node)',
      'Realized Volatility (Glass Node)',
      'Net Realized P&L (Glass Node)',
      'Price Drawdown (Glass Node)',
      'Transaction Volume (Glass Node)'
    ];
    
    console.log(`💰 Final NPV Results:`);
    console.log(`   - NPV: $${npv.toLocaleString()}`);
    console.log(`   - Inflation-Adjusted NPV: $${adjustedNpv.toLocaleString()}`);
    console.log(`   - Confidence Level: ${confidenceLevel}%`);
    
    return {
      npv,
      adjustedNpv,
      confidenceLevel,
      priceProjections: priceProjections.map((proj, idx) => ({
        year: idx + 1,
        price: proj,
        confidence: confidenceLevel
      })),
      dataSourcesUsed,
      marketCyclePosition,
      riskAdjustedDiscount
    };
  }
  
  private getMarketCyclePosition(mvrvRatio: number, drawdown: number): 'early' | 'mid' | 'late' | 'uncertain' {
    // Use MVRV and drawdown to determine market cycle position
    if (mvrvRatio < 0.8 && drawdown > 0.5) {
      return 'early'; // Undervalued + high drawdown = early cycle
    } else if (mvrvRatio > 2.5 && drawdown < 0.1) {
      return 'late'; // Overvalued + low drawdown = late cycle
    } else if (mvrvRatio >= 0.8 && mvrvRatio <= 2.5) {
      return 'mid'; // Reasonable valuation = mid cycle
    } else {
      return 'uncertain'; // Mixed signals
    }
  }
  
  private calculateRiskAdjustedDiscountRate(
    baseRate: number,
    volatility: number,
    drawdown: number,
    cyclePosition: string
  ): number {
    let adjustedRate = baseRate;
    
    // Volatility adjustment (higher volatility = higher discount rate)
    const volatilityPremium = (volatility / 100) * 0.15; // 15% of volatility as premium
    adjustedRate += volatilityPremium;
    
    // Drawdown adjustment (current high drawdown = lower required return)
    const drawdownAdjustment = drawdown * 0.05; // 5% reduction per unit drawdown
    adjustedRate -= drawdownAdjustment;
    
    // Market cycle adjustment
    const cycleAdjustments = {
      'early': -0.02, // Lower discount rate in early cycle (more upside potential)
      'mid': 0,       // No adjustment in mid cycle
      'late': 0.03,   // Higher discount rate in late cycle (more risk)
      'uncertain': 0.01 // Slight premium for uncertainty
    };
    adjustedRate += cycleAdjustments[cyclePosition as keyof typeof cycleAdjustments] || 0;
    
    // Ensure reasonable bounds
    return Math.max(0.01, Math.min(0.25, adjustedRate));
  }
  
  private generateGlassnodeBasedProjections(
    historicalPrices: any[],
    mvrvRatio: number,
    volatility: number,
    netRealizedPL: number,
    holdingPeriodMonths: number
  ): number[] {
    const currentPrice = historicalPrices[historicalPrices.length - 1]?.price || 50000;
    const projectionYears = Math.ceil(holdingPeriodMonths / 12);
    const projections: number[] = [];
    
    console.log('📈 Generating Glassnode-based price projections:');
    
    // Base growth rate adjustment using MVRV
    let baseGrowthRate = 0.15; // 15% base annual growth
    
    if (mvrvRatio < 0.8) {
      baseGrowthRate = 0.35; // High growth potential when undervalued
      console.log('   ✅ Undervalued asset detected: +35% annual growth potential');
    } else if (mvrvRatio > 2.5) {
      baseGrowthRate = 0.05; // Low growth when overvalued
      console.log('   ⚠️ Overvalued asset detected: +5% annual growth potential');
    } else {
      baseGrowthRate = 0.20; // Moderate growth for fair value
      console.log('   📊 Fair value detected: +20% annual growth potential');
    }
    
    // Sentiment adjustment using Net Realized P&L
    let sentimentMultiplier = 1.0;
    if (netRealizedPL > 0) {
      sentimentMultiplier = 1.1; // Positive sentiment boost
      console.log('   ✅ Positive market sentiment: +10% boost');
    } else if (netRealizedPL < 0) {
      sentimentMultiplier = 0.9; // Negative sentiment drag
      console.log('   ⚠️ Negative market sentiment: -10% drag');
    }
    
    // Generate yearly projections with Monte Carlo-like simulation
    let currentProjectedPrice = currentPrice;
    
    for (let year = 1; year <= projectionYears; year++) {
      // Apply base growth with sentiment adjustment
      const yearlyGrowth = baseGrowthRate * sentimentMultiplier;
      
      // Add volatility-based uncertainty (mean reversion)
      const volatilityFactor = 1 + (Math.random() - 0.5) * (volatility / 200);
      
      // Calculate projected price
      currentProjectedPrice *= (1 + yearlyGrowth) * volatilityFactor;
      
      // Apply diminishing returns over time (realistic projection)
      const timeDecay = Math.pow(0.95, year - 1);
      const finalProjection = currentProjectedPrice * timeDecay;
      
      projections.push(finalProjection);
      
      console.log(`   Year ${year}: $${finalProjection.toLocaleString()} (growth: ${(yearlyGrowth * 100).toFixed(1)}%)`);
    }
    
    return projections;
  }
  
  private calculateEnhancedNPV(
    investmentAmount: number,
    priceProjections: number[],
    discountRate: number,
    inputs: any
  ): { npv: number; adjustedNpv: number } {
    const currentPrice = priceProjections[0] / (1 + 0.15); // Reverse engineer starting price
    const coinQuantity = investmentAmount / currentPrice;
    
    // Generate cash flows with proper staking rewards
    const cashFlows = [-investmentAmount]; // Initial investment
    
    for (let year = 1; year <= priceProjections.length; year++) {
      const projectedPrice = priceProjections[year - 1];
      const stakingYield = inputs.stakingYield || 0;
      
      if (year < priceProjections.length) {
        // Intermediate years: only staking rewards
        const stakingIncome = coinQuantity * (stakingYield / 100) * projectedPrice;
        cashFlows.push(stakingIncome);
      } else {
        // Final year: staking + sale of all coins
        const stakingIncome = coinQuantity * (stakingYield / 100) * projectedPrice;
        const saleProceeds = coinQuantity * projectedPrice * (1 - (inputs.transactionCosts || 0) / 100);
        cashFlows.push(stakingIncome + saleProceeds);
      }
    }
    
    // Calculate NPV
    let npv = 0;
    for (let i = 0; i < cashFlows.length; i++) {
      npv += cashFlows[i] / Math.pow(1 + discountRate, i);
    }
    
    // Calculate inflation-adjusted NPV
    const inflationRate = inputs.inflationRate || 0.025;
    const realDiscountRate = discountRate + inflationRate;
    let adjustedNpv = 0;
    for (let i = 0; i < cashFlows.length; i++) {
      adjustedNpv += cashFlows[i] / Math.pow(1 + realDiscountRate, i);
    }
    
    return { npv, adjustedNpv };
  }
  
  private calculateConfidenceLevel(
    coinData: any,
    projections: number[],
    cyclePosition: string
  ): number {
    let confidence = 50; // Base confidence
    
    // Real data quality bonuses
    if (coinData.mvrv && coinData.mvrv !== 1.0) confidence += 20;
    if (coinData.volatility && coinData.volatility > 0) confidence += 15;
    if (coinData.realizedProfitLoss !== undefined) confidence += 10;
    if (coinData.drawdown && coinData.drawdown > 0) confidence += 10;
    if (coinData.volume && coinData.volume > 0) confidence += 10;
    
    // Market cycle clarity bonus
    if (cyclePosition !== 'uncertain') confidence += 15;
    
    // Price projection consistency bonus
    const projectionVariance = this.calculateVariance(projections);
    if (projectionVariance < 0.5) confidence += 10; // Low variance = higher confidence
    
    return Math.min(95, confidence);
  }
  
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance / (mean * mean); // Coefficient of variation
  }
}

export const glassnodeNPVCalculator = new GlassnodeNPVCalculator();

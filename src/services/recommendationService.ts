// =============================================================================
// ENHANCED RECOMMENDATION SERVICE WITH BASKET-SPECIFIC LOGIC
// Implements 60% Bitcoin, 40% Blue-chip, 15% Small-cap allocation rules
// =============================================================================

import { calculateRiskFactor } from '@/utils/financialCalculations';
import type { CoinData, MarketConditions, InvestmentRecommendation } from '@/types/investment';

export const generateAdvancedRecommendation = (
  npv: number,
  irr: number,
  hurdleRate: number,
  coin: CoinData,
  investmentAmount: number,
  totalPortfolio: number,
  targetAllocation: number,
  marketConditions: MarketConditions,
  allocation: { portfolioPercentage: number; status: string; recommendation: string; message: string }
): InvestmentRecommendation => {
  const portfolioPercentage = allocation.portfolioPercentage;
  
  let recommendation: 'Buy' | 'Buy Less' | 'Do Not Buy' | 'Sell';
  let conditions = '';
  let risks = '';
  let marketAnalysis = '';

  // BASKET-SPECIFIC LOGIC
  const basketType = coin.basket;
  
  // BITCOIN BASKET LOGIC (60-80% target)
  if (basketType === 'Bitcoin') {
    if (portfolioPercentage < 60) {
      recommendation = 'Buy';
      conditions = `Bitcoin allocation (${portfolioPercentage.toFixed(1)}%) below minimum 60%. Increase for portfolio stability.`;
    } else if (portfolioPercentage > 80) {
      recommendation = 'Do Not Buy';
      conditions = `Bitcoin allocation (${portfolioPercentage.toFixed(1)}%) exceeds maximum 80%. Over-concentrated.`;
      risks = 'Excessive Bitcoin concentration reduces diversification benefits. ';
    } else if (npv > 0 && irr > hurdleRate && marketConditions.bitcoinState !== 'bearish') {
      recommendation = 'Buy';
      conditions = `Bitcoin allocation optimal (${portfolioPercentage.toFixed(1)}%). Strong fundamentals support investment.`;
    } else {
      recommendation = 'Buy Less';
      conditions = `Bitcoin allocation acceptable but market conditions uncertain.`;
    }
  }
  
  // BLUE-CHIP BASKET LOGIC (0-40% target)
  else if (basketType === 'Blue Chip') {
    if (portfolioPercentage > 40) {
      recommendation = 'Do Not Buy';
      conditions = `Blue-chip allocation (${portfolioPercentage.toFixed(1)}%) exceeds maximum 40%. Reduce exposure.`;
      risks = 'Over-allocation to blue-chips reduces portfolio Bitcoin foundation. ';
    } else if (npv > 0 && irr > hurdleRate) {
      recommendation = 'Buy';
      conditions = `Blue-chip allocation within limits (${portfolioPercentage.toFixed(1)}%). Good diversification opportunity.`;
    } else {
      recommendation = 'Buy Less';
      conditions = `Blue-chip investment acceptable but monitor systematic risk.`;
    }
  }
  
  // SMALL-CAP BASKET LOGIC (0-15% target)
  else if (basketType === 'Small-Cap') {
    if (portfolioPercentage > 15) {
      recommendation = 'Sell';
      conditions = `Small-cap allocation (${portfolioPercentage.toFixed(1)}%) exceeds maximum 15%. High risk exposure.`;
      risks = 'Excessive small-cap allocation. Risk of major losses in bear market. ';
    } else if (npv > 0 && irr > hurdleRate + 5 && marketConditions.bitcoinState === 'bullish') {
      recommendation = 'Buy Less';
      conditions = `Small-cap shows potential but limit position size. High-risk, high-reward.`;
      risks = 'Small-cap investments carry 80%+ volatility. Only invest what you can afford to lose. ';
    } else {
      recommendation = 'Do Not Buy';
      conditions = `Small-cap doesn't meet risk-adjusted return requirements or market conditions unfavorable.`;
    }
  }
  
  // Default case
  else {
    if (npv > 0 && irr > hurdleRate) {
      recommendation = 'Buy Less';
      conditions = 'Acceptable returns but unspecified basket requires caution.';
    } else {
      recommendation = 'Do Not Buy';
      conditions = 'Poor risk-adjusted returns.';
    }
  }
  
  // MARKET CONDITION OVERLAYS
  if (marketConditions.bitcoinState === 'bearish') {
    marketAnalysis = `Bitcoin bearish (AVIV: ${marketConditions.avivRatio?.toFixed(2) || 'N/A'}). All crypto carries elevated risk.`;
    
    if (marketConditions.smartMoneyActivity) {
      recommendation = 'Sell';
      conditions = 'Smart money selling detected. Consider exiting positions to preserve capital.';
      risks += 'Major price correction likely. Protect against 50-70% drawdowns. ';
    } else if (recommendation === 'Buy') {
      recommendation = 'Do Not Buy';
      conditions += ' Bear market conditions override positive fundamentals.';
      risks += 'Bitcoin bearish state increases all crypto risk. Wait for AVIV < 0.55. ';
    }
  } else if (marketConditions.bitcoinState === 'bullish') {
    marketAnalysis = `Bitcoin bullish (AVIV: ${marketConditions.avivRatio?.toFixed(2) || 'N/A'}). Favorable environment for crypto investments.`;
  } else {
    marketAnalysis = `Bitcoin neutral (AVIV: ${marketConditions.avivRatio?.toFixed(2) || 'N/A'}). Mixed signals require careful position sizing.`;
  }

  // Federal Reserve policy impact
  if (marketConditions.fedRateChange && Math.abs(marketConditions.fedRateChange) > 0.25) {
    const direction = marketConditions.fedRateChange > 0 ? 'hiking' : 'cutting';
    const impact = marketConditions.fedRateChange > 0 ? 'increases' : 'decreases';
    marketAnalysis += ` Fed ${direction} rates ${impact} crypto attractiveness.`;
    
    if (marketConditions.fedRateChange > 0.5) {
      risks += 'Aggressive Fed rate hikes create headwinds for crypto investments. ';
    }
  }

  // Additional risk factors
  const volatilityRisk = (coin.volatility || 50) > 70 ? `High volatility (${coin.volatility}%). ` : '';
  const regulatoryRisk = 'Regulatory uncertainty remains. ';
  
  risks = volatilityRisk + regulatoryRisk + risks;

  // Rebalancing suggestions
  const rebalancingActions: string[] = [];
  
  if (allocation.status === 'overexposed') {
    rebalancingActions.push(`Reduce ${basketType} allocation from ${portfolioPercentage.toFixed(1)}%`);
  }
  
  if (allocation.status === 'underexposed' && basketType === 'Bitcoin') {
    rebalancingActions.push(`Increase Bitcoin allocation to at least 60%`);
  }
  
  if (marketConditions.bitcoinState === 'bearish') {
    rebalancingActions.push('Consider reducing crypto allocation by 10-20%');
    rebalancingActions.push('Increase stablecoin allocation until Bitcoin AVIV <1.0');
  }

  return {
    recommendation,
    worthInvesting: npv > 0 && marketConditions.bitcoinState !== 'bearish',
    goodTiming: marketConditions.bitcoinState === 'bullish',
    appropriateAmount: allocation.status === 'optimal',
    riskFactor: calculateBasketRiskFactor(basketType, portfolioPercentage),
    shouldDiversify: basketType !== 'Bitcoin' || portfolioPercentage > 80,
    conditions,
    risks,
    rebalancingActions,
    marketAnalysis
  };
};

// Helper function to calculate basket-specific risk factor
function calculateBasketRiskFactor(basketType: string, portfolioPercentage: number): number {
  let baseRisk = {
    'Bitcoin': 2,
    'Blue Chip': 3,
    'Small-Cap': 4
  }[basketType] || 3;
  
  // Increase risk for over-allocation
  if (basketType === 'Bitcoin' && portfolioPercentage > 80) baseRisk += 1;
  if (basketType === 'Blue Chip' && portfolioPercentage > 40) baseRisk += 2;
  if (basketType === 'Small-Cap' && portfolioPercentage > 15) baseRisk += 2;
  
  return Math.min(5, baseRisk);
}
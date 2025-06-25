
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
  allocation: { basketPercentage: number; portfolioPercentage: number; overexposed: boolean }
): InvestmentRecommendation => {
  const basketAllocation = (totalPortfolio * targetAllocation / 100);
  
  let recommendation: 'Buy' | 'Buy Less' | 'Do Not Buy' | 'Sell';
  let conditions = '';
  let risks = '';
  let marketAnalysis = '';

  // Market analysis based on Cointime Economics
  if (marketConditions.bitcoinState === 'bearish') {
    marketAnalysis = `Bitcoin is in bearish state (AVIV: ${marketConditions.avivRatio?.toFixed(2) || 'N/A'}, Active Supply: ${marketConditions.activeSupply?.toFixed(1) || 'N/A'}%). All crypto baskets carry elevated risk.`;
    
    if (marketConditions.smartMoneyActivity) {
      recommendation = 'Sell';
      conditions = 'Smart money is selling. Consider exiting positions to preserve capital.';
      risks = 'Major price correction likely. Protect against 50-70% drawdowns.';
    } else {
      recommendation = 'Do Not Buy';
      conditions = 'Wait for Bitcoin AVIV <0.55 or higher vaulted supply (>70%) before investing.';
      risks = 'High volatility expected. Market may decline further.';
    }
  } else if (marketConditions.bitcoinState === 'bullish') {
    marketAnalysis = `Bitcoin shows bullish signals (AVIV: ${marketConditions.avivRatio?.toFixed(2) || 'N/A'}, Vaulted Supply: ${marketConditions.vaultedSupply?.toFixed(1) || 'N/A'}%). Favorable environment for crypto investments.`;
    
    if (npv > 0 && irr > hurdleRate && !allocation.overexposed) {
      recommendation = 'Buy';
      conditions = 'Strong bullish Bitcoin environment supports investment thesis.';
    } else {
      recommendation = 'Buy Less';
      conditions = 'Bullish environment but consider position sizing carefully.';
    }
  } else {
    // Neutral Bitcoin market
    marketAnalysis = `Bitcoin in neutral state (AVIV: ${marketConditions.avivRatio?.toFixed(2) || 'N/A'}). Mixed signals require careful evaluation.`;
    
    if (npv > 0 && irr > hurdleRate && !allocation.overexposed) {
      if (coin.basket === 'Bitcoin' && marketConditions.avivRatio && marketConditions.avivRatio < 1.0) {
        recommendation = 'Buy';
        conditions = 'Good fundamentals with neutral Bitcoin environment.';
      } else {
        recommendation = 'Buy Less';
        conditions = 'Neutral conditions suggest cautious approach.';
      }
    } else {
      recommendation = 'Do Not Buy';
      conditions = 'Poor risk-adjusted returns or position too large for portfolio.';
    }
  }

  // Additional risk factors
  const volatilityRisk = (coin.volatility || 50) > 70 ? `High volatility (${coin.volatility}%). ` : '';
  const regulatoryRisk = 'Regulatory uncertainty remains. ';
  const fedRisk = marketConditions.fedRateChange > 0 ? 'Fed rate hikes increase crypto risk. ' : 
                  marketConditions.fedRateChange < 0 ? 'Fed rate cuts support crypto. ' : '';
  
  risks = volatilityRisk + regulatoryRisk + fedRisk + risks;

  // Rebalancing suggestions
  const rebalancingActions: string[] = [];
  if (allocation.overexposed) {
    rebalancingActions.push(`Reduce position size - currently ${allocation.basketPercentage.toFixed(1)}% of basket allocation`);
  }
  
  if (marketConditions.bitcoinState === 'bearish') {
    rebalancingActions.push('Consider selling 10-20% of crypto holdings');
    rebalancingActions.push('Increase stablecoin allocation until Bitcoin AVIV <1.0');
  }

  return {
    recommendation,
    worthInvesting: npv > 0 && marketConditions.bitcoinState !== 'bearish',
    goodTiming: marketConditions.bitcoinState === 'bullish' || (marketConditions.bitcoinState === 'neutral' && marketConditions.sentimentScore < 0),
    appropriateAmount: !allocation.overexposed,
    riskFactor: calculateRiskFactor(
      coin.basket,
      coin.volatility || 50,
      coin.fundamentals_score || 5,
      marketConditions.avivRatio,
      marketConditions.activeSupply,
      marketConditions.vaultedSupply,
      marketConditions.fedRateChange,
      marketConditions.smartMoneyActivity
    ),
    shouldDiversify: coin.basket !== 'Bitcoin',
    conditions,
    risks,
    rebalancingActions,
    marketAnalysis
  };
};


// Enhanced financial calculation utilities with Cointime Economics and Fed rate adjustments

export const calculateNPV = (cashFlows: number[], discountRate: number): number => {
  return cashFlows.reduce((npv, cashFlow, period) => {
    return npv + cashFlow / Math.pow(1 + discountRate, period);
  }, 0);
};

export const calculateIRR = (cashFlows: number[], maxIterations = 100, precision = 0.0001): number => {
  let rate = 0.1; // Initial guess of 10%
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;
    
    for (let t = 0; t < cashFlows.length; t++) {
      npv += cashFlows[t] / Math.pow(1 + rate, t);
      dnpv -= t * cashFlows[t] / Math.pow(1 + rate, t + 1);
    }
    
    if (Math.abs(npv) < precision) {
      return rate * 100;
    }
    
    if (dnpv === 0) break;
    rate = rate - npv / dnpv;
    
    if (rate < -0.99) rate = -0.99;
  }
  
  return rate * 100;
};

export const calculateCAGR = (beginningValue: number, endingValue: number, periods: number): number => {
  if (beginningValue <= 0 || endingValue <= 0 || periods <= 0) return 0;
  return (Math.pow(endingValue / beginningValue, 1 / periods) - 1) * 100;
};

export const calculateROI = (beginningValue: number, endingValue: number): number => {
  if (beginningValue <= 0) return 0;
  return ((endingValue - beginningValue) / beginningValue) * 100;
};

export const calculateRiskFactor = (
  basket: string,
  volatility: number,
  fundamentalsScore: number,
  avivRatio?: number,
  activeSupply?: number,
  vaultedSupply?: number,
  fedRateChange?: number,
  smartMoneyActivity?: boolean
): number => {
  let baseScore: number;
  
  switch (basket) {
    case 'Bitcoin':
      baseScore = 3;
      // Cointime Economics adjustments
      if (avivRatio && avivRatio > 2.5) baseScore += 1; // Overbought
      if (avivRatio && avivRatio < 0.55) baseScore -= 1; // Oversold
      if (activeSupply && activeSupply > 50) baseScore += 1; // High active supply = bearish
      if (vaultedSupply && vaultedSupply > 70) baseScore -= 1; // High vaulted supply = bullish
      if (smartMoneyActivity) baseScore += 1; // Smart money selling
      break;
    case 'Blue Chip':
      baseScore = 4;
      if (fundamentalsScore && fundamentalsScore > 8) baseScore -= 1;
      // Add risk if Bitcoin is bearish
      if (avivRatio && avivRatio > 2.5) baseScore += 1;
      break;
    case 'Small-Cap':
      baseScore = 5;
      if (fundamentalsScore && fundamentalsScore > 9) baseScore -= 1;
      if (fundamentalsScore && fundamentalsScore < 5) baseScore += 1; // No audits/poor fundamentals
      // Add risk if Bitcoin is bearish
      if (avivRatio && avivRatio > 2.5) baseScore += 1;
      break;
    default:
      baseScore = 3;
  }
  
  // Volatility adjustments
  if (volatility > 80) baseScore += 1;
  else if (volatility < 30) baseScore -= 1;
  
  // Federal Reserve rate adjustments
  if (fedRateChange) {
    if (fedRateChange < 0) baseScore -= 0.5; // Rate cut = lower risk
    else if (fedRateChange > 0) baseScore += 0.5; // Rate hike = higher risk
  }
  
  return Math.max(1, Math.min(5, Math.round(baseScore)));
};

export const analyzeBitcoinMarketState = (
  avivRatio?: number,
  activeSupply?: number,
  vaultedSupply?: number,
  smartMoneyActivity?: boolean
): 'bullish' | 'neutral' | 'bearish' => {
  if (!avivRatio) return 'neutral';
  
  // Bearish conditions
  if (avivRatio > 2.5 || (activeSupply && activeSupply > 50) || smartMoneyActivity) {
    return 'bearish';
  }
  
  // Bullish conditions
  if (avivRatio < 0.55 && (vaultedSupply && vaultedSupply > 70)) {
    return 'bullish';
  }
  
  return 'neutral';
};

export const generateCashFlows = (
  investmentAmount: number,
  expectedPrice: number,
  currentPrice: number,
  investmentHorizon: number,
  stakingYield = 0
): number[] => {
  const cashFlows = [-investmentAmount];
  
  // Add intermediate cash flows (staking rewards)
  for (let i = 1; i < investmentHorizon; i++) {
    cashFlows.push(investmentAmount * (stakingYield / 100));
  }
  
  // Final cash flow (sale + final staking reward)
  const finalValue = (investmentAmount * expectedPrice) / currentPrice;
  const finalStaking = investmentAmount * (stakingYield / 100);
  cashFlows.push(finalValue + finalStaking);
  
  return cashFlows;
};

export const adjustDiscountRateForFed = (
  baseRate: number,
  fedRateChange: number
): number => {
  // Adjust discount rate based on Fed policy
  if (fedRateChange < 0) return Math.max(0.01, baseRate - 0.005); // Rate cut
  if (fedRateChange > 0) return baseRate + 0.005; // Rate hike
  return baseRate;
};

export const checkAllocation = (
  investmentAmount: number,
  basketAllocation: number,
  totalPortfolio: number
): { basketPercentage: number; portfolioPercentage: number; overexposed: boolean } => {
  const basketPercentage = (investmentAmount / basketAllocation) * 100;
  const portfolioPercentage = (investmentAmount / totalPortfolio) * 100;
  const overexposed = basketPercentage > 5;
  
  return { basketPercentage, portfolioPercentage, overexposed };
};

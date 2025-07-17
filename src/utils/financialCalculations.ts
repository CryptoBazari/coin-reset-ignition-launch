
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
  
  // Calculate coin quantity purchased
  const coinQuantity = investmentAmount / currentPrice;
  let totalCoins = coinQuantity; // Track compounding
  
  // Proper staking with compounding
  for (let i = 1; i < investmentHorizon; i++) {
    // Annual staking reward in coins
    const stakingRewardCoins = totalCoins * (stakingYield / 100);
    totalCoins += stakingRewardCoins; // Compound staking
    
    // Price appreciation path for intermediate valuation
    const intermediatePrice = currentPrice * 
      Math.pow(expectedPrice / currentPrice, i / investmentHorizon);
    
    // Cash flow from staking (sell rewards)
    const stakingCashValue = stakingRewardCoins * intermediatePrice;
    cashFlows.push(stakingCashValue);
  }
  
  // Final sale of all accumulated coins
  const finalValue = totalCoins * expectedPrice;
  cashFlows.push(finalValue);
  
  return cashFlows;
};

export const adjustDiscountRateForFed = (
  baseRate: number,
  fedRateChange: number,
  cryptoSensitivity: number = 2.0, // Crypto sensitivity multiplier
  basketMultiplier: number = 1.0 // Basket-specific adjustment
): number => {
  // Proportional adjustment based on Fed change magnitude
  const baseAdjustment = fedRateChange * cryptoSensitivity * 0.01;
  const basketAdjustment = baseAdjustment * basketMultiplier;
  
  if (fedRateChange < 0) {
    // Rate cuts: Lower discount rate but maintain floor
    return Math.max(0.005, baseRate + basketAdjustment); // basketAdjustment is negative
  } else if (fedRateChange > 0) {
    // Rate hikes: Increase discount rate proportionally
    return Math.min(0.50, baseRate + basketAdjustment); // Add ceiling
  }
  return baseRate;
};

// Basket allocation rules interface
interface BasketAllocationRules {
  bitcoin: { min: number; max: number; recommended: [number, number] };
  blueChip: { min: number; max: number; recommended: [number, number] };
  smallCap: { min: number; max: number; recommended: [number, number] };
}

const BASKET_RULES: BasketAllocationRules = {
  bitcoin: { min: 60, max: 80, recommended: [60, 75] },
  blueChip: { min: 0, max: 40, recommended: [20, 35] },
  smallCap: { min: 0, max: 15, recommended: [5, 10] }
};

// Enhanced allocation result
interface AllocationResult {
  portfolioPercentage: number;
  basketType: 'bitcoin' | 'blueChip' | 'smallCap';
  status: 'underexposed' | 'optimal' | 'overexposed';
  recommendation: 'increase' | 'decrease' | 'maintain';
  message: string;
  targetRange: [number, number];
}

export const checkAdvancedAllocation = (
  investmentAmount: number,
  totalPortfolio: number,
  coinBasket: 'Bitcoin' | 'Blue Chip' | 'Small-Cap',
  currentPortfolioBreakdown?: { bitcoin: number; blueChip: number; smallCap: number }
): AllocationResult => {
  const portfolioPercentage = (investmentAmount / totalPortfolio) * 100;
  
  // Map basket types
  const basketType = coinBasket === 'Bitcoin' ? 'bitcoin' : 
                    coinBasket === 'Blue Chip' ? 'blueChip' : 'smallCap';
  
  const rules = BASKET_RULES[basketType];
  
  // Determine status
  let status: 'underexposed' | 'optimal' | 'overexposed';
  let recommendation: 'increase' | 'decrease' | 'maintain';
  let message: string;
  
  if (portfolioPercentage < rules.min) {
    status = 'underexposed';
    recommendation = 'increase';
    message = `${coinBasket} allocation (${portfolioPercentage.toFixed(1)}%) below minimum ${rules.min}%`;
  } else if (portfolioPercentage > rules.max) {
    status = 'overexposed';
    recommendation = 'decrease';
    message = `${coinBasket} allocation (${portfolioPercentage.toFixed(1)}%) exceeds maximum ${rules.max}%`;
  } else {
    status = 'optimal';
    recommendation = 'maintain';
    message = `${coinBasket} allocation (${portfolioPercentage.toFixed(1)}%) within acceptable range`;
  }
  
  return {
    portfolioPercentage,
    basketType,
    status,
    recommendation,
    message,
    targetRange: rules.recommended
  };
};

// Legacy function for backward compatibility
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

// Calculate Sharpe Ratio
export const calculateSharpeRatio = (
  portfolioReturn: number,
  riskFreeRate: number,
  standardDeviation: number
): number => {
  if (standardDeviation === 0) return 0;
  return (portfolioReturn - riskFreeRate) / standardDeviation;
};

// Calculate portfolio Beta (systematic risk)
export const calculateBeta = (
  portfolioReturns: number[],
  marketReturns: number[]
): number => {
  if (portfolioReturns.length !== marketReturns.length || portfolioReturns.length < 2) {
    return 1; // Default beta
  }

  const portfolioMean = portfolioReturns.reduce((sum, ret) => sum + ret, 0) / portfolioReturns.length;
  const marketMean = marketReturns.reduce((sum, ret) => sum + ret, 0) / marketReturns.length;

  let covariance = 0;
  let marketVariance = 0;

  for (let i = 0; i < portfolioReturns.length; i++) {
    const portfolioDeviation = portfolioReturns[i] - portfolioMean;
    const marketDeviation = marketReturns[i] - marketMean;
    
    covariance += portfolioDeviation * marketDeviation;
    marketVariance += Math.pow(marketDeviation, 2);
  }

  covariance /= portfolioReturns.length - 1;
  marketVariance /= marketReturns.length - 1;

  return marketVariance !== 0 ? covariance / marketVariance : 1;
};

// Calculate Value at Risk (VaR)
export const calculateVaR = (
  portfolioValue: number,
  returns: number[],
  confidenceLevel: number = 0.95
): number => {
  if (returns.length === 0) return 0;

  const sortedReturns = returns.sort((a, b) => a - b);
  const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);
  const varReturn = sortedReturns[index] || 0;
  
  return portfolioValue * Math.abs(varReturn / 100);
};

// Enhanced NPV with risk adjustment
export const calculateRiskAdjustedNPV = (
  cashFlows: number[],
  riskFreeRate: number,
  riskPremium: number,
  beta: number = 1
): number => {
  const discountRate = riskFreeRate + (beta * riskPremium);
  return calculateNPV(cashFlows, discountRate);
};

// Calculate Expected Portfolio Return using CAPM
export const calculateExpectedReturn = (
  riskFreeRate: number,
  marketReturn: number,
  beta: number
): number => {
  return riskFreeRate + beta * (marketReturn - riskFreeRate);
};

// =============================================================================
// PHASE 1 ADDITIONS: STANDARD DEVIATION AND ENHANCED FUNCTIONS
// =============================================================================

// Calculate standard deviation from array of values
export const calculateStandardDeviation = (values: number[]): number => {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDifferences.reduce((sum, sq) => sum + sq, 0) / (values.length - 1);
  
  return Math.sqrt(variance);
};

// Calculate annualized volatility from price data
export const calculateAnnualizedVolatility = (
  prices: number[],
  periodsPerYear: number = 365
): number => {
  if (prices.length < 2) return 0;
  
  // Calculate daily returns
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  
  const dailyStdDev = calculateStandardDeviation(returns);
  return dailyStdDev * Math.sqrt(periodsPerYear) * 100; // Convert to percentage
};

// Portfolio validation function
export const validatePortfolioAllocation = (
  portfolioBreakdown: { bitcoin: number; blueChip: number; smallCap: number }
): {
  isValid: boolean;
  totalAllocation: number;
  violations: string[];
  recommendations: string[];
} => {
  const { bitcoin, blueChip, smallCap } = portfolioBreakdown;
  const totalAllocation = bitcoin + blueChip + smallCap;
  const violations: string[] = [];
  const recommendations: string[] = [];
  
  // Check individual basket limits
  if (bitcoin < BASKET_RULES.bitcoin.min) {
    violations.push(`Bitcoin below minimum ${BASKET_RULES.bitcoin.min}%`);
    recommendations.push(`Increase Bitcoin to at least ${BASKET_RULES.bitcoin.min}%`);
  }
  
  if (blueChip > BASKET_RULES.blueChip.max) {
    violations.push(`Blue-chip exceeds maximum ${BASKET_RULES.blueChip.max}%`);
    recommendations.push(`Reduce blue-chip to below ${BASKET_RULES.blueChip.max}%`);
  }
  
  if (smallCap > BASKET_RULES.smallCap.max) {
    violations.push(`Small-cap exceeds maximum ${BASKET_RULES.smallCap.max}%`);
    recommendations.push(`Reduce small-cap to below ${BASKET_RULES.smallCap.max}%`);
  }
  
  // Check total allocation
  if (Math.abs(totalAllocation - 100) > 1) {
    violations.push(`Total allocation ${totalAllocation.toFixed(1)}% ≠ 100%`);
  }
  
  return {
    isValid: violations.length === 0,
    totalAllocation,
    violations,
    recommendations
  };
};

// Enhanced risk factor calculation with beta integration
export const calculateEnhancedRiskFactor = (
  basket: string,
  volatility: number,
  fundamentalsScore: number,
  beta: number,
  avivRatio?: number,
  activeSupply?: number,
  vaultedSupply?: number,
  fedRateChange?: number,
  smartMoneyActivity?: boolean
): number => {
  let riskScore = 0;
  
  // Beta component (40% of risk score) - systematic risk
  const betaRisk = Math.max(0, (beta - 1) * 20); // Beta > 1 increases risk
  riskScore += betaRisk * 0.4;
  
  // Volatility component (30% of risk score) - idiosyncratic risk  
  const volatilityRisk = Math.max(0, (volatility - 30) * 0.8);
  riskScore += volatilityRisk * 0.3;
  
  // Basket base risk (20% of risk score)
  const basketRisk = {
    'Bitcoin': 10,
    'Blue Chip': 20,
    'Small-Cap': 40
  }[basket] || 25;
  riskScore += basketRisk * 0.2;
  
  // Fundamentals adjustment (10% of risk score)
  const fundamentalsRisk = fundamentalsScore ? 
    Math.max(0, (8 - fundamentalsScore) * 3) : 15;
  riskScore += fundamentalsRisk * 0.1;
  
  // Market condition adjustments
  if (avivRatio && avivRatio > 2.5) riskScore += 5; // Bitcoin bearish
  if (smartMoneyActivity) riskScore += 5; // Smart money selling
  if (fedRateChange && fedRateChange > 0) riskScore += 3; // Rate hikes
  
  // Convert to 1-5 scale
  return Math.max(1, Math.min(5, Math.round(riskScore / 20)));
};

// Helper function for beta estimation
export const getEstimatedBeta = (coinId: string, basket?: string): number => {
  const betaEstimates: Record<string, number> = {
    'BTC': 1.0,
    'ETH': 1.4,
    'SOL': 1.6,
    'ADA': 1.3,
    'DOT': 1.3,
    'LINK': 1.4,
    'AVAX': 1.6,
    'MATIC': 1.5,
    'ATOM': 1.4,
    'ALGO': 1.2
  };
  
  return betaEstimates[coinId] || {
    'Bitcoin': 1.0,
    'Blue Chip': 1.5,
    'Small-Cap': 2.5
  }[basket || 'Blue Chip'] || 1.8;
};

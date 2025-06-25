
// Financial calculation utilities based on the specified formulas

export const calculateNPV = (cashFlows: number[], discountRate: number): number => {
  return cashFlows.reduce((npv, cashFlow, period) => {
    return npv + cashFlow / Math.pow(1 + discountRate, period);
  }, 0);
};

export const calculateIRR = (cashFlows: number[], maxIterations = 100, precision = 0.0001): number => {
  // Newton-Raphson method for IRR calculation
  let rate = 0.1; // Initial guess of 10%
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;
    
    for (let t = 0; t < cashFlows.length; t++) {
      npv += cashFlows[t] / Math.pow(1 + rate, t);
      dnpv -= t * cashFlows[t] / Math.pow(1 + rate, t + 1);
    }
    
    if (Math.abs(npv) < precision) {
      return rate * 100; // Return as percentage
    }
    
    if (dnpv === 0) break;
    rate = rate - npv / dnpv;
    
    if (rate < -0.99) rate = -0.99; // Prevent extreme negative rates
  }
  
  return rate * 100; // Return as percentage
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
  marketConditions?: string
): number => {
  let baseScore: number;
  
  switch (basket) {
    case 'Bitcoin':
      baseScore = 3;
      if (avivRatio && avivRatio > 2.5) baseScore += 1;
      if (avivRatio && avivRatio < 0.55) baseScore -= 1;
      break;
    case 'Blue Chip':
      baseScore = 4;
      if (fundamentalsScore && fundamentalsScore > 8) baseScore -= 1;
      break;
    case 'Small-Cap':
      baseScore = 5;
      if (fundamentalsScore && fundamentalsScore > 9) baseScore -= 1;
      break;
    default:
      baseScore = 3;
  }
  
  // Adjust for volatility
  if (volatility > 80) baseScore += 1;
  else if (volatility < 30) baseScore -= 1;
  
  return Math.max(1, Math.min(5, Math.round(baseScore)));
};

export const generateCashFlows = (
  investmentAmount: number,
  expectedPrice: number,
  currentPrice: number,
  investmentHorizon: number,
  stakingYield = 0
): number[] => {
  const cashFlows = [-investmentAmount]; // Initial investment (negative)
  
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

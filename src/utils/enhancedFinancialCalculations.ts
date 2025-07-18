import type { EnhancedCoinData, CointimeMetrics } from '@/services/enhancedInvestmentDataService';

// Enhanced NPV calculation using Glass Node on-chain data
export const calculateEnhancedNPV = (
  initialInvestment: number,
  enhancedCoinData: EnhancedCoinData,
  investmentHorizon: number,
  discountRate: number
): { npv: number; projectedValues: number[]; confidenceScore: number } => {
  
  const { liveMetrics, onChainData, technicalIndicators, priceHistory } = enhancedCoinData;
  
  // Generate more sophisticated cash flows using Glass Node data
  const cashFlows = generateEnhancedCashFlows(
    initialInvestment,
    enhancedCoinData,
    investmentHorizon
  );
  
  // Calculate risk-adjusted discount rate using on-chain metrics
  const riskAdjustedRate = calculateRiskAdjustedDiscountRate(
    discountRate,
    liveMetrics,
    technicalIndicators
  );
  
  // Standard NPV calculation with enhanced cash flows
  const npv = cashFlows.reduce((total, cashFlow, period) => {
    return total + cashFlow / Math.pow(1 + riskAdjustedRate, period);
  }, 0);
  
  // Calculate confidence score based on data quality
  const confidenceScore = calculateConfidenceScore(enhancedCoinData);
  
  return {
    npv,
    projectedValues: cashFlows,
    confidenceScore
  };
};

// Enhanced CAGR calculation using historical Glass Node data
export const calculateEnhancedCAGR = (
  enhancedCoinData: EnhancedCoinData,
  customPeriodYears?: number
): { cagr: number; volatilityAdjustedCAGR: number; onChainGrowthRate: number } => {
  
  const { priceHistory, onChainData, liveMetrics } = enhancedCoinData;
  
  // Use actual price history from Glass Node
  const dailyPrices = priceHistory.daily;
  if (dailyPrices.length < 2) {
    return { cagr: 0, volatilityAdjustedCAGR: 0, onChainGrowthRate: 0 };
  }
  
  const periods = customPeriodYears || (dailyPrices.length / 365);
  const beginningPrice = dailyPrices[0].price;
  const endingPrice = dailyPrices[dailyPrices.length - 1].price;
  
  // Standard CAGR
  const cagr = (Math.pow(endingPrice / beginningPrice, 1 / periods) - 1) * 100;
  
  // Volatility-adjusted CAGR (Sharpe-like adjustment)
  const volatility = priceHistory.volatility90d;
  const volatilityAdjustedCAGR = cagr - (volatility * 0.1); // Risk penalty
  
  // On-chain growth rate (network effect consideration)
  const onChainGrowthRate = onChainData.networkGrowth;
  
  return {
    cagr,
    volatilityAdjustedCAGR,
    onChainGrowthRate
  };
};

// Enhanced IRR calculation with staking and network rewards
export const calculateEnhancedIRR = (
  enhancedCoinData: EnhancedCoinData,
  initialInvestment: number,
  investmentHorizon: number
): { irr: number; stakingAdjustedIRR: number; networkEffectIRR: number } => {
  
  // Generate cash flows including staking rewards and network effects
  const enhancedCashFlows = generateEnhancedCashFlows(
    initialInvestment,
    enhancedCoinData,
    investmentHorizon
  );
  
  // Standard IRR calculation
  const irr = calculateIRR(enhancedCashFlows);
  
  // Calculate staking-adjusted IRR
  const stakingYield = enhancedCoinData.staking_yield || 0;
  const stakingAdjustedIRR = irr + stakingYield;
  
  // Calculate network effect IRR (considering on-chain growth)
  const networkGrowthBonus = enhancedCoinData.onChainData.networkGrowth * 0.1;
  const networkEffectIRR = stakingAdjustedIRR + networkGrowthBonus;
  
  return {
    irr,
    stakingAdjustedIRR,
    networkEffectIRR
  };
};

// Enhanced Beta calculation using market correlation and on-chain data
export const calculateEnhancedBeta = (
  enhancedCoinData: EnhancedCoinData,
  marketReturns: number[]
): { traditionalBeta: number; onChainBeta: number; adjustedBeta: number } => {
  
  const { priceHistory, onChainData, liveMetrics } = enhancedCoinData;
  
  // Calculate returns from price history
  const assetReturns = priceHistory.daily.slice(1).map((day, index) => {
    const previousPrice = priceHistory.daily[index].price;
    return (day.price - previousPrice) / previousPrice;
  });
  
  if (assetReturns.length !== marketReturns.length || assetReturns.length < 30) {
    return { traditionalBeta: 1, onChainBeta: 1, adjustedBeta: 1 };
  }
  
  // Traditional Beta calculation
  const traditionalBeta = calculateBeta(assetReturns, marketReturns);
  
  // On-chain Beta (considering network fundamentals)
  const networkStability = calculateNetworkStability(liveMetrics, onChainData);
  const onChainBeta = traditionalBeta * (1 - networkStability * 0.2); // Reduce beta if network is stable
  
  // Adjusted Beta (weighted average of traditional and on-chain)
  const adjustedBeta = (traditionalBeta * 0.7) + (onChainBeta * 0.3);
  
  return {
    traditionalBeta,
    onChainBeta,
    adjustedBeta
  };
};

// Enhanced risk calculation using Cointime Economics
export const calculateEnhancedRiskFactor = (
  enhancedCoinData: EnhancedCoinData,
  marketConditions: any
): { 
  overallRisk: number;
  liquidityRisk: number;
  technicalRisk: number;
  fundamentalRisk: number;
  cointimeRisk: number;
} => {
  
  const { liveMetrics, technicalIndicators, onChainData, priceHistory } = enhancedCoinData;
  
  // Liquidity risk (based on transaction volume and active addresses)
  const liquidityRisk = calculateLiquidityRisk(onChainData);
  
  // Technical risk (based on technical indicators)
  const technicalRisk = calculateTechnicalRisk(technicalIndicators);
  
  // Fundamental risk (based on network fundamentals)
  const fundamentalRisk = calculateFundamentalRisk(onChainData, priceHistory);
  
  // Cointime risk (based on AVIV ratio and supply dynamics)
  const cointimeRisk = calculateCointimeRisk(liveMetrics);
  
  // Overall risk (weighted combination)
  const overallRisk = (
    liquidityRisk * 0.25 +
    technicalRisk * 0.25 +
    fundamentalRisk * 0.25 +
    cointimeRisk * 0.25
  );
  
  return {
    overallRisk,
    liquidityRisk,
    technicalRisk,
    fundamentalRisk,
    cointimeRisk
  };
};

// Helper functions

function generateEnhancedCashFlows(
  initialInvestment: number,
  enhancedCoinData: EnhancedCoinData,
  horizon: number
): number[] {
  const { current_price, liveMetrics, onChainData, technicalIndicators } = enhancedCoinData;
  
  const cashFlows = [-initialInvestment]; // Initial investment (negative)
  
  for (let year = 1; year <= horizon; year++) {
    // Base price projection using multiple factors
    const baseGrowthRate = calculateBaseGrowthRate(enhancedCoinData);
    const networkEffectMultiplier = 1 + (onChainData.networkGrowth / 100) * 0.1;
    const cointimeMultiplier = calculateCointimeMultiplier(liveMetrics);
    const technicalMultiplier = calculateTechnicalMultiplier(technicalIndicators);
    
    // Combined growth rate
    const combinedGrowthRate = baseGrowthRate * networkEffectMultiplier * cointimeMultiplier * technicalMultiplier;
    
    // Project future price
    const futurePrice = current_price * Math.pow(1 + combinedGrowthRate, year);
    
    // Calculate position value
    const shares = initialInvestment / current_price;
    const positionValue = shares * futurePrice;
    
    // Add staking rewards if applicable
    const stakingRewards = enhancedCoinData.staking_yield ? 
      positionValue * (enhancedCoinData.staking_yield / 100) : 0;
    
    // Final year includes sale proceeds
    if (year === horizon) {
      cashFlows.push(positionValue + stakingRewards);
    } else {
      cashFlows.push(stakingRewards); // Only staking rewards in intermediate years
    }
  }
  
  return cashFlows;
}

function calculateRiskAdjustedDiscountRate(
  baseRate: number,
  metrics: CointimeMetrics,
  indicators: any
): number {
  // Risk adjustments based on Glass Node metrics
  let riskAdjustment = 0;
  
  // AVIV ratio risk adjustment
  if (metrics.avivRatio > 2.5) {
    riskAdjustment += 0.02; // Increase discount rate for overvalued assets
  } else if (metrics.avivRatio < 0.55) {
    riskAdjustment -= 0.01; // Decrease for undervalued assets
  }
  
  // Vaulted supply risk adjustment
  if (metrics.vaultedSupply > 70) {
    riskAdjustment -= 0.005; // Lower risk for high vaulted supply
  }
  
  // Technical indicator adjustments
  if (indicators.sopr > 1.1) {
    riskAdjustment += 0.01; // Higher risk when profit-taking is high
  }
  
  return Math.max(0.01, baseRate + riskAdjustment);
}

function calculateConfidenceScore(coinData: EnhancedCoinData): number {
  let score = 100;
  
  // Reduce score based on data availability and quality
  if (!coinData.liveMetrics.avivRatio || coinData.liveMetrics.avivRatio === 1.0) score -= 20;
  if (!coinData.onChainData.transactionVolume) score -= 15;
  if (coinData.priceHistory.daily.length < 30) score -= 25;
  if (!coinData.technicalIndicators.nvtRatio) score -= 10;
  
  return Math.max(0, Math.min(100, score));
}

function calculateBaseGrowthRate(coinData: EnhancedCoinData): number {
  // Combine multiple growth indicators
  const cagrGrowth = (coinData.cagr_36m || 20) / 100;
  const onChainGrowth = coinData.onChainData.networkGrowth / 100;
  const fundamentalScore = (coinData.fundamentals_score || 5) / 10;
  
  return (cagrGrowth * 0.5) + (onChainGrowth * 0.3) + (fundamentalScore * 0.2);
}

function calculateCointimeMultiplier(metrics: CointimeMetrics): number {
  // Favorable Cointime conditions boost growth
  let multiplier = 1.0;
  
  if (metrics.avivRatio < 0.8) multiplier += 0.1; // Undervalued boost
  if (metrics.vaultedSupply > 60) multiplier += 0.05; // Strong hands boost
  if (metrics.liveliness < 0.4) multiplier += 0.05; // Low velocity boost
  
  return Math.min(1.3, multiplier); // Cap at 30% boost
}

function calculateTechnicalMultiplier(indicators: any): number {
  let multiplier = 1.0;
  
  if (indicators.puellMultiple < 0.5) multiplier += 0.1; // Mining profitable
  if (indicators.sopr < 1.05) multiplier += 0.05; // Limited profit-taking
  if (indicators.nvtRatio < 50) multiplier += 0.05; // Reasonable valuation
  
  return Math.min(1.2, multiplier); // Cap at 20% boost
}

function calculateBeta(assetReturns: number[], marketReturns: number[]): number {
  const n = Math.min(assetReturns.length, marketReturns.length);
  
  const assetMean = assetReturns.slice(0, n).reduce((sum, ret) => sum + ret, 0) / n;
  const marketMean = marketReturns.slice(0, n).reduce((sum, ret) => sum + ret, 0) / n;
  
  let covariance = 0;
  let marketVariance = 0;
  
  for (let i = 0; i < n; i++) {
    const assetDev = assetReturns[i] - assetMean;
    const marketDev = marketReturns[i] - marketMean;
    
    covariance += assetDev * marketDev;
    marketVariance += marketDev * marketDev;
  }
  
  return marketVariance !== 0 ? covariance / marketVariance : 1;
}

function calculateNetworkStability(metrics: CointimeMetrics, onChainData: any): number {
  // Network stability score (0-1, higher is more stable)
  let stability = 0.5;
  
  if (metrics.vaultedSupply > 60) stability += 0.2;
  if (onChainData.networkGrowth > 0 && onChainData.networkGrowth < 20) stability += 0.1;
  if (metrics.liveliness < 0.5) stability += 0.1;
  
  return Math.min(1, stability);
}

function calculateLiquidityRisk(onChainData: any): number {
  // Higher transaction volume = lower liquidity risk
  const volumeScore = Math.min(100, onChainData.transactionVolume / 1000000); // Normalize
  return Math.max(0, 100 - volumeScore);
}

function calculateTechnicalRisk(indicators: any): number {
  let riskScore = 50; // Base risk
  
  if (indicators.nvtRatio > 100) riskScore += 20;
  if (indicators.puellMultiple > 3) riskScore += 15;
  if (indicators.sopr > 1.2) riskScore += 10;
  
  return Math.min(100, riskScore);
}

function calculateFundamentalRisk(onChainData: any, priceHistory: any): number {
  let riskScore = 50;
  
  if (onChainData.networkGrowth < 0) riskScore += 20;
  if (priceHistory.volatility90d > 80) riskScore += 15;
  if (onChainData.activeAddresses < 100000) riskScore += 10;
  
  return Math.min(100, riskScore);
}

function calculateCointimeRisk(metrics: CointimeMetrics): number {
  let riskScore = 50;
  
  if (metrics.avivRatio > 2.5) riskScore += 25; // Overvalued
  if (metrics.activeSupply > 70) riskScore += 15; // High activity risk
  if (metrics.liveliness > 0.8) riskScore += 10; // High velocity risk
  
  return Math.min(100, riskScore);
}

// Standard IRR calculation (kept for compatibility)
function calculateIRR(cashFlows: number[], maxIterations = 100, precision = 0.0001): number {
  let rate = 0.1;
  
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
}
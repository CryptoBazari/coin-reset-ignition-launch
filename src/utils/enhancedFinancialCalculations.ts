
import type { EnhancedCoinData, MarketConditions } from '@/types/investment';

export const calculateEnhancedNPV = (
  investmentAmount: number,
  coinData: EnhancedCoinData,
  horizon: number,
  discountRate: number
): { npv: number; projectedValues: number[]; confidenceScore: number } => {
  const projectedValues: number[] = [];
  const currentPrice = coinData.current_price;
  
  // Enhanced growth rate using Glass Node data
  let baseGrowthRate = (coinData.cagr_36m || 20) / 100;
  
  // Adjust growth based on on-chain metrics
  if (coinData.onChainData.networkGrowth > 0) {
    baseGrowthRate *= (1 + coinData.onChainData.networkGrowth / 100);
  }
  
  // AVIV ratio adjustment
  if (coinData.liveMetrics.avivRatio < 1.0) {
    baseGrowthRate *= 1.2; // Undervalued asset potential
  } else if (coinData.liveMetrics.avivRatio > 2.0) {
    baseGrowthRate *= 0.8; // Overvalued adjustment
  }
  
  // Calculate projected values
  for (let year = 1; year <= horizon; year++) {
    const projectedPrice = currentPrice * Math.pow(1 + baseGrowthRate, year);
    const coinQuantity = investmentAmount / currentPrice;
    projectedValues.push(coinQuantity * projectedPrice);
  }
  
  // Calculate NPV
  let npv = -investmentAmount;
  for (let i = 0; i < projectedValues.length; i++) {
    npv += projectedValues[i] / Math.pow(1 + discountRate, i + 1);
  }
  
  // Calculate confidence score based on data quality
  let confidenceScore = 50; // Base confidence
  
  if (coinData.liveMetrics.avivRatio !== 1.0) confidenceScore += 15;
  if (coinData.onChainData.activeAddresses > 0) confidenceScore += 15;
  if (coinData.technicalIndicators.sopr !== 1) confidenceScore += 10;
  if (coinData.priceHistory.daily.length > 30) confidenceScore += 10;
  
  confidenceScore = Math.min(95, confidenceScore);
  
  return { npv, projectedValues, confidenceScore };
};

export const calculateEnhancedCAGR = (
  coinData: EnhancedCoinData
): { cagr: number; volatilityAdjustedCAGR: number; onChainGrowthRate: number } => {
  const baseCagr = coinData.cagr_36m || 20;
  const volatility = coinData.priceHistory.volatility30d || 50;
  const onChainGrowthRate = coinData.onChainData.networkGrowth || 0;
  
  // Volatility-adjusted CAGR (Sharpe-like adjustment)
  const volatilityAdjustedCAGR = baseCagr * (1 - volatility / 200);
  
  return {
    cagr: baseCagr,
    volatilityAdjustedCAGR,
    onChainGrowthRate
  };
};

export const calculateEnhancedIRR = (
  coinData: EnhancedCoinData,
  investmentAmount: number,
  horizon: number
): { irr: number; stakingAdjustedIRR: number; networkEffectIRR: number } => {
  const baseIrr = (coinData.cagr_36m || 20);
  const stakingYield = coinData.staking_yield || 0;
  
  // Network effect adjustment based on active addresses growth
  let networkEffectMultiplier = 1;
  if (coinData.onChainData.networkGrowth > 10) {
    networkEffectMultiplier = 1.15; // Strong network growth
  } else if (coinData.onChainData.networkGrowth < 0) {
    networkEffectMultiplier = 0.85; // Declining network
  }
  
  const stakingAdjustedIRR = baseIrr + stakingYield;
  const networkEffectIRR = stakingAdjustedIRR * networkEffectMultiplier;
  
  return {
    irr: baseIrr,
    stakingAdjustedIRR,
    networkEffectIRR
  };
};

export const calculateEnhancedBeta = (
  coinData: EnhancedCoinData,
  marketReturns: number[]
): { traditionalBeta: number; onChainBeta: number; adjustedBeta: number } => {
  const traditionalBeta = coinData.beta || 1.0;
  
  // Calculate on-chain beta based on supply dynamics
  let onChainBeta = traditionalBeta;
  
  // Lower beta if supply is more vaulted (less reactive to market)
  if (coinData.liveMetrics.vaultedSupply > 70) {
    onChainBeta *= 0.8;
  } else if (coinData.liveMetrics.activeSupply > 80) {
    onChainBeta *= 1.2; // More reactive if highly active
  }
  
  // Adjust for network growth stability
  if (Math.abs(coinData.onChainData.networkGrowth) < 5) {
    onChainBeta *= 0.9; // More stable network = lower beta
  }
  
  // Final adjusted beta combining traditional and on-chain metrics
  const adjustedBeta = (traditionalBeta * 0.6) + (onChainBeta * 0.4);
  
  return {
    traditionalBeta,
    onChainBeta,
    adjustedBeta
  };
};

export const calculateEnhancedRiskFactor = (
  coinData: EnhancedCoinData,
  marketConditions: MarketConditions
): {
  overallRisk: number;
  liquidityRisk: number;
  technicalRisk: number;
  fundamentalRisk: number;
  cointimeRisk: number;
} => {
  // Base volatility risk
  const baseVolatility = coinData.priceHistory.volatility30d || 50;
  
  // Liquidity risk based on active supply
  let liquidityRisk = 40; // Base liquidity risk
  if (coinData.liveMetrics.activeSupply > 80) {
    liquidityRisk = 70; // High active supply = higher liquidity risk
  } else if (coinData.liveMetrics.vaultedSupply > 75) {
    liquidityRisk = 25; // High vaulted supply = lower liquidity risk
  }
  
  // Technical risk based on indicators
  let technicalRisk = 50;
  if (coinData.technicalIndicators.sopr > 1.2) {
    technicalRisk = 75; // High profit-taking
  } else if (coinData.technicalIndicators.sopr < 0.95) {
    technicalRisk = 30; // Accumulation phase
  }
  
  // Fundamental risk based on network health
  let fundamentalRisk = 50;
  if (coinData.onChainData.networkGrowth < -10) {
    fundamentalRisk = 80; // Declining network
  } else if (coinData.onChainData.networkGrowth > 15) {
    fundamentalRisk = 25; // Strong growth
  }
  
  // Cointime risk based on AVIV ratio
  let cointimeRisk = 50;
  if (coinData.liveMetrics.avivRatio > 2.5) {
    cointimeRisk = 85; // Significantly overvalued
  } else if (coinData.liveMetrics.avivRatio < 0.6) {
    cointimeRisk = 20; // Undervalued opportunity
  }
  
  // Market condition adjustment
  let marketAdjustment = 1;
  if (marketConditions.bitcoinState === 'bearish') {
    marketAdjustment = 1.2;
  } else if (marketConditions.bitcoinState === 'bullish') {
    marketAdjustment = 0.9;
  }
  
  // Calculate overall risk
  const overallRisk = Math.min(100, (
    (baseVolatility * 0.3) +
    (liquidityRisk * 0.2) +
    (technicalRisk * 0.2) +
    (fundamentalRisk * 0.15) +
    (cointimeRisk * 0.15)
  ) * marketAdjustment);
  
  return {
    overallRisk,
    liquidityRisk,
    technicalRisk,
    fundamentalRisk,
    cointimeRisk
  };
};

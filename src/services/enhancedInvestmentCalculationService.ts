// =============================================================================
// PHASE 3: ENHANCED INVESTMENT CALCULATION SERVICE
// Integrates REAL beta calculation service with investment analysis
// =============================================================================

import { 
  calculateNPV, 
  calculateIRR, 
  calculateCAGR, 
  calculateROI, 
  generateCashFlows,
  adjustDiscountRateForFed,
  checkAdvancedAllocation,
  calculateEnhancedRiskFactor,
  calculateSharpeRatio,
  calculateRiskAdjustedNPV,
  calculateExpectedReturn,
  validateCashFlows
} from '@/utils/financialCalculations';
import { realBetaCalculationService, RealBetaResult } from '@/services/realBetaCalculationService';
import type { CoinData, InvestmentInputs, FinancialMetrics, MarketConditions } from '@/types/investment';

// Enhanced financial metrics with REAL beta analysis
export interface EnhancedFinancialMetrics extends FinancialMetrics {
  betaAnalysis: RealBetaResult;
  volatilityBreakdown: {
    systematic: number;    // Beta * market volatility
    idiosyncratic: number; // Asset-specific volatility
    total: number;         // Total volatility
  };
  riskDecomposition: {
    marketRisk: number;     // Beta-driven risk
    specificRisk: number;   // Asset-specific risk
    totalRisk: number;      // Combined risk score
  };
}

export const calculateEnhancedFinancialMetrics = async (
  inputs: InvestmentInputs,
  coinData: CoinData,
  expectedPrice: number,
  adjustedDiscountRate: number,
  marketConditions: MarketConditions
): Promise<EnhancedFinancialMetrics> => {
  // Get REAL enhanced beta analysis using Glass Node data
  console.log('📊 Calculating REAL beta with Glass Node API data...');
  const betaAnalysis = await realBetaCalculationService.calculateRealBeta(inputs.coinId);
  console.log(`📈 Real Beta Result: ${betaAnalysis.beta.toFixed(3)} (${betaAnalysis.confidence}, ${betaAnalysis.source})`);
  
  // Generate cash flows using corrected function
  const cashFlows = generateCashFlows(
    inputs.investmentAmount,
    expectedPrice,
    coinData.current_price,
    inputs.investmentHorizon || 2,
    inputs.stakingYield || coinData.staking_yield || 0
  );

  // Validate cash flows
  if (!validateCashFlows(cashFlows)) {
    throw new Error('Invalid cash flows generated');
  }

  // Calculate core financial metrics
  const npv = calculateNPV(cashFlows, adjustedDiscountRate);
  const irr = calculateIRR(cashFlows);
  
  // Separate price CAGR from total return CAGR
  const priceCAGR = calculateCAGR(
    coinData.current_price,
    expectedPrice,
    inputs.investmentHorizon || 2
  );
  
  const totalReturnCAGR = calculateCAGR(
    inputs.investmentAmount,
    cashFlows[cashFlows.length - 1],
    inputs.investmentHorizon || 2
  );
  
  // Separate price ROI from total ROI
  const coinQuantity = inputs.investmentAmount / coinData.current_price;
  const priceROI = calculateROI(inputs.investmentAmount, coinQuantity * expectedPrice);
  const totalROI = calculateROI(inputs.investmentAmount, cashFlows[cashFlows.length - 1]);
  const stakingROI = totalROI - priceROI;
  
  // Use REAL beta from Glass Node analysis
  const beta = betaAnalysis.beta;
  
  // Calculate risk-adjusted metrics with REAL beta
  const riskFreeRate = 0.045; // 4.5% Treasury rate
  const marketRiskPremium = 0.15; // 15% crypto market premium
  const riskAdjustedNPV = calculateRiskAdjustedNPV(
    cashFlows,
    riskFreeRate,
    marketRiskPremium,
    beta
  );
  
  // Calculate expected return using CAPM with REAL beta
  const expectedReturn = calculateExpectedReturn(
    riskFreeRate,
    0.25, // 25% crypto market return
    beta
  );
  
  // Enhanced volatility breakdown with REAL beta
  const marketVolatility = 50; // Crypto market baseline volatility
  const assetVolatility = coinData.volatility || 50;
  
  const volatilityBreakdown = {
    systematic: beta * marketVolatility,
    idiosyncratic: Math.sqrt(Math.max(0, Math.pow(assetVolatility, 2) - Math.pow(beta * marketVolatility, 2))),
    total: assetVolatility
  };
  
  // Risk decomposition with REAL beta
  const riskDecomposition = {
    marketRisk: Math.min(5, Math.max(1, beta * 2)), // Market-driven risk (1-5 scale)
    specificRisk: Math.min(3, Math.max(0, (assetVolatility - marketVolatility) / 20)), // Asset-specific risk
    totalRisk: 0 // Will be calculated below
  };
  riskDecomposition.totalRisk = Math.min(5, riskDecomposition.marketRisk + riskDecomposition.specificRisk);
  
  // Calculate Sharpe ratio with enhanced data
  const sharpeRatio = calculateSharpeRatio(totalReturnCAGR, riskFreeRate * 100, assetVolatility);
  
  // Calculate enhanced risk factor with REAL beta
  const riskFactor = calculateEnhancedRiskFactor(
    coinData.basket,
    assetVolatility,
    coinData.fundamentals_score || 5,
    beta,
    coinData.aviv_ratio,
    coinData.active_supply,
    coinData.vaulted_supply,
    marketConditions.fedRateChange,
    marketConditions.smartMoneyActivity
  );

  console.log('✅ Enhanced financial metrics calculated with REAL Glass Node beta');
  console.log(`📊 Beta Impact: Systematic Risk ${riskDecomposition.marketRisk}/5, Total Risk ${riskDecomposition.totalRisk}/5`);

  return { 
    // Core metrics
    npv, 
    irr, 
    cagr: priceCAGR,              // Price appreciation only
    totalReturnCAGR,              // Total return including staking
    roi: totalROI,                // Total ROI
    priceROI,                     // Price appreciation ROI
    stakingROI,                   // Staking contribution ROI
    riskFactor,
    
    // Risk metrics with REAL beta
    beta,
    standardDeviation: assetVolatility,
    sharpeRatio,
    
    // Enhanced metrics
    riskAdjustedNPV,
    expectedReturn,
    
    // Confidence indicators - now REAL
    betaConfidence: betaAnalysis.confidence,
    dataQuality: betaAnalysis.source,
    
    // Enhanced analysis with REAL data
    betaAnalysis,
    volatilityBreakdown,
    riskDecomposition
  };
};

// Enhanced allocation with REAL beta consideration
export interface EnhancedAllocationResult {
  allocation: ReturnType<typeof checkAdvancedAllocation>;
  betaImpact: {
    portfolioBeta: number;
    diversificationBenefit: number;
    concentrationRisk: number;
  };
  recommendations: string[];
}

export const calculateEnhancedAllocation = async (
  inputs: InvestmentInputs,
  assumptions: any,
  coinData: CoinData,
  currentPortfolioBreakdown?: { bitcoin: number; blueChip: number; smallCap: number }
): Promise<EnhancedAllocationResult> => {
  // Get REAL beta for risk analysis
  console.log('📊 Getting REAL beta for allocation analysis...');
  const betaAnalysis = await realBetaCalculationService.calculateRealBeta(inputs.coinId);
  console.log(`📈 Using Real Beta ${betaAnalysis.beta.toFixed(3)} for allocation`);
  
  // Basic allocation analysis
  const allocation = checkAdvancedAllocation(
    inputs.investmentAmount,
    inputs.totalPortfolio,
    coinData.basket,
    currentPortfolioBreakdown
  );
  
  // Calculate portfolio beta impact with REAL beta
  const currentPortfolioBeta = currentPortfolioBreakdown ? 
    calculatePortfolioBeta(currentPortfolioBreakdown) : 1.2;
    
  const newWeight = inputs.investmentAmount / inputs.totalPortfolio;
  const newPortfolioBeta = currentPortfolioBeta * (1 - newWeight) + betaAnalysis.beta * newWeight;
  
  // Diversification benefit (negative correlation is better) with REAL beta
  const diversificationBenefit = Math.max(0, (1.5 - betaAnalysis.beta) * 0.2);
  
  // Concentration risk (higher beta = higher concentration risk) with REAL beta
  const concentrationRisk = Math.max(0, (betaAnalysis.beta - 1.0) * newWeight * 100);
  
  const recommendations: string[] = [];
  
  // Beta-based recommendations using REAL data
  if (betaAnalysis.beta > 2.0 && newWeight > 0.1) {
    recommendations.push(`HIGH RISK: Real Beta ${betaAnalysis.beta.toFixed(2)} indicates extreme volatility. Limit position size.`);
  }
  
  if (newPortfolioBeta > 1.8) {
    recommendations.push(`Portfolio beta increasing to ${newPortfolioBeta.toFixed(2)} with real data. Consider defensive assets.`);
  }
  
  if (diversificationBenefit > 0.1) {
    recommendations.push(`Good diversification: Real Beta ${betaAnalysis.beta.toFixed(2)} provides portfolio balance.`);
  }

  if (betaAnalysis.confidence === 'high') {
    recommendations.push(`High confidence in beta calculation (${betaAnalysis.source}) - reliable risk assessment.`);
  } else if (betaAnalysis.confidence === 'low') {
    recommendations.push(`Low confidence in beta (${betaAnalysis.source}) - consider additional risk analysis.`);
  }
  
  console.log('✅ Enhanced allocation calculated with REAL Glass Node beta');
  
  return {
    allocation,
    betaImpact: {
      portfolioBeta: newPortfolioBeta,
      diversificationBenefit,
      concentrationRisk
    },
    recommendations
  };
};

// Helper function to calculate portfolio beta
function calculatePortfolioBeta(breakdown: { bitcoin: number; blueChip: number; smallCap: number }): number {
  // Weighted average of basket betas
  const basketBetas = {
    bitcoin: 1.0,
    blueChip: 1.5,
    smallCap: 2.5
  };
  
  const totalWeight = breakdown.bitcoin + breakdown.blueChip + breakdown.smallCap;
  
  if (totalWeight === 0) return 1.2; // Default portfolio beta
  
  return (
    (breakdown.bitcoin / totalWeight) * basketBetas.bitcoin +
    (breakdown.blueChip / totalWeight) * basketBetas.blueChip +
    (breakdown.smallCap / totalWeight) * basketBetas.smallCap
  );
}

// Enhanced expected price calculation with REAL beta adjustment
export const calculateEnhancedExpectedPrice = async (
  coinData: CoinData,
  inputs: InvestmentInputs,
  marketConditions: MarketConditions
): Promise<number> => {
  if (inputs.expectedPrice) return inputs.expectedPrice;
  
  // Get REAL beta analysis
  const betaAnalysis = await realBetaCalculationService.calculateRealBeta(inputs.coinId);
  console.log(`📊 Using Real Beta ${betaAnalysis.beta.toFixed(3)} for price calculation`);
  
  // Base growth rate from historical data
  let growthRate = (coinData.cagr_36m || 20) / 100;
  
  // Market condition adjustments with REAL beta
  const marketMultiplier = getMarketMultiplier(marketConditions.bitcoinState);
  const betaAdjustedMultiplier = 1 + (marketMultiplier - 1) * betaAnalysis.beta;
  
  growthRate *= betaAdjustedMultiplier;
  
  // Fed policy impact (higher REAL beta = more sensitive)
  if (marketConditions.fedRateChange > 0) {
    const fedImpact = marketConditions.fedRateChange * 0.1 * betaAnalysis.beta;
    growthRate *= (1 - fedImpact);
  }
  
  // Basket-specific adjustments
  const basketMultiplier = {
    'Bitcoin': 1.0,
    'Blue Chip': 1.2,
    'Small-Cap': 1.5
  }[coinData.basket] || 1.0;
  
  growthRate *= basketMultiplier;
  
  // REAL Beta confidence adjustment
  const confidenceAdjustment = {
    'low': 0.9,     // 10% discount for uncertainty
    'medium': 1.0,  // No adjustment
    'high': 1.05    // 5% premium for high confidence
  }[betaAnalysis.confidence];
  
  growthRate *= confidenceAdjustment;
  
  // Constrain growth rate to realistic bounds
  growthRate = Math.max(-0.8, Math.min(3.0, growthRate));
  
  const expectedPrice = coinData.current_price * Math.pow(1 + growthRate, inputs.investmentHorizon || 2);
  
  console.log(`📈 Expected price calculated with Real Beta: $${expectedPrice.toFixed(2)}`);
  
  return expectedPrice;
};

function getMarketMultiplier(bitcoinState: 'bullish' | 'neutral' | 'bearish'): number {
  switch (bitcoinState) {
    case 'bullish': return 1.3;
    case 'bearish': return 0.4;
    case 'neutral': return 0.8;
    default: return 1.0;
  }
}

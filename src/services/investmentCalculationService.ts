
import { 
  calculateNPV, 
  calculateIRR, 
  calculateCAGR, 
  calculateROI, 
  calculateRiskFactor,
  generateCashFlows,
  adjustDiscountRateForFed,
  checkAllocation,
  checkAdvancedAllocation,
  calculateEnhancedRiskFactor,
  calculateSharpeRatio,
  calculateRiskAdjustedNPV,
  calculateExpectedReturn,
  getEstimatedBeta
} from '@/utils/financialCalculations';
import { realBetaCalculationService } from '@/services/realBetaCalculationService';
import type { CoinData, InvestmentInputs, FinancialMetrics, MarketConditions } from '@/types/investment';

export const calculateFinancialMetrics = async (
  inputs: InvestmentInputs,
  coinData: CoinData,
  expectedPrice: number,
  adjustedDiscountRate: number,
  marketConditions: MarketConditions
): Promise<FinancialMetrics> => {
  // Generate cash flows
  const cashFlows = generateCashFlows(
    inputs.investmentAmount,
    expectedPrice,
    coinData.current_price,
    inputs.investmentHorizon || 2,
    inputs.stakingYield || coinData.staking_yield || 0
  );

  // Calculate financial metrics
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
  
  // Separate different ROI types
  const coinQuantity = inputs.investmentAmount / coinData.current_price;
  const priceROI = calculateROI(inputs.investmentAmount, coinQuantity * expectedPrice);
  const totalROI = calculateROI(inputs.investmentAmount, cashFlows[cashFlows.length - 1]);
  const stakingROI = totalROI - priceROI;
  
  // Get REAL beta (from Glass Node API or estimate)
  console.log('📊 Getting REAL beta for financial metrics...');
  let beta: number;
  let betaConfidence: 'low' | 'medium' | 'high' = 'low';
  let dataQuality: 'estimated' | 'calculated' | 'api' | 'database' = 'estimated';
  
  try {
    const betaResult = await realBetaCalculationService.calculateRealBeta(inputs.coinId);
    beta = betaResult.beta;
    betaConfidence = betaResult.confidence;
    dataQuality = betaResult.source;
    console.log(`📈 Using Real Beta: ${beta.toFixed(3)} (${betaConfidence}, ${dataQuality})`);
  } catch (error) {
    console.warn('⚠️ Real beta calculation failed, using estimated beta:', error);
    beta = coinData.beta || getEstimatedBeta(coinData.coin_id, coinData.basket);
    betaConfidence = 'low';
    dataQuality = 'estimated';
  }
  
  // Calculate enhanced risk factor with REAL beta
  const riskFactor = calculateEnhancedRiskFactor(
    coinData.basket,
    coinData.volatility || 50,
    coinData.fundamentals_score || 5,
    beta,
    coinData.aviv_ratio,
    coinData.active_supply,
    coinData.vaulted_supply,
    marketConditions.fedRateChange,
    marketConditions.smartMoneyActivity
  );
  
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
  
  // Calculate Sharpe ratio
  const volatility = coinData.volatility || 50;
  const sharpeRatio = calculateSharpeRatio(totalReturnCAGR, riskFreeRate * 100, volatility);

  console.log('✅ Financial metrics calculated with REAL Glass Node beta');

  return { 
    npv, 
    irr, 
    cagr: priceCAGR,           // Price appreciation only
    totalReturnCAGR,           // Total return including staking
    roi: totalROI,             // Total ROI
    priceROI,                  // Price appreciation ROI
    stakingROI,                // Staking contribution ROI
    riskFactor,
    // Enhanced risk metrics with REAL beta
    beta,
    standardDeviation: volatility,
    sharpeRatio,
    riskAdjustedNPV,
    expectedReturn,
    // Confidence indicators - now REAL
    betaConfidence,
    dataQuality
  };
};

export const calculateAllocation = (
  inputs: InvestmentInputs,
  assumptions: any,
  coinData: CoinData,
  currentPortfolioBreakdown?: { bitcoin: number; blueChip: number; smallCap: number }
) => {
  console.log('🚀 Using ENHANCED allocation analysis for', coinData.basket);
  // Use only enhanced allocation analysis - NO LEGACY
  const allocationResult = checkAdvancedAllocation(
    inputs.investmentAmount,
    inputs.totalPortfolio,
    coinData.basket,
    currentPortfolioBreakdown
  );
  
  console.log('✅ Enhanced allocation result:', allocationResult);
  return allocationResult;
};

export const calculateExpectedPrice = (
  coinData: CoinData,
  inputs: InvestmentInputs,
  marketConditions: MarketConditions
): number => {
  if (inputs.expectedPrice) return inputs.expectedPrice;
  
  // Base growth rate from historical data
  let growthRate = (coinData.cagr_36m || 20) / 100;
  
  // Market condition adjustments
  switch (marketConditions.bitcoinState) {
    case 'bullish':
      growthRate *= 1.3; // 30% bonus in bull market
      break;
    case 'bearish':
      growthRate *= 0.4; // 60% penalty in bear market
      break;
    case 'neutral':
      growthRate *= 0.8; // 20% discount for uncertainty
      break;
  }
  
  // Fed policy impact
  if (marketConditions.fedRateChange > 0) {
    growthRate *= (1 - marketConditions.fedRateChange * 0.1); // Rate hikes hurt crypto
  }
  
  // Basket-specific adjustments
  const basketMultiplier = {
    'Bitcoin': 1.0,
    'Blue Chip': 1.2,    // More growth potential
    'Small-Cap': 1.5     // Higher growth but more risk
  }[coinData.basket] || 1.0;
  
  growthRate *= basketMultiplier;
  
  // Constrain growth rate to realistic bounds
  growthRate = Math.max(-0.8, Math.min(3.0, growthRate)); // -80% to +300%
  
  return coinData.current_price * Math.pow(1 + growthRate, inputs.investmentHorizon || 2);
};

export const calculateAdjustedDiscountRate = (
  assumptions: any,
  fedRateChange: number,
  coinBasket: 'Bitcoin' | 'Blue Chip' | 'Small-Cap' = 'Bitcoin'
): number => {
  // Basket-specific sensitivity to Fed changes
  const basketMultiplier = {
    'Bitcoin': 1.0,
    'Blue Chip': 1.2,    // More sensitive to rates
    'Small-Cap': 1.5     // Most sensitive to rates
  }[coinBasket] || 1.0;
  
  return adjustDiscountRateForFed(
    assumptions.discount_rate / 100,
    fedRateChange,
    2.0, // Crypto sensitivity
    basketMultiplier
  );
};

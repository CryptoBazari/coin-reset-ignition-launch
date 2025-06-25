
import { 
  calculateNPV, 
  calculateIRR, 
  calculateCAGR, 
  calculateROI, 
  calculateRiskFactor,
  generateCashFlows,
  adjustDiscountRateForFed,
  checkAllocation
} from '@/utils/financialCalculations';
import type { CoinData, InvestmentInputs, FinancialMetrics, MarketConditions } from '@/types/investment';

export const calculateFinancialMetrics = (
  inputs: InvestmentInputs,
  coinData: CoinData,
  expectedPrice: number,
  adjustedDiscountRate: number,
  marketConditions: MarketConditions
): FinancialMetrics => {
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
  const cagr = calculateCAGR(
    inputs.investmentAmount,
    cashFlows[cashFlows.length - 1],
    inputs.investmentHorizon || 2
  );
  const roi = calculateROI(inputs.investmentAmount, cashFlows[cashFlows.length - 1]);
  const riskFactor = calculateRiskFactor(
    coinData.basket,
    coinData.volatility || 50,
    coinData.fundamentals_score || 5,
    coinData.aviv_ratio,
    coinData.active_supply,
    coinData.vaulted_supply,
    marketConditions.fedRateChange,
    marketConditions.smartMoneyActivity
  );

  return { npv, irr, cagr, roi, riskFactor };
};

export const calculateAllocation = (
  inputs: InvestmentInputs,
  assumptions: any
) => {
  const basketAllocation = (inputs.totalPortfolio * assumptions.target_allocation / 100);
  return checkAllocation(inputs.investmentAmount, basketAllocation, inputs.totalPortfolio);
};

export const calculateExpectedPrice = (
  coinData: CoinData,
  inputs: InvestmentInputs
): number => {
  return inputs.expectedPrice || 
    coinData.current_price * (1 + (coinData.cagr_36m || 20) / 100) ** (inputs.investmentHorizon || 2);
};

export const calculateAdjustedDiscountRate = (
  assumptions: any,
  fedRateChange: number
): number => {
  return adjustDiscountRateForFed(
    assumptions.discount_rate / 100,
    fedRateChange
  );
};

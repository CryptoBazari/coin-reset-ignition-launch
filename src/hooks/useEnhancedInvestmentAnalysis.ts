// =============================================================================
// PHASE 3: ENHANCED INVESTMENT ANALYSIS HOOK
// Integrates beta calculation service with comprehensive analysis
// =============================================================================

import { useState } from 'react';
import { fetchCoinData, fetchBasketAssumptions, fetchBenchmarkData, storeAnalysisResult } from '@/services/investmentDataService';
import { 
  calculateEnhancedFinancialMetrics, 
  calculateEnhancedAllocation,
  calculateEnhancedExpectedPrice,
  EnhancedFinancialMetrics,
  EnhancedAllocationResult
} from '@/services/enhancedInvestmentCalculationService';
import { generateAdvancedRecommendation } from '@/services/recommendationService';
import { createMarketConditions, getMarketData } from '@/services/marketAnalysisService';
import { betaCalculationService } from '@/services/betaCalculationService';
import { calculateAdjustedDiscountRate } from '@/services/investmentCalculationService';
import type { InvestmentInputs, MarketDataResult, CoinData, InvestmentRecommendation, MarketConditions } from '@/types/investment';

export interface EnhancedAnalysisResult {
  coin: CoinData;
  metrics: EnhancedFinancialMetrics;
  allocation: EnhancedAllocationResult;
  recommendation: InvestmentRecommendation;
  marketConditions: MarketConditions;
  benchmarkComparison: {
    coinPerformance: number;
    benchmarkPerformance: number;
    benchmarkName: string;
  };
  insights: {
    riskProfile: string;
    marketTiming: string;
    positionSizing: string;
    keyRisks: string[];
    opportunities: string[];
  };
}

export const useEnhancedInvestmentAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeInvestment = async (
    inputs: InvestmentInputs,
    currentPortfolioBreakdown?: { bitcoin: number; blueChip: number; smallCap: number }
  ): Promise<EnhancedAnalysisResult | null> => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch core data
      const coinData = await fetchCoinData(inputs.coinId);
      const assumptions = await fetchBasketAssumptions(coinData.basket);
      
      // 2. Get benchmark data
      const benchmarkId = coinData.basket === 'Bitcoin' ? 'SP500' : 'BTC';
      const benchmark = await fetchBenchmarkData(benchmarkId);

      // 3. Get enhanced beta analysis
      const betaAnalysis = await betaCalculationService.getBetaForCoin(inputs.coinId);
      
      // 4. Get real market data
      const marketDataResult: MarketDataResult = await getMarketData();
      const { fedRateChange, marketSentiment, realMarketData } = marketDataResult;

      // 5. Update coin data with real market data if available
      if (realMarketData) {
        const coinSymbolMap = {
          'BTC': 'BTC',
          'ETH': 'ETH', 
          'SOL': 'SOL',
          'ADA': 'ADA'
        };
        
        const realCoinData = realMarketData.find(coin => 
          coin.symbol === coinSymbolMap[inputs.coinId as keyof typeof coinSymbolMap]
        );
        
        if (realCoinData) {
          console.log(`Updating ${coinData.name} with real market data`);
          coinData.current_price = realCoinData.current_price;
          coinData.market_cap = realCoinData.market_cap;
        }
      }

      // 6. Create enhanced market conditions
      const marketConditions = createMarketConditions(coinData, marketSentiment, fedRateChange);

      // 7. Enhanced expected price calculation with beta
      const expectedPrice = calculateEnhancedExpectedPrice(
        coinData, 
        inputs, 
        marketConditions, 
        betaAnalysis
      );

      // 8. Calculate enhanced financial metrics
      const adjustedDiscountRate = calculateAdjustedDiscountRate(
        assumptions, 
        fedRateChange, 
        coinData.basket
      );
      
      const metrics = await calculateEnhancedFinancialMetrics(
        inputs,
        coinData,
        expectedPrice,
        adjustedDiscountRate,
        marketConditions
      );

      // 9. Enhanced allocation analysis
      const allocation = await calculateEnhancedAllocation(
        inputs,
        assumptions,
        coinData,
        currentPortfolioBreakdown
      );

      // 10. Generate comprehensive recommendation
      const legacyAllocation = {
        basketPercentage: allocation.allocation.portfolioPercentage,
        portfolioPercentage: allocation.allocation.portfolioPercentage,
        overexposed: allocation.allocation.status === 'overexposed'
      };
      
      const recommendation = generateAdvancedRecommendation(
        metrics.npv,
        metrics.irr,
        assumptions.hurdle_rate,
        coinData,
        inputs.investmentAmount,
        inputs.totalPortfolio,
        assumptions.target_allocation,
        marketConditions,
        legacyAllocation
      );

      // 11. Generate insights
      const insights = generateInvestmentInsights(
        metrics,
        allocation,
        marketConditions,
        coinData,
        betaAnalysis
      );

      // 12. Store enhanced analysis result
      await storeAnalysisResult({
        coin_id: inputs.coinId,
        investment_amount: inputs.investmentAmount,
        total_portfolio: inputs.totalPortfolio,
        investment_horizon: inputs.investmentHorizon || 2,
        expected_price: expectedPrice,
        npv: metrics.npv,
        irr: metrics.irr,
        cagr: metrics.cagr,
        roi: metrics.roi,
        risk_factor: metrics.riskFactor,
        recommendation: recommendation.recommendation,
        conditions: recommendation.conditions,
        risks: recommendation.risks,
        // Enhanced metrics
        price_cagr: metrics.cagr,
        total_return_cagr: metrics.totalReturnCAGR,
        price_roi: metrics.priceROI,
        staking_roi: metrics.stakingROI,
        beta: metrics.beta,
        standard_deviation: metrics.standardDeviation,
        sharpe_ratio: metrics.sharpeRatio,
        risk_adjusted_npv: metrics.riskAdjustedNPV,
        allocation_status: allocation.allocation.status,
        portfolio_compliant: allocation.allocation.status === 'optimal'
      });

      return {
        coin: coinData,
        metrics,
        allocation,
        recommendation,
        marketConditions,
        benchmarkComparison: {
          coinPerformance: coinData.cagr_36m || 0,
          benchmarkPerformance: benchmark.cagr_36m,
          benchmarkName: benchmark.name
        },
        insights
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Enhanced analysis failed';
      console.error('Enhanced Investment Analysis Error:', err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { 
    analyzeInvestment, 
    loading, 
    error,
    // Utility functions
    updateBeta: (coinId: string) => betaCalculationService.getBetaForCoin(coinId),
    updateAllBetas: () => betaCalculationService.updateAllBetas()
  };
};

// Generate comprehensive investment insights
function generateInvestmentInsights(
  metrics: EnhancedFinancialMetrics,
  allocation: EnhancedAllocationResult,
  marketConditions: MarketConditions,
  coinData: CoinData,
  betaAnalysis: any
): {
  riskProfile: string;
  marketTiming: string;
  positionSizing: string;
  keyRisks: string[];
  opportunities: string[];
} {
  const { beta, sharpeRatio, riskFactor } = metrics;
  const { volatilityBreakdown, riskDecomposition } = metrics;
  
  // Risk Profile Analysis
  let riskProfile = '';
  if (beta < 1.2 && riskFactor <= 2) {
    riskProfile = `LOW RISK: Beta ${beta.toFixed(2)} indicates lower volatility than market. Suitable for conservative portfolios.`;
  } else if (beta < 1.8 && riskFactor <= 3) {
    riskProfile = `MODERATE RISK: Beta ${beta.toFixed(2)} shows moderate correlation with market movements. Balanced risk-return profile.`;
  } else if (beta < 2.5 && riskFactor <= 4) {
    riskProfile = `HIGH RISK: Beta ${beta.toFixed(2)} indicates high volatility. Suitable for aggressive growth strategies.`;
  } else {
    riskProfile = `VERY HIGH RISK: Beta ${beta.toFixed(2)} shows extreme volatility. Only for experienced risk-tolerant investors.`;
  }

  // Market Timing Analysis
  let marketTiming = '';
  if (marketConditions.bitcoinState === 'bullish') {
    marketTiming = `FAVORABLE: Bitcoin bullish environment supports ${coinData.basket} investments. Consider increasing position.`;
  } else if (marketConditions.bitcoinState === 'bearish') {
    marketTiming = `CAUTION: Bitcoin bearish state increases risk for all crypto investments. Consider delaying or reducing position.`;
  } else {
    marketTiming = `NEUTRAL: Mixed market signals. Focus on fundamentals and risk management.`;
  }

  // Position Sizing Recommendation
  let positionSizing = '';
  const allocationStatus = allocation.allocation.status;
  const concentrationRisk = allocation.betaImpact.concentrationRisk;
  
  if (allocationStatus === 'underexposed' && concentrationRisk < 5) {
    positionSizing = `INCREASE POSITION: Below target allocation with manageable concentration risk. Consider adding to position.`;
  } else if (allocationStatus === 'overexposed' || concentrationRisk > 15) {
    positionSizing = `REDUCE POSITION: Over-allocated or high concentration risk. Consider rebalancing.`;
  } else {
    positionSizing = `MAINTAIN POSITION: Current allocation within optimal range. Monitor for rebalancing opportunities.`;
  }

  // Key Risks
  const keyRisks: string[] = [];
  
  if (beta > 2.0) {
    keyRisks.push(`Extreme Beta Risk: ${beta.toFixed(2)}x market volatility could lead to significant losses in downturns`);
  }
  
  if (volatilityBreakdown.systematic > 40) {
    keyRisks.push(`High Systematic Risk: ${volatilityBreakdown.systematic.toFixed(1)}% volatility tied to market movements`);
  }
  
  if (riskDecomposition.specificRisk > 2) {
    keyRisks.push(`Asset-Specific Risk: High idiosyncratic risk independent of market conditions`);
  }
  
  if (marketConditions.smartMoneyActivity) {
    keyRisks.push(`Smart Money Exodus: Institutional selling detected, indicating potential price pressure`);
  }
  
  if (betaAnalysis.confidence === 'low') {
    keyRisks.push(`Beta Uncertainty: Low confidence in risk metrics due to limited data`);
  }

  // Opportunities
  const opportunities: string[] = [];
  
  if (sharpeRatio > 1.5) {
    opportunities.push(`Excellent Risk-Adjusted Returns: Sharpe ratio ${sharpeRatio.toFixed(2)} indicates strong reward per unit of risk`);
  }
  
  if (allocation.betaImpact.diversificationBenefit > 0.1) {
    opportunities.push(`Portfolio Diversification: Adding this asset improves overall portfolio risk profile`);
  }
  
  if (allocationStatus === 'underexposed' && marketConditions.bitcoinState === 'bullish') {
    opportunities.push(`Strategic Opportunity: Underexposed to ${coinData.basket} during favorable market conditions`);
  }
  
  if (beta < 1.0 && marketConditions.bitcoinState === 'bearish') {
    opportunities.push(`Defensive Play: Lower beta provides downside protection in difficult markets`);
  }
  
  if (metrics.expectedReturn > metrics.cagr * 1.2) {
    opportunities.push(`Upside Potential: CAPM expected return suggests significant growth opportunity`);
  }

  return {
    riskProfile,
    marketTiming,
    positionSizing,
    keyRisks,
    opportunities
  };
}
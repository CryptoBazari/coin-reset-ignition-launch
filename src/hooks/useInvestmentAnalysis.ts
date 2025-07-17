
import { useState } from 'react';
import { fetchCoinData, fetchBasketAssumptions, fetchBenchmarkData, storeAnalysisResult } from '@/services/investmentDataService';
import { calculateFinancialMetrics, calculateAllocation, calculateExpectedPrice, calculateAdjustedDiscountRate } from '@/services/investmentCalculationService';
import { generateAdvancedRecommendation } from '@/services/recommendationService';
import { createMarketConditions, getMarketData } from '@/services/marketAnalysisService';
import { betaCalculationService } from '@/services/betaCalculationService';
import type { InvestmentInputs, AnalysisResult, MarketDataResult } from '@/types/investment';

export const useInvestmentAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeInvestment = async (inputs: InvestmentInputs): Promise<AnalysisResult | null> => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch core data
      const coinData = await fetchCoinData(inputs.coinId);
      const assumptions = await fetchBasketAssumptions(coinData.basket);
      const benchmarkId = coinData.basket === 'Bitcoin' ? 'SP500' : 'BTC';
      const benchmark = await fetchBenchmarkData(benchmarkId);

      // 2. Get enhanced beta analysis
      const betaAnalysis = await betaCalculationService.getBetaForCoin(inputs.coinId);
      
      // 3. Get real market data
      const marketDataResult: MarketDataResult = await getMarketData();
      const { fedRateChange, marketSentiment, realMarketData } = marketDataResult;

      // 4. Update coin data with real market data if available
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

      // 5. Enhanced coin data with beta
      const enhancedCoinData = { ...coinData, beta: betaAnalysis.beta };

      // 6. Create enhanced market conditions
      const marketConditions = createMarketConditions(enhancedCoinData, marketSentiment, fedRateChange);

      // 7. Calculate enhanced financial metrics with beta integration
      const adjustedDiscountRate = calculateAdjustedDiscountRate(assumptions, fedRateChange, coinData.basket);
      const expectedPrice = calculateExpectedPrice(enhancedCoinData, inputs, marketConditions);
      const metrics = calculateFinancialMetrics(inputs, enhancedCoinData, expectedPrice, adjustedDiscountRate, marketConditions);
      
      // 8. Enhanced allocation analysis with current portfolio consideration
      const currentPortfolioBreakdown = await getCurrentPortfolioBreakdown(); // You'd implement this
      const allocation = calculateAllocation(inputs, assumptions, enhancedCoinData, currentPortfolioBreakdown);

      // Generate comprehensive recommendation with corrected allocation format
      const allocationForRecommendation = {
        portfolioPercentage: allocation.portfolioPercentage,
        status: allocation.status,
        recommendation: allocation.recommendation,
        message: allocation.message
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
        allocationForRecommendation
      );

      // Store analysis result with enhanced metrics
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
        allocation_status: allocation.status,
        portfolio_compliant: allocation.status === 'optimal'
      });

      return {
        coin: enhancedCoinData,
        metrics,
        recommendation,
        marketConditions,
        allocation,
        betaAnalysis, // ✅ NEW: Include beta analysis results
        benchmarkComparison: {
          coinPerformance: coinData.cagr_36m || 0,
          benchmarkPerformance: benchmark.cagr_36m,
          benchmarkName: benchmark.name
        }
      };

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { analyzeInvestment, loading, error };
};

// Helper function to get current portfolio breakdown (you'd implement this based on your data structure)
async function getCurrentPortfolioBreakdown(): Promise<{ bitcoin: number; blueChip: number; smallCap: number } | undefined> {
  // This would fetch from your virtual portfolio or user portfolio data
  // For now, return undefined to use enhanced allocation logic without current portfolio
  return undefined;
}

// Helper function for basket multipliers
function getCryptoBasketMultiplier(basket: string): number {
  const multipliers = {
    'Bitcoin': 1.0,
    'Blue Chip': 1.2,
    'Small-Cap': 1.8
  };
  return multipliers[basket] || 1.0;
}

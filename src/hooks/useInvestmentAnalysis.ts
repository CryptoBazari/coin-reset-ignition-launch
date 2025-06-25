
import { useState } from 'react';
import { fetchCoinData, fetchBasketAssumptions, fetchBenchmarkData, storeAnalysisResult } from '@/services/investmentDataService';
import { calculateFinancialMetrics, calculateAllocation, calculateExpectedPrice, calculateAdjustedDiscountRate } from '@/services/investmentCalculationService';
import { generateAdvancedRecommendation } from '@/services/recommendationService';
import { createMarketConditions, getSimulatedMarketData } from '@/services/marketAnalysisService';
import type { InvestmentInputs, AnalysisResult } from '@/types/investment';

export const useInvestmentAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeInvestment = async (inputs: InvestmentInputs): Promise<AnalysisResult | null> => {
    setLoading(true);
    setError(null);

    try {
      // Fetch coin data
      const coinData = await fetchCoinData(inputs.coinId);

      // Fetch assumptions for the basket
      const assumptions = await fetchBasketAssumptions(coinData.basket);

      // Fetch benchmark data
      const benchmarkId = coinData.basket === 'Bitcoin' ? 'SP500' : 'BTC';
      const benchmark = await fetchBenchmarkData(benchmarkId);

      // Get market data
      const { fedRateChange, marketSentiment } = getSimulatedMarketData();

      // Create market conditions object
      const marketConditions = createMarketConditions(coinData, marketSentiment, fedRateChange);

      // Calculate financial metrics
      const adjustedDiscountRate = calculateAdjustedDiscountRate(assumptions, fedRateChange);
      const expectedPrice = calculateExpectedPrice(coinData, inputs);
      const metrics = calculateFinancialMetrics(inputs, coinData, expectedPrice, adjustedDiscountRate, marketConditions);
      const allocation = calculateAllocation(inputs, assumptions);

      // Generate comprehensive recommendation
      const recommendation = generateAdvancedRecommendation(
        metrics.npv,
        metrics.irr,
        assumptions.hurdle_rate,
        coinData,
        inputs.investmentAmount,
        inputs.totalPortfolio,
        assumptions.target_allocation,
        marketConditions,
        allocation
      );

      // Store analysis result
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
        risks: recommendation.risks
      });

      return {
        coin: coinData,
        metrics,
        recommendation,
        marketConditions,
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

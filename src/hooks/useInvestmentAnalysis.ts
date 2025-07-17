
import { useState } from 'react';
import { fetchCoinData, fetchBasketAssumptions, fetchBenchmarkData, storeAnalysisResult } from '@/services/investmentDataService';
import { calculateFinancialMetrics, calculateAllocation, calculateExpectedPrice, calculateAdjustedDiscountRate } from '@/services/investmentCalculationService';
import { generateAdvancedRecommendation } from '@/services/recommendationService';
import { createMarketConditions, getMarketData } from '@/services/marketAnalysisService';
import type { InvestmentInputs, AnalysisResult, MarketDataResult } from '@/types/investment';

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

      // Get market data (now uses real APIs when available)
      const marketDataResult: MarketDataResult = await getMarketData();
      const { fedRateChange, marketSentiment, realMarketData } = marketDataResult;

      // Update coin data with real market data if available
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

      // Create market conditions object
      const marketConditions = createMarketConditions(coinData, marketSentiment, fedRateChange);

      // Calculate financial metrics with enhanced parameters
      const adjustedDiscountRate = calculateAdjustedDiscountRate(assumptions, fedRateChange, coinData.basket);
      const expectedPrice = calculateExpectedPrice(coinData, inputs, marketConditions);
      const metrics = calculateFinancialMetrics(inputs, coinData, expectedPrice, adjustedDiscountRate, marketConditions);
      const allocation = calculateAllocation(inputs, assumptions, coinData);

      // Generate comprehensive recommendation (use legacy allocation for now)
      const recommendation = generateAdvancedRecommendation(
        metrics.npv,
        metrics.irr,
        assumptions.hurdle_rate,
        coinData,
        inputs.investmentAmount,
        inputs.totalPortfolio,
        assumptions.target_allocation,
        marketConditions,
        allocation.legacy
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

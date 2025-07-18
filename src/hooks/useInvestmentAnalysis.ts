import { useState } from 'react';
import { fetchCoinData, fetchBasketAssumptions, fetchBenchmarkData, storeAnalysisResult } from '@/services/investmentDataService';
import { calculateFinancialMetrics, calculateAllocation, calculateExpectedPrice, calculateAdjustedDiscountRate } from '@/services/investmentCalculationService';
import { generateAdvancedRecommendation } from '@/services/recommendationService';
import { createMarketConditions, getMarketData } from '@/services/marketAnalysisService';
import { betaCalculationService } from '@/services/betaCalculationService';
import { enhancedRealTimeMarketService } from '@/services/enhancedRealTimeMarketService';
import { getOnChainAnalysis, calculateCointimeMetrics } from '@/services/glassNodeService';
import type { InvestmentInputs, AnalysisResult, MarketDataResult } from '@/types/investment';

export const useInvestmentAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeInvestment = async (inputs: InvestmentInputs): Promise<AnalysisResult | null> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🚀 Starting Glass Node enhanced investment analysis for:', inputs.coinId);

      // Use Glass Node enhanced real-time service
      const enhancedCoinData = await enhancedRealTimeMarketService.getEnhancedCoinData(inputs.coinId);
      if (!enhancedCoinData) {
        console.log('Falling back to basic analysis...');
        return await performBasicAnalysis(inputs);
      }

      // Get Glass Node on-chain analysis
      const coinSymbol = getCoinSymbol(inputs.coinId);
      const onChainAnalysis = await getOnChainAnalysis(coinSymbol, 30);
      
      // Calculate cointime metrics
      const cointimeMetrics = calculateCointimeMetrics(
        onChainAnalysis.price,
        onChainAnalysis.cointime
      );

      // Convert enhanced data to coin data format
      const coinData = await convertEnhancedToCoinData(enhancedCoinData, cointimeMetrics);
      
      const assumptions = await fetchBasketAssumptions(coinData.basket);
      const benchmarkId = coinData.basket === 'Bitcoin' ? 'SP500' : 'BTC';
      const benchmark = await fetchBenchmarkData(benchmarkId);
      const betaAnalysis = await betaCalculationService.getBetaForCoin(inputs.coinId);

      // Enhanced market conditions with Glass Node data
      const marketConditions = createMarketConditions(
        coinData,
        {
          sentiment_score: calculateSentimentFromGlassNode(enhancedCoinData.onChainMetrics),
          smart_money_activity: detectSmartMoneyFromGlassNode(enhancedCoinData.onChainMetrics)
        },
        0 // Fed rate change
      );

      const adjustedDiscountRate = calculateAdjustedDiscountRate(assumptions, 0, coinData.basket);
      const expectedPrice = calculateExpectedPrice(coinData, inputs, marketConditions);
      const metrics = calculateFinancialMetrics(inputs, coinData, expectedPrice, adjustedDiscountRate, marketConditions);
      const allocation = calculateAllocation(inputs, assumptions, coinData);

      // Enhanced recommendation with Glass Node insights
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

      // Store analysis result with Glass Node data
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

      console.log('✅ Glass Node enhanced analysis completed');

      return {
        coin: coinData,
        metrics: {
          ...metrics,
          // Add Glass Node specific metrics
          cointimePrice: cointimeMetrics.cointimePrice,
          cointimeRatio: cointimeMetrics.cointimeRatio,
          onChainScore: calculateOnChainHealthScore(enhancedCoinData.onChainMetrics)
        },
        recommendation,
        marketConditions,
        allocation,
        betaAnalysis,
        benchmarkComparison: {
          coinPerformance: coinData.cagr_36m || 0,
          benchmarkPerformance: benchmark.cagr_36m,
          benchmarkName: benchmark.name
        },
        glassNodeData: {
          onChainAnalysis,
          cointimeMetrics,
          onChainMetrics: enhancedCoinData.onChainMetrics
        }
      };

    } catch (err) {
      console.error('Glass Node analysis failed, attempting fallback:', err);
      // Fallback to basic analysis without Glass Node
      return await performBasicAnalysis(inputs);
    } finally {
      setLoading(false);
    }
  };

  // Fallback function for when Glass Node data is unavailable
  const performBasicAnalysis = async (inputs: InvestmentInputs): Promise<AnalysisResult | null> => {
    try {
      console.log('Performing basic analysis without Glass Node...');
      
      const coinData = await fetchCoinData(inputs.coinId);
      const assumptions = await fetchBasketAssumptions(coinData.basket);
      const benchmarkId = coinData.basket === 'Bitcoin' ? 'SP500' : 'BTC';
      const benchmark = await fetchBenchmarkData(benchmarkId);
      const betaAnalysis = await betaCalculationService.getBetaForCoin(inputs.coinId);

      const enhancedCoinData = { ...coinData, beta: betaAnalysis.beta };
      const marketDataResult = await getMarketData();
      const { fedRateChange, marketSentiment } = marketDataResult;
      
      const marketConditions = createMarketConditions(enhancedCoinData, marketSentiment, fedRateChange);
      const adjustedDiscountRate = calculateAdjustedDiscountRate(assumptions, fedRateChange, coinData.basket);
      const expectedPrice = calculateExpectedPrice(enhancedCoinData, inputs, marketConditions);
      const metrics = calculateFinancialMetrics(inputs, enhancedCoinData, expectedPrice, adjustedDiscountRate, marketConditions);
      const allocation = calculateAllocation(inputs, assumptions, enhancedCoinData);

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
        betaAnalysis,
        benchmarkComparison: {
          coinPerformance: coinData.cagr_36m || 0,
          benchmarkPerformance: benchmark.cagr_36m,
          benchmarkName: benchmark.name
        }
      };

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      return null;
    }
  };

  return { analyzeInvestment, loading, error };
};

// Helper functions
function getCoinSymbol(coinId: string): string {
  const symbolMap: { [key: string]: string } = {
    'bitcoin': 'BTC',
    'ethereum': 'ETH',
    'solana': 'SOL',
    'cardano': 'ADA',
    'BTC': 'BTC',
    'ETH': 'ETH',
    'SOL': 'SOL',
    'ADA': 'ADA'
  };
  
  return symbolMap[coinId] || 'BTC';
}

async function convertEnhancedToCoinData(enhancedData: any, cointimeMetrics: any): Promise<any> {
  return {
    id: enhancedData.id,
    coin_id: enhancedData.id,
    name: enhancedData.name,
    basket: getBasketForCoin(enhancedData.symbol),
    current_price: enhancedData.current_price,
    market_cap: enhancedData.market_cap,
    cagr_36m: enhancedData.price_change_percentage_30d || 20,
    fundamentals_score: 7,
    volatility: calculateVolatilityFromOnChain(enhancedData.onChainMetrics),
    aviv_ratio: cointimeMetrics.cointimeRatio,
    active_supply: enhancedData.onChainMetrics?.liquidSupply || 0,
    vaulted_supply: enhancedData.onChainMetrics?.illiquidSupply || 0,
    cointime_inflation: cointimeMetrics.cointimePrice,
    staking_yield: 0,
    beta: 1.0
  };
}

function getBasketForCoin(symbol: string): 'Bitcoin' | 'Blue Chip' | 'Small-Cap' {
  if (symbol === 'BTC') return 'Bitcoin';
  if (['ETH'].includes(symbol)) return 'Blue Chip';
  return 'Small-Cap';
}

function calculateSentimentFromGlassNode(metrics: any): number {
  if (!metrics) return 0;
  
  const netFlow = metrics.exchangeOutflow - metrics.exchangeInflow;
  const flowRatio = netFlow / (metrics.exchangeInflow + 1);
  
  return Math.max(-1, Math.min(1, flowRatio));
}

function detectSmartMoneyFromGlassNode(metrics: any): boolean {
  if (!metrics) return false;
  
  return metrics.exchangeOutflow > metrics.exchangeInflow * 1.5;
}

function calculateVolatilityFromOnChain(metrics: any): number {
  if (!metrics) return 50;
  
  const activityScore = (metrics.exchangeInflow + metrics.exchangeOutflow) / 2;
  return Math.min(100, Math.max(20, activityScore / 1000));
}

function calculateOnChainHealthScore(metrics: any): number {
  if (!metrics) return 5;
  
  let score = 5;
  
  if (metrics.activeAddresses > 100000) score += 1;
  if (metrics.exchangeOutflow > metrics.exchangeInflow) score += 1;
  if (metrics.liquidSupply > metrics.illiquidSupply * 2) score -= 1;
  
  return Math.max(1, Math.min(10, score));
}


import { useState } from 'react';
import { enhancedRealTimeMarketService } from '@/services/enhancedRealTimeMarketService';
import { fetchBasketAssumptions, fetchBenchmarkData, storeAnalysisResult } from '@/services/investmentDataService';
import { calculateFinancialMetrics, calculateAllocation, calculateExpectedPrice, calculateAdjustedDiscountRate } from '@/services/investmentCalculationService';
import { generateAdvancedRecommendation } from '@/services/recommendationService';
import { createMarketConditions } from '@/services/marketAnalysisService';
import { getOnChainAnalysis, calculateCointimeMetrics } from '@/services/glassNodeService';
import { betaCalculationService } from '@/services/betaCalculationService';
import type { InvestmentInputs, AnalysisResult, MarketDataResult } from '@/types/investment';

export const useEnhancedGlassNodeAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeInvestmentWithGlassNode = async (inputs: InvestmentInputs): Promise<AnalysisResult | null> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔬 Starting enhanced Glass Node analysis for:', inputs.coinId);

      // 1. Fetch enhanced coin data with Glass Node metrics
      const enhancedCoinData = await enhancedRealTimeMarketService.getEnhancedCoinData(inputs.coinId);
      if (!enhancedCoinData) {
        throw new Error('Failed to fetch enhanced coin data');
      }

      // 2. Get comprehensive on-chain analysis from Glass Node
      const coinSymbol = getCoinSymbol(inputs.coinId);
      const onChainAnalysis = await getOnChainAnalysis(coinSymbol, 30);
      
      // 3. Calculate cointime metrics
      const cointimeMetrics = calculateCointimeMetrics(
        onChainAnalysis.price,
        onChainAnalysis.cointime
      );

      // 4. Fetch basket assumptions and benchmark data
      const coinData = await convertToCoinData(enhancedCoinData, cointimeMetrics);
      const assumptions = await fetchBasketAssumptions(coinData.basket);
      const benchmarkId = coinData.basket === 'Bitcoin' ? 'SP500' : 'BTC';
      const benchmark = await fetchBenchmarkData(benchmarkId);

      // 5. Get beta analysis
      const betaAnalysis = await betaCalculationService.getBetaForCoin(inputs.coinId);

      // 6. Create market conditions with enhanced data
      const marketConditions = createMarketConditions(
        coinData,
        {
          sentiment_score: calculateSentimentFromOnChain(enhancedCoinData.onChainMetrics),
          smart_money_activity: detectSmartMoneyActivity(enhancedCoinData.onChainMetrics)
        },
        0 // Fed rate change - could be enhanced with real data
      );

      // 7. Calculate expected price with Glass Node insights
      const expectedPrice = calculateExpectedPrice(coinData, inputs, marketConditions);
      
      // 8. Calculate enhanced financial metrics
      const adjustedDiscountRate = calculateAdjustedDiscountRate(assumptions, 0, coinData.basket);
      const metrics = calculateFinancialMetrics(inputs, coinData, expectedPrice, adjustedDiscountRate, marketConditions);

      // 9. Calculate allocation
      const allocation = calculateAllocation(inputs, assumptions, coinData);

      // 10. Generate recommendation
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

      // 11. Store analysis result
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

      console.log('✅ Enhanced Glass Node analysis completed');

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
      console.error('❌ Enhanced Glass Node analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { analyzeInvestmentWithGlassNode, loading, error };
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

async function convertToCoinData(enhancedData: any, cointimeMetrics: any): Promise<any> {
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

function calculateSentimentFromOnChain(metrics: any): number {
  if (!metrics) return 0;
  
  const netFlow = metrics.exchangeOutflow - metrics.exchangeInflow;
  const flowRatio = netFlow / (metrics.exchangeInflow + 1);
  
  // Positive outflow = bullish, negative = bearish
  return Math.max(-1, Math.min(1, flowRatio));
}

function detectSmartMoneyActivity(metrics: any): boolean {
  if (!metrics) return false;
  
  // Large exchange outflows might indicate smart money accumulation
  return metrics.exchangeOutflow > metrics.exchangeInflow * 1.5;
}

function calculateVolatilityFromOnChain(metrics: any): number {
  if (!metrics) return 50;
  
  // Higher exchange activity = higher volatility
  const activityScore = (metrics.exchangeInflow + metrics.exchangeOutflow) / 2;
  return Math.min(100, Math.max(20, activityScore / 1000));
}

function calculateOnChainHealthScore(metrics: any): number {
  if (!metrics) return 5;
  
  let score = 5;
  
  // Active addresses (positive indicator)
  if (metrics.activeAddresses > 100000) score += 1;
  
  // Net outflow from exchanges (positive indicator)
  if (metrics.exchangeOutflow > metrics.exchangeInflow) score += 1;
  
  // High liquid supply relative to illiquid (risk indicator)
  if (metrics.liquidSupply > metrics.illiquidSupply * 2) score -= 1;
  
  return Math.max(1, Math.min(10, score));
}

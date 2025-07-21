import { useState } from 'react';
import { enhancedRealTimeMarketService } from '@/services/enhancedRealTimeMarketService';
import { fetchBasketAssumptions, fetchBenchmarkData, storeAnalysisResult } from '@/services/investmentDataService';
import { calculateFinancialMetrics, calculateAllocation, calculateExpectedPrice, calculateAdjustedDiscountRate } from '@/services/investmentCalculationService';
import { generateAdvancedRecommendation } from '@/services/recommendationService';
import { createMarketConditions } from '@/services/marketAnalysisService';
import { getOnChainAnalysis, calculateCointimeMetrics } from '@/services/glassNodeService';
import { realBetaCalculationService } from '@/services/realBetaCalculationService';
import { bitcoinGlassNodeService } from '@/services/bitcoinGlassNodeService';
import { enhancedBenchmarkService } from '@/services/enhancedBenchmarkService';
import type { InvestmentInputs, AnalysisResult, MarketDataResult } from '@/types/investment';

export const useEnhancedGlassNodeAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeInvestmentWithGlassNode = async (inputs: InvestmentInputs): Promise<AnalysisResult | null> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔬 Starting enhanced Glass Node analysis for:', inputs.coinId);
      console.log('📊 KEY CHANGE: AVIV Ratio will ALWAYS use Bitcoin data, regardless of selected coin');

      // 1. Fetch enhanced coin data with Glass Node metrics for the SELECTED coin
      const enhancedCoinData = await enhancedRealTimeMarketService.getEnhancedCoinData(inputs.coinId);
      if (!enhancedCoinData) {
        throw new Error('Failed to fetch enhanced coin data');
      }

      // 2. Get Bitcoin-specific cointime data (ALWAYS Bitcoin, regardless of selected coin)
      console.log('₿ Fetching Bitcoin AVIV Ratio and Cointime data (market timing indicators)...');
      const bitcoinCointimeData = await bitcoinGlassNodeService.getBitcoinCointimeData();
      
      // 3. Get on-chain analysis for the SELECTED coin
      const coinSymbol = getCoinSymbol(inputs.coinId);
      const onChainAnalysis = await getOnChainAnalysis(coinSymbol, 30);
      
      // 4. Calculate cointime metrics using BITCOIN data (not selected coin)
      const cointimeMetrics = {
        cointimePrice: bitcoinCointimeData.cointimePrice,
        cointimeRatio: bitcoinCointimeData.cointimeRatio
      };

      // 5. Convert to coin data structure with BITCOIN AVIV ratio
      const coinData = await convertToCoinData(enhancedCoinData, cointimeMetrics, bitcoinCointimeData.avivRatio);
      
      // 6. Fetch basket assumptions and proper benchmark data
      const assumptions = await fetchBasketAssumptions(coinData.basket);
      const benchmark = await enhancedBenchmarkService.getBenchmarkForCoin(inputs.coinId);
      
      console.log(`🎯 Using benchmark: ${benchmark.name} for ${inputs.coinId}`);

      // 7. Get REAL beta analysis with proper benchmark
      console.log('🎯 Calculating real beta with proper benchmark...');
      const betaAnalysis = await realBetaCalculationService.calculateRealBeta(inputs.coinId);

      // 8. Create market conditions with BITCOIN AVIV ratio (not selected coin)
      const marketConditions = createMarketConditions(
        coinData, // This now contains Bitcoin AVIV ratio
        {
          sentiment_score: calculateSentimentFromOnChain(enhancedCoinData.onChainMetrics),
          smart_money_activity: detectSmartMoneyActivity(enhancedCoinData.onChainMetrics)
        },
        0 // Fed rate change
      );

      // 9. Calculate expected price using SELECTED coin data
      const expectedPrice = calculateExpectedPrice(coinData, inputs, marketConditions);
      
      // 10. Calculate enhanced financial metrics with proper benchmark
      const adjustedDiscountRate = calculateAdjustedDiscountRate(assumptions, 0, coinData.basket);
      const metrics = await calculateFinancialMetrics(inputs, coinData, expectedPrice, adjustedDiscountRate, marketConditions);

      // Update metrics with real beta data
      metrics.beta = betaAnalysis.beta;
      metrics.betaConfidence = betaAnalysis.confidence;
      metrics.dataQuality = betaAnalysis.source;

      // 11. Calculate allocation
      const allocation = calculateAllocation(inputs, assumptions, coinData);

      // 12. Generate recommendation
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

      // 13. Store analysis result
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
        conditions: `Beta: ${betaAnalysis.beta.toFixed(3)} (${betaAnalysis.confidence}) vs ${betaAnalysis.benchmarkUsed} - Bitcoin AVIV: ${bitcoinCointimeData.avivRatio.toFixed(3)} - ${recommendation.conditions}`,
        risks: `Beta Source: ${betaAnalysis.source} - ${recommendation.risks}`,
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

      console.log('✅ Enhanced Glass Node analysis completed with BITCOIN AVIV ratio');
      console.log(`📊 Bitcoin AVIV Ratio: ${bitcoinCointimeData.avivRatio.toFixed(3)} (used for ALL coins)`);
      console.log(`📊 Real Beta: ${betaAnalysis.beta.toFixed(3)} (${betaAnalysis.confidence}) vs ${betaAnalysis.benchmarkUsed}`);
      console.log(`📈 Coin-specific metrics calculated for: ${inputs.coinId}`);

      return {
        coin: coinData,
        metrics: {
          ...metrics,
          // Add Bitcoin-specific metrics
          bitcoinAvivRatio: bitcoinCointimeData.avivRatio, // Always Bitcoin
          cointimePrice: cointimeMetrics.cointimePrice, // Always Bitcoin
          cointimeRatio: cointimeMetrics.cointimeRatio, // Always Bitcoin
          onChainScore: calculateOnChainHealthScore(enhancedCoinData.onChainMetrics)
        },
        recommendation,
        marketConditions,
        allocation,
        betaAnalysis,
        benchmarkComparison: {
          coinPerformance: coinData.cagr_36m || 0,
          benchmarkPerformance: benchmark.cagr36m,
          benchmarkName: benchmark.name
        },
        glassNodeData: {
          onChainAnalysis,
          cointimeMetrics,
          onChainMetrics: enhancedCoinData.onChainMetrics,
          bitcoinCointimeData // Include Bitcoin-specific data
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
    'litecoin': 'LTC',
    'BTC': 'BTC',
    'ETH': 'ETH',
    'SOL': 'SOL',
    'ADA': 'ADA',
    'LTC': 'LTC'
  };
  
  return symbolMap[coinId] || 'BTC';
}

async function convertToCoinData(enhancedData: any, cointimeMetrics: any, bitcoinAvivRatio: number): Promise<any> {
  console.log(`🔄 Converting coin data with Bitcoin AVIV ratio: ${bitcoinAvivRatio.toFixed(3)}`);
  
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
    aviv_ratio: bitcoinAvivRatio, // ALWAYS Bitcoin AVIV ratio
    active_supply: enhancedData.onChainMetrics?.liquidSupply || 0,
    vaulted_supply: enhancedData.onChainMetrics?.illiquidSupply || 0,
    cointime_inflation: cointimeMetrics.cointimePrice, // Bitcoin-based
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
  
  return Math.max(-1, Math.min(1, flowRatio));
}

function detectSmartMoneyActivity(metrics: any): boolean {
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

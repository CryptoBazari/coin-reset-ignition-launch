
import { useState } from 'react';
import { fetchBasketAssumptions, fetchBenchmarkData, storeAnalysisResult } from '@/services/investmentDataService';
import { calculateFinancialMetrics, calculateAllocation, calculateExpectedPrice, calculateAdjustedDiscountRate } from '@/services/investmentCalculationService';
import { generateAdvancedRecommendation } from '@/services/recommendationService';
import { createMarketConditions, getMarketData } from '@/services/marketAnalysisService';
import { realBetaCalculationService } from '@/services/realBetaCalculationService';
import { enhancedRealTimeMarketService } from '@/services/enhancedRealTimeMarketService';
import { getOnChainAnalysis, calculateCointimeMetrics } from '@/services/glassNodeService';
import { realTimeMarketService } from '@/services/realTimeMarketService';
import type { InvestmentInputs, AnalysisResult, MarketDataResult } from '@/types/investment';

export const useInvestmentAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeInvestment = async (inputs: InvestmentInputs): Promise<AnalysisResult | null> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🚀 Starting Glass Node enhanced investment analysis for:', inputs.coinId);

      // Step 1: Try to get enhanced real-time data from Glass Node + CoinGecko
      let coinData: any = null;
      let glassNodeData: any = null;
      
      try {
        // First, get basic real-time data from CoinGecko
        const basicCoinData = await realTimeMarketService.getCoinData(inputs.coinId);
        if (!basicCoinData) {
          throw new Error('Failed to fetch basic coin data');
        }

        // Try to enhance with Glass Node data
        const enhancedCoinData = await enhancedRealTimeMarketService.getEnhancedCoinData(inputs.coinId);
        
        if (enhancedCoinData && enhancedCoinData.onChainMetrics) {
          console.log('✅ Using Glass Node enhanced data');
          
          // Get comprehensive on-chain analysis
          const coinSymbol = getCoinSymbol(inputs.coinId);
          const onChainAnalysis = await getOnChainAnalysis(coinSymbol, 30);
          
          // Calculate cointime metrics
          const cointimeMetrics = calculateCointimeMetrics(
            onChainAnalysis.price,
            onChainAnalysis.cointime
          );

          // Convert to our coin data format with real-time prices
          coinData = {
            id: basicCoinData.id,
            coin_id: basicCoinData.id,
            name: basicCoinData.name,
            symbol: basicCoinData.symbol,
            basket: getBasketForCoin(basicCoinData.symbol.toUpperCase()),
            current_price: basicCoinData.current_price, // Real-time price from CoinGecko
            market_cap: basicCoinData.market_cap,
            cagr_36m: basicCoinData.price_change_percentage_30d || 20,
            fundamentals_score: 7,
            volatility: calculateVolatilityFromOnChain(enhancedCoinData.onChainMetrics),
            aviv_ratio: cointimeMetrics.cointimeRatio,
            active_supply: enhancedCoinData.onChainMetrics?.liquidSupply || basicCoinData.circulating_supply,
            vaulted_supply: enhancedCoinData.onChainMetrics?.illiquidSupply || 0,
            cointime_inflation: cointimeMetrics.cointimePrice,
            staking_yield: 0,
            beta: 1.0
          };

          glassNodeData = {
            onChainAnalysis,
            cointimeMetrics,
            onChainMetrics: enhancedCoinData.onChainMetrics
          };
        } else {
          console.log('⚠️ Glass Node data unavailable, using CoinGecko data');
          
          // Fallback to CoinGecko-only data
          coinData = {
            id: basicCoinData.id,
            coin_id: basicCoinData.id,
            name: basicCoinData.name,
            symbol: basicCoinData.symbol,
            basket: getBasketForCoin(basicCoinData.symbol.toUpperCase()),
            current_price: basicCoinData.current_price,
            market_cap: basicCoinData.market_cap,
            cagr_36m: basicCoinData.price_change_percentage_30d || 20,
            fundamentals_score: 7,
            volatility: Math.abs(basicCoinData.price_change_percentage_24h) || 50,
            aviv_ratio: 1.0,
            active_supply: basicCoinData.circulating_supply,
            vaulted_supply: 0,
            cointime_inflation: 0,
            staking_yield: 0,
            beta: 1.0
          };
        }
      } catch (apiError) {
        console.error('Real-time API failed:', apiError);
        // Last resort: use fallback data but with a clear indication
        coinData = createFallbackCoinData(inputs.coinId);
        setError('Using fallback data - real-time APIs unavailable');
      }

      // Step 2: Get assumptions and benchmark data
      const assumptions = await fetchBasketAssumptions(coinData.basket);
      const benchmarkId = coinData.basket === 'Bitcoin' ? 'SP500' : 'BTC';
      const benchmark = await fetchBenchmarkData(benchmarkId);
      
      // Use REAL beta calculation service
      console.log('📊 Calculating REAL beta with Glass Node data...');
      const betaAnalysis = await realBetaCalculationService.calculateRealBeta(inputs.coinId);
      console.log(`📈 Real Beta: ${betaAnalysis.beta.toFixed(3)} (${betaAnalysis.confidence}, ${betaAnalysis.source})`);

      // Step 3: Create market conditions
      const marketDataResult: MarketDataResult = await getMarketData();
      const { fedRateChange, marketSentiment } = marketDataResult;
      
      const marketConditions = createMarketConditions(
        coinData,
        glassNodeData ? {
          sentiment_score: calculateSentimentFromGlassNode(glassNodeData.onChainMetrics),
          smart_money_activity: detectSmartMoneyFromGlassNode(glassNodeData.onChainMetrics)
        } : marketSentiment,
        fedRateChange
      );

      // Step 4: Calculate financial metrics with REAL beta
      const adjustedDiscountRate = calculateAdjustedDiscountRate(assumptions, fedRateChange, coinData.basket);
      const expectedPrice = calculateExpectedPrice(coinData, inputs, marketConditions);
      const metrics = calculateFinancialMetrics(inputs, coinData, expectedPrice, adjustedDiscountRate, marketConditions);

      // Update metrics with REAL beta data
      metrics.beta = betaAnalysis.beta;
      metrics.betaConfidence = betaAnalysis.confidence;
      metrics.dataQuality = betaAnalysis.source;

      // Add Glass Node specific metrics if available
      if (glassNodeData) {
        Object.assign(metrics, {
          cointimePrice: glassNodeData.cointimeMetrics.cointimePrice,
          cointimeRatio: glassNodeData.cointimeMetrics.cointimeRatio,
          onChainScore: calculateOnChainHealthScore(glassNodeData.onChainMetrics)
        });
      }

      // Step 5: Calculate allocation
      const allocation = calculateAllocation(inputs, assumptions, coinData);

      // Step 6: Generate recommendation
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

      // Step 7: Store analysis result with REAL beta
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
        conditions: `Real Beta: ${betaAnalysis.beta.toFixed(3)} (${betaAnalysis.confidence}) - ${recommendation.conditions}`,
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

      console.log('✅ Investment analysis completed with REAL Glass Node beta data');
      console.log(`📊 Final Beta: ${betaAnalysis.beta.toFixed(3)} (${betaAnalysis.confidence}, ${betaAnalysis.source})`);

      const result: AnalysisResult = {
        coin: coinData,
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

      // Add Glass Node data if available
      if (glassNodeData) {
        result.glassNodeData = glassNodeData;
      }

      return result;

    } catch (err) {
      console.error('Investment analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
      return null;
    } finally {
      setLoading(false);
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

function getBasketForCoin(symbol: string): 'Bitcoin' | 'Blue Chip' | 'Small-Cap' {
  if (symbol === 'BTC') return 'Bitcoin';
  if (['ETH'].includes(symbol)) return 'Blue Chip';
  return 'Small-Cap';
}

function calculateSentimentFromGlassNode(metrics: any): number {
  if (!metrics) return 0;
  
  const netFlow = (metrics.exchangeOutflow || 0) - (metrics.exchangeInflow || 0);
  const flowRatio = netFlow / ((metrics.exchangeInflow || 0) + 1);
  
  return Math.max(-1, Math.min(1, flowRatio));
}

function detectSmartMoneyFromGlassNode(metrics: any): boolean {
  if (!metrics) return false;
  
  return (metrics.exchangeOutflow || 0) > (metrics.exchangeInflow || 0) * 1.5;
}

function calculateVolatilityFromOnChain(metrics: any): number {
  if (!metrics) return 50;
  
  const activityScore = ((metrics.exchangeInflow || 0) + (metrics.exchangeOutflow || 0)) / 2;
  return Math.min(100, Math.max(20, activityScore / 1000));
}

function calculateOnChainHealthScore(metrics: any): number {
  if (!metrics) return 5;
  
  let score = 5;
  
  if ((metrics.activeAddresses || 0) > 100000) score += 1;
  if ((metrics.exchangeOutflow || 0) > (metrics.exchangeInflow || 0)) score += 1;
  if ((metrics.liquidSupply || 0) > (metrics.illiquidSupply || 0) * 2) score -= 1;
  
  return Math.max(1, Math.min(10, score));
}

function createFallbackCoinData(coinId: string): any {
  const fallbackData = {
    'bitcoin': { name: 'Bitcoin', symbol: 'BTC', price: 45000, marketCap: 850000000000 },
    'ethereum': { name: 'Ethereum', symbol: 'ETH', price: 2500, marketCap: 300000000000 },
    'solana': { name: 'Solana', symbol: 'SOL', price: 100, marketCap: 40000000000 },
    'cardano': { name: 'Cardano', symbol: 'ADA', price: 0.5, marketCap: 17000000000 }
  };

  const fallback = fallbackData[coinId as keyof typeof fallbackData] || fallbackData.bitcoin;
  
  return {
    id: coinId,
    coin_id: coinId,
    name: fallback.name,
    symbol: fallback.symbol,
    basket: getBasketForCoin(fallback.symbol),
    current_price: fallback.price,
    market_cap: fallback.marketCap,
    cagr_36m: 25,
    fundamentals_score: 6,
    volatility: 60,
    aviv_ratio: 1.0,
    active_supply: fallback.marketCap / fallback.price,
    vaulted_supply: 0,
    cointime_inflation: 0,
    staking_yield: 0,
    beta: 1.0
  };
}


// =============================================================================
// PHASE 4: GLASS NODE ENHANCED INVESTMENT ANALYSIS HOOK
// Integrates Glass Node real-time data with comprehensive financial analysis
// =============================================================================

import { useState } from 'react';
import { enhancedInvestmentDataService } from '@/services/enhancedInvestmentDataService';
import { fetchBasketAssumptions, fetchBenchmarkData, storeAnalysisResult } from '@/services/investmentDataService';
import { 
  calculateEnhancedNPV, 
  calculateEnhancedCAGR, 
  calculateEnhancedIRR,
  calculateEnhancedBeta,
  calculateEnhancedRiskFactor 
} from '@/utils/enhancedFinancialCalculations';
import { generateAdvancedRecommendation } from '@/services/recommendationService';
import { createMarketConditions, getMarketData } from '@/services/marketAnalysisService';
import { realTimeMarketService } from '@/services/realTimeMarketService';
import { realBetaCalculationService } from '@/services/realBetaCalculationService';
import type { InvestmentInputs, EnhancedCoinData, MarketDataResult, InvestmentRecommendation, MarketConditions } from '@/types/investment';

export interface EnhancedAnalysisResult {
  enhancedCoinData: EnhancedCoinData;
  metrics: {
    npv: { npv: number; projectedValues: number[]; confidenceScore: number };
    cagr: { cagr: number; volatilityAdjustedCAGR: number; onChainGrowthRate: number };
    irr: { irr: number; stakingAdjustedIRR: number; networkEffectIRR: number };
    beta: { traditionalBeta: number; onChainBeta: number; adjustedBeta: number };
    risk: { 
      overallRisk: number;
      liquidityRisk: number;
      technicalRisk: number;
      fundamentalRisk: number;
      cointimeRisk: number;
    };
  };
  recommendation: InvestmentRecommendation;
  marketConditions: MarketConditions;
  dataQuality: {
    glassnodeConnection: boolean;
    confidenceScore: number;
    lastUpdated: string;
    dataCompleteness: number;
  };
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
    glassnodeInsights: string[];
  };
}

export const useEnhancedInvestmentAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeInvestment = async (inputs: InvestmentInputs): Promise<EnhancedAnalysisResult | null> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🚀 Starting Glass Node enhanced investment analysis for:', inputs.coinId);
      console.log('📊 Input parameters:', inputs);

      // 1. Fetch enhanced coin data with live Glass Node metrics
      console.log('📡 Fetching enhanced data with Glass Node integration...');
      const enhancedCoinData = await enhancedInvestmentDataService.fetchEnhancedCoinData(inputs.coinId);
      
      console.log('📈 Enhanced coin data received:', {
        coinId: enhancedCoinData.coin_id,
        currentPrice: enhancedCoinData.current_price,
        avivRatio: enhancedCoinData.liveMetrics?.avivRatio,
        activeSupply: enhancedCoinData.liveMetrics?.activeSupply,
        vaultedSupply: enhancedCoinData.liveMetrics?.vaultedSupply,
        activeAddresses: enhancedCoinData.onChainData?.activeAddresses,
        networkGrowth: enhancedCoinData.onChainData?.networkGrowth
      });

      // 2. Get basket assumptions and benchmark data
      console.log('🎯 Fetching basket assumptions and benchmark data...');
      const assumptions = await fetchBasketAssumptions(enhancedCoinData.basket);
      const benchmarkId = enhancedCoinData.basket === 'Bitcoin' ? 'SP500' : 'BTC';
      const benchmark = await fetchBenchmarkData(benchmarkId);

      // 3. Get market conditions with real-time data
      console.log('🌐 Analyzing market conditions...');
      const marketDataResult: MarketDataResult = await getMarketData();
      const marketConditions = createMarketConditions(enhancedCoinData, marketDataResult.marketSentiment, marketDataResult.fedRateChange);

      // 4. Calculate enhanced financial metrics
      console.log('💰 Calculating enhanced financial metrics...');
      const npvResult = calculateEnhancedNPV(
        inputs.investmentAmount,
        enhancedCoinData,
        inputs.investmentHorizon || 2,
        assumptions.discount_rate
      );

      const cagrResult = calculateEnhancedCAGR(enhancedCoinData);
      const irrResult = calculateEnhancedIRR(
        enhancedCoinData,
        inputs.investmentAmount,
        inputs.investmentHorizon || 2
      );

      // 5. Get REAL market data for Beta calculation using Glass Node
      console.log('📊 Calculating REAL beta with Glass Node data...');
      const realBetaResult = await realBetaCalculationService.calculateRealBeta(inputs.coinId);
      console.log(`📈 Real Beta calculated: ${realBetaResult.beta.toFixed(3)} (${realBetaResult.confidence})`);

      // Use real beta in enhanced calculation
      const betaResult = {
        traditionalBeta: realBetaResult.beta,
        onChainBeta: realBetaResult.beta, // Use same value for now
        adjustedBeta: realBetaResult.beta
      };

      // 6. Calculate enhanced risk factors
      console.log('⚠️ Assessing risk factors...');
      const riskResult = calculateEnhancedRiskFactor(enhancedCoinData, marketConditions);

      // 7. Generate enhanced recommendation
      console.log('🎯 Generating investment recommendation...');
      const recommendation = generateEnhancedRecommendation({
        npv: npvResult.npv,
        irr: irrResult.networkEffectIRR,
        cagr: cagrResult.volatilityAdjustedCAGR,
        risk: riskResult.overallRisk,
        confidence: npvResult.confidenceScore,
        enhancedCoinData
      });

      // 8. Generate comprehensive insights
      console.log('🧠 Generating Glass Node insights...');
      const insights = generateGlassNodeInsights(enhancedCoinData, {
        npv: npvResult,
        cagr: cagrResult,
        irr: irrResult,
        beta: betaResult,
        risk: riskResult
      }, marketConditions);

      // 9. Calculate data completeness score
      const dataCompleteness = calculateDataCompleteness(enhancedCoinData);
      const glassnodeConnection = checkGlassNodeConnection(enhancedCoinData);

      console.log('📋 Data quality assessment:', {
        glassnodeConnection,
        dataCompleteness,
        confidenceScore: npvResult.confidenceScore,
        realBeta: realBetaResult.beta,
        betaSource: realBetaResult.source
      });

      // 10. Store enhanced analysis result with REAL beta
      console.log('💾 Storing analysis result with real beta data...');
      await storeEnhancedAnalysisResult({
        ...inputs,
        enhancedMetrics: {
          npv: npvResult.npv,
          irr: irrResult.networkEffectIRR,
          cagr: cagrResult.volatilityAdjustedCAGR,
          beta: realBetaResult.beta, // Store REAL beta
          risk: riskResult.overallRisk,
          confidence: npvResult.confidenceScore
        },
        recommendation: recommendation.recommendation,
        glassnodeData: {
          liveMetrics: enhancedCoinData.liveMetrics,
          onChainData: enhancedCoinData.onChainData,
          technicalIndicators: enhancedCoinData.technicalIndicators,
          realBeta: realBetaResult // Include real beta data
        }
      });

      console.log('✅ Enhanced Glass Node analysis completed successfully with REAL beta');
      console.log(`📊 Final Beta: ${realBetaResult.beta.toFixed(3)} (${realBetaResult.confidence}, ${realBetaResult.source})`);

      const result: EnhancedAnalysisResult = {
        enhancedCoinData,
        metrics: {
          npv: npvResult,
          cagr: cagrResult,
          irr: irrResult,
          beta: betaResult,
          risk: riskResult
        },
        recommendation,
        marketConditions,
        dataQuality: {
          glassnodeConnection,
          confidenceScore: npvResult.confidenceScore,
          lastUpdated: new Date().toISOString(),
          dataCompleteness
        },
        benchmarkComparison: {
          coinPerformance: enhancedCoinData.cagr_36m || cagrResult.cagr,
          benchmarkPerformance: benchmark.cagr_36m,
          benchmarkName: benchmark.name
        },
        insights
      };

      console.log('📤 Returning enhanced analysis result with real beta:', {
        recommendation: result.recommendation.recommendation,
        npv: result.metrics.npv.npv,
        confidence: result.dataQuality.confidenceScore,
        glassnodeConnection: result.dataQuality.glassnodeConnection,
        realBeta: realBetaResult.beta
      });

      return result;

    } catch (err) {
      console.error('❌ Enhanced analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
      
      // Fallback to basic analysis if Glass Node fails
      console.log('🔄 Attempting fallback analysis...');
      return await fallbackToBasicAnalysis(inputs);
    } finally {
      setLoading(false);
    }
  };

  return { 
    analyzeInvestment, 
    loading, 
    error,
    // Utility functions - now using REAL beta service
    updateCache: () => enhancedInvestmentDataService.clearCache(),
    getBetaData: (coinId: string) => realBetaCalculationService.calculateRealBeta(coinId)
  };
};

// Helper functions

function checkGlassNodeConnection(coinData: EnhancedCoinData): boolean {
  // Check if we have real Glass Node data vs fallback data
  const hasLiveMetrics = coinData.liveMetrics && 
    coinData.liveMetrics.avivRatio !== 1.0 && 
    coinData.liveMetrics.activeSupply !== 50;
  
  const hasOnChainData = coinData.onChainData && 
    coinData.onChainData.activeAddresses > 0;
    
  const hasTechnicalIndicators = coinData.technicalIndicators && 
    coinData.technicalIndicators.sopr !== 1;

  console.log('🔍 Glass Node connection check:', {
    hasLiveMetrics,
    hasOnChainData,
    hasTechnicalIndicators,
    overall: hasLiveMetrics || hasOnChainData || hasTechnicalIndicators
  });

  return hasLiveMetrics || hasOnChainData || hasTechnicalIndicators;
}

async function getMarketReturns(): Promise<number[]> {
  try {
    // Return default market returns since CoinData doesn't have price_history
    return generateDefaultMarketReturns();
  } catch (error) {
    console.error('Failed to get market returns:', error);
    return generateDefaultMarketReturns();
  }
}

function generateDefaultMarketReturns(): number[] {
  // Generate synthetic market returns based on historical crypto volatility
  const returns = [];
  const volatility = 0.04; // 4% daily volatility
  
  for (let i = 0; i < 90; i++) {
    // Random walk with slight positive bias
    const randomReturn = (Math.random() - 0.48) * volatility;
    returns.push(randomReturn);
  }
  
  return returns;
}

function generateEnhancedRecommendation(data: {
  npv: number;
  irr: number;
  cagr: number;
  risk: number;
  confidence: number;
  enhancedCoinData: EnhancedCoinData;
}): InvestmentRecommendation {
  const { npv, irr, cagr, risk, confidence, enhancedCoinData } = data;
  const { liveMetrics, onChainData, technicalIndicators } = enhancedCoinData;

  // Enhanced recommendation logic using Glass Node metrics
  let recommendation: 'Buy' | 'Buy Less' | 'Do Not Buy' | 'Sell' = 'Do Not Buy';
  let worthInvesting = false;
  let goodTiming = false;
  let appropriateAmount = false;

  // NPV and IRR thresholds
  if (npv > 0 && irr > 15) {
    worthInvesting = true;
  }

  // Timing analysis using Glass Node metrics
  if (liveMetrics.avivRatio < 1.2 && // Not overvalued
      liveMetrics.vaultedSupply > 60 && // Strong hands holding
      technicalIndicators.sopr < 1.1 && // Limited profit-taking
      onChainData.networkGrowth > 0) { // Growing network
    goodTiming = true;
  }

  // Amount appropriateness based on risk and confidence
  if (risk < 70 && confidence > 60) {
    appropriateAmount = true;
  }

  // Final recommendation
  if (worthInvesting && goodTiming && appropriateAmount) {
    recommendation = 'Buy';
  } else if (worthInvesting && (goodTiming || appropriateAmount)) {
    recommendation = 'Buy Less';
  } else if (worthInvesting) {
    recommendation = 'Buy Less';
  } else {
    recommendation = 'Do Not Buy';
  }

  // Generate market analysis
  const marketAnalysis = generateMarketAnalysis(enhancedCoinData);
  
  // Generate conditions and risks
  const conditions = generateConditions(liveMetrics, technicalIndicators);
  const risks = generateRisks(risk, onChainData);

  return {
    recommendation,
    worthInvesting,
    goodTiming,
    appropriateAmount,
    riskFactor: Math.round(risk),
    shouldDiversify: risk > 60,
    conditions,
    risks,
    marketAnalysis,
    rebalancingActions: []
  };
}

function generateGlassNodeInsights(
  coinData: EnhancedCoinData, 
  metrics: any, 
  marketConditions: MarketConditions
): {
  riskProfile: string;
  marketTiming: string;
  positionSizing: string;
  keyRisks: string[];
  opportunities: string[];
  glassnodeInsights: string[];
} {
  const { liveMetrics, onChainData, technicalIndicators } = coinData;
  const { beta, risk } = metrics;

  // Risk Profile Analysis
  let riskProfile = '';
  if (beta.adjustedBeta < 1.2 && risk.overallRisk <= 50) {
    riskProfile = `LOW RISK: Adjusted beta ${beta.adjustedBeta.toFixed(2)} with strong on-chain fundamentals. Suitable for conservative portfolios.`;
  } else if (beta.adjustedBeta < 1.8 && risk.overallRisk <= 70) {
    riskProfile = `MODERATE RISK: Beta ${beta.adjustedBeta.toFixed(2)} with balanced on-chain metrics. Good risk-return profile.`;
  } else {
    riskProfile = `HIGH RISK: Beta ${beta.adjustedBeta.toFixed(2)} indicates high volatility. Monitor on-chain metrics closely.`;
  }

  // Market Timing Analysis
  let marketTiming = '';
  if (liveMetrics.avivRatio < 0.8 && liveMetrics.vaultedSupply > 70) {
    marketTiming = `EXCELLENT TIMING: AVIV ratio suggests undervaluation with strong holder conviction. Ideal entry point.`;
  } else if (liveMetrics.avivRatio > 2.0 || technicalIndicators.sopr > 1.2) {
    marketTiming = `POOR TIMING: Overvaluation signals suggest waiting for better entry. High profit-taking activity.`;
  } else {
    marketTiming = `NEUTRAL TIMING: Mixed on-chain signals. Focus on fundamentals and risk management.`;
  }

  // Position Sizing based on Glass Node data
  let positionSizing = '';
  if (risk.overallRisk < 50 && onChainData.networkGrowth > 5) {
    positionSizing = `INCREASE POSITION: Low risk with strong network growth. Consider larger allocation.`;
  } else if (risk.overallRisk > 80 || onChainData.networkGrowth < 0) {
    positionSizing = `REDUCE POSITION: High risk or declining network metrics. Consider smaller allocation.`;
  } else {
    positionSizing = `MAINTAIN POSITION: Balanced risk profile. Standard position sizing appropriate.`;
  }

  // Key Risks
  const keyRisks: string[] = [];
  
  if (liveMetrics.avivRatio > 2.5) {
    keyRisks.push(`Overvaluation Risk: AVIV ratio ${liveMetrics.avivRatio.toFixed(2)} suggests asset may be overpriced`);
  }
  
  if (liveMetrics.activeSupply > 80) {
    keyRisks.push(`Velocity Risk: High active supply (${liveMetrics.activeSupply.toFixed(1)}%) indicates potential selling pressure`);
  }
  
  if (onChainData.networkGrowth < -10) {
    keyRisks.push(`Network Decline: Negative network growth (${onChainData.networkGrowth.toFixed(1)}%) signals fundamental weakness`);
  }
  
  if (technicalIndicators.sopr > 1.2) {
    keyRisks.push(`Profit-Taking Risk: SOPR ${technicalIndicators.sopr.toFixed(2)} indicates heavy profit realization`);
  }

  // Opportunities
  const opportunities: string[] = [];
  
  if (liveMetrics.avivRatio < 0.6) {
    opportunities.push(`Value Opportunity: AVIV ratio ${liveMetrics.avivRatio.toFixed(2)} suggests significant undervaluation`);
  }
  
  if (liveMetrics.vaultedSupply > 75) {
    opportunities.push(`Strong Holder Base: ${liveMetrics.vaultedSupply.toFixed(1)}% vaulted supply indicates committed long-term holders`);
  }
  
  if (onChainData.networkGrowth > 15) {
    opportunities.push(`Network Expansion: Strong growth (${onChainData.networkGrowth.toFixed(1)}%) indicates increasing adoption`);
  }
  
  if (beta.onChainBeta < beta.traditionalBeta) {
    opportunities.push(`Stability Improvement: On-chain fundamentals reduce traditional market correlation`);
  }

  // Glass Node Specific Insights
  const glassnodeInsights: string[] = [];
  
  glassnodeInsights.push(`Cointime Economics: AVIV ${liveMetrics.avivRatio.toFixed(2)}, Vaulted ${liveMetrics.vaultedSupply.toFixed(1)}%`);
  glassnodeInsights.push(`Network Health: ${onChainData.activeAddresses.toLocaleString()} active addresses, ${onChainData.networkGrowth.toFixed(1)}% growth`);
  glassnodeInsights.push(`Technical Signals: NVT ${technicalIndicators.nvtRatio.toFixed(1)}, SOPR ${technicalIndicators.sopr.toFixed(2)}`);
  glassnodeInsights.push(`Risk Breakdown: Liquidity ${risk.liquidityRisk.toFixed(0)}%, Technical ${risk.technicalRisk.toFixed(0)}%, Cointime ${risk.cointimeRisk.toFixed(0)}%`);

  return {
    riskProfile,
    marketTiming,
    positionSizing,
    keyRisks,
    opportunities,
    glassnodeInsights
  };
}

function calculateDataCompleteness(coinData: EnhancedCoinData): number {
  let score = 0;
  let maxScore = 0;

  // Live metrics completeness
  maxScore += 20;
  if (coinData.liveMetrics.avivRatio && coinData.liveMetrics.avivRatio !== 1.0) score += 5;
  if (coinData.liveMetrics.activeSupply && coinData.liveMetrics.activeSupply !== 50) score += 5;
  if (coinData.liveMetrics.vaultedSupply && coinData.liveMetrics.vaultedSupply !== 50) score += 5;
  if (coinData.liveMetrics.realizedCap > 0) score += 5;

  // On-chain data completeness
  maxScore += 20;
  if (coinData.onChainData.transactionVolume > 0) score += 5;
  if (coinData.onChainData.activeAddresses > 0) score += 5;
  if (coinData.onChainData.networkValue > 0) score += 5;
  if (coinData.onChainData.networkGrowth !== 0) score += 5;

  // Technical indicators completeness
  maxScore += 20;
  if (coinData.technicalIndicators.nvtRatio > 0) score += 5;
  if (coinData.technicalIndicators.sopr !== 1) score += 5;
  if (coinData.technicalIndicators.puellMultiple !== 1) score += 5;
  if (coinData.technicalIndicators.mvrv !== 1) score += 5;

  // Price history completeness
  maxScore += 20;
  if (coinData.priceHistory.daily.length > 30) score += 10;
  if (coinData.priceHistory.volatility30d !== 50) score += 5;
  if (coinData.priceHistory.volatility90d !== 50) score += 5;

  // Basic data completeness
  maxScore += 20;
  if (coinData.current_price > 0) score += 5;
  if (coinData.market_cap && coinData.market_cap > 0) score += 5;
  if (coinData.cagr_36m && coinData.cagr_36m !== 0) score += 5;
  if (coinData.fundamentals_score && coinData.fundamentals_score > 0) score += 5;

  return Math.round((score / maxScore) * 100);
}

function generateMarketAnalysis(coinData: EnhancedCoinData): string {
  const { liveMetrics, onChainData, technicalIndicators } = coinData;
  
  let analysis = "";
  
  // AVIV ratio analysis
  if (liveMetrics.avivRatio < 0.8) {
    analysis += "Asset appears undervalued based on AVIV ratio. ";
  } else if (liveMetrics.avivRatio > 2.0) {
    analysis += "Asset may be overvalued based on AVIV ratio. ";
  }
  
  // Supply dynamics
  if (liveMetrics.vaultedSupply > 70) {
    analysis += "Strong holder behavior with high vaulted supply. ";
  }
  
  // Network growth
  if (onChainData.networkGrowth > 10) {
    analysis += "Strong network growth indicates healthy fundamentals. ";
  } else if (onChainData.networkGrowth < 0) {
    analysis += "Declining network activity raises concerns. ";
  }
  
  return analysis || "Mixed market signals require careful analysis.";
}

function generateConditions(metrics: any, indicators: any): string {
  const conditions = [];
  
  if (metrics.avivRatio < 1.0) {
    conditions.push("Asset shows value relative to realized price");
  }
  
  if (metrics.vaultedSupply > 60) {
    conditions.push("Strong holder conviction evident in supply metrics");
  }
  
  if (indicators.sopr < 1.05) {
    conditions.push("Limited profit-taking suggests accumulation phase");
  }
  
  return conditions.join("; ") || "Standard market conditions apply";
}

function generateRisks(riskScore: number, onChainData: any): string {
  const risks = [];
  
  if (riskScore > 80) {
    risks.push("High volatility and market risk");
  }
  
  if (onChainData.transactionVolume < 1000000) {
    risks.push("Lower liquidity may impact large transactions");
  }
  
  if (onChainData.networkGrowth < 0) {
    risks.push("Declining network activity poses fundamental risk");
  }
  
  return risks.join("; ") || "Standard crypto market risks apply";
}

async function storeEnhancedAnalysisResult(data: any): Promise<void> {
  try {
    await storeAnalysisResult({
      coin_id: data.coinId,
      investment_amount: data.investmentAmount,
      total_portfolio: data.totalPortfolio,
      investment_horizon: data.investmentHorizon,
      npv: data.enhancedMetrics.npv,
      irr: data.enhancedMetrics.irr,
      cagr: data.enhancedMetrics.cagr,
      beta: data.enhancedMetrics.beta,
      risk_factor: data.enhancedMetrics.risk,
      recommendation: data.recommendation,
      conditions: JSON.stringify(data.glassnodeData),
      risks: `Confidence: ${data.enhancedMetrics.confidence}%`
    });
  } catch (error) {
    console.error('Failed to store enhanced analysis result:', error);
  }
}

async function fallbackToBasicAnalysis(inputs: InvestmentInputs): Promise<EnhancedAnalysisResult | null> {
  try {
    console.log('🔄 Falling back to basic analysis without Glass Node data');
    
    // Get basic coin data
    const basicCoinData = await realTimeMarketService.getCoinData(inputs.coinId);
    
    if (!basicCoinData) {
      throw new Error('Failed to get basic coin data');
    }

    // Create minimal enhanced data structure with required properties
    const fallbackEnhancedData: EnhancedCoinData = {
      ...basicCoinData,
      coin_id: inputs.coinId,
      basket: 'Bitcoin' as const, // Default basket
      liveMetrics: {
        avivRatio: 1.0,
        activeSupply: 50,
        vaultedSupply: 50,
        liveliness: 0.5,
        vaultedness: 0.5,
        realizedCap: 0,
        activeCap: 0,
        investorCap: 0
      },
      onChainData: {
        transactionVolume: 0,
        networkValue: 0,
        activeAddresses: 0,
        networkGrowth: 0
      },
      technicalIndicators: {
        nvtRatio: 0,
        sopr: 1,
        puellMultiple: 1,
        mvrv: 1
      },
      priceHistory: {
        daily: [],
        volatility30d: 60,
        volatility90d: 60
      }
    };

    // Basic calculations with fallback data
    const npvResult = { npv: 0, projectedValues: [], confidenceScore: 30 };
    const cagrResult = { cagr: 20, volatilityAdjustedCAGR: 15, onChainGrowthRate: 0 };
    const irrResult = { irr: 15, stakingAdjustedIRR: 15, networkEffectIRR: 15 };
    const betaResult = { traditionalBeta: 1, onChainBeta: 1, adjustedBeta: 1 };
    const riskResult = { 
      overallRisk: 70, 
      liquidityRisk: 70, 
      technicalRisk: 70, 
      fundamentalRisk: 70, 
      cointimeRisk: 70 
    };

    const recommendation: InvestmentRecommendation = {
      recommendation: 'Do Not Buy',
      worthInvesting: false,
      goodTiming: false,
      appropriateAmount: false,
      riskFactor: 70,
      shouldDiversify: true,
      conditions: "Limited data available for analysis",
      risks: "High uncertainty due to missing Glass Node data",
      marketAnalysis: "Basic analysis only - consider waiting for full data"
    };

    const marketConditions: MarketConditions = {
      bitcoinState: 'neutral',
      sentimentScore: 50,
      smartMoneyActivity: false,
      fedRateChange: 0
    };

    return {
      enhancedCoinData: fallbackEnhancedData,
      metrics: {
        npv: npvResult,
        cagr: cagrResult,
        irr: irrResult,
        beta: betaResult,
        risk: riskResult
      },
      recommendation,
      marketConditions,
      dataQuality: {
        glassnodeConnection: false,
        confidenceScore: 30,
        lastUpdated: new Date().toISOString(),
        dataCompleteness: 20
      },
      benchmarkComparison: {
        coinPerformance: 0,
        benchmarkPerformance: 0,
        benchmarkName: 'Unknown'
      },
      insights: {
        riskProfile: 'High uncertainty due to limited data',
        marketTiming: 'Cannot determine without Glass Node data',
        positionSizing: 'Reduce position until full data available',
        keyRisks: ['Missing on-chain data', 'Limited analysis capability'],
        opportunities: ['Wait for full data integration'],
        glassnodeInsights: ['Glass Node connection failed - using basic data only']
      }
    };

  } catch (error) {
    console.error('Fallback analysis also failed:', error);
    return null;
  }
}

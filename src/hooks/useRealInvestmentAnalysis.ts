import { useState } from 'react';
import { realTimeGlassNodeService } from '@/services/realTimeGlassNodeService';
import { monteCarloProjectionService } from '@/services/monteCarloProjectionService';
import { realBetaCalculationService } from '@/services/realBetaCalculationService';
import { calculateNPV, calculateIRR } from '@/utils/financialCalculations';
import type { InvestmentInputs } from '@/types/investment';

export interface RealAnalysisResult {
  coinId: string;
  realTimeData: {
    priceHistory: Array<{ timestamp: number; price: number }>;
    volatility: number;
    cagr36m: number;
    avivRatio: number;
    activeSupply: number;
    vaultedSupply: number;
    dataQuality: number;
    lastUpdated: string;
  };
  monteCarloProjection: {
    expectedValue: number;
    confidenceInterval: { lower: number; upper: number };
    probabilityOfLoss: number;
    valueAtRisk: number;
  };
  betaAnalysis: {
    beta: number;
    correlation: number;
    confidence: string;
    dataPoints: number;
  };
  financialMetrics: {
    npv: number;
    irr: number;
    realCAGR: number;
    realVolatility: number;
    sharpeRatio: number;
  };
  recommendation: {
    action: 'Buy' | 'Buy Less' | 'Do Not Buy' | 'Sell';
    confidence: number;
    reasoning: string[];
    riskWarnings: string[];
  };
  dataQualityScore: number;
}

export const useRealInvestmentAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRealRecommendation = (data: {
    npv: number;
    irr: number;
    realCAGR: number;
    volatility: number;
    avivRatio: number;
    beta: number;
    probabilityOfLoss: number;
    dataQuality: number;
  }) => {
    console.log('🎯 Generating recommendation based on REAL data');
    
    const reasoning: string[] = [];
    const riskWarnings: string[] = [];
    let confidence = 50;
    let action: 'Buy' | 'Buy Less' | 'Do Not Buy' | 'Sell' = 'Do Not Buy';

    // NPV Analysis
    if (data.npv > 0) {
      reasoning.push(`Positive NPV of $${data.npv.toLocaleString()} indicates value creation`);
      confidence += 15;
    } else {
      riskWarnings.push(`Negative NPV of $${data.npv.toLocaleString()} indicates value destruction`);
      confidence -= 20;
    }

    // IRR Analysis
    if (data.irr > 15) {
      reasoning.push(`Strong IRR of ${data.irr.toFixed(1)}% exceeds hurdle rate`);
      confidence += 10;
    } else if (data.irr < 5) {
      riskWarnings.push(`Low IRR of ${data.irr.toFixed(1)}% below risk-free rate`);
      confidence -= 15;
    }

    // Real CAGR Analysis
    if (data.realCAGR > 20) {
      reasoning.push(`Excellent 36-month CAGR of ${data.realCAGR.toFixed(1)}% from real data`);
      confidence += 10;
    } else if (data.realCAGR < 0) {
      riskWarnings.push(`Negative 36-month CAGR of ${data.realCAGR.toFixed(1)}% shows declining trend`);
      confidence -= 20;
    }

    // Volatility Analysis
    if (data.volatility > 100) {
      riskWarnings.push(`Very high volatility of ${data.volatility.toFixed(1)}% indicates extreme risk`);
      confidence -= 15;
    } else if (data.volatility < 40) {
      reasoning.push(`Moderate volatility of ${data.volatility.toFixed(1)}% suggests stability`);
      confidence += 5;
    }

    // AVIV Ratio Analysis (Cointime Economics)
    if (data.avivRatio < 0.8) {
      reasoning.push(`AVIV ratio ${data.avivRatio.toFixed(2)} suggests asset is undervalued`);
      confidence += 15;
    } else if (data.avivRatio > 2.5) {
      riskWarnings.push(`AVIV ratio ${data.avivRatio.toFixed(2)} suggests asset is overextended`);
      confidence -= 15;
    }

    // Beta Analysis
    if (data.beta > 2.5) {
      riskWarnings.push(`High beta of ${data.beta.toFixed(2)} indicates amplified market risk`);
      confidence -= 10;
    } else if (data.beta < 1.2) {
      reasoning.push(`Moderate beta of ${data.beta.toFixed(2)} provides balanced risk exposure`);
      confidence += 5;
    }

    // Probability of Loss
    if (data.probabilityOfLoss > 0.4) {
      riskWarnings.push(`${(data.probabilityOfLoss * 100).toFixed(1)}% probability of loss based on Monte Carlo simulation`);
      confidence -= 20;
    } else if (data.probabilityOfLoss < 0.2) {
      reasoning.push(`Low ${(data.probabilityOfLoss * 100).toFixed(1)}% probability of loss provides confidence`);
      confidence += 10;
    }

    // Data Quality Impact
    if (data.dataQuality < 50) {
      riskWarnings.push(`Low data quality (${data.dataQuality}%) reduces analysis confidence`);
      confidence -= 15;
    } else if (data.dataQuality > 80) {
      reasoning.push(`High data quality (${data.dataQuality}%) supports analysis reliability`);
      confidence += 10;
    }

    // Final recommendation logic
    confidence = Math.max(0, Math.min(100, confidence));

    if (data.npv > 0 && data.irr > 15 && confidence > 70) {
      action = 'Buy';
    } else if (data.npv > 0 && confidence > 50) {
      action = 'Buy Less';
    } else if (data.npv < -1000 || data.probabilityOfLoss > 0.6) {
      action = 'Sell';
    } else {
      action = 'Do Not Buy';
    }

    return {
      action,
      confidence,
      reasoning,
      riskWarnings
    };
  };

  const calculateOverallDataQuality = (realTimeData: any, betaResult: any): number => {
    let score = 0;
    
    // Real-time data quality (40% weight)
    score += realTimeData.dataQuality * 0.4;
    
    // Beta calculation confidence (30% weight)
    const betaScore = betaResult.confidence === 'high' ? 90 : 
                     betaResult.confidence === 'medium' ? 60 : 30;
    score += betaScore * 0.3;
    
    // Data points availability (30% weight)
    const dataPointsScore = Math.min(100, (betaResult.dataPoints / 252) * 100);
    score += dataPointsScore * 0.3;
    
    return Math.round(score);
  };

  const analyzeInvestment = async (inputs: InvestmentInputs): Promise<RealAnalysisResult | null> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🚀 Starting REAL investment analysis (no more mock data!)');
      console.log('📊 Input parameters:', inputs);

      // Step 1: Get real-time Glass Node data
      console.log('📡 Fetching real Glass Node data...');
      const realTimeData = await realTimeGlassNodeService.fetchRealTimeData(inputs.coinId);
      
      console.log('✅ Real-time data received:', {
        dataQuality: realTimeData.dataQuality,
        volatility: realTimeData.volatility,
        cagr36m: realTimeData.cagr36m,
        avivRatio: realTimeData.avivRatio
      });

      // Step 2: Run Monte Carlo projection with real volatility
      console.log('🎲 Running Monte Carlo simulation with real data...');
      const monteCarloProjection = monteCarloProjectionService.generateProjection(
        inputs.investmentAmount,
        realTimeData,
        inputs.investmentHorizon || 2
      );

      // Step 3: Calculate real beta correlation
      console.log('📈 Calculating real beta correlation...');
      const betaResult = await realBetaCalculationService.calculateRealBeta(inputs.coinId, 'bitcoin');

      // Step 4: Generate real cash flows from Monte Carlo
      console.log('💰 Generating real cash flows...');
      const realCashFlows = monteCarloProjectionService.generateRealCashFlows(
        inputs.investmentAmount,
        monteCarloProjection,
        inputs.investmentHorizon || 2,
        inputs.stakingYield || 0
      );

      // Step 5: Calculate financial metrics with real data
      console.log('📊 Calculating financial metrics with real data...');
      const npv = calculateNPV(realCashFlows, 0.1); // 10% discount rate
      const irr = calculateIRR(realCashFlows);
      
      // Real Sharpe ratio using real volatility and returns
      const riskFreeRate = 4.5; // Current risk-free rate
      const sharpeRatio = (realTimeData.cagr36m - riskFreeRate) / realTimeData.volatility;

      // Step 6: Generate recommendation based on real data
      const recommendation = generateRealRecommendation({
        npv,
        irr,
        realCAGR: realTimeData.cagr36m,
        volatility: realTimeData.volatility,
        avivRatio: realTimeData.avivRatio,
        beta: betaResult.beta,
        probabilityOfLoss: monteCarloProjection.riskMetrics.probabilityOfLoss,
        dataQuality: realTimeData.dataQuality
      });

      // Step 7: Calculate overall data quality score
      const dataQualityScore = calculateOverallDataQuality(realTimeData, betaResult);

      const result: RealAnalysisResult = {
        coinId: inputs.coinId,
        realTimeData: {
          priceHistory: realTimeData.priceHistory,
          volatility: realTimeData.volatility,
          cagr36m: realTimeData.cagr36m,
          avivRatio: realTimeData.avivRatio,
          activeSupply: realTimeData.activeSupply,
          vaultedSupply: realTimeData.vaultedSupply,
          dataQuality: realTimeData.dataQuality,
          lastUpdated: realTimeData.lastUpdated
        },
        monteCarloProjection: {
          expectedValue: monteCarloProjection.expectedValue,
          confidenceInterval: monteCarloProjection.confidenceInterval,
          probabilityOfLoss: monteCarloProjection.riskMetrics.probabilityOfLoss,
          valueAtRisk: monteCarloProjection.riskMetrics.valueAtRisk
        },
        betaAnalysis: {
          beta: betaResult.beta,
          correlation: betaResult.correlation,
          confidence: betaResult.confidence,
          dataPoints: betaResult.dataPoints
        },
        financialMetrics: {
          npv,
          irr,
          realCAGR: realTimeData.cagr36m,
          realVolatility: realTimeData.volatility,
          sharpeRatio
        },
        recommendation,
        dataQualityScore
      };

      console.log('✅ REAL analysis completed successfully!');
      console.log('📊 Results summary:', {
        npv: result.financialMetrics.npv,
        irr: result.financialMetrics.irr,
        recommendation: result.recommendation.action,
        dataQuality: result.dataQualityScore
      });

      return result;

    } catch (err) {
      console.error('❌ Real analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    analyzeInvestment
  };
};
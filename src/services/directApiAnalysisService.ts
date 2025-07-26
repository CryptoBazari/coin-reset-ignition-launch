
import { enhancedFallbackDataService } from './enhancedFallbackDataService';
import type { InvestmentInputs, AnalysisResult } from '@/types/investment';

export interface DirectApiAnalysisResult {
  metrics: {
    npv: number;
    irr: number;
    roi: number;
    cagr: number;
    beta: number;
    volatility: number;
    sharpeRatio: number;
    riskFactor: number;
    bitcoinAvivRatio?: number;
  };
  recommendation: {
    action: 'Buy' | 'Hold' | 'Sell' | 'Not Recommended';
    confidence: number;
    reasoning: string[];
    riskWarnings: string[];
  };
  dataQuality: {
    score: number;
    source: string;
    freshness: string;
    isLive: boolean;
  };
  coinData: {
    currentPrice: number;
    volume24h: number;
    marketCap: number;
    priceHistory: Array<{ date: string; price: number }>;
  };
  lastUpdated: string;
}

class DirectApiAnalysisService {
  
  async analyzeInvestment(inputs: InvestmentInputs): Promise<DirectApiAnalysisResult> {
    console.log('🚀 Starting direct API analysis with enhanced fallback support');
    
    try {
      // Get comprehensive analysis data with fallback support
      const analysisData = await enhancedFallbackDataService.getAnalysisData(
        inputs.coinId,
        inputs.coinId.toUpperCase(),
        inputs.investmentAmount,
        inputs.investmentHorizon
      );
      
      // Generate recommendation based on analysis
      const recommendation = this.generateRecommendation(
        analysisData.financial,
        analysisData.onChainMetrics,
        analysisData.marketTiming,
        inputs.coinId.toUpperCase()
      );
      
      // Determine data quality
      const dataQuality = {
        score: analysisData.financial.confidence,
        source: analysisData.financial.dataSource === 'live_api' ? 'Live API Data' : 'Enhanced Test Data',
        freshness: analysisData.financial.dataSource === 'live_api' ? 'Real-time' : 'Simulated',
        isLive: analysisData.financial.dataSource === 'live_api'
      };
      
      console.log(`✅ Analysis completed using ${dataQuality.source}`);
      
      return {
        metrics: {
          npv: analysisData.financial.npv,
          irr: analysisData.financial.irr,
          roi: analysisData.financial.roi,
          cagr: analysisData.financial.cagr,
          beta: analysisData.financial.beta,
          volatility: analysisData.financial.volatility,
          sharpeRatio: analysisData.financial.sharpeRatio,
          riskFactor: analysisData.financial.riskFactor,
          bitcoinAvivRatio: analysisData.onChainMetrics.avivRatio
        },
        recommendation,
        dataQuality,
        coinData: analysisData.coinData,
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Direct API analysis failed:', error);
      throw error;
    }
  }
  
  private generateRecommendation(
    financial: any,
    onChain: any,
    marketTiming: any,
    symbol: string
  ) {
    const reasoning: string[] = [];
    const riskWarnings: string[] = [];
    
    let action: 'Buy' | 'Hold' | 'Sell' | 'Not Recommended' = 'Hold';
    let confidence = 60;
    
    // Financial metrics analysis
    if (financial.npv > 0) {
      reasoning.push(`Positive NPV of $${financial.npv.toLocaleString()} indicates good investment potential`);
      confidence += 10;
    } else {
      riskWarnings.push(`Negative NPV of $${financial.npv.toLocaleString()} suggests poor returns`);
      confidence -= 10;
    }
    
    if (financial.cagr > 20) {
      reasoning.push(`Strong historical performance with ${financial.cagr}% CAGR`);
      action = 'Buy';
      confidence += 15;
    } else if (financial.cagr < 0) {
      riskWarnings.push(`Negative CAGR of ${financial.cagr}% shows declining value`);
      action = 'Sell';
      confidence += 10;
    }
    
    if (financial.sharpeRatio > 1) {
      reasoning.push(`Excellent risk-adjusted returns with Sharpe ratio of ${financial.sharpeRatio}`);
      confidence += 10;
    } else if (financial.sharpeRatio < 0) {
      riskWarnings.push(`Poor risk-adjusted returns with negative Sharpe ratio`);
    }
    
    // Volatility analysis
    if (financial.volatility > 80) {
      riskWarnings.push(`Very high volatility (${financial.volatility}%) - expect significant price swings`);
      confidence -= 5;
    } else if (financial.volatility < 40) {
      reasoning.push(`Moderate volatility (${financial.volatility}%) for crypto asset`);
      confidence += 5;
    }
    
    // Beta analysis
    if (financial.beta > 2) {
      riskWarnings.push(`High beta (${financial.beta}) indicates higher risk than market average`);
    } else if (financial.beta < 0.5) {
      reasoning.push(`Low beta (${financial.beta}) provides some stability`);
    }
    
    // On-chain metrics (if available)
    if (onChain.avivRatio && onChain.avivRatio < 0.8) {
      reasoning.push(`Low AVIV ratio (${onChain.avivRatio.toFixed(3)}) suggests undervaluation`);
      action = 'Buy';
      confidence += 15;
    } else if (onChain.avivRatio && onChain.avivRatio > 2.0) {
      riskWarnings.push(`High AVIV ratio (${onChain.avivRatio.toFixed(3)}) may indicate overvaluation`);
      if (action === 'Buy') action = 'Hold';
      confidence += 10;
    }
    
    // Market timing integration
    if (marketTiming.recommendation.includes('BUY')) {
      reasoning.push(...marketTiming.signals);
      if (action === 'Hold') action = 'Buy';
      confidence = Math.max(confidence, marketTiming.confidence);
    } else if (marketTiming.recommendation.includes('SELL')) {
      riskWarnings.push(...marketTiming.signals);
      if (action !== 'Buy') action = 'Sell';
    }
    
    // Risk factor adjustment
    if (financial.riskFactor >= 8) {
      riskWarnings.push(`High risk asset (${financial.riskFactor}/10) - only suitable for risk-tolerant investors`);
      confidence -= 5;
    }
    
    // Ensure minimum reasoning
    if (reasoning.length === 0) {
      reasoning.push(`Analysis based on ${financial.dataSource === 'live_api' ? 'live' : 'test'} data for ${symbol}`);
    }
    
    confidence = Math.min(95, Math.max(25, confidence));
    
    return {
      action,
      confidence,
      reasoning,
      riskWarnings
    };
  }
}

export const directApiAnalysisService = new DirectApiAnalysisService();

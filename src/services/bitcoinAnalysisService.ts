
import { bitcoinGlassNodeService } from './bitcoinGlassNodeService';
import { realDataFinancialCalculations } from './realDataFinancialCalculations';
import { bitcoinMarketAnalyzer } from './bitcoinMarketAnalyzer';
import { fetchGlassNodeMetric, GLASS_NODE_METRICS } from './glassNodeService';

export interface BitcoinAnalysisResult {
  // Standard financial metrics
  financialMetrics: {
    npv: number;
    cagr: number;
    irr: number;
    roi: number;
    beta: number;
    volatility: number;
    sharpeRatio: number;
  };
  
  // Bitcoin-specific cointime metrics
  cointimeMetrics: {
    avivRatio: number;
    activeSupply: number;
    vaultedSupply: number;
    cointimeDestroyed: number;
    cointimePrice: number;
    liquidSupply: number;
  };
  
  // Market state analysis
  marketState: {
    condition: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    summary: string;
    signals: any;
  };
  
  // Investment recommendation
  recommendation: {
    action: 'Buy' | 'Hold' | 'Sell' | 'Not Recommended';
    confidence: number;
    reasoning: string[];
    riskWarnings: string[];
  };
  
  dataQuality: {
    score: number;
    source: 'glassnode';
    freshness: string;
  };
  
  lastUpdated: string;
}

export class BitcoinAnalysisService {
  
  async analyzeBitcoinInvestment(
    investmentAmount: number,
    timeHorizon: number
  ): Promise<BitcoinAnalysisResult> {
    console.log('🟠 Starting comprehensive Bitcoin analysis with full cointime metrics');
    
    try {
      // Get Bitcoin cointime data
      const bitcoinData = await bitcoinGlassNodeService.getBitcoinCointimeData();
      
      // Calculate financial metrics using real Glassnode data
      const financialMetrics = await realDataFinancialCalculations.calculateRealMetrics(
        'bitcoin',
        'BTC',
        investmentAmount,
        timeHorizon,
        true // Bitcoin is always Glassnode supported
      );
      
      // Get Bitcoin market state
      const marketState = await bitcoinMarketAnalyzer.getBitcoinMarketState();
      
      // Get additional supply metrics
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const [liquidSupplyData, illiquidSupplyData] = await Promise.all([
        fetchGlassNodeMetric(GLASS_NODE_METRICS.LIQUID_SUPPLY, 'BTC', since),
        fetchGlassNodeMetric(GLASS_NODE_METRICS.ILLIQUID_SUPPLY, 'BTC', since)
      ]);
      
      // Calculate supply percentages
      const latestLiquid = this.getLatestValue(liquidSupplyData) || 0;
      const latestIlliquid = this.getLatestValue(illiquidSupplyData) || 0;
      const total = latestLiquid + latestIlliquid;
      
      const cointimeMetrics = {
        avivRatio: bitcoinData.avivRatio,
        activeSupply: total > 0 ? (latestLiquid / total) * 100 : 0,
        vaultedSupply: total > 0 ? (latestIlliquid / total) * 100 : 0,
        cointimeDestroyed: bitcoinData.cointimeDestroyed,
        cointimePrice: bitcoinData.cointimePrice,
        liquidSupply: latestLiquid
      };
      
      // Generate Bitcoin-specific recommendation
      const recommendation = this.generateBitcoinRecommendation(
        financialMetrics,
        cointimeMetrics,
        marketState
      );
      
      console.log('✅ Bitcoin analysis completed with full cointime metrics');
      
      return {
        financialMetrics: {
          npv: financialMetrics.npv,
          cagr: financialMetrics.cagr,
          irr: financialMetrics.irr,
          roi: financialMetrics.roi,
          beta: financialMetrics.beta,
          volatility: financialMetrics.volatility,
          sharpeRatio: financialMetrics.sharpeRatio
        },
        cointimeMetrics,
        marketState: {
          condition: marketState.condition,
          confidence: marketState.confidence,
          summary: marketState.summary,
          signals: marketState.signals
        },
        recommendation,
        dataQuality: {
          score: 95, // Bitcoin has the highest quality data
          source: 'glassnode',
          freshness: 'Real-time'
        },
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Bitcoin analysis failed:', error);
      throw error;
    }
  }
  
  private generateBitcoinRecommendation(
    financialMetrics: any,
    cointimeMetrics: any,
    marketState: any
  ) {
    const reasoning: string[] = [];
    const riskWarnings: string[] = [];
    
    let action: 'Buy' | 'Hold' | 'Sell' | 'Not Recommended' = 'Hold';
    let confidence = 60;
    
    // AVIV ratio analysis
    if (cointimeMetrics.avivRatio < 0.8) {
      reasoning.push(`Strong buy signal: AVIV ratio ${cointimeMetrics.avivRatio.toFixed(3)} indicates significant undervaluation`);
      action = 'Buy';
      confidence += 20;
    } else if (cointimeMetrics.avivRatio > 2.0) {
      riskWarnings.push(`High AVIV ratio ${cointimeMetrics.avivRatio.toFixed(3)} suggests potential overvaluation`);
      action = 'Sell';
      confidence += 15;
    }
    
    // Supply analysis
    if (cointimeMetrics.vaultedSupply > 75) {
      reasoning.push(`${cointimeMetrics.vaultedSupply.toFixed(1)}% vaulted supply shows strong HODLing behavior`);
      confidence += 10;
    } else if (cointimeMetrics.activeSupply > 85) {
      riskWarnings.push(`${cointimeMetrics.activeSupply.toFixed(1)}% active supply may indicate selling pressure`);
      confidence -= 5;
    }
    
    // Financial metrics
    if (financialMetrics.npv > 0) {
      reasoning.push(`Positive NPV of $${financialMetrics.npv.toLocaleString()} indicates good investment potential`);
      confidence += 5;
    }
    
    if (financialMetrics.cagr > 15) {
      reasoning.push(`Strong historical performance with ${financialMetrics.cagr.toFixed(1)}% CAGR`);
      confidence += 10;
    }
    
    // Market state integration
    if (marketState.condition === 'bullish') {
      reasoning.push(`Bitcoin market showing bullish signals with ${marketState.confidence}% confidence`);
      confidence += 10;
    } else if (marketState.condition === 'bearish') {
      riskWarnings.push(`Bitcoin market showing bearish signals with ${marketState.confidence}% confidence`);
      confidence -= 10;
    }
    
    // Risk warnings
    if (financialMetrics.volatility > 70) {
      riskWarnings.push(`High volatility (${financialMetrics.volatility.toFixed(1)}%) - expect significant price swings`);
    }
    
    if (financialMetrics.beta > 1.5) {
      riskWarnings.push(`High beta (${financialMetrics.beta.toFixed(2)}) - more volatile than market average`);
    }
    
    confidence = Math.min(95, Math.max(25, confidence));
    
    return {
      action,
      confidence,
      reasoning,
      riskWarnings
    };
  }
  
  private getLatestValue(data: Array<{ value: number }>): number | null {
    return data.length > 0 ? data[data.length - 1].value : null;
  }
}

export const bitcoinAnalysisService = new BitcoinAnalysisService();

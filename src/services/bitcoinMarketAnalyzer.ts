
import { bitcoinGlassNodeService } from './bitcoinGlassNodeService';
import { fetchGlassNodeMetric, GLASS_NODE_METRICS } from './glassNodeService';

export interface BitcoinMarketState {
  condition: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  signals: {
    aviv: 'bullish' | 'bearish' | 'neutral';
    volatility: 'bullish' | 'bearish' | 'neutral';
    mvrv: 'bullish' | 'bearish' | 'neutral';
    drawdown: 'bullish' | 'bearish' | 'neutral';
  };
  summary: string;
  lastUpdated: string;
  dataQuality: {
    usingRealData: boolean;
    apiSuccessRate: number;
    dataFreshness: string;
  };
}

export class BitcoinMarketAnalyzer {
  private cache: BitcoinMarketState | null = null;
  private lastUpdate = 0;
  private cacheExpiry = 300000; // 5 minutes

  async getBitcoinMarketState(): Promise<BitcoinMarketState> {
    if (this.cache && Date.now() - this.lastUpdate < this.cacheExpiry) {
      return this.cache;
    }

    console.log('🔍 Analyzing Bitcoin market state with REAL Glassnode data...');

    try {
      // Get comprehensive REAL Bitcoin data
      const bitcoinData = await bitcoinGlassNodeService.getBitcoinRealData();
      
      console.log('📊 Using REAL Glassnode data for Bitcoin market analysis:');
      console.log(`   - AVIV Ratio: ${bitcoinData.avivRatio.toFixed(3)} (${bitcoinData.dataQuality.avivFromAPI ? 'REAL API' : 'FALLBACK'})`);
      console.log(`   - Volatility: ${bitcoinData.realizedVolatility.toFixed(2)}% (${bitcoinData.dataQuality.volatilityFromAPI ? 'REAL API' : 'FALLBACK'})`);
      console.log(`   - MVRV Z-Score: ${bitcoinData.mvrvZScore.toFixed(3)} (${bitcoinData.dataQuality.mvrvFromAPI ? 'REAL API' : 'FALLBACK'})`);
      console.log(`   - Price Drawdown: ${bitcoinData.priceDrawdown.toFixed(3)}`);

      // Analyze signals using REAL data
      const signals = {
        aviv: this.analyzeAVIVSignal(bitcoinData.avivRatio),
        volatility: this.analyzeVolatilitySignal(bitcoinData.realizedVolatility),
        mvrv: this.analyzeMVRVSignal(bitcoinData.mvrvZScore),
        drawdown: this.analyzeDrawdownSignal(bitcoinData.priceDrawdown)
      };

      // Calculate overall market condition based on real signals
      const bullishSignals = Object.values(signals).filter(s => s === 'bullish').length;
      const bearishSignals = Object.values(signals).filter(s => s === 'bearish').length;
      
      let condition: 'bullish' | 'bearish' | 'neutral';
      let confidence: number;
      
      if (bullishSignals >= 3) {
        condition = 'bullish';
        confidence = Math.min(95, 70 + (bullishSignals * 8));
      } else if (bearishSignals >= 3) {
        condition = 'bearish';
        confidence = Math.min(95, 70 + (bearishSignals * 8));
      } else {
        condition = 'neutral';
        confidence = 50 + Math.abs(bullishSignals - bearishSignals) * 10;
      }

      // Adjust confidence based on data quality
      const apiSuccessRate = bitcoinData.dataQuality.apiCallsSuccessful / 
        (bitcoinData.dataQuality.apiCallsSuccessful + bitcoinData.dataQuality.apiCallsFailed);
      
      if (apiSuccessRate < 0.6) {
        confidence = Math.max(30, confidence * 0.7); // Reduce confidence if API calls failed
      }

      const summary = this.generateMarketSummary(condition, signals, bitcoinData);

      this.cache = {
        condition,
        confidence,
        signals,
        summary,
        lastUpdated: new Date().toISOString(),
        dataQuality: {
          usingRealData: apiSuccessRate > 0.5,
          apiSuccessRate: Math.round(apiSuccessRate * 100),
          dataFreshness: this.getDataFreshness(bitcoinData.lastUpdated)
        }
      };

      this.lastUpdate = Date.now();
      
      console.log(`📊 Bitcoin market analysis complete:`);
      console.log(`   - Condition: ${condition} (${confidence}% confidence)`);
      console.log(`   - API Success Rate: ${Math.round(apiSuccessRate * 100)}%`);
      console.log(`   - Using Real Data: ${apiSuccessRate > 0.5 ? 'YES' : 'PARTIAL'}`);
      
      return this.cache;
    } catch (error) {
      console.error('❌ Failed to analyze Bitcoin market state:', error);
      return this.getFallbackState();
    }
  }

  private analyzeAVIVSignal(avivRatio: number): 'bullish' | 'bearish' | 'neutral' {
    console.log(`📈 Analyzing AVIV signal: ${avivRatio.toFixed(3)}`);
    
    // AVIV ratio analysis based on historical Bitcoin patterns
    if (avivRatio < 0.7) {
      console.log('   → BULLISH: AVIV < 0.7 indicates undervaluation');
      return 'bullish'; // Undervalued
    }
    if (avivRatio > 2.5) {
      console.log('   → BEARISH: AVIV > 2.5 indicates overvaluation');
      return 'bearish'; // Overvalued
    }
    
    console.log('   → NEUTRAL: AVIV in normal range');
    return 'neutral';
  }

  private analyzeVolatilitySignal(volatility: number): 'bullish' | 'bearish' | 'neutral' {
    console.log(`📊 Analyzing volatility signal: ${volatility.toFixed(2)}%`);
    
    // Bitcoin volatility analysis
    if (volatility > 90) {
      console.log('   → BEARISH: High volatility indicates market stress');
      return 'bearish'; // High volatility = market stress
    }
    if (volatility < 30) {
      console.log('   → BULLISH: Low volatility indicates market stability');
      return 'bullish'; // Low volatility = stability
    }
    
    console.log('   → NEUTRAL: Normal volatility range');
    return 'neutral';
  }

  private analyzeMVRVSignal(mvrvZScore: number): 'bullish' | 'bearish' | 'neutral' {
    console.log(`📈 Analyzing MVRV Z-Score signal: ${mvrvZScore.toFixed(3)}`);
    
    // MVRV Z-Score analysis for Bitcoin market cycles
    if (mvrvZScore < -1.0) {
      console.log('   → BULLISH: MVRV Z-Score < -1 indicates undervaluation');
      return 'bullish'; // Undervalued
    }
    if (mvrvZScore > 6.0) {
      console.log('   → BEARISH: MVRV Z-Score > 6 indicates overvaluation');
      return 'bearish'; // Overvalued
    }
    
    console.log('   → NEUTRAL: MVRV Z-Score in normal range');
    return 'neutral';
  }

  private analyzeDrawdownSignal(drawdown: number): 'bullish' | 'bearish' | 'neutral' {
    console.log(`📉 Analyzing drawdown signal: ${drawdown.toFixed(3)}`);
    
    // Price drawdown analysis
    if (drawdown > 0.5) {
      console.log('   → BULLISH: Large drawdown indicates potential buying opportunity');
      return 'bullish'; // Large drawdowns can be buying opportunities
    }
    if (drawdown < 0.1) {
      console.log('   → BEARISH: Small drawdown indicates potential top');
      return 'bearish'; // Near all-time highs
    }
    
    console.log('   → NEUTRAL: Normal drawdown range');
    return 'neutral';
  }

  private generateMarketSummary(condition: string, signals: any, bitcoinData: any): string {
    const dataQualityNote = bitcoinData.dataQuality.apiCallsSuccessful > 3 
      ? "using real Glassnode API data" 
      : "with limited API data availability";
    
    const avivText = `AVIV ratio at ${bitcoinData.avivRatio.toFixed(3)}`;
    const volatilityText = `${bitcoinData.realizedVolatility.toFixed(1)}% realized volatility`;
    const mvrvText = `MVRV Z-Score at ${bitcoinData.mvrvZScore.toFixed(2)}`;
    
    switch (condition) {
      case 'bullish':
        return `Bitcoin shows bullish signals ${dataQualityNote}: ${avivText} suggests undervaluation, ${volatilityText}, and ${mvrvText} supports positive market structure.`;
      case 'bearish':
        return `Bitcoin shows bearish signals ${dataQualityNote}: ${avivText} indicates overvaluation concerns, ${volatilityText}, and ${mvrvText} suggests caution.`;
      default:
        return `Bitcoin market is neutral ${dataQualityNote}: ${avivText}, ${volatilityText}, and ${mvrvText} show mixed signals requiring patience.`;
    }
  }

  private getDataFreshness(lastUpdated: string): string {
    const updateTime = new Date(lastUpdated);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - updateTime.getTime()) / (1000 * 60));
    
    if (diffMinutes < 5) return 'Very Fresh';
    if (diffMinutes < 15) return 'Fresh';
    if (diffMinutes < 60) return 'Recent';
    return 'Stale';
  }

  private getFallbackState(): BitcoinMarketState {
    return {
      condition: 'neutral',
      confidence: 25,
      signals: {
        aviv: 'neutral',
        volatility: 'neutral',
        mvrv: 'neutral',
        drawdown: 'neutral'
      },
      summary: 'Bitcoin market state unavailable - Glassnode API connection failed. All analysis is based on fallback data.',
      lastUpdated: new Date().toISOString(),
      dataQuality: {
        usingRealData: false,
        apiSuccessRate: 0,
        dataFreshness: 'Unavailable'
      }
    };
  }

  clearCache(): void {
    this.cache = null;
    this.lastUpdate = 0;
  }
}

export const bitcoinMarketAnalyzer = new BitcoinMarketAnalyzer();

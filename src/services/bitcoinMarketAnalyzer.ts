
import { bitcoinGlassNodeService } from './bitcoinGlassNodeService';
import { fetchGlassNodeMetric, GLASS_NODE_METRICS } from './glassNodeService';

export interface BitcoinMarketState {
  condition: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  signals: {
    aviv: 'bullish' | 'bearish' | 'neutral';
    activeSupply: 'bullish' | 'bearish' | 'neutral';
    priceAction: 'bullish' | 'bearish' | 'neutral';
    onChainActivity: 'bullish' | 'bearish' | 'neutral';
  };
  summary: string;
  lastUpdated: string;
}

export class BitcoinMarketAnalyzer {
  private cache: BitcoinMarketState | null = null;
  private lastUpdate = 0;
  private cacheExpiry = 300000; // 5 minutes

  async getBitcoinMarketState(): Promise<BitcoinMarketState> {
    if (this.cache && Date.now() - this.lastUpdate < this.cacheExpiry) {
      return this.cache;
    }

    console.log('🔍 Analyzing Bitcoin market state with real Glassnode data...');

    try {
      // Get comprehensive Bitcoin data
      const bitcoinData = await bitcoinGlassNodeService.getBitcoinCointimeData();
      
      // Get additional metrics for market analysis
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
      const [priceData, activeAddressData] = await Promise.all([
        fetchGlassNodeMetric(GLASS_NODE_METRICS.PRICE_USD, 'BTC', since),
        fetchGlassNodeMetric(GLASS_NODE_METRICS.ACTIVE_ADDRESSES, 'BTC', since)
      ]);

      // Analyze signals
      const signals = {
        aviv: this.analyzeAVIVSignal(bitcoinData.avivRatio),
        activeSupply: this.analyzeActiveSupplySignal(bitcoinData.liquidSupply),
        priceAction: this.analyzePriceAction(priceData),
        onChainActivity: this.analyzeOnChainActivity(activeAddressData)
      };

      // Calculate overall market condition
      const bullishSignals = Object.values(signals).filter(s => s === 'bullish').length;
      const bearishSignals = Object.values(signals).filter(s => s === 'bearish').length;
      
      let condition: 'bullish' | 'bearish' | 'neutral';
      let confidence: number;
      
      if (bullishSignals >= 3) {
        condition = 'bullish';
        confidence = Math.min(95, 60 + (bullishSignals * 10));
      } else if (bearishSignals >= 3) {
        condition = 'bearish';
        confidence = Math.min(95, 60 + (bearishSignals * 10));
      } else {
        condition = 'neutral';
        confidence = 50 + Math.abs(bullishSignals - bearishSignals) * 5;
      }

      const summary = this.generateMarketSummary(condition, signals, bitcoinData);

      this.cache = {
        condition,
        confidence,
        signals,
        summary,
        lastUpdated: new Date().toISOString()
      };

      this.lastUpdate = Date.now();
      console.log(`📊 Bitcoin market state: ${condition} (${confidence}% confidence)`);
      
      return this.cache;
    } catch (error) {
      console.error('❌ Failed to analyze Bitcoin market state:', error);
      return this.getFallbackState();
    }
  }

  private analyzeAVIVSignal(avivRatio: number): 'bullish' | 'bearish' | 'neutral' {
    if (avivRatio < 0.8) return 'bullish'; // Undervalued
    if (avivRatio > 2.0) return 'bearish'; // Overvalued
    return 'neutral';
  }

  private analyzeActiveSupplySignal(liquidSupply: number): 'bullish' | 'bearish' | 'neutral' {
    // Higher liquid supply can indicate selling pressure
    if (liquidSupply > 85) return 'bearish';
    if (liquidSupply < 75) return 'bullish';
    return 'neutral';
  }

  private analyzePriceAction(priceData: Array<{ value: number }>): 'bullish' | 'bearish' | 'neutral' {
    if (priceData.length < 2) return 'neutral';
    
    const recent = priceData.slice(-3).map(p => p.value);
    const earlier = priceData.slice(-7, -3).map(p => p.value);
    
    if (recent.length === 0 || earlier.length === 0) return 'neutral';
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    
    const change = (recentAvg - earlierAvg) / earlierAvg;
    
    if (change > 0.05) return 'bullish';
    if (change < -0.05) return 'bearish';
    return 'neutral';
  }

  private analyzeOnChainActivity(activeAddressData: Array<{ value: number }>): 'bullish' | 'bearish' | 'neutral' {
    if (activeAddressData.length < 2) return 'neutral';
    
    const recent = activeAddressData.slice(-2).map(a => a.value);
    const earlier = activeAddressData.slice(-4, -2).map(a => a.value);
    
    if (recent.length === 0 || earlier.length === 0) return 'neutral';
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    
    const change = (recentAvg - earlierAvg) / earlierAvg;
    
    if (change > 0.03) return 'bullish';
    if (change < -0.03) return 'bearish';
    return 'neutral';
  }

  private generateMarketSummary(condition: string, signals: any, bitcoinData: any): string {
    const avivText = `AVIV ratio at ${bitcoinData.avivRatio.toFixed(3)}`;
    const supplyText = `liquid supply behavior`;
    
    switch (condition) {
      case 'bullish':
        return `Bitcoin shows bullish signals with ${avivText} suggesting potential undervaluation and favorable ${supplyText}.`;
      case 'bearish':
        return `Bitcoin shows bearish signals with ${avivText} indicating potential overvaluation and concerning ${supplyText}.`;
      default:
        return `Bitcoin market is in a neutral state with ${avivText} and mixed on-chain signals.`;
    }
  }

  private getFallbackState(): BitcoinMarketState {
    return {
      condition: 'neutral',
      confidence: 30,
      signals: {
        aviv: 'neutral',
        activeSupply: 'neutral',
        priceAction: 'neutral',
        onChainActivity: 'neutral'
      },
      summary: 'Bitcoin market state unavailable - using fallback neutral assessment.',
      lastUpdated: new Date().toISOString()
    };
  }

  clearCache(): void {
    this.cache = null;
    this.lastUpdate = 0;
  }
}

export const bitcoinMarketAnalyzer = new BitcoinMarketAnalyzer();

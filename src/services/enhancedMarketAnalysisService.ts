
import { analyzeBitcoinMarketState } from '@/utils/financialCalculations';
import type { CoinData, MarketConditions, MarketDataResult } from '@/types/investment';
import { fetchRealMarketData } from './realDataService';
import { fetchEconomicIndicators, calculateYieldCurveSpread, calculateInflationTrend } from './fredService';

export const getEnhancedMarketData = async (): Promise<MarketDataResult & {
  economicIndicators?: any;
  yieldCurveSpread?: number;
  inflationTrend?: number;
}> => {
  try {
    // Fetch real crypto market data
    const realData = await fetchRealMarketData(['BTC', 'ETH', 'SOL', 'ADA']);
    
    // Fetch comprehensive economic data from FRED
    const economicData = await fetchEconomicIndicators();
    
    let fedRateChange = 0;
    let yieldCurveSpread = 0;
    let inflationTrend = 0;
    
    if (economicData.fedFundsRate.length >= 2) {
      const currentRate = parseFloat(economicData.fedFundsRate[0].value);
      const previousRate = parseFloat(economicData.fedFundsRate[1].value);
      fedRateChange = currentRate - previousRate;
      console.log(`Fed rate change: ${fedRateChange.toFixed(2)}%`);
    }
    
    // Calculate yield curve spread (recession indicator)
    yieldCurveSpread = calculateYieldCurveSpread(
      economicData.treasuryYield10Y, 
      economicData.treasuryYield2Y
    );
    
    // Calculate current inflation trend
    inflationTrend = calculateInflationTrend(economicData.inflation);
    
    console.log(`Yield curve spread: ${yieldCurveSpread.toFixed(2)}%`);
    console.log(`Current inflation trend: ${inflationTrend.toFixed(2)}%`);
    
    if (realData && realData.length > 0) {
      console.log('Using real market data from CoinMarketCap with FRED economic data');
      
      // Enhanced sentiment analysis using economic indicators
      const btcData = realData.find(coin => coin.symbol === 'BTC');
      let sentimentScore = btcData ? 
        (btcData.price_change_24h > 5 ? 1 : btcData.price_change_24h < -5 ? -1 : 0) : 0;
      
      // Adjust sentiment based on economic conditions
      if (yieldCurveSpread < 0) sentimentScore -= 0.5; // Inverted yield curve = bearish
      if (inflationTrend > 4) sentimentScore -= 0.3; // High inflation = bearish for crypto
      if (economicData.consumerSentiment.length > 0) {
        const sentiment = parseFloat(economicData.consumerSentiment[0].value);
        if (sentiment < 70) sentimentScore -= 0.2; // Low consumer sentiment
      }
      
      const marketSentiment = {
        sentiment_score: Math.max(-1, Math.min(1, sentimentScore)),
        smart_money_activity: btcData ? btcData.price_change_24h < -10 : false
      };

      return { 
        fedRateChange, 
        marketSentiment, 
        realMarketData: realData,
        economicIndicators: economicData,
        yieldCurveSpread,
        inflationTrend
      };
    }
  } catch (error) {
    console.error('Failed to fetch enhanced market data, falling back to basic:', error);
  }

  // Fallback to basic data
  console.log('Using basic market data');
  return {
    fedRateChange: 0,
    marketSentiment: {
      sentiment_score: 0,
      smart_money_activity: false
    }
  };
};

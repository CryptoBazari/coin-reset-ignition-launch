import { analyzeBitcoinMarketState } from '@/utils/financialCalculations';
import type { CoinData, MarketConditions } from '@/types/investment';
import { fetchRealMarketData } from './realDataService';

export const createMarketConditions = (
  coinData: CoinData,
  marketSentiment: { sentiment_score: number; smart_money_activity: boolean },
  fedRateChange: number
): MarketConditions => {
  // Analyze Bitcoin market state using Cointime Economics
  const bitcoinState = analyzeBitcoinMarketState(
    coinData.aviv_ratio,
    coinData.active_supply,
    coinData.vaulted_supply,
    marketSentiment.smart_money_activity
  );

  return {
    bitcoinState,
    sentimentScore: marketSentiment.sentiment_score,
    smartMoneyActivity: marketSentiment.smart_money_activity,
    fedRateChange,
    avivRatio: coinData.aviv_ratio,
    activeSupply: coinData.active_supply,
    vaultedSupply: coinData.vaulted_supply
  };
};

export const getMarketData = async () => {
  // Try to fetch real data first
  try {
    const realData = await fetchRealMarketData(['BTC', 'ETH', 'SOL', 'ADA']);
    
    if (realData && realData.length > 0) {
      console.log('Using real market data from CoinMarketCap');
      
      // Extract Fed rate data (simulated for now until you add Fed API)
      const fedRateChange = 0; // Neutral rate - will be real when Fed API is added
      
      // Extract market sentiment from price changes (basic sentiment analysis)
      const btcData = realData.find(coin => coin.symbol === 'BTC');
      const sentimentScore = btcData ? 
        (btcData.price_change_24h > 5 ? 1 : btcData.price_change_24h < -5 ? -1 : 0) : 0;
      
      const marketSentiment = {
        sentiment_score: sentimentScore,
        smart_money_activity: btcData ? btcData.price_change_24h < -10 : false // Large drops might indicate smart money selling
      };

      return { fedRateChange, marketSentiment, realMarketData: realData };
    }
  } catch (error) {
    console.error('Failed to fetch real market data, falling back to simulated:', error);
  }

  // Fallback to simulated data
  console.log('Using simulated market data');
  return getSimulatedMarketData();
};

export const getSimulatedMarketData = () => {
  // Simulate Fed rate data (4.5% neutral rate)
  const fedRateChange = 0; // No recent change

  // Fetch latest market sentiment (simulated for now)
  const marketSentiment = {
    sentiment_score: 0, // Neutral
    smart_money_activity: false
  };

  return { fedRateChange, marketSentiment };
};

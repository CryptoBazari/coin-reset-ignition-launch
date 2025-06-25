
import { analyzeBitcoinMarketState } from '@/utils/financialCalculations';
import type { CoinData, MarketConditions } from '@/types/investment';

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

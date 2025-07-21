import { analyzeBitcoinMarketState } from '@/utils/financialCalculations';
import type { CoinData, MarketConditions, MarketDataResult } from '@/types/investment';
import { fetchRealMarketData } from './realDataService';
import { fetchFedFundsRate } from './alphaVantageService';

export const createMarketConditions = (
  coinData: CoinData,
  marketSentiment: { sentiment_score: number; smart_money_activity: boolean },
  fedRateChange: number
): MarketConditions => {
  console.log('🎯 Creating market conditions with Bitcoin AVIV ratio:', coinData.aviv_ratio);
  
  // IMPORTANT: coinData.aviv_ratio should now ALWAYS contain Bitcoin's AVIV ratio
  // regardless of the selected coin, as updated in the analysis hooks
  const bitcoinState = analyzeBitcoinMarketState(
    coinData.aviv_ratio, // This is now always Bitcoin AVIV ratio
    coinData.active_supply,
    coinData.vaulted_supply,
    marketSentiment.smart_money_activity
  );

  console.log(`📊 Bitcoin market state: ${bitcoinState} (AVIV: ${coinData.aviv_ratio.toFixed(3)})`);

  return {
    bitcoinState,
    sentimentScore: marketSentiment.sentiment_score,
    smartMoneyActivity: marketSentiment.smart_money_activity,
    fedRateChange,
    avivRatio: coinData.aviv_ratio, // Always Bitcoin AVIV ratio
    activeSupply: coinData.active_supply,
    vaultedSupply: coinData.vaulted_supply
  };
};

export const getMarketData = async (): Promise<MarketDataResult> => {
  try {
    const realData = await fetchRealMarketData(['BTC', 'ETH', 'SOL', 'ADA']);
    
    if (realData && realData.length > 0) {
      console.log('Using real market data from CoinMarketCap');
      
      const fedRateData = await fetchFedFundsRate();
      let fedRateChange = 0;
      
      if (fedRateData && fedRateData.length >= 2) {
        const currentRate = parseFloat(fedRateData[0].value);
        const previousRate = parseFloat(fedRateData[1].value);
        fedRateChange = currentRate - previousRate;
        console.log(`Fed rate change: ${fedRateChange.toFixed(2)}%`);
      }
      
      const btcData = realData.find(coin => coin.symbol === 'BTC');
      const sentimentScore = btcData ? 
        (btcData.price_change_24h > 5 ? 1 : btcData.price_change_24h < -5 ? -1 : 0) : 0;
      
      const marketSentiment = {
        sentiment_score: sentimentScore,
        smart_money_activity: btcData ? btcData.price_change_24h < -10 : false
      };

      return { fedRateChange, marketSentiment, realMarketData: realData };
    }
  } catch (error) {
    console.error('Failed to fetch real market data, falling back to simulated:', error);
  }

  console.log('Using simulated market data');
  return getSimulatedMarketData();
};

export const getSimulatedMarketData = (): MarketDataResult => {
  const fedRateChange = 0;

  const marketSentiment = {
    sentiment_score: 0,
    smart_money_activity: false
  };

  return { fedRateChange, marketSentiment };
};


import { supabase } from '@/integrations/supabase/client';

export interface CoinMarketCapCoin {
  id: number;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  price_change_24h: number;
  price_change_7d?: number;
  price_change_30d?: number;
  logo?: string;
}

export const fetchCoinListings = async (limit: number = 100): Promise<CoinMarketCapCoin[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-market-data', {
      body: { 
        fetchListings: true, 
        limit,
        includeLogo: true
      }
    });

    if (error) {
      console.error('Error fetching coin listings:', error);
      return [];
    }

    return data?.data || [];
  } catch (error) {
    console.error('Error calling coin listings function:', error);
    return [];
  }
};

export const fetchCoinPrices = async (symbols: string[]): Promise<CoinMarketCapCoin[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-market-data', {
      body: { 
        coinSymbols: symbols,
        includeLogo: true
      }
    });

    if (error) {
      console.error('Error fetching coin prices:', error);
      return [];
    }

    return data?.data || [];
  } catch (error) {
    console.error('Error calling coin prices function:', error);
    return [];
  }
};

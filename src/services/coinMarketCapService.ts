
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
    console.log('Fetching coin listings from CoinMarketCap...');
    
    const { data, error } = await supabase.functions.invoke('fetch-market-data', {
      body: { 
        fetchListings: true, 
        limit,
        includeLogo: true
      }
    });

    if (error) {
      console.error('Error fetching coin listings:', error);
      throw new Error('Failed to fetch coin listings from CoinMarketCap');
    }

    if (!data?.data || !Array.isArray(data.data)) {
      throw new Error('Invalid response format from CoinMarketCap API');
    }

    console.log('Successfully fetched coin listings:', data.data.length, 'coins');
    return data.data;
  } catch (error) {
    console.error('Error calling coin listings function:', error);
    throw error;
  }
};

export const fetchCoinPrices = async (symbols: string[]): Promise<CoinMarketCapCoin[]> => {
  try {
    console.log('Fetching coin prices for symbols:', symbols);
    
    const { data, error } = await supabase.functions.invoke('fetch-market-data', {
      body: { 
        coinSymbols: symbols,
        includeLogo: true
      }
    });

    if (error) {
      console.error('Error fetching coin prices:', error);
      throw new Error('Failed to fetch coin prices from CoinMarketCap');
    }

    if (!data?.data || !Array.isArray(data.data)) {
      throw new Error('Invalid response format from CoinMarketCap API');
    }

    console.log('Successfully fetched coin prices');
    return data.data;
  } catch (error) {
    console.error('Error calling coin prices function:', error);
    throw error;
  }
};

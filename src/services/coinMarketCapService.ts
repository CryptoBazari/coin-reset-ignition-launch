
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
      // Return mock data as fallback
      return getMockCoinData();
    }

    console.log('Successfully fetched coin listings:', data?.data?.length || 0, 'coins');
    return data?.data || getMockCoinData();
  } catch (error) {
    console.error('Error calling coin listings function:', error);
    // Return mock data as fallback
    return getMockCoinData();
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
      return [];
    }

    console.log('Successfully fetched coin prices');
    return data?.data || [];
  } catch (error) {
    console.error('Error calling coin prices function:', error);
    return [];
  }
};

// Mock data as fallback when API is not available
const getMockCoinData = (): CoinMarketCapCoin[] => {
  return [
    {
      id: 1,
      symbol: 'BTC',
      name: 'Bitcoin',
      current_price: 67000,
      market_cap: 1300000000000,
      price_change_24h: 2.5,
      logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png'
    },
    {
      id: 1027,
      symbol: 'ETH',
      name: 'Ethereum',
      current_price: 3500,
      market_cap: 420000000000,
      price_change_24h: 1.8,
      logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png'
    },
    {
      id: 52,
      symbol: 'XRP',
      name: 'XRP',
      current_price: 0.6,
      market_cap: 33000000000,
      price_change_24h: -0.5,
      logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/52.png'
    },
    {
      id: 5426,
      symbol: 'SOL',
      name: 'Solana',
      current_price: 150,
      market_cap: 70000000000,
      price_change_24h: 3.2,
      logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png'
    },
    {
      id: 74,
      symbol: 'DOGE',
      name: 'Dogecoin',
      current_price: 0.08,
      market_cap: 11000000000,
      price_change_24h: 1.1,
      logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/74.png'
    }
  ];
};

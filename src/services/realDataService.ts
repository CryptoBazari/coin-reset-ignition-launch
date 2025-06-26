
import { supabase } from '@/integrations/supabase/client';

export const fetchRealMarketData = async (coinSymbols: string[]) => {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-market-data', {
      body: { coinSymbols }
    });

    if (error) {
      console.error('Error fetching real market data:', error);
      return null;
    }

    return data?.data || null;
  } catch (error) {
    console.error('Error calling market data function:', error);
    return null;
  }
};

export const fetchRealBlockchainData = async (contractAddress: string, action = 'tokensupply') => {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-blockchain-data', {
      body: { contractAddress, action }
    });

    if (error) {
      console.error('Error fetching blockchain data:', error);
      return null;
    }

    return data?.data || null;
  } catch (error) {
    console.error('Error calling blockchain data function:', error);
    return null;
  }
};

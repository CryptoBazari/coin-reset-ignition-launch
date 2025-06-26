
import { supabase } from '@/integrations/supabase/client';
import { VirtualCoinData } from '@/types/portfolio';

class VirtualCoinService {
  async ensureVirtualCoin(coinData: VirtualCoinData) {
    console.log('Ensuring virtual coin exists:', coinData);
    
    // Check if coin already exists
    const { data: existingCoin } = await supabase
      .from('virtual_coins')
      .select('id')
      .eq('symbol', coinData.symbol)
      .maybeSingle();

    if (existingCoin) {
      console.log('Coin already exists:', existingCoin.id);
      return existingCoin.id;
    }

    // Create new coin - only include fields that exist in the table
    const insertData = {
      symbol: coinData.symbol,
      name: coinData.name
    };

    const { data: newCoin, error } = await supabase
      .from('virtual_coins')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating virtual coin:', error);
      throw error;
    }
    
    console.log('Created new coin:', newCoin.id);
    return newCoin.id;
  }
}

export const virtualCoinService = new VirtualCoinService();


import { supabase } from '@/integrations/supabase/client';
import type { CoinData } from '@/types/investment';

export const fetchCoinData = async (coinId: string): Promise<CoinData> => {
  const { data: coinDataRaw, error: coinError } = await supabase
    .from('coins')
    .select('*')
    .eq('coin_id', coinId)
    .single();

  if (coinError || !coinDataRaw) {
    throw new Error('Coin not found');
  }

  // Convert database record to CoinData interface
  return {
    id: coinDataRaw.id,
    coin_id: coinDataRaw.coin_id,
    name: coinDataRaw.name,
    basket: coinDataRaw.basket as 'Bitcoin' | 'Blue Chip' | 'Small-Cap',
    current_price: coinDataRaw.current_price,
    market_cap: coinDataRaw.market_cap,
    price_history: coinDataRaw.price_history,
    cagr_36m: coinDataRaw.cagr_36m,
    fundamentals_score: coinDataRaw.fundamentals_score,
    volatility: coinDataRaw.volatility,
    aviv_ratio: coinDataRaw.aviv_ratio,
    active_supply: coinDataRaw.active_supply,
    vaulted_supply: coinDataRaw.vaulted_supply,
    cointime_inflation: null, // Set to null since it's not in the database yet
    staking_yield: coinDataRaw.staking_yield
  };
};

export const fetchBasketAssumptions = async (basket: 'Bitcoin' | 'Blue Chip' | 'Small-Cap') => {
  const { data: assumptions, error: assumptionsError } = await supabase
    .from('assumptions')
    .select('*')
    .eq('basket', basket)
    .single();

  if (assumptionsError || !assumptions) {
    throw new Error('Failed to fetch basket assumptions');
  }

  return assumptions;
};

export const fetchBenchmarkData = async (benchmarkId: string) => {
  const { data: benchmark, error: benchmarkError } = await supabase
    .from('benchmarks')
    .select('*')
    .eq('benchmark_id', benchmarkId)
    .single();

  if (benchmarkError || !benchmark) {
    throw new Error('Failed to fetch benchmark data');
  }

  return benchmark;
};

export const storeAnalysisResult = async (analysisData: any) => {
  await supabase.from('investment_analyses').insert(analysisData);
};

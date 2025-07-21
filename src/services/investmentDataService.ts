
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
    basket: coinDataRaw.basket,
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
    staking_yield: coinDataRaw.staking_yield,
    // Enhanced risk metrics
    beta: coinDataRaw.beta,
    beta_last_calculated: coinDataRaw.beta_last_calculated,
    beta_data_source: coinDataRaw.beta_data_source,
    beta_confidence: coinDataRaw.beta_confidence,
    standard_deviation: coinDataRaw.standard_deviation,
    sharpe_ratio: coinDataRaw.sharpe_ratio
  };
};

export const fetchBasketAssumptions = async (basket: 'bitcoin' | 'blue_chip' | 'small_cap') => {
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
  // Enhanced analysis data with new metrics
  const enhancedData = {
    ...analysisData,
    // Add new enhanced metrics fields
    price_cagr: analysisData.price_cagr,
    total_return_cagr: analysisData.total_return_cagr,
    price_roi: analysisData.price_roi,
    staking_roi: analysisData.staking_roi,
    beta: analysisData.beta,
    standard_deviation: analysisData.standard_deviation,
    sharpe_ratio: analysisData.sharpe_ratio,
    risk_adjusted_npv: analysisData.risk_adjusted_npv,
    allocation_status: analysisData.allocation_status,
    portfolio_compliant: analysisData.portfolio_compliant
  };
  
  await supabase.from('investment_analyses').insert(enhancedData);
};

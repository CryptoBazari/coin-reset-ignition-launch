
import { supabase } from '@/integrations/supabase/client';

export interface GlassNodeDataPoint {
  timestamp: string;
  value: number;
  unix_timestamp: number;
}

export interface GlassNodeMetric {
  metric: string;
  asset: string;
  data: GlassNodeDataPoint[];
}

// Common Glass Node metrics for crypto analysis
export const GLASS_NODE_METRICS = {
  // Price metrics
  PRICE_USD: 'market/price_usd_close',
  MARKET_CAP: 'market/marketcap_usd',
  
  // On-chain metrics
  ACTIVE_ADDRESSES: 'addresses/active_count',
  NEW_ADDRESSES: 'addresses/new_non_zero_count',
  WHALE_ADDRESSES: 'addresses/count_1k_10k',
  
  // Network metrics
  HASH_RATE: 'mining/hash_rate_mean',
  DIFFICULTY: 'mining/difficulty_latest',
  
  // Supply metrics
  CIRCULATING_SUPPLY: 'supply/current',
  LIQUID_SUPPLY: 'supply/liquid_sum',
  ILLIQUID_SUPPLY: 'supply/illiquid_sum',
  
  // Exchange metrics
  EXCHANGE_INFLOW: 'transactions/transfers_to_exchanges_sum',
  EXCHANGE_OUTFLOW: 'transactions/transfers_from_exchanges_sum',
  EXCHANGE_BALANCE: 'distribution/balance_exchanges',
  
  // HODL metrics
  HODL_WAVES: 'supply/hodl_waves',
  LONG_TERM_HOLDERS: 'supply/lth_sum',
  SHORT_TERM_HOLDERS: 'supply/sth_sum',
  
  // Derivatives
  FUTURES_VOLUME: 'derivatives/futures_volume_daily_sum',
  OPTIONS_VOLUME: 'derivatives/options_volume_daily_sum',
  
  // Cointime metrics
  COINTIME_DESTROYED: 'indicators/cdd',
  COINTIME_PRICE: 'indicators/ctp',
  COINTIME_CAP: 'indicators/ctc'
};

export const fetchGlassNodeMetric = async (
  metric: string,
  asset: string = 'BTC',
  since?: Date,
  until?: Date,
  resolution?: '1h' | '24h' | '1w' | '1month'
): Promise<GlassNodeDataPoint[]> => {
  try {
    console.log(`Fetching Glass Node metric: ${metric} for ${asset}`);
    
    const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
      body: { 
        metric,
        asset,
        since: since?.toISOString(),
        until: until?.toISOString(),
        resolution
      }
    });

    if (error) {
      console.error('Error fetching Glass Node data:', error);
      throw new Error(`Failed to fetch Glass Node data: ${error.message}`);
    }

    return data?.data || [];
  } catch (error) {
    console.error('Error calling Glass Node function:', error);
    throw error;
  }
};

// Get multiple metrics at once
export const fetchMultipleGlassNodeMetrics = async (
  metrics: string[],
  asset: string = 'BTC',
  since?: Date,
  until?: Date
): Promise<GlassNodeMetric[]> => {
  try {
    const promises = metrics.map(metric => 
      fetchGlassNodeMetric(metric, asset, since, until)
        .then(data => ({ metric, asset, data }))
        .catch(error => {
          console.error(`Failed to fetch ${metric}:`, error);
          return { metric, asset, data: [] };
        })
    );

    return await Promise.all(promises);
  } catch (error) {
    console.error('Error fetching multiple Glass Node metrics:', error);
    return [];
  }
};

// Cointime formulas implementation
export const calculateCointimeMetrics = (
  priceData: GlassNodeDataPoint[],
  cointimeData: GlassNodeDataPoint[]
) => {
  if (priceData.length === 0 || cointimeData.length === 0) {
    return { cointimePrice: 0, cointimeRatio: 0 };
  }

  const latestPrice = priceData[priceData.length - 1]?.value || 0;
  const latestCointime = cointimeData[cointimeData.length - 1]?.value || 0;
  
  // Cointime Price = Price / Cointime Destroyed
  const cointimePrice = latestCointime > 0 ? latestPrice / latestCointime : 0;
  
  // Cointime Ratio = Current Cointime / Historical Average
  const avgCointime = cointimeData.reduce((sum, point) => sum + point.value, 0) / cointimeData.length;
  const cointimeRatio = avgCointime > 0 ? latestCointime / avgCointime : 0;

  return { cointimePrice, cointimeRatio };
};

// Get comprehensive on-chain analysis
export const getOnChainAnalysis = async (
  asset: string = 'BTC',
  days: number = 30
): Promise<{
  price: GlassNodeDataPoint[];
  activeAddresses: GlassNodeDataPoint[];
  exchangeFlow: { inflow: GlassNodeDataPoint[]; outflow: GlassNodeDataPoint[] };
  supply: { liquid: GlassNodeDataPoint[]; illiquid: GlassNodeDataPoint[] };
  cointime: GlassNodeDataPoint[];
}> => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const until = new Date();

  try {
    const [
      price,
      activeAddresses,
      exchangeInflow,
      exchangeOutflow,
      liquidSupply,
      illiquidSupply,
      cointime
    ] = await Promise.all([
      fetchGlassNodeMetric(GLASS_NODE_METRICS.PRICE_USD, asset, since, until),
      fetchGlassNodeMetric(GLASS_NODE_METRICS.ACTIVE_ADDRESSES, asset, since, until),
      fetchGlassNodeMetric(GLASS_NODE_METRICS.EXCHANGE_INFLOW, asset, since, until),
      fetchGlassNodeMetric(GLASS_NODE_METRICS.EXCHANGE_OUTFLOW, asset, since, until),
      fetchGlassNodeMetric(GLASS_NODE_METRICS.LIQUID_SUPPLY, asset, since, until),
      fetchGlassNodeMetric(GLASS_NODE_METRICS.ILLIQUID_SUPPLY, asset, since, until),
      fetchGlassNodeMetric(GLASS_NODE_METRICS.COINTIME_DESTROYED, asset, since, until)
    ]);

    return {
      price,
      activeAddresses,
      exchangeFlow: { inflow: exchangeInflow, outflow: exchangeOutflow },
      supply: { liquid: liquidSupply, illiquid: illiquidSupply },
      cointime
    };
  } catch (error) {
    console.error('Error fetching on-chain analysis:', error);
    return {
      price: [],
      activeAddresses: [],
      exchangeFlow: { inflow: [], outflow: [] },
      supply: { liquid: [], illiquid: [] },
      cointime: []
    };
  }
};

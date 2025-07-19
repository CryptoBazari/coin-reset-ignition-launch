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
  PRICE_REALIZED_USD: 'market/price_realized_usd',
  MARKET_CAP: 'market/marketcap_usd',
  
  // Volatility metrics
  REALIZED_VOLATILITY: 'market/realized_volatility_all',
  
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
  COINTIME_CAP: 'indicators/ctc',
  
  // AVIV Ratio - Premium Glass Node metric
  AVIV_RATIO: 'indicators/aviv'
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

// Get historical price data using realized price
export const fetchHistoricalRealizedPrice = async (
  asset: string = 'BTC',
  since?: Date,
  until?: Date,
  resolution?: '1h' | '24h' | '1w' | '1month'
): Promise<GlassNodeDataPoint[]> => {
  try {
    console.log(`Fetching historical realized price data for ${asset}`);
    
    return await fetchGlassNodeMetric(
      GLASS_NODE_METRICS.PRICE_REALIZED_USD,
      asset,
      since,
      until,
      resolution
    );
  } catch (error) {
    console.error('Error fetching historical realized price:', error);
    return [];
  }
};

// Get volatility data
export const fetchRealizedVolatility = async (
  asset: string = 'BTC',
  since?: Date,
  until?: Date,
  resolution?: '1h' | '24h' | '1w' | '1month'
): Promise<GlassNodeDataPoint[]> => {
  try {
    console.log(`Fetching realized volatility data for ${asset}`);
    
    return await fetchGlassNodeMetric(
      GLASS_NODE_METRICS.REALIZED_VOLATILITY,
      asset,
      since,
      until,
      resolution
    );
  } catch (error) {
    console.error('Error fetching realized volatility:', error);
    return [];
  }
};

// Get comprehensive volatility and price analysis
export const getVolatilityPriceAnalysis = async (
  asset: string = 'BTC',
  days: number = 30
): Promise<{
  historicalPrice: GlassNodeDataPoint[];
  realizedPrice: GlassNodeDataPoint[];
  realizedVolatility: GlassNodeDataPoint[];
  analysis: {
    currentVolatility: number;
    averageVolatility: number;
    priceDeviation: number;
    volatilityTrend: 'increasing' | 'decreasing' | 'stable';
  };
}> => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const until = new Date();

  try {
    const [historicalPrice, realizedPrice, realizedVolatility] = await Promise.all([
      fetchGlassNodeMetric(GLASS_NODE_METRICS.PRICE_USD, asset, since, until),
      fetchHistoricalRealizedPrice(asset, since, until),
      fetchRealizedVolatility(asset, since, until)
    ]);

    // Calculate analysis metrics
    const currentVolatility = realizedVolatility.length > 0 
      ? realizedVolatility[realizedVolatility.length - 1].value 
      : 0;
    
    const averageVolatility = realizedVolatility.length > 0
      ? realizedVolatility.reduce((sum, point) => sum + point.value, 0) / realizedVolatility.length
      : 0;

    // Calculate price deviation between historical and realized price
    const priceDeviation = historicalPrice.length > 0 && realizedPrice.length > 0
      ? Math.abs(historicalPrice[historicalPrice.length - 1].value - realizedPrice[realizedPrice.length - 1].value) / historicalPrice[historicalPrice.length - 1].value * 100
      : 0;

    // Determine volatility trend
    let volatilityTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (realizedVolatility.length >= 10) {
      const recent = realizedVolatility.slice(-5).reduce((sum, p) => sum + p.value, 0) / 5;
      const earlier = realizedVolatility.slice(-10, -5).reduce((sum, p) => sum + p.value, 0) / 5;
      
      if (recent > earlier * 1.1) volatilityTrend = 'increasing';
      else if (recent < earlier * 0.9) volatilityTrend = 'decreasing';
    }

    return {
      historicalPrice,
      realizedPrice,
      realizedVolatility,
      analysis: {
        currentVolatility,
        averageVolatility,
        priceDeviation,
        volatilityTrend
      }
    };
  } catch (error) {
    console.error('Error fetching volatility and price analysis:', error);
    return {
      historicalPrice: [],
      realizedPrice: [],
      realizedVolatility: [],
      analysis: {
        currentVolatility: 0,
        averageVolatility: 0,
        priceDeviation: 0,
        volatilityTrend: 'stable'
      }
    };
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

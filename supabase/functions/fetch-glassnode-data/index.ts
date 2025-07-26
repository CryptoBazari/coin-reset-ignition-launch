import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GlassNodeResponse {
  t: number; // timestamp
  v: number; // value
}

// Fixed endpoint configurations with correct resolution parameters
const ENDPOINT_CONFIGS = {
  'market/price_usd_close': { resolutions: ['24h'], defaultRes: '24h' },
  'market/price_usd_ohlc': { resolutions: ['24h'], defaultRes: '24h' },
  'market/amer_30d_price_change': { resolutions: ['24h'], defaultRes: '24h' },
  'market/apac_30d_price_change': { resolutions: ['24h'], defaultRes: '24h' },
  'market/emea_30d_price_change': { resolutions: ['24h'], defaultRes: '24h' },
  'market/realized_volatility_all': { resolutions: ['24h'], defaultRes: '24h' },
  'indicators/net_realized_profit_loss': { resolutions: ['24h'], defaultRes: '24h' },
  'market/mvrv_z_score': { resolutions: ['24h'], defaultRes: '24h' },
  'market/price_drawdown_relative': { resolutions: ['24h'], defaultRes: '24h' },
  'transactions/transfers_volume_mean': { resolutions: ['10m', '1h', '24h'], defaultRes: '24h' },
  'addresses/active_count': { resolutions: ['24h'], defaultRes: '24h' },
  'transactions/transfers_to_exchanges_sum': { resolutions: ['24h'], defaultRes: '24h' },
  'transactions/transfers_from_exchanges_sum': { resolutions: ['24h'], defaultRes: '24h' },
  'supply/liquid_sum': { resolutions: ['24h'], defaultRes: '24h' },
  'supply/illiquid_sum': { resolutions: ['24h'], defaultRes: '24h' },
  'indicators/cdd': { resolutions: ['24h'], defaultRes: '24h' },
  'indicators/aviv': { resolutions: ['24h'], defaultRes: '24h' },
  'indicators/coin_blocks_destroyed': { resolutions: ['24h'], defaultRes: '24h' }
};

// Comprehensive list of supported metrics for different assets
const SUPPORTED_METRICS = {
  'BTC': [
    'market/price_usd_close',
    'market/price_usd_ohlc',
    'market/amer_30d_price_change',
    'market/apac_30d_price_change',
    'market/emea_30d_price_change',
    'market/realized_volatility_all',
    'indicators/net_realized_profit_loss',
    'market/mvrv_z_score',
    'market/price_drawdown_relative',
    'transactions/transfers_volume_mean',
    'addresses/active_count',
    'transactions/transfers_to_exchanges_sum',
    'transactions/transfers_from_exchanges_sum',
    'supply/liquid_sum',
    'supply/illiquid_sum',
    'indicators/cdd',
    'indicators/aviv',
    'indicators/coin_blocks_destroyed'
  ],
  'ETH': [
    'market/price_usd_close',
    'market/price_usd_ohlc',
    'market/amer_30d_price_change',
    'market/apac_30d_price_change',
    'market/emea_30d_price_change',
    'market/realized_volatility_all',
    'indicators/net_realized_profit_loss',
    'market/mvrv_z_score',
    'market/price_drawdown_relative',
    'transactions/transfers_volume_mean',
    'addresses/active_count',
    'transactions/transfers_to_exchanges_sum',
    'transactions/transfers_from_exchanges_sum'
  ],
  'SOL': [
    'market/price_usd_close',
    'market/price_usd_ohlc',
    'addresses/active_count'
  ],
  'ADA': [
    'market/price_usd_close',
    'market/price_usd_ohlc',
    'addresses/active_count'
  ],
  'LTC': [
    'market/price_usd_close',
    'market/price_usd_ohlc',
    'addresses/active_count'
  ]
};

/**
 * Sample data to monthly intervals with proper date alignment
 */
function sampleDataToMonthly(data: any[]): any[] {
  if (!data || data.length === 0) return [];

  // Group data by month and take the last entry of each month
  const monthlyGroups = new Map<string, any>();
  
  data.forEach(point => {
    const date = new Date(point.timestamp);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    // Keep the latest entry for each month
    if (!monthlyGroups.has(monthKey) || new Date(point.timestamp) > new Date(monthlyGroups.get(monthKey)!.timestamp)) {
      monthlyGroups.set(monthKey, point);
    }
  });

  // Convert to array and sort by date
  const monthlyData = Array.from(monthlyGroups.values())
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  console.log(`📅 Properly sampled ${data.length} data points to ${monthlyData.length} monthly points`);
  return monthlyData;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { metric, asset, since, until, resolution, disableSampling } = await req.json();
    
    const glassNodeApiKey = Deno.env.get('GLASSNODE_API_KEY');
    
    if (!glassNodeApiKey) {
      console.error('Glass Node API key not found');
      return new Response(
        JSON.stringify({ error: 'Glass Node API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if metric is supported for this asset
    const supportedForAsset = SUPPORTED_METRICS[asset as keyof typeof SUPPORTED_METRICS];
    if (supportedForAsset && !supportedForAsset.includes(metric)) {
      console.log(`Metric ${metric} not supported for ${asset}, returning empty data`);
      return new Response(
        JSON.stringify({ 
          data: [], 
          metric, 
          asset, 
          warning: `Metric ${metric} not available for ${asset}` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get correct resolution for this endpoint
    const endpointConfig = ENDPOINT_CONFIGS[metric as keyof typeof ENDPOINT_CONFIGS];
    const correctResolution = endpointConfig ? endpointConfig.defaultRes : '24h';
    
    // Build query parameters with correct resolution
    const params = new URLSearchParams({
      a: asset || 'BTC',
      api_key: glassNodeApiKey,
      i: correctResolution // Use endpoint-specific resolution
    });

    // Add time range if provided (ensure Unix timestamps)
    if (since) {
      const sinceTimestamp = typeof since === 'string' ? Math.floor(new Date(since).getTime() / 1000) : since;
      const untilTimestamp = until ? (typeof until === 'string' ? Math.floor(new Date(until).getTime() / 1000) : until) : Math.floor(Date.now() / 1000);
      
      params.append('s', sinceTimestamp.toString());
      if (until) params.append('u', untilTimestamp.toString());
    }

    const glassNodeUrl = `https://api.glassnode.com/v1/metrics/${metric}?${params}`;
    
    console.log(`Fetching Glass Node data for metric: ${metric}, asset: ${asset}, resolution: ${correctResolution}`);
    
    const response = await fetch(glassNodeUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Glass Node API error: ${response.status} - ${errorText}`);
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized - Invalid Glass Node API key' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded for Glass Node API' }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else if (response.status === 404) {
        console.log(`Metric ${metric} not found for ${asset}, returning empty data`);
        return new Response(
          JSON.stringify({ 
            data: [], 
            metric, 
            asset, 
            warning: `Metric not available: ${metric}` 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      // Return empty data instead of throwing error to allow other endpoints to work
      console.log(`Glass Node API error for ${metric}, returning empty data`);
      return new Response(
        JSON.stringify({ 
          data: [], 
          metric, 
          asset, 
          warning: `Data unavailable for ${metric}: ${errorText}` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data: GlassNodeResponse[] = await response.json();
    console.log(`Successfully fetched ${data.length} Glass Node data points for ${metric}`);

    // Check if we got empty data and log for debugging
    if (data.length === 0) {
      console.warn(`⚠️ No data returned from Glassnode for ${metric} on asset ${asset}`);
      console.warn(`Request params: since=${since}, until=${until}`);
    }

    // Transform the data with proper monthly sampling
    let processedData = data.map(point => ({
      timestamp: new Date(point.t * 1000).toISOString(),
      value: point.v,
      unix_timestamp: point.t,
      t: point.t, // Keep original timestamp for compatibility
      v: point.v  // Keep original value for compatibility
    }));

    // Apply monthly sampling if we have daily data spanning more than 2 months
    // Skip sampling if explicitly disabled (for beta calculations)
    if (processedData.length > 60 && !disableSampling) {
      processedData = sampleDataToMonthly(processedData);
    } else if (disableSampling) {
      console.log(`🔍 Beta calculation mode: Keeping all ${processedData.length} daily data points`);
    }

    return new Response(
      JSON.stringify({ data: processedData, metric, asset }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in fetch-glassnode-data function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

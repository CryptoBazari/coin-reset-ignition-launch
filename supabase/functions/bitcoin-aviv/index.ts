import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Market condition thresholds
const AVIV_THRESHOLDS = {
  STRONG_BUY: [0, 0.5],
  DCA_BUY: [0.5, 1.0],
  ACCUMULATE: [1.0, 1.5],
  NEUTRAL: [1.5, 1.9],
  PREPARE_SELL: [1.9, 2.5],
  STRONG_SELL: [2.5, Infinity]
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    const { data: cached } = await supabase
      .from('glassnode_cache')
      .select('data, created_at')
      .eq('cache_key', 'bitcoin-aviv')
      .single();

    if (cached && new Date(cached.created_at) > new Date(Date.now() - 15 * 60 * 1000)) {
      console.log('Returning cached Bitcoin AVIV data');
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Calculate Bitcoin CAGR
    const cagrResponse = await supabase.functions.invoke('calculate-standalone-cagr', {
      body: { asset: 'btc', years_back: 3 }
    });

    if (cagrResponse.error) throw new Error('Failed to calculate BTC CAGR');
    const btcCagr = cagrResponse.data.adjusted_cagr || 0;

    // Calculate Bitcoin Beta vs SP500
    const betaResponse = await supabase.functions.invoke('calculate-real-beta', {
      body: { coinSymbol: 'btc' }
    });

    if (betaResponse.error) throw new Error('Failed to calculate BTC Beta');
    const btcBeta = betaResponse.data.beta || 1;

    // Get risk-free rate (10Y Treasury)
    const { data: benchmarks } = await supabase
      .from('benchmarks')
      .select('current_value')
      .eq('benchmark_id', 'DGS10')
      .single();

    const riskFreeRate = (benchmarks?.current_value || 4.5) / 100;

    // Get Bitcoin volatility from cointime metrics
    const { data: cointime } = await supabase
      .from('cointime_metrics')
      .select('aviv_ratio')
      .eq('coin_id', 'btc')
      .order('metric_date', { ascending: false })
      .limit(1)
      .single();

    let avivRatio = cointime?.aviv_ratio || 1.5;

    // Calculate AVIV if not available
    if (!cointime?.aviv_ratio) {
      // Fetch recent volatility data
      const btcVolatility = Math.abs(btcCagr) * 0.8; // Simplified volatility estimate
      avivRatio = (btcCagr - riskFreeRate) / (btcVolatility * Math.abs(btcBeta));
    }

    // Determine market condition
    const marketCondition = Object.entries(AVIV_THRESHOLDS).find(
      ([_, [min, max]]) => avivRatio >= min && avivRatio < max
    )?.[0] || 'NEUTRAL';

    const result = {
      avivRatio: Number(avivRatio.toFixed(3)),
      marketCondition,
      timestamp: new Date().toISOString(),
      metrics: { 
        btcCagr: Number(btcCagr.toFixed(4)), 
        btcBeta: Number(btcBeta.toFixed(3)), 
        riskFreeRate: Number(riskFreeRate.toFixed(4))
      }
    };

    // Cache result
    await supabase
      .from('glassnode_cache')
      .upsert({
        cache_key: 'bitcoin-aviv',
        data: result,
        updated_at: new Date().toISOString()
      });

    console.log('Bitcoin AVIV calculated:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Bitcoin AVIV calculation error:', error);
    
    // Return cached result if available
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: cached } = await supabase
      .from('glassnode_cache')
      .select('data')
      .eq('cache_key', 'bitcoin-aviv')
      .single();

    if (cached) {
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      error: 'AVIV_CALCULATION_FAILED',
      message: error.message,
      fallback: {
        avivRatio: 1.5,
        marketCondition: 'NEUTRAL',
        timestamp: new Date().toISOString()
      }
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
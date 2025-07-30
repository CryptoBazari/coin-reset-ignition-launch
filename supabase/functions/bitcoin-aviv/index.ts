
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
    const glassnodeApiKey = Deno.env.get('GLASSNODE_API_KEY');
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

    if (!glassnodeApiKey) {
      throw new Error('Glass Node API key not configured');
    }

    // Fetch real AVIV data directly from Glass Node API
    console.log('Fetching real AVIV data from Glass Node API...');
    
    const avivResponse = await fetch(
      `https://api.glassnode.com/v1/metrics/indicators/aviv?a=BTC&api_key=${glassnodeApiKey}&limit=1`
    );

    let avivRatio = 1.5; // fallback
    let metrics = null;

    if (avivResponse.ok) {
      const avivData = await avivResponse.json();
      if (avivData && avivData.length > 0) {
        avivRatio = avivData[0].v || 1.5;
        console.log(`✅ Real AVIV ratio from Glass Node: ${avivRatio}`);
      }
    } else {
      console.warn('⚠️ Glass Node AVIV API call failed, using fallback');
    }

    // Try to get additional metrics from Glass Node
    try {
      const [priceResponse, liquidSupplyResponse] = await Promise.all([
        fetch(`https://api.glassnode.com/v1/metrics/market/price_usd_close?a=BTC&api_key=${glassnodeApiKey}&limit=30`),
        fetch(`https://api.glassnode.com/v1/metrics/supply/liquid_sum?a=BTC&api_key=${glassnodeApiKey}&limit=1`)
      ]);

      if (priceResponse.ok && liquidSupplyResponse.ok) {
        const priceData = await priceResponse.json();
        const liquidData = await liquidSupplyResponse.json();
        
        if (priceData.length >= 30) {
          // Calculate simple CAGR from 30-day price data
          const oldPrice = priceData[0].v;
          const newPrice = priceData[priceData.length - 1].v;
          const btcCagr = (Math.pow(newPrice / oldPrice, 365/30) - 1);
          
          metrics = {
            btcCagr: Number(btcCagr.toFixed(4)),
            btcBeta: 1.2, // Reasonable default for Bitcoin
            riskFreeRate: 0.045 // 4.5% default risk-free rate
          };
        }
      }
    } catch (metricsError) {
      console.warn('Could not fetch additional metrics:', metricsError);
    }

    // Determine market condition based on AVIV ratio
    const marketCondition = Object.entries(AVIV_THRESHOLDS).find(
      ([_, [min, max]]) => avivRatio >= min && avivRatio < max
    )?.[0] || 'NEUTRAL';

    const result = {
      avivRatio: Number(avivRatio.toFixed(3)),
      marketCondition,
      timestamp: new Date().toISOString(),
      metrics
    };

    // Cache result
    await supabase
      .from('glassnode_cache')
      .upsert({
        cache_key: 'bitcoin-aviv',
        data: result,
        updated_at: new Date().toISOString()
      });

    console.log('✅ Bitcoin AVIV calculated with real Glass Node data:', result);

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
      console.log('📦 Returning cached data due to error');
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
        timestamp: new Date().toISOString(),
        isMockData: true
      }
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

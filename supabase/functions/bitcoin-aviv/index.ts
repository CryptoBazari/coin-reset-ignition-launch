

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

    // Clear cache to force fresh data fetch
    await supabase
      .from('glassnode_cache')
      .delete()
      .eq('cache_key', 'bitcoin-aviv');

    console.log('Forcing fresh AVIV data fetch from Glass Node API...');

    if (!glassnodeApiKey) {
      throw new Error('Glass Node API key not configured');
    }

    // Fetch the most recent AVIV data from Glass Node API
    console.log('Fetching current AVIV data from Glass Node API...');
    
    let avivResponse;
    
    // First try: Get most recent data without time constraints
    try {
      avivResponse = await fetch(
        `https://api.glassnode.com/v1/metrics/indicators/aviv?a=BTC&api_key=${glassnodeApiKey}&limit=1`
      );
    } catch (error) {
      console.error('Primary AVIV API call failed:', error);
      
      // Fallback: Try with 'since' parameter for last 30 days
      const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
      console.log('Trying fallback with recent timeframe...');
      avivResponse = await fetch(
        `https://api.glassnode.com/v1/metrics/indicators/aviv?a=BTC&api_key=${glassnodeApiKey}&s=${thirtyDaysAgo}&limit=1`
      );
    }

    let avivRatio = 1.5; // fallback

    if (avivResponse.ok) {
      const avivData = await avivResponse.json();
      console.log('🔍 Raw Glass Node AVIV response:', JSON.stringify(avivData));
      
      if (avivData && avivData.length > 0) {
        // Get the LAST (most recent) value from the array, not the first
        const mostRecentEntry = avivData[avivData.length - 1];
        const rawValue = mostRecentEntry.v;
        const timestamp = new Date(mostRecentEntry.t * 1000);
        const now = new Date();
        const daysDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60 * 24);
        
        console.log(`📊 Most recent AVIV entry from ${timestamp.toISOString()}: ${rawValue}`);
        console.log(`📅 Data age: ${daysDiff.toFixed(1)} days old`);
        
        // Check if data is recent (within last 7 days)
        if (daysDiff > 7) {
          console.warn(`⚠️ AVIV data is ${daysDiff.toFixed(1)} days old, may not be current`);
        }
        
        // Validate AVIV ratio is reasonable (typically 0.1-10 range for current market)
        if (rawValue && typeof rawValue === 'number' && rawValue >= 0.1 && rawValue <= 10) {
          avivRatio = rawValue;
          console.log(`✅ Valid AVIV ratio from Glass Node: ${avivRatio}`);
        } else {
          console.warn(`⚠️ AVIV value outside expected range: ${rawValue}, using fallback: 1.5`);
          avivRatio = 1.5;
        }
      } else {
        console.warn('⚠️ No AVIV data in response, using fallback');
        avivRatio = 1.5;
      }
    } else {
      console.warn('⚠️ Glass Node AVIV API call failed, using fallback');
      const errorText = await avivResponse.text();
      console.error('AVIV API error:', errorText);
    }

    // Determine market condition based on AVIV ratio
    const marketCondition = Object.entries(AVIV_THRESHOLDS).find(
      ([_, [min, max]]) => avivRatio >= min && avivRatio < max
    )?.[0] || 'NEUTRAL';

    const result = {
      avivRatio: Number(avivRatio.toFixed(3)),
      marketCondition,
      timestamp: new Date().toISOString()
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


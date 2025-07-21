import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const fredApiKey = Deno.env.get('FRED_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Testing FRED API for real risk-free rates...');
    
    if (!fredApiKey) {
      console.log('⚠️ FRED API key not configured, using default risk-free rate');
      
      return new Response(
        JSON.stringify({
          success: false,
          apiHealthy: false,
          riskFreeRate: 2.0,
          dataSource: 'default',
          qualityScore: 30,
          message: 'FRED API key not configured. Using default 2% risk-free rate.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Test FRED API with 10-Year Treasury rate
    const fredResponse = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=${fredApiKey}&file_type=json&limit=5&sort_order=desc`
    );

    if (!fredResponse.ok) {
      throw new Error(`FRED API error: ${fredResponse.status}`);
    }

    const fredData = await fredResponse.json();
    
    if (fredData.error_code) {
      throw new Error(`FRED API error: ${fredData.error_message}`);
    }

    if (!fredData.observations || !fredData.observations.length) {
      throw new Error('No Treasury rate data available from FRED');
    }

    // Find the most recent valid observation
    let currentRate = null;
    let dataDate = null;
    
    for (const obs of fredData.observations) {
      if (obs.value !== '.' && !isNaN(parseFloat(obs.value))) {
        currentRate = parseFloat(obs.value);
        dataDate = obs.date;
        break;
      }
    }

    if (currentRate === null) {
      throw new Error('No valid Treasury rate data found');
    }

    console.log(`✅ FRED API verified: Current 10-Year Treasury rate: ${currentRate}% (as of ${dataDate})`);

    // Calculate data freshness
    const observationDate = new Date(dataDate);
    const now = new Date();
    const daysSinceUpdate = Math.floor((now.getTime() - observationDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Quality score based on data freshness
    let qualityScore = 95;
    if (daysSinceUpdate > 7) qualityScore = 80;      // Weekly updates are good
    if (daysSinceUpdate > 30) qualityScore = 60;     // Monthly is acceptable
    if (daysSinceUpdate > 90) qualityScore = 40;     // Quarterly is poor

    // Store API health status
    await supabase
      .from('api_health_status')
      .upsert({
        api_name: 'fred',
        endpoint: 'series/observations',
        status: 'healthy',
        response_time_ms: 300,
        success_rate_pct: 100,
        last_successful_call: new Date().toISOString(),
        last_error: null,
        checked_at: new Date().toISOString()
      }, { onConflict: 'api_name,endpoint,checked_at' });

    // Log successful verification
    await supabase
      .from('data_quality_log')
      .insert({
        coin_id: 'USD',
        metric_type: 'risk_free_rate',
        data_source: 'fred',
        quality_score: qualityScore,
        data_points: fredData.observations.length,
        completeness_pct: 100,
        freshness_hours: daysSinceUpdate * 24,
        api_status: 'healthy',
        logged_at: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({
        success: true,
        apiHealthy: true,
        riskFreeRate: currentRate,
        dataDate,
        daysSinceUpdate,
        qualityScore,
        dataSource: 'fred_10y_treasury',
        observationsAvailable: fredData.observations.length,
        message: `FRED API verified. Current 10-Year Treasury: ${currentRate}% (${daysSinceUpdate} days old)`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('FRED API verification failed:', error);
    
    // Store error status
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      
      await supabase
        .from('api_health_status')
        .upsert({
          api_name: 'fred',
          endpoint: 'series/observations',
          status: 'down',
          response_time_ms: 0,
          success_rate_pct: 0,
          last_successful_call: null,
          last_error: error.message,
          checked_at: new Date().toISOString()
        }, { onConflict: 'api_name,endpoint,checked_at' });
    } catch (logError) {
      console.error('Failed to log FRED API error:', logError);
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        apiHealthy: false,
        riskFreeRate: 2.0, // Default fallback
        dataSource: 'default_fallback',
        qualityScore: 30
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
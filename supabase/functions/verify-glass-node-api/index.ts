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
    const glassNodeApiKey = Deno.env.get('GLASSNODE_API_KEY');
    
    if (!glassNodeApiKey) {
      throw new Error('Glass Node API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check API health
    console.log('Testing Glass Node API connectivity...');
    
    const testResponse = await fetch(
      `https://api.glassnode.com/v1/metrics/market/price_usd_close?a=BTC&api_key=${glassNodeApiKey}&limit=1`
    );

    const isHealthy = testResponse.ok;
    const responseTime = Date.now();

    // Store API health status
    await supabase
      .from('api_health_status')
      .upsert({
        api_name: 'glassnode',
        endpoint: 'market/price_usd_close',
        status: isHealthy ? 'healthy' : 'down',
        response_time_ms: testResponse.ok ? 200 : 0,
        success_rate_pct: testResponse.ok ? 100 : 0,
        last_successful_call: testResponse.ok ? new Date().toISOString() : null,
        last_error: testResponse.ok ? null : `HTTP ${testResponse.status}`,
        checked_at: new Date().toISOString()
      }, { onConflict: 'api_name,endpoint,checked_at' });

    if (!isHealthy) {
      throw new Error(`Glass Node API unhealthy: ${testResponse.status}`);
    }

    // Test different Glass Node metrics
    const metrics = [
      'market/price_usd_close',
      'indicators/aviv',
      'supply/liquid_sum',
      'supply/illiquid_sum',
      'addresses/active_count'
    ];

    const testResults = [];
    
    for (const metric of metrics) {
      try {
        console.log(`Testing Glass Node metric: ${metric}`);
        
        const response = await fetch(
          `https://api.glassnode.com/v1/metrics/${metric}?a=BTC&api_key=${glassNodeApiKey}&limit=5`
        );

        const success = response.ok;
        let dataPoints = 0;
        
        if (success) {
          const data = await response.json();
          dataPoints = Array.isArray(data) ? data.length : 0;
          console.log(`✅ ${metric}: ${dataPoints} data points`);
        } else {
          console.log(`❌ ${metric}: HTTP ${response.status}`);
        }

        testResults.push({
          metric,
          success,
          dataPoints,
          status: response.status
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error testing ${metric}:`, error);
        testResults.push({
          metric,
          success: false,
          dataPoints: 0,
          error: error.message
        });
      }
    }

    // Calculate overall API quality score
    const successfulMetrics = testResults.filter(r => r.success).length;
    const totalDataPoints = testResults.reduce((sum, r) => sum + r.dataPoints, 0);
    const qualityScore = Math.round((successfulMetrics / metrics.length) * 80 + (totalDataPoints > 0 ? 20 : 0));

    console.log(`Glass Node API Verification Complete:`);
    console.log(`- Successful metrics: ${successfulMetrics}/${metrics.length}`);
    console.log(`- Total data points: ${totalDataPoints}`);
    console.log(`- Quality score: ${qualityScore}%`);

    // Log the verification results
    await supabase
      .from('data_quality_log')
      .insert({
        coin_id: 'BTC',
        metric_type: 'api_verification',
        data_source: 'glassnode',
        quality_score: qualityScore,
        data_points: totalDataPoints,
        completeness_pct: (successfulMetrics / metrics.length) * 100,
        freshness_hours: 0,
        api_status: isHealthy ? 'healthy' : 'degraded',
        logged_at: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({
        success: true,
        apiHealthy: isHealthy,
        qualityScore,
        metricsAvailable: successfulMetrics,
        totalMetrics: metrics.length,
        totalDataPoints,
        testResults,
        message: `Glass Node API verification complete. ${successfulMetrics}/${metrics.length} metrics available with quality score ${qualityScore}%`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Glass Node API verification failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        apiHealthy: false,
        qualityScore: 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
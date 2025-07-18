import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

// CORS headers for web app compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('Scheduled Glass Node discovery triggered...');

    // Check when the last discovery was run
    const { data: lastLog } = await supabase
      .from('glass_node_discovery_logs')
      .select('discovery_run_at')
      .order('discovery_run_at', { ascending: false })
      .limit(1)
      .single();

    const now = new Date();
    const lastRun = lastLog ? new Date(lastLog.discovery_run_at) : null;
    const hoursSinceLastRun = lastRun ? 
      (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60) : 
      Infinity;

    // Only run discovery if it's been more than 6 hours since the last run
    if (hoursSinceLastRun < 6) {
      console.log(`Skipping discovery - last run was ${hoursSinceLastRun.toFixed(1)} hours ago`);
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          reason: 'Recent discovery already completed',
          hours_since_last_run: hoursSinceLastRun,
          next_scheduled_in_hours: 6 - hoursSinceLastRun
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Trigger the discovery function
    const { data: discoveryResult, error: discoveryError } = await supabase.functions.invoke('discover-glass-node-assets', {
      body: { trigger: 'scheduled' }
    });

    if (discoveryError) {
      console.error('Discovery function error:', discoveryError);
      throw new Error(`Discovery failed: ${discoveryError.message}`);
    }

    console.log('Scheduled discovery completed successfully:', discoveryResult);

    return new Response(
      JSON.stringify({
        success: true,
        scheduled_at: now.toISOString(),
        discovery_result: discoveryResult,
        hours_since_last_run: hoursSinceLastRun
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Scheduled discovery error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        scheduled_at: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
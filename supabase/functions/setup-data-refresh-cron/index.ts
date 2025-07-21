
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔄 Setting up automated data refresh cron jobs...');

    // Setup daily coin data refresh (every day at 2 AM UTC)
    const { error: coinRefreshError } = await supabaseClient.rpc('cron_schedule', {
      jobname: 'daily-coin-refresh',
      schedule: '0 2 * * *',
      command: `
        SELECT net.http_post(
          url := '${Deno.env.get('SUPABASE_URL')}/functions/v1/update-coins-real-data',
          headers := '{"Content-Type": "application/json", "Authorization": "Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}"}'::jsonb,
          body := '{}'::jsonb
        );
      `
    });

    if (coinRefreshError) {
      console.error('❌ Failed to setup coin refresh cron:', coinRefreshError);
    } else {
      console.log('✅ Daily coin refresh cron job scheduled');
    }

    // Setup weekly price history refresh (every Sunday at 3 AM UTC)
    const { error: priceHistoryError } = await supabaseClient.rpc('cron_schedule', {
      jobname: 'weekly-price-history-refresh',
      schedule: '0 3 * * 0',
      command: `
        SELECT net.http_post(
          url := '${Deno.env.get('SUPABASE_URL')}/functions/v1/bulk-populate-price-history',
          headers := '{"Content-Type": "application/json", "Authorization": "Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}"}'::jsonb,
          body := '{}'::jsonb
        );
      `
    });

    if (priceHistoryError) {
      console.error('❌ Failed to setup price history refresh cron:', priceHistoryError);
    } else {
      console.log('✅ Weekly price history refresh cron job scheduled');
    }

    // Setup daily Glass Node metrics refresh (every day at 4 AM UTC)
    const { error: glassNodeError } = await supabaseClient.rpc('cron_schedule', {
      jobname: 'daily-glass-node-refresh',
      schedule: '0 4 * * *',
      command: `
        SELECT net.http_post(
          url := '${Deno.env.get('SUPABASE_URL')}/functions/v1/bulk-populate-glass-node-metrics',
          headers := '{"Content-Type": "application/json", "Authorization": "Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}"}'::jsonb,
          body := '{}'::jsonb
        );
      `
    });

    if (glassNodeError) {
      console.error('❌ Failed to setup Glass Node refresh cron:', glassNodeError);
    } else {
      console.log('✅ Daily Glass Node metrics refresh cron job scheduled');
    }

    const summary = {
      success: true,
      message: '✅ Automated data refresh cron jobs configured successfully',
      jobs: [
        {
          name: 'daily-coin-refresh',
          schedule: '0 2 * * *',
          description: 'Updates coin data daily at 2 AM UTC',
          status: coinRefreshError ? 'failed' : 'active'
        },
        {
          name: 'weekly-price-history-refresh',
          schedule: '0 3 * * 0',
          description: 'Updates price history weekly on Sunday at 3 AM UTC',
          status: priceHistoryError ? 'failed' : 'active'
        },
        {
          name: 'daily-glass-node-refresh',
          schedule: '0 4 * * *',
          description: 'Updates Glass Node metrics daily at 4 AM UTC',
          status: glassNodeError ? 'failed' : 'active'
        }
      ]
    };

    console.log('📊 Cron jobs setup summary:', summary);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Fatal error setting up cron jobs:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to setup cron jobs', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})

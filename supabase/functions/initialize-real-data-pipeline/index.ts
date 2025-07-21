
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

    console.log('🚀 Starting Real Data Pipeline Initialization...');

    const results = {
      coinsUpdated: 0,
      priceHistoryPopulated: 0,
      glassNodeMetricsPopulated: 0,
      errors: []
    };

    try {
      // Step 1: Update coins table with real current data
      console.log('Step 1: Updating coins table with real data...');
      const { data: coinsResult, error: coinsError } = await supabaseClient.functions.invoke(
        'update-coins-real-data',
        { body: {} }
      );
      
      if (coinsError) {
        results.errors.push(`Coins update failed: ${coinsError.message}`);
      } else {
        results.coinsUpdated = coinsResult?.updated || 0;
        console.log(`✅ Updated ${results.coinsUpdated} coins`);
      }

      // Wait 5 seconds before next step
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Step 2: Populate price history
      console.log('Step 2: Populating price history...');
      const { data: priceResult, error: priceError } = await supabaseClient.functions.invoke(
        'bulk-populate-price-history',
        { body: {} }
      );
      
      if (priceError) {
        results.errors.push(`Price history population failed: ${priceError.message}`);
      } else {
        results.priceHistoryPopulated = priceResult?.successful || 0;
        console.log(`✅ Populated price history for ${results.priceHistoryPopulated} coins`);
      }

      // Wait 10 seconds before Glass Node requests
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Step 3: Populate Glass Node metrics
      console.log('Step 3: Populating Glass Node metrics...');
      const { data: glassNodeResult, error: glassNodeError } = await supabaseClient.functions.invoke(
        'bulk-populate-glass-node-metrics',
        { body: {} }
      );
      
      if (glassNodeError) {
        results.errors.push(`Glass Node metrics population failed: ${glassNodeError.message}`);
      } else {
        results.glassNodeMetricsPopulated = glassNodeResult?.successful || 0;
        console.log(`✅ Populated ${results.glassNodeMetricsPopulated} Glass Node metrics`);
      }

    } catch (error) {
      results.errors.push(`Pipeline execution error: ${error.message}`);
    }

    // Step 4: Verify data population
    console.log('Step 4: Verifying data population...');
    
    const { data: priceHistoryCount } = await supabaseClient
      .from('price_history_36m')
      .select('*', { count: 'exact', head: true });
    
    const { data: cointimeCount } = await supabaseClient
      .from('cointime_metrics')
      .select('*', { count: 'exact', head: true });
    
    const { data: coinsCount } = await supabaseClient
      .from('coins')
      .select('*', { count: 'exact', head: true });

    const summary = {
      success: results.errors.length === 0,
      coinsInDatabase: coinsCount || 0,
      priceHistoryRecords: priceHistoryCount || 0,
      cointimeMetricsRecords: cointimeCount || 0,
      results,
      message: results.errors.length === 0 
        ? '🎉 Real Data Pipeline Initialization Complete!' 
        : `⚠️ Pipeline completed with ${results.errors.length} errors`
    };

    console.log('📊 Final Summary:', summary);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Fatal error in real data pipeline initialization:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Pipeline initialization failed', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})

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
    const { metrics } = await req.json()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`🔄 Storing cointime metrics for ${metrics.coinId}`)

    // Store cointime metrics
    const { error: metricsError } = await supabaseClient
      .from('cointime_metrics')
      .upsert({
        coin_id: metrics.coinId,
        coinblocks_created: 0, // Will be calculated from Glassnode data
        coinblocks_destroyed: 0,
        coinblocks_stored: 0,
        aviv_ratio: metrics.avivRatio,
        active_supply_pct: metrics.activeSupplyPct,
        vaulted_supply_pct: metrics.vaultedSupplyPct,
        liveliness: metrics.activeSupplyPct / 100,
        vaultedness: metrics.vaultedSupplyPct / 100,
        data_source: metrics.dataSource,
        confidence_score: metrics.confidenceScore,
        calculated_at: new Date().toISOString()
      }, {
        onConflict: 'coin_id,calculated_at',
        ignoreDuplicates: false
      })

    if (metricsError) {
      console.error('❌ Failed to store cointime metrics:', metricsError)
      throw metricsError
    }

    // Log data quality
    const qualityScore = metrics.confidenceScore >= 70 ? 85 : metrics.confidenceScore >= 40 ? 60 : 35

    await supabaseClient
      .from('data_quality_log')
      .insert({
        coin_id: metrics.coinId,
        metric_type: 'cointime_metrics',
        data_source: metrics.dataSource,
        quality_score: qualityScore,
        data_points: 1,
        completeness_pct: 100,
        freshness_hours: 0,
        api_status: 'healthy'
      })

    console.log(`✅ Stored cointime metrics for ${metrics.coinId} - AVIV: ${metrics.avivRatio.toFixed(3)}, Quality: ${qualityScore}%`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        coinId: metrics.coinId,
        qualityScore 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Error in store-cointime-metrics function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
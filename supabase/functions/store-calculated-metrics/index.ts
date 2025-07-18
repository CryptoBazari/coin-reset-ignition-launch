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

    console.log(`🔄 Storing calculated metrics for ${metrics.coinId}`)

    // Store calculated metrics
    const { error: calculatedError } = await supabaseClient
      .from('calculated_metrics')
      .upsert({
        coin_id: metrics.coinId,
        real_volatility: metrics.realVolatility,
        real_beta: metrics.realBeta,
        real_cagr_36m: metrics.realCagr36m,
        real_standard_deviation: metrics.realStandardDeviation,
        sharpe_ratio: metrics.sharpeRatio,
        correlation_btc: metrics.correlationBtc,
        data_points_used: metrics.dataPointsUsed,
        data_quality_score: metrics.dataQualityScore,
        calculation_method: 'historical',
        is_estimated: metrics.isEstimated,
        calculation_date: new Date().toISOString()
      }, {
        onConflict: 'coin_id,calculation_date',
        ignoreDuplicates: false
      })

    if (calculatedError) {
      console.error('❌ Failed to store calculated metrics:', calculatedError)
      throw calculatedError
    }

    // Log data quality
    await supabaseClient
      .from('data_quality_log')
      .insert({
        coin_id: metrics.coinId,
        metric_type: 'calculated_metrics',
        data_source: metrics.isEstimated ? 'estimated' : 'calculated',
        quality_score: metrics.dataQualityScore,
        data_points: metrics.dataPointsUsed,
        completeness_pct: 100,
        freshness_hours: 0,
        api_status: 'healthy'
      })

    console.log(`✅ Stored calculated metrics for ${metrics.coinId} - Quality: ${metrics.dataQualityScore}%, Points: ${metrics.dataPointsUsed}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        coinId: metrics.coinId,
        dataQualityScore: metrics.dataQualityScore,
        isEstimated: metrics.isEstimated
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Error in store-calculated-metrics function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
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

    const { coinId, metricsData } = await req.json()

    if (!coinId || !metricsData || !Array.isArray(metricsData)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: coinId and metricsData array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Storing cointime metrics for ${coinId}, ${metricsData.length} data points`)

    // Transform and validate data
    const records = metricsData.map((data: any) => {
      const liquidPct = data.liquid_supply ? 
        (data.liquid_supply / (data.liquid_supply + (data.illiquid_supply || 0))) * 100 : null
      const vaultedPct = data.illiquid_supply ? 
        (data.illiquid_supply / (data.liquid_supply + data.illiquid_supply)) * 100 : null

      // Calculate confidence score based on available data
      let confidenceScore = 0
      if (data.aviv_ratio !== null && data.aviv_ratio !== undefined) confidenceScore += 40
      if (data.liquid_supply !== null && data.liquid_supply !== undefined) confidenceScore += 30
      if (data.illiquid_supply !== null && data.illiquid_supply !== undefined) confidenceScore += 30

      return {
        coin_id: coinId,
        metric_date: data.date,
        aviv_ratio: data.aviv_ratio || null,
        cointime_destroyed: data.cointime_destroyed || null,
        cointime_created: data.cointime_created || null,
        active_supply_pct: data.active_supply_pct || null,
        vaulted_supply_pct: vaultedPct,
        liquid_supply_pct: liquidPct,
        data_source: 'glassnode',
        confidence_score: confidenceScore
      }
    }).filter(record => 
      record.aviv_ratio !== null || 
      record.liquid_supply_pct !== null || 
      record.vaulted_supply_pct !== null ||
      record.cointime_destroyed !== null ||
      record.cointime_created !== null
    )

    if (records.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid cointime metrics to store' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Store cointime metrics data
    const { error: insertError } = await supabaseClient
      .from('cointime_metrics')
      .upsert(records, { 
        onConflict: 'coin_id,metric_date',
        ignoreDuplicates: false 
      })

    if (insertError) {
      console.error('Error storing cointime metrics:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to store cointime metrics', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Successfully stored ${records.length} cointime metrics records for ${coinId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        stored_records: records.length,
        coin_id: coinId,
        avg_confidence_score: records.reduce((sum, r) => sum + r.confidence_score, 0) / records.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in store-cointime-metrics function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
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
    const { entries } = await req.json()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`📊 Storing ${entries.length} price history entries`)

    let stored = 0
    let errors = 0

    // Process entries in batches to avoid overwhelming the database
    const batchSize = 100
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize)
      
      const insertData = batch.map((entry: any) => ({
        coin_id: entry.coinId,
        price_date: entry.priceDate,
        price_usd: entry.priceUsd,
        volume_24h: entry.volume24h || 0,
        market_cap: entry.marketCap || 0
      }))

      const { data, error } = await supabaseClient
        .from('price_history_36m')
        .upsert(insertData, {
          onConflict: 'coin_id,price_date',
          ignoreDuplicates: false
        })

      if (error) {
        console.error(`❌ Batch ${i / batchSize + 1} failed:`, error)
        errors += batch.length
      } else {
        stored += batch.length
        console.log(`✅ Batch ${i / batchSize + 1} stored: ${batch.length} entries`)
      }
    }

    // Calculate quality score
    const successRate = entries.length > 0 ? (stored / entries.length) * 100 : 0
    let qualityScore = 0

    if (successRate >= 95) qualityScore = 90
    else if (successRate >= 80) qualityScore = 75
    else if (successRate >= 60) qualityScore = 60
    else if (successRate >= 40) qualityScore = 45
    else qualityScore = 25

    // Log data quality
    await supabaseClient
      .from('data_quality_log')
      .insert({
        coin_id: entries[0]?.coinId || 'unknown',
        metric_type: 'price_history',
        data_source: 'batch_storage',
        quality_score: qualityScore,
        data_points: stored,
        completeness_pct: successRate,
        freshness_hours: 0,
        api_status: errors === 0 ? 'healthy' : 'degraded',
        error_message: errors > 0 ? `${errors} failed insertions` : null
      })

    console.log(`📈 Price history storage complete: ${stored}/${entries.length} stored, quality: ${qualityScore}%`)

    return new Response(
      JSON.stringify({ 
        stored, 
        errors, 
        qualityScore, 
        successRate: successRate.toFixed(1) 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Error in store-price-history function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
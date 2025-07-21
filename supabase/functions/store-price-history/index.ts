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

    const { coinId, priceData } = await req.json()

    if (!coinId || !priceData || !Array.isArray(priceData)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: coinId and priceData array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Storing price history for ${coinId}, ${priceData.length} data points`)

    // Transform and validate data
    const records = priceData.map((data: any) => ({
      coin_id: coinId,
      price_date: data.date,
      price_usd: parseFloat(data.price),
      volume_24h: data.volume ? parseFloat(data.volume) : null,
      market_cap: data.marketCap ? parseInt(data.marketCap) : null,
      data_source: 'coinmarketcap'
    })).filter(record => !isNaN(record.price_usd) && record.price_usd > 0)

    if (records.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid price data to store' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Store price history data
    const { error: insertError } = await supabaseClient
      .from('price_history_36m')
      .upsert(records, { 
        onConflict: 'coin_id,price_date',
        ignoreDuplicates: false 
      })

    if (insertError) {
      console.error('Error storing price history:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to store price history', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Successfully stored ${records.length} price history records for ${coinId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        stored_records: records.length,
        coin_id: coinId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in store-price-history function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

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

    const glassNodeApiKey = Deno.env.get('GLASSNODE_API_KEY');
    if (!glassNodeApiKey) {
      throw new Error('Glass Node API key not configured');
    }

    console.log('Starting bulk Glass Node metrics population...');

    // Focus on Bitcoin first as it has the most comprehensive Glass Node data
    const supportedAssets = ['BTC'];
    const metrics = [
      'indicators/aviv',
      'supply/liquid_sum',
      'supply/illiquid_sum',
      'addresses/active_count',
      'market/realized_volatility_all'
    ];

    // Calculate date range for 36 months
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 36);

    let totalMetricsProcessed = 0;
    let successfulMetrics = 0;

    for (const asset of supportedAssets) {
      const coinId = asset === 'BTC' ? 'bitcoin' : asset.toLowerCase();
      
      for (const metric of metrics) {
        try {
          console.log(`Fetching ${metric} for ${asset}...`);

          const params = new URLSearchParams({
            a: asset,
            api_key: glassNodeApiKey,
            s: Math.floor(startDate.getTime() / 1000).toString(),
            u: Math.floor(endDate.getTime() / 1000).toString(),
            i: '1d'
          });

          const response = await fetch(
            `https://api.glassnode.com/v1/metrics/${metric}?${params}`,
            {
              headers: {
                'Accept': 'application/json',
              }
            }
          );

          if (!response.ok) {
            console.error(`Glass Node API error for ${metric}: ${response.status}`);
            totalMetricsProcessed++;
            continue;
          }

          const data = await response.json();
          
          if (data && Array.isArray(data) && data.length > 0) {
            const records = data.map((point: any) => {
              const record: any = {
                coin_id: coinId,
                metric_date: new Date(point.t * 1000).toISOString().split('T')[0],
                data_source: 'glassnode',
                confidence_score: 90
              };

              // Map specific metrics to database columns
              if (metric === 'indicators/aviv') {
                record.aviv_ratio = point.v;
              } else if (metric === 'supply/liquid_sum') {
                record.liquid_supply_pct = point.v;
              } else if (metric === 'supply/illiquid_sum') {
                record.vaulted_supply_pct = point.v;
              } else if (metric === 'addresses/active_count') {
                record.active_supply_pct = point.v;
              }

              return record;
            }).filter(record => Object.keys(record).length > 5); // Ensure we have actual data

            if (records.length > 0) {
              // Store in database
              const { error: insertError } = await supabaseClient
                .from('cointime_metrics')
                .upsert(records, { 
                  onConflict: 'coin_id,metric_date',
                  ignoreDuplicates: false 
                });

              if (insertError) {
                console.error(`Error storing ${metric} for ${asset}:`, insertError);
              } else {
                console.log(`✅ Stored ${records.length} ${metric} points for ${asset}`);
                successfulMetrics++;
              }
            }
          }

          totalMetricsProcessed++;
          
          // Rate limiting - wait 2 seconds between Glass Node requests
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          console.error(`Error processing ${metric} for ${asset}:`, error);
          totalMetricsProcessed++;
        }
      }
    }

    console.log(`Bulk Glass Node metrics population completed: ${successfulMetrics}/${totalMetricsProcessed} metrics processed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: totalMetricsProcessed,
        successful: successfulMetrics,
        message: `Bulk populated Glass Node metrics: ${successfulMetrics} successful`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in bulk-populate-glass-node-metrics:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

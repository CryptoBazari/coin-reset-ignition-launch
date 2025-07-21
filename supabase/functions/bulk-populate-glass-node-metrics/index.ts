
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

    // Get all coins that support Glass Node
    const { data: coins, error: coinsError } = await supabaseClient
      .from('coins')
      .select('coin_id, name, glass_node_supported')
      .eq('glass_node_supported', true)
      .limit(10);

    if (coinsError) {
      throw new Error(`Failed to fetch coins: ${coinsError.message}`);
    }

    let totalProcessed = 0;
    let successCount = 0;
    const results = [];

    for (const coin of coins || []) {
      try {
        console.log(`Processing Glass Node metrics for ${coin.name}...`);
        
        const asset = coin.coin_id === 'bitcoin' ? 'BTC' : 
                     coin.coin_id === 'ethereum' ? 'ETH' : 
                     coin.coin_id.toUpperCase();

        // Calculate date range for 30 days of data
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const since = Math.floor(startDate.getTime() / 1000);
        const until = Math.floor(endDate.getTime() / 1000);

        // Fetch multiple Glass Node metrics
        const metrics = [
          { endpoint: 'indicators/aviv', field: 'aviv_ratio' },
          { endpoint: 'supply/liquid_sum', field: 'liquid_supply' },
          { endpoint: 'supply/illiquid_sum', field: 'illiquid_supply' },
          { endpoint: 'addresses/active_count', field: 'active_addresses' }
        ];

        const metricsData = {};
        
        for (const metric of metrics) {
          try {
            const url = `https://api.glassnode.com/v1/metrics/${metric.endpoint}?a=${asset}&api_key=${glassNodeApiKey}&s=${since}&u=${until}&i=24h`;
            
            const response = await fetch(url);
            if (response.ok) {
              const data = await response.json();
              if (data && data.length > 0) {
                metricsData[metric.field] = data;
                console.log(`✅ Fetched ${data.length} ${metric.field} points for ${coin.name}`);
              }
            } else {
              console.warn(`⚠️ Failed to fetch ${metric.endpoint} for ${asset}: ${response.status}`);
            }
          } catch (error) {
            console.error(`Error fetching ${metric.endpoint}:`, error);
          }
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Process and store the metrics data
        if (Object.keys(metricsData).length > 0) {
          const processedMetrics = [];
          
          // Get the longest dataset to iterate through
          const maxLength = Math.max(...Object.values(metricsData).map((arr: any[]) => arr.length));
          
          for (let i = 0; i < maxLength; i++) {
            const metric = {
              coin_id: coin.coin_id,
              metric_date: new Date(Date.now() - (maxLength - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              aviv_ratio: metricsData.aviv_ratio?.[i]?.v || null,
              liquid_supply_pct: null,
              vaulted_supply_pct: null,
              active_supply_pct: null,
              cointime_destroyed: null,
              cointime_created: null,
              data_source: 'glassnode',
              confidence_score: 75
            };

            // Calculate supply percentages if we have the data
            if (metricsData.liquid_supply && metricsData.illiquid_supply) {
              const liquidData = metricsData.liquid_supply[i];
              const illiquidData = metricsData.illiquid_supply[i];
              
              if (liquidData && illiquidData) {
                const totalSupply = liquidData.v + illiquidData.v;
                if (totalSupply > 0) {
                  metric.liquid_supply_pct = (liquidData.v / totalSupply) * 100;
                  metric.vaulted_supply_pct = (illiquidData.v / totalSupply) * 100;
                  metric.active_supply_pct = metric.liquid_supply_pct;
                }
              }
            }

            processedMetrics.push(metric);
          }

          // Store in database
          if (processedMetrics.length > 0) {
            const { error: insertError } = await supabaseClient
              .from('cointime_metrics')
              .upsert(processedMetrics, { 
                onConflict: 'coin_id,metric_date',
                ignoreDuplicates: false 
              });

            if (insertError) {
              console.error(`Error storing metrics for ${coin.name}:`, insertError);
            } else {
              console.log(`✅ Stored ${processedMetrics.length} metrics for ${coin.name}`);
              successCount++;
              
              // Update coin record with Glass Node data
              const latestMetric = processedMetrics[processedMetrics.length - 1];
              await supabaseClient
                .from('coins')
                .update({
                  aviv_ratio: latestMetric.aviv_ratio,
                  active_supply: latestMetric.active_supply_pct,
                  vaulted_supply: latestMetric.vaulted_supply_pct,
                  last_glass_node_update: new Date().toISOString(),
                  glass_node_supported: true,
                  api_status: 'healthy'
                })
                .eq('coin_id', coin.coin_id);
            }
          }
        }

        results.push({
          coin_id: coin.coin_id,
          success: Object.keys(metricsData).length > 0,
          metrics_count: Object.keys(metricsData).length
        });

        totalProcessed++;
        
      } catch (error) {
        console.error(`Error processing ${coin.name}:`, error);
        results.push({
          coin_id: coin.coin_id,
          success: false,
          error: error.message
        });
        totalProcessed++;
      }
    }

    console.log(`Bulk Glass Node metrics population completed: ${successCount}/${totalProcessed} coins processed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: totalProcessed,
        successful: successCount,
        results,
        message: `Bulk populated Glass Node metrics for ${successCount} coins`
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


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

    const coinMarketCapApiKey = Deno.env.get('COINMARKETCAP_API_KEY');
    if (!coinMarketCapApiKey) {
      throw new Error('CoinMarketCap API key not configured');
    }

    console.log('Starting bulk price history population...');

    // Get all coins from database
    const { data: coins, error: coinsError } = await supabaseClient
      .from('coins')
      .select('coin_id, name')
      .limit(20); // Start with top 20 coins

    if (coinsError) {
      throw new Error(`Failed to fetch coins: ${coinsError.message}`);
    }

    let totalProcessed = 0;
    let successCount = 0;

    for (const coin of coins || []) {
      try {
        console.log(`Processing ${coin.name} (${coin.coin_id})...`);

        // Calculate date range for 36 months
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 36);

        // Get symbol for CoinMarketCap API
        const symbol = coin.coin_id === 'bitcoin' ? 'BTC' : 
                      coin.coin_id === 'ethereum' ? 'ETH' :
                      coin.coin_id === 'solana' ? 'SOL' :
                      coin.coin_id === 'cardano' ? 'ADA' :
                      coin.coin_id === 'litecoin' ? 'LTC' :
                      coin.coin_id.toUpperCase();

        // Try to use Glassnode data first for supported coins
        const glassnodeSupported = ['bitcoin', 'ethereum', 'solana', 'cardano', 'chainlink'];
        let priceHistory = [];

        if (glassnodeSupported.includes(coin.coin_id)) {
          console.log(`Fetching daily Glassnode data for ${coin.name}`);
          
          // Map coin_id to Glassnode asset
          const assetMap: Record<string, string> = {
            'bitcoin': 'BTC',
            'ethereum': 'ETH', 
            'solana': 'SOL',
            'cardano': 'ADA',
            'chainlink': 'LINK'
          };
          
          const asset = assetMap[coin.coin_id];
          
          try {
            // Fetch daily Glassnode data with sampling disabled for full daily data
            const glassnodeResponse = await supabaseClient.functions.invoke('fetch-glassnode-data', {
              body: {
                metric: 'market/price_usd_close',
                asset: asset,
                since: startDate.toISOString().split('T')[0],
                until: endDate.toISOString().split('T')[0],
                disableSampling: true // Important: get daily data, not monthly
              }
            });

            if (glassnodeResponse.data && glassnodeResponse.data.data && glassnodeResponse.data.data.length > 0) {
              priceHistory = glassnodeResponse.data.data.map((point: any) => ({
                coin_id: coin.coin_id,
                price_date: point.timestamp.split('T')[0],
                price_usd: point.value,
                volume_24h: 0, // Volume would need separate API call
                market_cap: 0,  // Market cap would need separate API call
                data_source: 'glassnode'
              }));
              
              console.log(`✅ Fetched ${priceHistory.length} daily Glassnode price points for ${coin.name}`);
            }
          } catch (glassnodeError) {
            console.error(`Glassnode fetch failed for ${coin.name}, falling back to CoinMarketCap:`, glassnodeError);
          }
        }

        // Fallback to CoinMarketCap if Glassnode failed or not supported
        if (priceHistory.length === 0) {
          console.log(`Using CoinMarketCap for ${coin.name}`);
          
          const response = await fetch(
            `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/historical?symbol=${symbol}&time_start=${startDate.toISOString()}&time_end=${endDate.toISOString()}&interval=daily`,
            {
              headers: {
                'X-CMC_PRO_API_KEY': coinMarketCapApiKey,
                'Accept': 'application/json',
              },
            }
          );

          if (!response.ok) {
            console.error(`CoinMarketCap API error for ${coin.name}: ${response.status}`);
            continue;
          }

          const data = await response.json();
          
          if (data.data && data.data.quotes) {
            priceHistory = data.data.quotes.map((quote: any) => ({
              coin_id: coin.coin_id,
              price_date: quote.timestamp.split('T')[0],
              price_usd: quote.quote.USD.price,
              volume_24h: quote.quote.USD.volume_24h || 0,
              market_cap: quote.quote.USD.market_cap || 0,
              data_source: 'coinmarketcap'
            }));
          }
        }

        // Store in database if we have data
        if (priceHistory.length > 0) {
          const { error: insertError } = await supabaseClient
            .from('price_history_36m')
            .upsert(priceHistory, { 
              onConflict: 'coin_id,price_date',
              ignoreDuplicates: false 
            });

          if (insertError) {
            console.error(`Error storing price history for ${coin.name}:`, insertError);
          } else {
            console.log(`✅ Stored ${priceHistory.length} price points for ${coin.name}`);
            successCount++;
          }
        }

        totalProcessed++;
        
        // Rate limiting - wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error processing ${coin.name}:`, error);
        totalProcessed++;
      }
    }

    console.log(`Bulk price history population completed: ${successCount}/${totalProcessed} coins processed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: totalProcessed,
        successful: successCount,
        message: `Bulk populated price history for ${successCount} coins`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in bulk-populate-price-history:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

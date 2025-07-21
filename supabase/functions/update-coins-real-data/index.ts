
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

    console.log('Starting coins table update with real data...');

    // First, get current market data for top cryptocurrencies
    const response = await fetch(
      'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=50&convert=USD',
      {
        headers: {
          'X-CMC_PRO_API_KEY': coinMarketCapApiKey,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid response from CoinMarketCap API');
    }

    let updatedCoins = 0;

    for (const coin of data.data) {
      try {
        // Map symbol to coin_id
        const coinId = coin.symbol === 'BTC' ? 'bitcoin' :
                      coin.symbol === 'ETH' ? 'ethereum' :
                      coin.symbol === 'SOL' ? 'solana' :
                      coin.symbol === 'ADA' ? 'cardano' :
                      coin.symbol === 'LTC' ? 'litecoin' :
                      coin.symbol === 'DOT' ? 'polkadot' :
                      coin.symbol === 'AVAX' ? 'avalanche' :
                      coin.symbol === 'MATIC' ? 'polygon' :
                      coin.symbol === 'LINK' ? 'chainlink' :
                      coin.symbol === 'UNI' ? 'uniswap' :
                      coin.name.toLowerCase().replace(/\s+/g, '-');

        // Determine basket based on market cap
        const marketCap = coin.quote.USD.market_cap;
        let basket = 'small-cap';
        if (marketCap > 100000000000) { // > $100B
          basket = coin.symbol === 'BTC' ? 'bitcoin' : 'blue-chip';
        } else if (marketCap > 10000000000) { // > $10B
          basket = 'blue-chip';
        }

        // Calculate volatility from price changes
        const volatility = Math.abs(coin.quote.USD.percent_change_30d || 0) / 100;

        // Update or insert coin data
        const { error: upsertError } = await supabaseClient
          .from('coins')
          .upsert({
            coin_id: coinId,
            name: coin.name,
            current_price: coin.quote.USD.price,
            market_cap: coin.quote.USD.market_cap,
            basket: basket,
            volatility: volatility,
            glass_node_supported: coin.symbol === 'BTC' || coin.symbol === 'ETH',
            premium_metrics_available: coin.symbol === 'BTC',
            api_status: 'healthy',
            updated_at: new Date().toISOString(),
            logo_url: `https://s2.coinmarketcap.com/static/img/coins/64x64/${coin.id}.png`
          }, { 
            onConflict: 'coin_id',
            ignoreDuplicates: false 
          });

        if (upsertError) {
          console.error(`Error updating ${coin.name}:`, upsertError);
        } else {
          console.log(`✅ Updated ${coin.name} with real data`);
          updatedCoins++;
        }

      } catch (error) {
        console.error(`Error processing coin ${coin.name}:`, error);
      }
    }

    console.log(`Coins table update completed: ${updatedCoins} coins updated with real data`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: updatedCoins,
        message: `Updated ${updatedCoins} coins with real market data`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in update-coins-real-data:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})


import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CoinMarketCapResponse {
  data: {
    [key: string]: {
      id: number;
      name: string;
      symbol: string;
      quote: {
        USD: {
          price: number;
          market_cap: number;
          percent_change_24h: number;
          percent_change_7d: number;
          percent_change_30d: number;
        };
      };
    };
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { coinSymbols } = await req.json();
    
    const coinMarketCapApiKey = Deno.env.get('COINMARKETCAP_API_KEY');
    
    if (!coinMarketCapApiKey) {
      console.error('CoinMarketCap API key not found');
      return new Response(
        JSON.stringify({ error: 'CoinMarketCap API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch data from CoinMarketCap
    const symbolsParam = coinSymbols.join(',');
    const cmcUrl = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbolsParam}`;
    
    console.log(`Fetching data for symbols: ${symbolsParam}`);
    
    const cmcResponse = await fetch(cmcUrl, {
      headers: {
        'X-CMC_PRO_API_KEY': coinMarketCapApiKey,
        'Accept': 'application/json',
      },
    });

    if (!cmcResponse.ok) {
      console.error(`CoinMarketCap API error: ${cmcResponse.status}`);
      throw new Error(`CoinMarketCap API error: ${cmcResponse.status}`);
    }

    const cmcData: CoinMarketCapResponse = await cmcResponse.json();
    console.log('Successfully fetched CoinMarketCap data');

    // Transform data to match our format
    const transformedData = Object.entries(cmcData.data).map(([symbol, coinData]) => ({
      symbol: symbol,
      name: coinData.name,
      current_price: coinData.quote.USD.price,
      market_cap: coinData.quote.USD.market_cap,
      price_change_24h: coinData.quote.USD.percent_change_24h,
      price_change_7d: coinData.quote.USD.percent_change_7d,
      price_change_30d: coinData.quote.USD.percent_change_30d,
    }));

    return new Response(
      JSON.stringify({ data: transformedData }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in fetch-market-data function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

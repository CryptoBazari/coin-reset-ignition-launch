
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
      logo?: string;
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

interface CoinListingResponse {
  data: Array<{
    id: number;
    name: string;
    symbol: string;
    logo?: string;
    quote: {
      USD: {
        price: number;
        market_cap: number;
        percent_change_24h: number;
      };
    };
  }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { coinSymbols, fetchListings, limit, includeLogo } = await req.json();
    
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

    let transformedData;

    if (fetchListings) {
      // Fetch cryptocurrency listings
      const listingLimit = Math.min(limit || 30, 200);
      let listingsUrl = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=${listingLimit}&sort=market_cap&convert=USD`;
      
      console.log(`Fetching crypto listings with limit: ${listingLimit}`);
      console.log(`Request URL: ${listingsUrl}`);
      
      const listingsResponse = await fetch(listingsUrl, {
        headers: {
          'X-CMC_PRO_API_KEY': coinMarketCapApiKey,
          'Accept': 'application/json',
          'Accept-Encoding': 'deflate, gzip',
        },
      });

      console.log(`CoinMarketCap API Response Status: ${listingsResponse.status}`);
      
      if (!listingsResponse.ok) {
        const errorText = await listingsResponse.text();
        console.error(`CoinMarketCap API error: ${listingsResponse.status} - ${errorText}`);
        
        if (listingsResponse.status === 400) {
          return new Response(
            JSON.stringify({ error: 'Invalid request to CoinMarketCap API. Check API key and parameters.' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } else if (listingsResponse.status === 401) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized - Invalid CoinMarketCap API key' }),
            { 
              status: 401, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } else if (listingsResponse.status === 429) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded for CoinMarketCap API' }),
            { 
              status: 429, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        
        throw new Error(`CoinMarketCap API error: ${listingsResponse.status}`);
      }

      const listingsData: CoinListingResponse = await listingsResponse.json();
      console.log(`Successfully fetched ${listingsData.data?.length || 0} coin listings`);

      if (!listingsData.data || !Array.isArray(listingsData.data)) {
        throw new Error('Invalid response format from CoinMarketCap API');
      }

      transformedData = listingsData.data.map(coin => ({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        current_price: coin.quote.USD.price,
        market_cap: coin.quote.USD.market_cap,
        price_change_24h: coin.quote.USD.percent_change_24h,
        logo: `https://s2.coinmarketcap.com/static/img/coins/64x64/${coin.id}.png`
      }));
    } else {
      // Fetch specific coin data by symbols
      if (!coinSymbols || !Array.isArray(coinSymbols)) {
        throw new Error('coinSymbols must be provided as an array');
      }

      const symbolsParam = coinSymbols.join(',');
      const quotesUrl = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbolsParam}&convert=USD`;
      
      console.log(`Fetching data for symbols: ${symbolsParam}`);
      
      const quotesResponse = await fetch(quotesUrl, {
        headers: {
          'X-CMC_PRO_API_KEY': coinMarketCapApiKey,
          'Accept': 'application/json',
          'Accept-Encoding': 'deflate, gzip',
        },
      });

      if (!quotesResponse.ok) {
        const errorText = await quotesResponse.text();
        console.error(`CoinMarketCap API error: ${quotesResponse.status} - ${errorText}`);
        throw new Error(`CoinMarketCap API error: ${quotesResponse.status}`);
      }

      const quotesData: CoinMarketCapResponse = await quotesResponse.json();
      console.log('Successfully fetched CoinMarketCap quotes');

      transformedData = Object.entries(quotesData.data).map(([symbol, coinData]) => ({
        symbol: symbol,
        name: coinData.name,
        current_price: coinData.quote.USD.price,
        market_cap: coinData.quote.USD.market_cap,
        price_change_24h: coinData.quote.USD.percent_change_24h,
        price_change_7d: coinData.quote.USD.percent_change_7d,
        price_change_30d: coinData.quote.USD.percent_change_30d,
        logo: `https://s2.coinmarketcap.com/static/img/coins/64x64/${coinData.id}.png`
      }));
    }

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


import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HistoricalDataRequest {
  symbol: string;
  timeStart: string;
  timeEnd: string;
  interval: 'daily' | 'weekly' | 'monthly';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, timeStart, timeEnd, interval }: HistoricalDataRequest = await req.json();
    
    if (!symbol || !timeStart || !timeEnd) {
      throw new Error('Missing required parameters: symbol, timeStart, timeEnd');
    }

    console.log(`Fetching historical data for ${symbol} from ${timeStart} to ${timeEnd}`);

    const cmcApiKey = Deno.env.get('COINMARKETCAP_API_KEY');
    if (!cmcApiKey) {
      throw new Error('CoinMarketCap API key not configured');
    }

    // Convert interval for CoinMarketCap API
    const cmcInterval = interval === 'monthly' ? '1M' : interval === 'weekly' ? '1W' : '1D';
    
    // Use CoinMarketCap historical quotes endpoint
    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/historical?symbol=${symbol}&time_start=${timeStart}&time_end=${timeEnd}&interval=${cmcInterval}`;
    
    const response = await fetch(url, {
      headers: {
        'X-CMC_PRO_API_KEY': cmcApiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`CoinMarketCap API error: ${response.status} - ${errorText}`);
      throw new Error(`CoinMarketCap API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || !data.data.quotes) {
      console.log('No historical quotes found in response');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No historical data available',
          data: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process the quotes data
    const processedData = data.data.quotes.map((quote: any) => ({
      timestamp: quote.timestamp,
      price: quote.quote.USD.price,
      volume_24h: quote.quote.USD.volume_24h || 0,
      market_cap: quote.quote.USD.market_cap || 0,
      percent_change_24h: quote.quote.USD.percent_change_24h || 0
    }));

    console.log(`Successfully fetched ${processedData.length} historical data points for ${symbol}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          symbol,
          quotes: processedData,
          interval,
          count: processedData.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching historical data:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        data: []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

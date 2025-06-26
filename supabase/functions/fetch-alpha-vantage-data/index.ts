
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AlphaVantageResponse {
  [key: string]: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { function: apiFunction, ...params } = await req.json();
    
    const alphaVantageApiKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    
    if (!alphaVantageApiKey) {
      console.error('Alpha Vantage API key not found');
      return new Response(
        JSON.stringify({ error: 'Alpha Vantage API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Build query parameters
    const queryParams = new URLSearchParams({
      function: apiFunction,
      apikey: alphaVantageApiKey,
      ...params
    });

    const alphaVantageUrl = `https://www.alphavantage.co/query?${queryParams}`;
    
    console.log(`Fetching Alpha Vantage data for function: ${apiFunction}`);
    
    const response = await fetch(alphaVantageUrl);

    if (!response.ok) {
      console.error(`Alpha Vantage API error: ${response.status}`);
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }

    const data: AlphaVantageResponse = await response.json();
    
    // Check for API error messages
    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }
    
    if (data['Note']) {
      throw new Error('API call frequency limit reached. Please try again later.');
    }

    console.log('Successfully fetched Alpha Vantage data');

    return new Response(
      JSON.stringify({ data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in fetch-alpha-vantage-data function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

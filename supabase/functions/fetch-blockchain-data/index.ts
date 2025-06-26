
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contractAddress, action = 'tokensupply' } = await req.json();
    
    const arbiscanApiKey = Deno.env.get('ARBISCAN_API_KEY');
    
    if (!arbiscanApiKey) {
      console.error('Arbiscan API key not found');
      return new Response(
        JSON.stringify({ error: 'Arbiscan API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch data from Arbiscan API
    const arbiscanUrl = `https://api.arbiscan.io/api?module=stats&action=${action}&contractaddress=${contractAddress}&apikey=${arbiscanApiKey}`;
    
    console.log(`Fetching blockchain data for contract: ${contractAddress}`);
    
    const arbiscanResponse = await fetch(arbiscanUrl);

    if (!arbiscanResponse.ok) {
      console.error(`Arbiscan API error: ${arbiscanResponse.status}`);
      throw new Error(`Arbiscan API error: ${arbiscanResponse.status}`);
    }

    const arbiscanData = await arbiscanResponse.json();
    console.log('Successfully fetched Arbiscan data');

    if (arbiscanData.status === '0') {
      throw new Error(arbiscanData.message || 'Arbiscan API returned error');
    }

    return new Response(
      JSON.stringify({ 
        data: {
          result: arbiscanData.result,
          contractAddress,
          action
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in fetch-blockchain-data function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

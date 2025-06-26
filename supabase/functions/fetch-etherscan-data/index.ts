
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EtherscanResponse {
  [key: string]: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { module, action, ...params } = await req.json();
    
    const etherscanApiKey = Deno.env.get('ETHERSCAN_API_KEY');
    
    if (!etherscanApiKey) {
      console.error('Etherscan API key not found');
      return new Response(
        JSON.stringify({ error: 'Etherscan API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Build query parameters
    const queryParams = new URLSearchParams({
      module,
      action,
      apikey: etherscanApiKey,
      ...params
    });

    const etherscanUrl = `https://api.etherscan.io/api?${queryParams}`;
    
    console.log(`Fetching Etherscan data for module: ${module}, action: ${action}`);
    
    const response = await fetch(etherscanUrl);

    if (!response.ok) {
      console.error(`Etherscan API error: ${response.status}`);
      throw new Error(`Etherscan API error: ${response.status}`);
    }

    const data: EtherscanResponse = await response.json();
    
    // Check for API error messages
    if (data.status === '0' && data.message !== 'OK') {
      throw new Error(data.result || data.message);
    }
    
    if (data.message === 'NOTOK') {
      throw new Error(data.result || 'Etherscan API error');
    }

    console.log('Successfully fetched Etherscan data');

    return new Response(
      JSON.stringify({ data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in fetch-etherscan-data function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

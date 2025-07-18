
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GlassNodeResponse {
  t: number; // timestamp
  v: number; // value
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { metric, asset, since, until, resolution } = await req.json();
    
    const glassNodeApiKey = Deno.env.get('GLASSNODE_API_KEY');
    
    if (!glassNodeApiKey) {
      console.error('Glass Node API key not found');
      return new Response(
        JSON.stringify({ error: 'Glass Node API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Build query parameters
    const params = new URLSearchParams({
      a: asset || 'BTC',
      api_key: glassNodeApiKey
    });

    if (since) params.append('s', Math.floor(new Date(since).getTime() / 1000).toString());
    if (until) params.append('u', Math.floor(new Date(until).getTime() / 1000).toString());
    if (resolution) params.append('i', resolution);

    const glassNodeUrl = `https://api.glassnode.com/v1/metrics/${metric}?${params}`;
    
    console.log(`Fetching Glass Node data for metric: ${metric}, asset: ${asset}`);
    
    const response = await fetch(glassNodeUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Glass Node API error: ${response.status} - ${errorText}`);
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized - Invalid Glass Node API key' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded for Glass Node API' }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      throw new Error(`Glass Node API error: ${response.status}`);
    }

    const data: GlassNodeResponse[] = await response.json();
    console.log(`Successfully fetched ${data.length} Glass Node data points`);

    // Transform the data to a more usable format
    const transformedData = data.map(point => ({
      timestamp: new Date(point.t * 1000).toISOString(),
      value: point.v,
      unix_timestamp: point.t
    }));

    return new Response(
      JSON.stringify({ data: transformedData, metric, asset }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in fetch-glassnode-data function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

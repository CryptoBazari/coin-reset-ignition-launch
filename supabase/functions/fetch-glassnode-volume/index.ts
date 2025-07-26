import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GlassNodeVolumeResponse {
  t: number;
  v: number;
}

Deno.serve(async (req) => {
  console.log('fetch-glassnode-volume function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { asset, since, until } = await req.json();
    console.log('Request params:', { asset, since, until });

    if (!asset) {
      return new Response(
        JSON.stringify({ error: 'Asset parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const glassnodeApiKey = Deno.env.get('GLASSNODE_API_KEY');
    if (!glassnodeApiKey) {
      console.error('GLASSNODE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Glassnode API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Build Glassnode URL for volume data
    const baseUrl = 'https://api.glassnode.com/v1/metrics/transactions/transfers_volume_sum';
    const params = new URLSearchParams({
      a: asset.toLowerCase(),
      i: '24h', // Daily interval
      api_key: glassnodeApiKey
    });

    if (since) params.append('s', since.toString());
    if (until) params.append('u', until.toString());

    const glassnodeUrl = `${baseUrl}?${params.toString()}`;
    console.log('Fetching from Glassnode:', glassnodeUrl.replace(glassnodeApiKey, '[REDACTED]'));

    const response = await fetch(glassnodeUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Glassnode API error:', response.status, errorText);
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Invalid Glassnode API key' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else if (response.status === 404) {
        return new Response(
          JSON.stringify({ error: `Volume data not found for asset: ${asset}` }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `Glassnode API error: ${response.status}` }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data: GlassNodeVolumeResponse[] = await response.json();
    console.log(`Received ${data.length} volume data points`);

    // Transform and validate data
    const processedData = data
      .filter(item => item.v !== null && item.v >= 0) // Filter valid volume data
      .map(item => ({
        date: new Date(item.t * 1000).toISOString().split('T')[0], // Convert to YYYY-MM-DD
        timestamp: item.t,
        value: item.v, // Use 'value' to match expected structure
        iso_timestamp: new Date(item.t * 1000).toISOString()
      }))
      .sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp

    console.log(`Processed ${processedData.length} valid volume data points`);

    return new Response(
      JSON.stringify({
        success: true,
        data: processedData,
        asset: asset.toUpperCase(),
        metric: 'transfers_volume_sum',
        count: processedData.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in fetch-glassnode-volume:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
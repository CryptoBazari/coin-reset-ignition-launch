
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FredResponse {
  observations: Array<{
    date: string;
    value: string;
  }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { seriesId, limit = 20 } = await req.json();
    
    const fredApiKey = Deno.env.get('FRED_API_KEY');
    
    if (!fredApiKey) {
      console.error('FRED API key not found');
      return new Response(
        JSON.stringify({ error: 'FRED API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!seriesId) {
      return new Response(
        JSON.stringify({ error: 'Series ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${fredApiKey}&file_type=json&limit=${limit}&sort_order=desc`;
    
    console.log(`Fetching FRED data for series: ${seriesId}`);
    
    const response = await fetch(fredUrl);

    if (!response.ok) {
      console.error(`FRED API error: ${response.status}`);
      throw new Error(`FRED API error: ${response.status}`);
    }

    const fredData: FredResponse = await response.json();
    
    // Filter out invalid values (like "." which FRED uses for missing data)
    const validData = fredData.observations
      .filter(obs => obs.value !== '.' && obs.value !== '')
      .map(obs => ({
        date: obs.date,
        value: obs.value
      }));

    console.log(`Successfully fetched ${validData.length} data points for ${seriesId}`);

    return new Response(
      JSON.stringify({ data: validData }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in fetch-fred-data function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

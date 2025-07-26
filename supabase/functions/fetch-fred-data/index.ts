
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
    const { seriesId, startDate, endDate, limit = 1000 } = await req.json();
    
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

    // Build FRED API URL with date range support
    const fredUrl = new URL('https://api.stlouisfed.org/fred/series/observations');
    fredUrl.searchParams.set('series_id', seriesId);
    fredUrl.searchParams.set('api_key', fredApiKey);
    fredUrl.searchParams.set('file_type', 'json');
    fredUrl.searchParams.set('limit', limit.toString());
    fredUrl.searchParams.set('sort_order', 'asc');
    fredUrl.searchParams.set('frequency', 'd'); // Daily frequency
    
    if (startDate) {
      fredUrl.searchParams.set('observation_start', startDate);
    }
    if (endDate) {
      fredUrl.searchParams.set('observation_end', endDate);
    }
    
    console.log(`Fetching FRED data for series: ${seriesId} from ${startDate || 'earliest'} to ${endDate || 'latest'}`);
    
    const response = await fetch(fredUrl.toString());

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

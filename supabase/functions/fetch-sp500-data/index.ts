import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { series_id, observation_start, observation_end } = await req.json();
    
    console.log(`🔄 Fetching FRED data: ${series_id} from ${observation_start} to ${observation_end}`);
    
    const fredApiKey = Deno.env.get('FRED_API_KEY');
    if (!fredApiKey) {
      throw new Error('FRED API key not configured');
    }

    // Construct FRED API URL
    const url = new URL('https://api.stlouisfed.org/fred/series/observations');
    url.searchParams.set('series_id', series_id);
    url.searchParams.set('api_key', fredApiKey);
    url.searchParams.set('file_type', 'json');
    url.searchParams.set('observation_start', observation_start);
    url.searchParams.set('observation_end', observation_end);
    url.searchParams.set('sort_order', 'asc');
    url.searchParams.set('frequency', 'd'); // Daily frequency

    console.log(`🌐 FRED URL: ${url.toString().replace(fredApiKey, 'API_KEY_HIDDEN')}`);

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'CryptoAnalysis/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`FRED API error: ${response.status} ${response.statusText}`);
    }

    const fredData = await response.json();
    
    if (!fredData.observations || !Array.isArray(fredData.observations)) {
      throw new Error('Invalid FRED API response format');
    }

    // Filter out non-numeric values and weekends/holidays
    const validObservations = fredData.observations.filter((obs: any) => 
      obs.value && obs.value !== '.' && !isNaN(parseFloat(obs.value))
    );

    console.log(`✅ Successfully fetched ${validObservations.length} FRED data points for ${series_id}`);

    return new Response(JSON.stringify({
      success: true,
      data: validObservations,
      count: validObservations.length,
      series_id,
      period: `${observation_start} to ${observation_end}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ FRED API fetch failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
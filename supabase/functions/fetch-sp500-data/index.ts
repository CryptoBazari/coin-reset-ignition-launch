const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { series_id, observation_start, observation_end } = await req.json();
    console.log(`🔄 Fetching FRED data: ${series_id} from ${observation_start} to ${observation_end}`);

    const fredApiKey = Deno.env.get('FRED_API_KEY');
    if (!fredApiKey) {
      return new Response(
        JSON.stringify({ error: 'FRED API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Build FRED API URL
    const fredUrl = new URL('https://api.stlouisfed.org/fred/series/observations');
    fredUrl.searchParams.set('series_id', series_id || 'SP500');
    fredUrl.searchParams.set('api_key', fredApiKey);
    fredUrl.searchParams.set('file_type', 'json');
    fredUrl.searchParams.set('observation_start', observation_start);
    fredUrl.searchParams.set('observation_end', observation_end);
    fredUrl.searchParams.set('sort_order', 'asc');
    fredUrl.searchParams.set('frequency', 'd'); // Daily frequency

    console.log('🌐 FRED URL:', fredUrl.toString().replace(fredApiKey, 'API_KEY_HIDDEN'));

    const response = await fetch(fredUrl.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('FRED API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `FRED API error: ${response.status}` }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const fredData = await response.json();
    
    // Process and filter the data - remove weekends and invalid data points
    const validData = fredData.observations
      .filter((item: any) => item.value !== '.' && item.value !== '' && !isNaN(parseFloat(item.value)))
      .map((item: any) => {
        const date = new Date(item.date);
        const dayOfWeek = date.getDay();
        // Only include Monday-Friday (1-5) for S&P 500
        return dayOfWeek >= 1 && dayOfWeek <= 5 ? {
          date: item.date,
          value: parseFloat(item.value),
          realtime_start: item.realtime_start,
          realtime_end: item.realtime_end
        } : null;
      })
      .filter((item: any) => item !== null);

    console.log(`✅ Successfully fetched ${validData.length} FRED data points for ${series_id}`);

    return new Response(
      JSON.stringify(validData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in fetch-sp500-data function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
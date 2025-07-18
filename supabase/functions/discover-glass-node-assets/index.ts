// CORS headers for web app compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GlassNodeMetric {
  metric: string;
  category: string;
  subcategory: string;
  assets: string[];
  resolutions: string[];
  tier: string;
}

interface GlassNodeAssetsResponse {
  metrics: GlassNodeMetric[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const GLASSNODE_API_KEY = Deno.env.get('GLASSNODE_API_KEY');
    
    if (!GLASSNODE_API_KEY) {
      throw new Error('GLASSNODE_API_KEY is not configured');
    }

    console.log('Discovering Glass Node supported assets...');

    // Fetch available metrics from Glass Node API
    const metricsUrl = `https://api.glassnode.com/v1/metrics/market/price?api_key=${GLASSNODE_API_KEY}&format=json&limit=1`;
    
    const response = await fetch(metricsUrl);
    
    if (!response.ok) {
      throw new Error(`Glass Node API error: ${response.status} ${response.statusText}`);
    }

    // Get supported assets from the price endpoint (it lists all supported assets)
    const priceData = await response.json();
    
    // Query supported assets from a different endpoint that lists all available assets
    const assetsUrl = `https://api.glassnode.com/v1/metrics/assets?api_key=${GLASSNODE_API_KEY}`;
    
    let supportedAssets: string[] = [];
    
    try {
      const assetsResponse = await fetch(assetsUrl);
      if (assetsResponse.ok) {
        const assetsData = await assetsResponse.json();
        supportedAssets = assetsData || [];
      }
    } catch (error) {
      console.log('Assets endpoint not available, using fallback list');
      // Fallback to known supported assets
      supportedAssets = ['BTC', 'ETH', 'LTC', 'ADA', 'DOT', 'LINK', 'XLM', 'UNI', 'AAVE', 'SOL', 'MATIC', 'AVAX'];
    }

    // Test asset availability by trying to fetch price data for each
    const assetAvailability = await Promise.allSettled(
      supportedAssets.map(async (asset) => {
        try {
          const testUrl = `https://api.glassnode.com/v1/metrics/market/price?a=${asset}&api_key=${GLASSNODE_API_KEY}&s=1d&f=json&limit=1`;
          const testResponse = await fetch(testUrl);
          
          if (testResponse.ok) {
            const testData = await testResponse.json();
            return {
              asset,
              available: Array.isArray(testData) && testData.length > 0,
              premium: true, // Most Glass Node metrics require premium
              dataQuality: testResponse.status === 200 ? 8 : 5
            };
          }
          
          return {
            asset,
            available: false,
            premium: false,
            dataQuality: 0
          };
        } catch {
          return {
            asset,
            available: false,
            premium: false,
            dataQuality: 0
          };
        }
      })
    );

    // Process results
    const availableAssets = assetAvailability
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value)
      .filter(asset => asset.available);

    console.log(`Discovered ${availableAssets.length} available Glass Node assets`);

    return new Response(
      JSON.stringify({
        success: true,
        discovered_at: new Date().toISOString(),
        total_assets: availableAssets.length,
        assets: availableAssets,
        supported_assets: availableAssets.map(asset => ({
          symbol: asset.asset,
          glass_node_supported: asset.available,
          premium_metrics_available: asset.premium,
          glass_node_data_quality: asset.dataQuality,
          last_glass_node_update: new Date().toISOString()
        }))
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error discovering Glass Node assets:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        fallback_assets: [
          { symbol: 'BTC', glass_node_supported: true, premium_metrics_available: true, glass_node_data_quality: 8 },
          { symbol: 'ETH', glass_node_supported: true, premium_metrics_available: true, glass_node_data_quality: 8 },
          { symbol: 'SOL', glass_node_supported: true, premium_metrics_available: true, glass_node_data_quality: 7 },
          { symbol: 'ADA', glass_node_supported: true, premium_metrics_available: true, glass_node_data_quality: 7 },
          { symbol: 'LINK', glass_node_supported: true, premium_metrics_available: true, glass_node_data_quality: 7 }
        ]
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
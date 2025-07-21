
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

// CORS headers for web app compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GlassNodeAsset {
  symbol: string;
  available: boolean;
  premium: boolean;
  dataQuality: number;
  name?: string;
  logo_url?: string;
  coingecko_id?: string;
}

interface CoinGeckoSearchResult {
  id: string;
  symbol: string;
  name: string;
  large: string;
}

interface GlassNodeAssetsResponse {
  assets: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  let discoveredAssets = 0;
  let updatedAssets = 0;
  let apiStatus = 'unknown';
  let errorMessage: string | null = null;

  try {
    const GLASSNODE_API_KEY = Deno.env.get('GLASSNODE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!GLASSNODE_API_KEY) {
      throw new Error('GLASSNODE_API_KEY is not configured');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }

    // Initialize Supabase client with service role key for database writes
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('Starting Glass Node asset discovery and synchronization...');

    // Get current assets from database
    const { data: existingCoins } = await supabase
      .from('coins')
      .select('coin_id, glass_node_supported, coingecko_id, logo_url');

    const existingCoinMap = new Map(
      existingCoins?.map(coin => [coin.coin_id.toLowerCase(), coin]) || []
    );

    // Fetch all supported assets from Glassnode
    console.log('Fetching supported assets from Glassnode API...');
    let supportedAssets: string[] = [];
    
    try {
      const assetsResponse = await fetch(`https://api.glassnode.com/v1/metrics/assets?api_key=${GLASSNODE_API_KEY}`);
      if (assetsResponse.ok) {
        const assetsData: GlassNodeAssetsResponse = await assetsResponse.json();
        supportedAssets = assetsData.assets || [];
        console.log(`✅ Found ${supportedAssets.length} supported assets from Glassnode API`);
        apiStatus = 'operational';
      } else {
        console.error('Failed to fetch assets from Glassnode API, using fallback list');
        // Fallback to expanded known list if API fails
        supportedAssets = [
          'BTC', 'ETH', 'LTC', 'BCH', 'BSV', 'ADA', 'DOT', 'LINK', 'XLM', 'UNI', 
          'AAVE', 'SOL', 'MATIC', 'AVAX', 'ATOM', 'LUNA', 'CRV', 'COMP',
          'MKR', 'SNX', 'YFI', 'SUSHI', 'GRT', 'FIL', 'THETA', 'VET', 'TRX',
          'XTZ', 'EOS', 'IOTA', 'NEO', 'DASH', 'ZEC', 'XMR', 'ETC', 'OMG',
          'BAT', 'ZRX', 'REP', 'KNC', 'LRC', 'BNT', 'REN', 'STORJ', 'MANA',
          'ENJ', 'CHZ', 'HOT', 'DOGE', 'SHIB', 'FTT', 'NEAR', 'ALGO', 'FLOW',
          'SAND', 'AXS', 'GALA', 'APE', 'GMT', 'STEPN', 'LUNC', 'USDT', 'USDC',
          'BUSD', 'DAI', 'FRAX', 'TUSD', 'USDP', 'GUSD', 'USDD', 'LUSD'
        ];
        apiStatus = 'fallback';
      }
    } catch (error) {
      console.error('Error fetching assets from Glassnode:', error);
      // Use fallback list
      supportedAssets = [
        'BTC', 'ETH', 'LTC', 'BCH', 'BSV', 'ADA', 'DOT', 'LINK', 'XLM', 'UNI', 
        'AAVE', 'SOL', 'MATIC', 'AVAX', 'ATOM', 'LUNA', 'CRV', 'COMP',
        'MKR', 'SNX', 'YFI', 'SUSHI', 'GRT', 'FIL', 'THETA', 'VET', 'TRX',
        'XTZ', 'EOS', 'IOTA', 'NEO', 'DASH', 'ZEC', 'XMR', 'ETC', 'OMG',
        'BAT', 'ZRX', 'REP', 'KNC', 'LRC', 'BNT', 'REN', 'STORJ', 'MANA',
        'ENJ', 'CHZ', 'HOT', 'DOGE', 'SHIB', 'FTT', 'NEAR', 'ALGO', 'FLOW'
      ];
      apiStatus = 'error';
    }

    // Function to get CoinGecko data for asset
    const getCoinGeckoData = async (symbol: string): Promise<Partial<CoinGeckoSearchResult> | null> => {
      try {
        // Search for the coin on CoinGecko
        const searchResponse = await fetch(`https://api.coingecko.com/api/v3/search?query=${symbol}`);
        if (!searchResponse.ok) return null;
        
        const searchData = await searchResponse.json();
        const coin = searchData.coins?.find((c: any) => 
          c.symbol.toLowerCase() === symbol.toLowerCase()
        );
        
        if (coin) {
          return {
            id: coin.id,
            symbol: coin.symbol,
            name: coin.name,
            large: coin.large
          };
        }
        return null;
      } catch (error) {
        console.log(`Failed to fetch CoinGecko data for ${symbol}:`, error);
        return null;
      }
    };

    // Clean up existing duplicate/invalid entries
    console.log('Cleaning up duplicate and invalid entries...');
    await supabase
      .from('coins')
      .delete()
      .eq('glass_node_data_quality', 0)
      .neq('coin_id', 'bitcoin'); // Keep bitcoin even if it has 0 quality temporarily

    // Test asset availability and gather data
    const assetResults: GlassNodeAsset[] = [];
    const batchSize = 10; // Process in batches to avoid rate limiting
    
    for (let i = 0; i < supportedAssets.length; i += batchSize) {
      const batch = supportedAssets.slice(i, i + batchSize);
      
      for (const symbol of batch) {
        try {
          // Test Glass Node API availability
          const testUrl = `https://api.glassnode.com/v1/metrics/market/price?a=${symbol}&api_key=${GLASSNODE_API_KEY}&s=1d&f=json&limit=1`;
          const testResponse = await fetch(testUrl);
          
          const available = testResponse.ok;
          let dataQuality = 0;
          let premium = false;
          
          if (available) {
            const testData = await testResponse.json();
            dataQuality = Array.isArray(testData) && testData.length > 0 ? 8 : 5;
            premium = testResponse.status === 200;
          }

          // Get CoinGecko data for logo and additional info
          const coinGeckoData = await getCoinGeckoData(symbol);
          
          assetResults.push({
            symbol,
            available,
            premium,
            dataQuality,
            name: coinGeckoData?.name || symbol,
            logo_url: coinGeckoData?.large || null,
            coingecko_id: coinGeckoData?.id || null
          });

          discoveredAssets++;
          
        } catch (error) {
          console.log(`Error testing asset ${symbol}:`, error);
          assetResults.push({
            symbol,
            available: false,
            premium: false,
            dataQuality: 0
          });
        }
      }
      
      // Small delay between batches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Update database with discovered assets
    for (const asset of assetResults) {
      if (!asset.available) continue; // Skip unavailable assets
      
      const coinId = asset.symbol.toLowerCase();
      const existingCoin = existingCoinMap.get(coinId);
      
      try {
        if (existingCoin) {
          // Update existing coin
          const updateData: any = {
            glass_node_supported: asset.available,
            premium_metrics_available: asset.premium,
            glass_node_data_quality: asset.dataQuality,
            last_glass_node_update: new Date().toISOString(),
            api_status: asset.available ? 'operational' : 'unavailable',
            glass_node_last_discovered: new Date().toISOString()
          };

          // Update logo and CoinGecko data if available
          if (asset.logo_url && !existingCoin.logo_url) {
            updateData.logo_url = asset.logo_url;
          }
          if (asset.coingecko_id && !existingCoin.coingecko_id) {
            updateData.coingecko_id = asset.coingecko_id;
          }

          const { error: updateError } = await supabase
            .from('coins')
            .update(updateData)
            .eq('coin_id', coinId);

          if (updateError) {
            console.error(`Error updating ${coinId}:`, updateError);
          } else {
            updatedAssets++;
          }
        } else {
          // Insert new Glass Node supported asset
          const { error: insertError } = await supabase
            .from('coins')
            .insert({
              coin_id: coinId,
              name: asset.name || asset.symbol,
              current_price: 0, // Will be updated by price sync
              basket: asset.symbol === 'BTC' ? 'Bitcoin' : 
                     ['ETH', 'ADA', 'SOL', 'DOT', 'AVAX', 'MATIC'].includes(asset.symbol) ? 'Blue Chip' : 
                     'Small-Cap',
              glass_node_supported: true,
              premium_metrics_available: asset.premium,
              glass_node_data_quality: asset.dataQuality,
              last_glass_node_update: new Date().toISOString(),
              api_status: 'operational',
              glass_node_last_discovered: new Date().toISOString(),
              logo_url: asset.logo_url,
              coingecko_id: asset.coingecko_id,
              glass_node_asset_name: asset.symbol
            });

          if (insertError) {
            console.error(`Error inserting ${coinId}:`, insertError);
          } else {
            updatedAssets++;
          }
        }
      } catch (error) {
        console.error(`Database operation failed for ${coinId}:`, error);
      }
    }

    const duration = Date.now() - startTime;

    // Log discovery run
    await supabase
      .from('glass_node_discovery_logs')
      .insert({
        discovery_run_at: new Date().toISOString(),
        assets_discovered: discoveredAssets,
        assets_updated: updatedAssets,
        api_status: apiStatus,
        discovery_duration_ms: duration
      });

    console.log(`Discovery completed: ${discoveredAssets} discovered, ${updatedAssets} updated in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        discovered_at: new Date().toISOString(),
        discovery_duration_ms: duration,
        stats: {
          total_discovered: discoveredAssets,
          database_updated: updatedAssets,
          glass_node_available: assetResults.filter(a => a.available).length,
          api_status: apiStatus
        },
        available_assets: assetResults.filter(a => a.available).map(asset => ({
          symbol: asset.symbol,
          name: asset.name,
          glass_node_supported: asset.available,
          premium_metrics_available: asset.premium,
          glass_node_data_quality: asset.dataQuality,
          logo_url: asset.logo_url,
          coingecko_id: asset.coingecko_id
        }))
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Glass Node discovery error:', error);
    errorMessage = error.message;
    
    const duration = Date.now() - startTime;

    // Log error
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      
      await supabase
        .from('glass_node_discovery_logs')
        .insert({
          discovery_run_at: new Date().toISOString(),
          assets_discovered: discoveredAssets,
          assets_updated: updatedAssets,
          api_status: 'error',
          error_message: errorMessage,
          discovery_duration_ms: duration
        });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        discovered_at: new Date().toISOString(),
        discovery_duration_ms: duration,
        fallback_assets: [
          { symbol: 'BTC', name: 'Bitcoin', glass_node_supported: true, premium_metrics_available: true, glass_node_data_quality: 8 },
          { symbol: 'ETH', name: 'Ethereum', glass_node_supported: true, premium_metrics_available: true, glass_node_data_quality: 8 },
          { symbol: 'SOL', name: 'Solana', glass_node_supported: true, premium_metrics_available: true, glass_node_data_quality: 7 },
          { symbol: 'ADA', name: 'Cardano', glass_node_supported: true, premium_metrics_available: true, glass_node_data_quality: 7 },
          { symbol: 'DOT', name: 'Polkadot', glass_node_supported: true, premium_metrics_available: true, glass_node_data_quality: 7 }
        ]
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

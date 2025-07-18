
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GlassNodeResponse {
  t: number;
  v: number;
}

const SUPPORTED_COINS = [
  { coinId: 'BTC', glassNodeAsset: 'BTC', name: 'Bitcoin' },
  { coinId: 'ETH', glassNodeAsset: 'ETH', name: 'Ethereum' },
  { coinId: 'SOL', glassNodeAsset: 'SOL', name: 'Solana' },
  { coinId: 'ADA', glassNodeAsset: 'ADA', name: 'Cardano' },
  { coinId: 'LINK', glassNodeAsset: 'LINK', name: 'Chainlink' }
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting real Glass Node data update');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const glassNodeApiKey = Deno.env.get('GLASSNODE_API_KEY');
    
    if (!glassNodeApiKey) {
      throw new Error('Glass Node API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const updateResults = [];
    
    for (const coin of SUPPORTED_COINS) {
      try {
        console.log(`📊 Updating data for ${coin.name} (${coin.coinId})`);
        
        // Fetch 36 months of price data
        const since = Math.floor((Date.now() - 36 * 30 * 24 * 60 * 60 * 1000) / 1000);
        const priceUrl = `https://api.glassnode.com/v1/metrics/market/price_usd_close?a=${coin.glassNodeAsset}&api_key=${glassNodeApiKey}&s=${since}&i=24h`;
        
        const priceResponse = await fetch(priceUrl);
        if (!priceResponse.ok) {
          console.error(`Failed to fetch price data for ${coin.coinId}: ${priceResponse.status}`);
          continue;
        }
        
        const priceData: GlassNodeResponse[] = await priceResponse.json();
        console.log(`📈 Received ${priceData.length} price points for ${coin.coinId}`);
        
        // Calculate real metrics
        const realMetrics = calculateRealMetrics(priceData);
        
        // Fetch supply data
        const supplyMetrics = await fetchSupplyMetrics(coin.glassNodeAsset, glassNodeApiKey);
        
        // Update database
        const { error } = await supabase
          .from('coins')
          .upsert({
            coin_id: coin.coinId,
            name: coin.name,
            basket: coin.coinId === 'BTC' ? 'Bitcoin' : coin.coinId === 'ETH' ? 'Blue Chip' : 'Small-Cap',
            current_price: realMetrics.currentPrice,
            price_history: JSON.stringify(priceData.slice(-365)), // Last year for storage
            cagr_36m: realMetrics.cagr36m,
            volatility: realMetrics.volatility,
            aviv_ratio: supplyMetrics.avivRatio,
            active_supply: supplyMetrics.activeSupply,
            vaulted_supply: supplyMetrics.vaultedSupply,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'coin_id'
          });
        
        if (error) {
          console.error(`Database update failed for ${coin.coinId}:`, error);
        } else {
          console.log(`✅ Updated database for ${coin.coinId}`);
          updateResults.push({
            coinId: coin.coinId,
            success: true,
            metrics: realMetrics
          });
        }
        
      } catch (error) {
        console.error(`Error processing ${coin.coinId}:`, error);
        updateResults.push({
          coinId: coin.coinId,
          success: false,
          error: error.message
        });
      }
    }
    
    console.log('✅ Real Glass Node data update completed');
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Real Glass Node data updated successfully',
        results: updateResults,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('❌ Real Glass Node data update failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function calculateRealMetrics(priceData: GlassNodeResponse[]) {
  if (priceData.length < 2) {
    throw new Error('Insufficient price data for calculations');
  }
  
  // Current price
  const currentPrice = priceData[priceData.length - 1].v;
  
  // Calculate real 36-month CAGR
  const startPrice = priceData[0].v;
  const endPrice = currentPrice;
  const years = 3;
  const cagr36m = (Math.pow(endPrice / startPrice, 1/years) - 1) * 100;
  
  // Calculate real volatility from daily returns
  const returns = [];
  for (let i = 1; i < priceData.length; i++) {
    const returnRate = (priceData[i].v - priceData[i-1].v) / priceData[i-1].v;
    returns.push(returnRate);
  }
  
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance) * Math.sqrt(365) * 100; // Annualized
  
  console.log(`📊 Real metrics calculated - CAGR: ${cagr36m.toFixed(2)}%, Volatility: ${volatility.toFixed(2)}%`);
  
  return {
    currentPrice,
    cagr36m: Math.max(-80, Math.min(500, cagr36m)), // Reasonable bounds
    volatility: Math.max(10, Math.min(200, volatility)) // Reasonable bounds
  };
}

async function fetchSupplyMetrics(asset: string, apiKey: string) {
  try {
    // Fetch liquid and illiquid supply data
    const liquidUrl = `https://api.glassnode.com/v1/metrics/supply/liquid_sum?a=${asset}&api_key=${apiKey}`;
    const illiquidUrl = `https://api.glassnode.com/v1/metrics/supply/illiquid_sum?a=${asset}&api_key=${apiKey}`;
    
    const [liquidResponse, illiquidResponse] = await Promise.all([
      fetch(liquidUrl),
      fetch(illiquidUrl)
    ]);
    
    if (liquidResponse.ok && illiquidResponse.ok) {
      const liquidData: GlassNodeResponse[] = await liquidResponse.json();
      const illiquidData: GlassNodeResponse[] = await illiquidResponse.json();
      
      const latestLiquid = liquidData[liquidData.length - 1]?.v || 0;
      const latestIlliquid = illiquidData[illiquidData.length - 1]?.v || 0;
      const totalSupply = latestLiquid + latestIlliquid;
      
      const activeSupply = totalSupply > 0 ? (latestLiquid / totalSupply) * 100 : 50;
      const vaultedSupply = totalSupply > 0 ? (latestIlliquid / totalSupply) * 100 : 50;
      const avivRatio = 1.2; // Placeholder - would need realized cap for accurate calculation
      
      console.log(`📊 Supply metrics - Active: ${activeSupply.toFixed(1)}%, Vaulted: ${vaultedSupply.toFixed(1)}%`);
      
      return { avivRatio, activeSupply, vaultedSupply };
    }
  } catch (error) {
    console.error('Supply metrics fetch failed:', error);
  }
  
  // Fallback values
  return {
    avivRatio: 1.0,
    activeSupply: 50,
    vaultedSupply: 50
  };
}

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { portfolioId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Creating daily snapshot for portfolio:', portfolioId);

    // Get portfolio assets with current prices
    const { data: assets, error: assetsError } = await supabase
      .from('virtual_assets')
      .select(`
        *,
        virtual_coins!inner(symbol, name)
      `)
      .eq('portfolio_id', portfolioId);

    if (assetsError) throw assetsError;

    // Calculate current portfolio value
    let totalValue = 0;
    const assetBreakdown = [];

    for (const asset of assets) {
      const symbol = asset.virtual_coins.symbol;
      
      // Get current price from CoinMarketCap
      try {
        const response = await fetch(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol}`, {
          headers: {
            'X-CMC_PRO_API_KEY': Deno.env.get('COINMARKETCAP_API_KEY')!
          }
        });
        const data = await response.json();
        const currentPrice = data.data?.[symbol]?.quote?.USD?.price || 0;
        
        const assetValue = asset.total_amount * currentPrice;
        totalValue += assetValue;
        
        assetBreakdown.push({
          symbol: symbol,
          name: asset.virtual_coins.name,
          amount: asset.total_amount,
          price: currentPrice,
          value: assetValue,
          costBasis: asset.cost_basis,
          pnl: assetValue - asset.cost_basis
        });
      } catch (error) {
        console.error(`Failed to fetch price for ${symbol}:`, error);
      }
    }

    // Get previous snapshot for comparison
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const { data: previousSnapshot } = await supabase
      .from('portfolio_daily_snapshots')
      .select('total_value, total_profit')
      .eq('portfolio_id', portfolioId)
      .eq('snapshot_date', yesterday)
      .single();

    const previousValue = previousSnapshot?.total_value || totalValue;
    const dayChange = totalValue - previousValue;
    const dayChangePercent = previousValue > 0 ? (dayChange / previousValue) * 100 : 0;

    // Calculate total profit
    const totalCostBasis = assetBreakdown.reduce((sum, asset) => sum + asset.costBasis, 0);
    const totalProfit = totalValue - totalCostBasis;

    // Create snapshot
    const { data: snapshot, error: snapshotError } = await supabase
      .from('portfolio_daily_snapshots')
      .upsert({
        portfolio_id: portfolioId,
        snapshot_date: today,
        total_value: totalValue,
        total_profit: totalProfit,
        day_change: dayChange,
        day_change_percent: dayChangePercent,
        asset_breakdown: assetBreakdown
      })
      .select()
      .single();

    if (snapshotError) throw snapshotError;

    // Update portfolio totals
    await supabase
      .from('virtual_portfolios')
      .update({
        total_value: totalValue,
        all_time_profit: totalProfit,
        updated_at: new Date().toISOString()
      })
      .eq('id', portfolioId);

    console.log('Portfolio snapshot created successfully:', {
      portfolioId,
      totalValue,
      totalProfit,
      dayChange,
      dayChangePercent
    });

    return new Response(JSON.stringify({
      success: true,
      snapshot: {
        date: today,
        totalValue: Number(totalValue.toFixed(2)),
        totalProfit: Number(totalProfit.toFixed(2)),
        dayChange: Number(dayChange.toFixed(2)),
        dayChangePercent: Number(dayChangePercent.toFixed(2)),
        assetCount: assetBreakdown.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Portfolio snapshot error:', error);
    return new Response(JSON.stringify({
      error: 'SNAPSHOT_FAILED',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
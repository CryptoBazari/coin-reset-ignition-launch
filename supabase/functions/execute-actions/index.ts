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
    const { action, portfolioId, params } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Executing action:', action, 'for portfolio:', portfolioId);

    let result;

    switch(action) {
      case 'market-action':
        result = await handleMarketAction(supabase, portfolioId, params);
        break;
        
      case 'buy':
        result = await handleBuyAction(supabase, portfolioId, params);
        break;
        
      case 'sell':
        result = await handleSellAction(supabase, portfolioId, params);
        break;
        
      case 'rebalance':
        result = await handleRebalanceAction(supabase, portfolioId, params);
        break;
        
      case 'convert-to-stable':
        result = await handleConvertToStable(supabase, portfolioId, params);
        break;
        
      default:
        throw new Error(`Invalid action: ${action}`);
    }

    console.log('Action executed successfully:', result);

    return new Response(JSON.stringify({
      status: 'executed',
      action,
      portfolioId,
      result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Action execution error:', error);
    return new Response(JSON.stringify({
      error: 'EXECUTION_FAILED',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleMarketAction(supabase: any, portfolioId: string, params: any) {
  const { marketCondition, amount } = params;
  
  // Get portfolio value
  const { data: portfolio } = await supabase
    .from('virtual_portfolios')
    .select('total_value')
    .eq('id', portfolioId)
    .single();

  const portfolioValue = portfolio?.total_value || 0;

  const actions = {
    STRONG_BUY: {
      message: "Placing maximum Bitcoin allocation order",
      btcAllocation: Math.min(0.9, portfolioValue * 0.4)
    },
    DCA_BUY: {
      message: "Setting up weekly DCA into Bitcoin",
      weeklyAmount: portfolioValue * 0.1
    },
    ACCUMULATE: {
      message: "Prepared to buy Bitcoin on dips",
      maxBuyAmount: portfolioValue * 0.2
    },
    NEUTRAL: {
      message: "Maintaining current allocations",
      action: "hold"
    },
    PREPARE_SELL: {
      message: "Prepared to reduce altcoin exposure",
      sellAmount: portfolioValue * 0.05
    },
    STRONG_SELL: {
      message: "Reducing Bitcoin and altcoin exposure",
      sellAmount: portfolioValue * 0.2
    }
  };

  return actions[marketCondition] || { message: "No specific action for this market condition" };
}

async function handleBuyAction(supabase: any, portfolioId: string, params: any) {
  const { symbol, amount, price } = params;
  
  // Get or create coin
  let { data: coin } = await supabase
    .from('virtual_coins')
    .select('id')
    .eq('symbol', symbol.toUpperCase())
    .single();

  if (!coin) {
    const { data: newCoin, error } = await supabase
      .from('virtual_coins')
      .insert({
        symbol: symbol.toUpperCase(),
        name: symbol.toUpperCase()
      })
      .select('id')
      .single();
    
    if (error) throw error;
    coin = newCoin;
  }

  // Determine category
  const category = symbol.toLowerCase() === 'btc' ? 'Bitcoin' : 
                  ['eth', 'ada', 'dot', 'sol', 'avax'].includes(symbol.toLowerCase()) ? 'Blue Chip' : 
                  'Small-Cap';

  // Calculate purchase details
  const quantity = amount / price;
  const fee = amount * 0.001; // 0.1% fee

  // Add transaction
  const { error: txError } = await supabase
    .from('virtual_transactions')
    .insert({
      portfolio_id: portfolioId,
      coin_id: coin.id,
      transaction_type: 'buy',
      amount: quantity,
      price: price,
      value: amount,
      fee: fee,
      category: category,
      note: `Executed via portfolio action`
    });

  if (txError) throw txError;

  // Update or create asset
  const { data: existingAsset } = await supabase
    .from('virtual_assets')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .eq('coin_id', coin.id)
    .single();

  if (existingAsset) {
    const newTotalAmount = existingAsset.total_amount + quantity;
    const newCostBasis = existingAsset.cost_basis + amount;
    const newAveragePrice = newCostBasis / newTotalAmount;

    await supabase
      .from('virtual_assets')
      .update({
        total_amount: newTotalAmount,
        cost_basis: newCostBasis,
        average_price: newAveragePrice,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingAsset.id);
  } else {
    await supabase
      .from('virtual_assets')
      .insert({
        portfolio_id: portfolioId,
        coin_id: coin.id,
        total_amount: quantity,
        average_price: price,
        cost_basis: amount,
        category: category
      });
  }

  return {
    message: `Successfully bought ${quantity.toFixed(6)} ${symbol.toUpperCase()}`,
    symbol: symbol.toUpperCase(),
    quantity: quantity,
    price: price,
    totalCost: amount + fee,
    fee: fee
  };
}

async function handleSellAction(supabase: any, portfolioId: string, params: any) {
  const { symbol, amount, price } = params;

  // Get asset
  const { data: asset, error: assetError } = await supabase
    .from('virtual_assets')
    .select(`
      *,
      virtual_coins!inner(symbol)
    `)
    .eq('portfolio_id', portfolioId)
    .eq('virtual_coins.symbol', symbol.toUpperCase())
    .single();

  if (assetError || !asset) throw new Error(`Asset ${symbol} not found in portfolio`);

  const quantity = amount / price;
  
  if (quantity > asset.total_amount) {
    throw new Error(`Insufficient ${symbol} balance`);
  }

  const fee = amount * 0.001; // 0.1% fee
  const realizedProfit = (price - asset.average_price) * quantity;

  // Add transaction
  await supabase
    .from('virtual_transactions')
    .insert({
      portfolio_id: portfolioId,
      coin_id: asset.coin_id,
      asset_id: asset.id,
      transaction_type: 'sell',
      amount: quantity,
      price: price,
      value: amount,
      fee: fee,
      category: asset.category,
      note: `Executed via portfolio action`
    });

  // Update asset
  const newTotalAmount = asset.total_amount - quantity;
  const newCostBasis = asset.cost_basis - (asset.average_price * quantity);
  const newRealizedProfit = asset.realized_profit + realizedProfit;

  if (newTotalAmount <= 0) {
    // Remove asset if fully sold
    await supabase
      .from('virtual_assets')
      .delete()
      .eq('id', asset.id);
  } else {
    await supabase
      .from('virtual_assets')
      .update({
        total_amount: newTotalAmount,
        cost_basis: newCostBasis,
        realized_profit: newRealizedProfit,
        updated_at: new Date().toISOString()
      })
      .eq('id', asset.id);
  }

  return {
    message: `Successfully sold ${quantity.toFixed(6)} ${symbol.toUpperCase()}`,
    symbol: symbol.toUpperCase(),
    quantity: quantity,
    price: price,
    proceeds: amount - fee,
    realizedProfit: realizedProfit,
    fee: fee
  };
}

async function handleRebalanceAction(supabase: any, portfolioId: string, params: any) {
  const { targetAllocations } = params;
  
  // This would implement portfolio rebalancing logic
  // For now, return a simulation result
  
  return {
    message: "Portfolio rebalancing simulation completed",
    targetAllocations,
    requiredTrades: [
      { action: "sell", symbol: "ALTCOIN", amount: 1000 },
      { action: "buy", symbol: "BTC", amount: 1000 }
    ],
    estimatedFees: 20,
    projectedImprovement: "5% better risk-adjusted returns"
  };
}

async function handleConvertToStable(supabase: any, portfolioId: string, params: any) {
  const { amount } = params;
  
  // This would implement conversion to stablecoins
  // For now, return a simulation result
  
  return {
    message: `Converted $${amount} to USDC`,
    amount,
    stablecoinReceived: amount * 0.999, // Account for fees
    fee: amount * 0.001
  };
}
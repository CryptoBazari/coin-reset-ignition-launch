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
  
  // Get current market price if not provided
  let actualPrice = price;
  if (!actualPrice) {
    const response = await fetch(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol}`, {
      headers: {
        'X-CMC_PRO_API_KEY': Deno.env.get('COINMARKETCAP_API_KEY')!
      }
    });
    const data = await response.json();
    actualPrice = data.data?.[symbol]?.quote?.USD?.price || 0;
  }

  if (actualPrice <= 0) {
    throw new Error(`Unable to fetch current price for ${symbol}`);
  }

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
  const quantity = amount / actualPrice;
  const fee = amount * 0.001; // 0.1% fee

  // Add transaction
  const { error: txError } = await supabase
    .from('virtual_transactions')
    .insert({
      portfolio_id: portfolioId,
      coin_id: coin.id,
      transaction_type: 'buy',
      amount: quantity,
      price: actualPrice,
      value: amount,
      fee: fee,
      category: category,
      note: `Auto-executed buy order`,
      transaction_date: new Date().toISOString()
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
        average_price: actualPrice,
        cost_basis: amount,
        category: category
      });
  }

  // Create portfolio snapshot after transaction
  await supabase.functions.invoke('portfolio-snapshot', {
    body: { portfolioId }
  });

  return {
    message: `Successfully bought ${quantity.toFixed(6)} ${symbol.toUpperCase()}`,
    symbol: symbol.toUpperCase(),
    quantity: quantity,
    price: actualPrice,
    totalCost: amount + fee,
    fee: fee,
    executed: true
  };
}

async function handleSellAction(supabase: any, portfolioId: string, params: any) {
  const { symbol, amount, price } = params;

  // Get current market price if not provided
  let actualPrice = price;
  if (!actualPrice) {
    const response = await fetch(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol}`, {
      headers: {
        'X-CMC_PRO_API_KEY': Deno.env.get('COINMARKETCAP_API_KEY')!
      }
    });
    const data = await response.json();
    actualPrice = data.data?.[symbol]?.quote?.USD?.price || 0;
  }

  if (actualPrice <= 0) {
    throw new Error(`Unable to fetch current price for ${symbol}`);
  }

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

  const quantity = amount / actualPrice;
  
  if (quantity > asset.total_amount) {
    throw new Error(`Insufficient ${symbol} balance`);
  }

  const fee = amount * 0.001; // 0.1% fee
  const realizedProfit = (actualPrice - asset.average_price) * quantity;

  // Add transaction
  await supabase
    .from('virtual_transactions')
    .insert({
      portfolio_id: portfolioId,
      coin_id: asset.coin_id,
      asset_id: asset.id,
      transaction_type: 'sell',
      amount: quantity,
      price: actualPrice,
      value: amount,
      fee: fee,
      category: asset.category,
      note: `Auto-executed sell order`,
      transaction_date: new Date().toISOString()
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

  // Create portfolio snapshot after transaction
  await supabase.functions.invoke('portfolio-snapshot', {
    body: { portfolioId }
  });

  return {
    message: `Successfully sold ${quantity.toFixed(6)} ${symbol.toUpperCase()}`,
    symbol: symbol.toUpperCase(),
    quantity: quantity,
    price: actualPrice,
    proceeds: amount - fee,
    realizedProfit: realizedProfit,
    fee: fee,
    executed: true
  };
}

async function handleRebalanceAction(supabase: any, portfolioId: string, params: any) {
  const { targetAllocations } = params;
  
  // Get current portfolio state
  const { data: portfolio } = await supabase
    .from('virtual_portfolios')
    .select('total_value')
    .eq('id', portfolioId)
    .single();

  const { data: assets, error: assetsError } = await supabase
    .from('virtual_assets')
    .select(`
      *,
      virtual_coins!inner(symbol, name)
    `)
    .eq('portfolio_id', portfolioId);

  if (assetsError) throw assetsError;

  const totalValue = portfolio?.total_value || 0;
  const executedTrades = [];
  let totalFees = 0;

  // Calculate required trades
  for (const [category, targetPercent] of Object.entries(targetAllocations)) {
    const targetValue = totalValue * (targetPercent as number);
    const currentValue = assets
      .filter(asset => asset.category.toLowerCase() === category.toLowerCase())
      .reduce((sum, asset) => {
        // Get current price and calculate value
        return sum + (asset.total_amount * asset.average_price); // Using average price as approximation
      }, 0);

    const difference = targetValue - currentValue;
    
    if (Math.abs(difference) > totalValue * 0.01) { // Only rebalance if difference > 1%
      if (difference > 0) {
        // Need to buy more of this category
        const buySymbol = category.toLowerCase() === 'bitcoin' ? 'BTC' : 'ETH'; // Simplified
        
        try {
          const buyResult = await handleBuyAction(supabase, portfolioId, {
            symbol: buySymbol,
            amount: Math.abs(difference),
            price: null // Will fetch current price
          });
          
          executedTrades.push({
            action: 'buy',
            ...buyResult
          });
          totalFees += buyResult.fee;
        } catch (error) {
          console.error(`Failed to execute buy for ${category}:`, error);
        }
      } else {
        // Need to sell some of this category
        const categoryAssets = assets.filter(asset => 
          asset.category.toLowerCase() === category.toLowerCase()
        );
        
        if (categoryAssets.length > 0) {
          const sellAmount = Math.abs(difference);
          const largestAsset = categoryAssets.reduce((largest, current) => 
            current.total_amount * current.average_price > largest.total_amount * largest.average_price 
              ? current : largest
          );

          try {
            const sellResult = await handleSellAction(supabase, portfolioId, {
              symbol: largestAsset.virtual_coins.symbol,
              amount: sellAmount,
              price: null // Will fetch current price
            });
            
            executedTrades.push({
              action: 'sell',
              ...sellResult
            });
            totalFees += sellResult.fee;
          } catch (error) {
            console.error(`Failed to execute sell for ${category}:`, error);
          }
        }
      }
    }
  }

  // Create portfolio snapshot after rebalancing
  await supabase.functions.invoke('portfolio-snapshot', {
    body: { portfolioId }
  });

  return {
    message: `Portfolio rebalanced successfully`,
    executedTrades,
    totalFees: Number(totalFees.toFixed(2)),
    tradesCount: executedTrades.length,
    rebalanced: true
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
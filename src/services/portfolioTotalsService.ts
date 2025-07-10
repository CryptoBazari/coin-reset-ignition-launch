
import { supabase } from '@/integrations/supabase/client';
import { fetchCoinPrices } from './coinMarketCapService';

class PortfolioTotalsService {
  async updatePortfolioTotals(portfolioId: string) {
    console.log('Updating portfolio totals for:', portfolioId);
    
    const { data: assets, error } = await supabase
      .from('virtual_assets')
      .select(`
        *,
        virtual_coins (symbol, name)
      `)
      .eq('portfolio_id', portfolioId);

    if (error) throw error;

    console.log('Assets for portfolio calculation:', assets);

    if (!assets || assets.length === 0) {
      // No assets, set portfolio to zero
      const { error: updateError } = await supabase
        .from('virtual_portfolios')
        .update({
          total_value: 0,
          all_time_profit: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', portfolioId);

      if (updateError) throw updateError;
      console.log('Portfolio totals updated to zero (no assets)');
      return;
    }

    // Get live prices for accurate valuation
    let liveCoinsData = [];
    try {
      const symbols = assets.map(asset => asset.virtual_coins.symbol);
      liveCoinsData = await fetchCoinPrices(symbols);
      console.log('Fetched live prices for portfolio calculation:', liveCoinsData.length, 'prices');
    } catch (error) {
      console.warn('Could not fetch live prices, using average prices:', error);
    }

    const getLivePrice = (symbol: string) => {
      const coinData = liveCoinsData.find(coin => coin.symbol === symbol);
      return coinData?.current_price || null;
    };

    // Calculate portfolio metrics
    let totalValue = 0;
    let totalCostBasis = 0;
    let totalRealizedProfit = 0;
    let totalUnrealizedProfit = 0;

    assets.forEach(asset => {
      // Use live price if available, otherwise use average price
      const currentPrice = getLivePrice(asset.virtual_coins.symbol) || asset.average_price;
      const currentValue = asset.total_amount * currentPrice;
      
      // Add to totals
      totalValue += currentValue;
      totalCostBasis += asset.cost_basis;
      totalRealizedProfit += asset.realized_profit;
      
      // Calculate unrealized profit/loss for this asset
      const unrealizedPnL = currentValue - asset.cost_basis;
      totalUnrealizedProfit += unrealizedPnL;

      console.log(`Asset ${asset.virtual_coins.symbol}:`, {
        total_amount: asset.total_amount,
        currentPrice,
        currentValue,
        cost_basis: asset.cost_basis,
        realized_profit: asset.realized_profit,
        unrealizedPnL
      });
    });

    // Total profit/loss = realized + unrealized
    const allTimeProfit = totalRealizedProfit + totalUnrealizedProfit;

    console.log('Calculated portfolio totals:', { 
      totalValue, 
      totalCostBasis,
      totalRealizedProfit,
      totalUnrealizedProfit,
      allTimeProfit 
    });

    const { error: updateError } = await supabase
      .from('virtual_portfolios')
      .update({
        total_value: totalValue,
        all_time_profit: allTimeProfit,
        updated_at: new Date().toISOString()
      })
      .eq('id', portfolioId);

    if (updateError) throw updateError;

    console.log('Portfolio totals updated successfully');
  }
}

export const portfolioTotalsService = new PortfolioTotalsService();

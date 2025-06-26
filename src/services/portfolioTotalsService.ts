
import { supabase } from '@/integrations/supabase/client';

class PortfolioTotalsService {
  async updatePortfolioTotals(portfolioId: string) {
    console.log('Updating portfolio totals for:', portfolioId);
    
    const { data: assets, error } = await supabase
      .from('virtual_assets')
      .select('*')
      .eq('portfolio_id', portfolioId);

    if (error) throw error;

    console.log('Assets for portfolio calculation:', assets);

    // Calculate total value using current market values (average_price * total_amount)
    const totalValue = assets.reduce((sum, asset) => {
      const currentValue = asset.total_amount * asset.average_price;
      console.log(`Asset ${asset.id}: amount=${asset.total_amount}, price=${asset.average_price}, value=${currentValue}`);
      return sum + currentValue;
    }, 0);

    // Calculate total cost basis (what was actually invested)
    const totalCostBasis = assets.reduce((sum, asset) => {
      return sum + asset.cost_basis;
    }, 0);

    // Calculate total realized profit from all assets
    const totalRealizedProfit = assets.reduce((sum, asset) => {
      return sum + asset.realized_profit;
    }, 0);

    // Calculate unrealized profit/loss (current value - cost basis)
    const unrealizedProfitLoss = totalValue - totalCostBasis;

    // Total profit/loss = realized + unrealized
    const allTimeProfit = totalRealizedProfit + unrealizedProfitLoss;

    console.log('Calculated portfolio totals:', { 
      totalValue, 
      totalCostBasis,
      totalRealizedProfit,
      unrealizedProfitLoss,
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

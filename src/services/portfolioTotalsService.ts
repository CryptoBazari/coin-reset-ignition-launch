
import { supabase } from '@/integrations/supabase/client';

class PortfolioTotalsService {
  async updatePortfolioTotals(portfolioId: string) {
    console.log('Updating portfolio totals for:', portfolioId);
    
    const { data: assets, error } = await supabase
      .from('virtual_assets')
      .select('*')
      .eq('portfolio_id', portfolioId);

    if (error) throw error;

    // Calculate total value using current market values (average_price * total_amount)
    const totalValue = assets.reduce((sum, asset) => {
      const currentValue = asset.total_amount * asset.average_price;
      return sum + currentValue;
    }, 0);

    // Calculate total realized profit
    const allTimeProfit = assets.reduce((sum, asset) => {
      return sum + asset.realized_profit;
    }, 0);

    console.log('Calculated portfolio totals:', { totalValue, allTimeProfit });

    const { error: updateError } = await supabase
      .from('virtual_portfolios')
      .update({
        total_value: totalValue,
        all_time_profit: allTimeProfit,
        updated_at: new Date().toISOString()
      })
      .eq('id', portfolioId);

    if (updateError) throw updateError;
  }
}

export const portfolioTotalsService = new PortfolioTotalsService();

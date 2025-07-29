import { supabase } from '@/integrations/supabase/client';

export interface PortfolioPerformanceData {
  totalValue: number;
  totalInvested: number;
  allTimeProfit: number;
  realizedProfit: number;
  unrealizedProfit: number;
  dayChange: number;
  dayChangePercent: number;
  monthlyReturn: number;
  yearlyReturn: number;
}

class PortfolioPerformanceCalculator {
  async getPortfolioPerformanceData(portfolioId: string): Promise<PortfolioPerformanceData | null> {
    try {
      // Get current portfolio data
      const { data: portfolio, error: portfolioError } = await supabase
        .from('virtual_portfolios')
        .select('*')
        .eq('id', portfolioId)
        .single();

      if (portfolioError || !portfolio) {
        console.error('Error fetching portfolio:', portfolioError);
        return null;
      }

      // Get latest daily snapshot for day change
      const { data: latestSnapshot } = await supabase
        .from('portfolio_daily_snapshots')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single();

      let dayChange = 0;
      let dayChangePercent = 0;

      if (latestSnapshot) {
        dayChange = latestSnapshot.day_change || 0;
        dayChangePercent = latestSnapshot.day_change_percent || 0;
      }

      // Calculate monthly return (30 days ago)
      const monthlyReturn = await this.calculatePeriodReturn(portfolioId, 30);
      
      // Calculate yearly return (365 days ago)
      const yearlyReturn = await this.calculatePeriodReturn(portfolioId, 365);

      return {
        totalValue: portfolio.total_value || 0,
        totalInvested: portfolio.total_invested || 0,
        allTimeProfit: portfolio.all_time_profit || 0,
        realizedProfit: portfolio.realized_profit || 0,
        unrealizedProfit: portfolio.unrealized_profit || 0,
        dayChange,
        dayChangePercent,
        monthlyReturn,
        yearlyReturn
      };
    } catch (error) {
      console.error('Error calculating portfolio performance:', error);
      return null;
    }
  }

  private async calculatePeriodReturn(portfolioId: string, daysBack: number): Promise<number> {
    try {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - daysBack);
      const targetDateStr = targetDate.toISOString().split('T')[0];

      // Get current portfolio value
      const { data: currentPortfolio } = await supabase
        .from('virtual_portfolios')
        .select('total_value')
        .eq('id', portfolioId)
        .single();

      if (!currentPortfolio) return 0;

      // Get snapshot from the target date or closest available
      const { data: historicalSnapshot } = await supabase
        .from('portfolio_daily_snapshots')
        .select('total_value')
        .eq('portfolio_id', portfolioId)
        .lte('snapshot_date', targetDateStr)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single();

      if (!historicalSnapshot || historicalSnapshot.total_value === 0) return 0;

      const currentValue = currentPortfolio.total_value || 0;
      const historicalValue = historicalSnapshot.total_value;

      // Calculate percentage return
      const returnPercent = ((currentValue - historicalValue) / historicalValue) * 100;
      
      return returnPercent;
    } catch (error) {
      console.error(`Error calculating ${daysBack}-day return:`, error);
      return 0;
    }
  }

  async getPortfolioSnapshots(portfolioId: string, days: number = 30) {
    const { data: snapshots, error } = await supabase
      .from('portfolio_daily_snapshots')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('snapshot_date', { ascending: false })
      .limit(days);

    if (error) {
      console.error('Error fetching portfolio snapshots:', error);
      return [];
    }

    return snapshots || [];
  }
}

export const portfolioPerformanceCalculator = new PortfolioPerformanceCalculator();
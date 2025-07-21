import { supabase } from '@/integrations/supabase/client';
import { portfolioTotalsService } from './portfolioTotalsService';

export interface PortfolioSnapshot {
  id: string;
  portfolio_id: string;
  snapshot_date: string;
  total_value: number;
  total_profit: number;
  day_change: number;
  day_change_percent: number;
  asset_breakdown: any;
  created_at: string;
}

export interface PerformanceMetrics {
  id: string;
  portfolio_id: string;
  calculation_date: string;
  sharpe_ratio: number | null;
  max_drawdown: number | null;
  volatility: number | null;
  beta: number | null;
  alpha: number | null;
  correlation_sp500: number | null;
  data_points_used: number;
}

class PortfolioPerformanceService {
  async createDailySnapshot(portfolioId: string): Promise<void> {
    try {
      // First update portfolio totals to get current values
      await portfolioTotalsService.updatePortfolioTotals(portfolioId);

      // Get current portfolio data
      const { data: portfolio, error: portfolioError } = await supabase
        .from('virtual_portfolios')
        .select('total_value, all_time_profit')
        .eq('id', portfolioId)
        .single();

      if (portfolioError) throw portfolioError;

      // Get previous day's snapshot for comparison
      const { data: previousSnapshot } = await supabase
        .from('portfolio_daily_snapshots')
        .select('total_value')
        .eq('portfolio_id', portfolioId)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single();

      // Calculate day change
      const previousValue = previousSnapshot?.total_value || portfolio.total_value;
      const dayChange = portfolio.total_value - previousValue;
      const dayChangePercent = previousValue > 0 ? (dayChange / previousValue) * 100 : 0;

      // Get asset breakdown
      const { data: assets } = await supabase
        .from('virtual_assets')
        .select(`
          *,
          virtual_coins!inner(symbol, name)
        `)
        .eq('portfolio_id', portfolioId);

      const assetBreakdown = assets?.map(asset => ({
        coin_id: asset.coin_id,
        symbol: asset.virtual_coins.symbol,
        name: asset.virtual_coins.name,
        amount: asset.total_amount,
        value: asset.total_amount * asset.average_price,
        category: asset.category
      })) || [];

      // Insert today's snapshot
      const { error: insertError } = await supabase
        .from('portfolio_daily_snapshots')
        .insert({
          portfolio_id: portfolioId,
          snapshot_date: new Date().toISOString().split('T')[0],
          total_value: portfolio.total_value,
          total_profit: portfolio.all_time_profit,
          day_change: dayChange,
          day_change_percent: dayChangePercent,
          asset_breakdown: assetBreakdown
        });

      if (insertError) throw insertError;
    } catch (error) {
      console.error('Error creating portfolio snapshot:', error);
      throw error;
    }
  }

  async getPortfolioSnapshots(portfolioId: string, days: number = 30): Promise<PortfolioSnapshot[]> {
    const { data, error } = await supabase
      .from('portfolio_daily_snapshots')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('snapshot_date', { ascending: false })
      .limit(days);

    if (error) throw error;
    return data || [];
  }

  async calculatePerformanceMetrics(portfolioId: string): Promise<void> {
    try {
      // Get historical snapshots for calculations
      const snapshots = await this.getPortfolioSnapshots(portfolioId, 365);
      
      if (snapshots.length < 7) {
        console.log('Insufficient data for performance metrics calculation');
        return;
      }

      const returns = this.calculateDailyReturns(snapshots);
      const metrics = this.calculateMetrics(returns);

      // Insert performance metrics
      const { error } = await supabase
        .from('portfolio_performance_metrics')
        .insert({
          portfolio_id: portfolioId,
          calculation_date: new Date().toISOString().split('T')[0],
          sharpe_ratio: metrics.sharpeRatio,
          max_drawdown: metrics.maxDrawdown,
          volatility: metrics.volatility,
          beta: metrics.beta,
          alpha: metrics.alpha,
          correlation_sp500: metrics.correlationSP500,
          data_points_used: snapshots.length
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error calculating performance metrics:', error);
      throw error;
    }
  }

  private calculateDailyReturns(snapshots: PortfolioSnapshot[]): number[] {
    const returns: number[] = [];
    
    for (let i = 1; i < snapshots.length; i++) {
      const currentValue = snapshots[i-1].total_value;
      const previousValue = snapshots[i].total_value;
      
      if (previousValue > 0) {
        const dailyReturn = (currentValue - previousValue) / previousValue;
        returns.push(dailyReturn);
      }
    }
    
    return returns;
  }

  private calculateMetrics(returns: number[]) {
    if (returns.length === 0) {
      return {
        sharpeRatio: null,
        maxDrawdown: null,
        volatility: null,
        beta: null,
        alpha: null,
        correlationSP500: null
      };
    }

    // Calculate volatility (annualized)
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance * 252); // Annualized

    // Calculate Sharpe ratio (assuming 5% risk-free rate)
    const riskFreeRate = 0.05;
    const excessReturn = mean * 252 - riskFreeRate;
    const sharpeRatio = volatility > 0 ? excessReturn / volatility : null;

    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = 0;
    
    for (const returnValue of returns) {
      peak = Math.max(peak, returnValue);
      const drawdown = (peak - returnValue) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    return {
      sharpeRatio,
      maxDrawdown,
      volatility,
      beta: null, // Will be calculated separately with market data
      alpha: null,
      correlationSP500: null
    };
  }

  async getPerformanceMetrics(portfolioId: string): Promise<PerformanceMetrics | null> {
    const { data, error } = await supabase
      .from('portfolio_performance_metrics')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('calculation_date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return data;
  }
}

export const portfolioPerformanceService = new PortfolioPerformanceService();
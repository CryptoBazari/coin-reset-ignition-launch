import { supabase } from '@/integrations/supabase/client';
import { portfolioPerformanceService } from './portfolioPerformanceService';
import { enhancedPriceHistoryService } from './enhancedPriceHistoryService';
import { cointimeMetricsService } from './cointimeMetricsService';
import { fetchCoinPrices } from './coinMarketCapService';

export interface LivePortfolioData {
  portfolioId: string;
  totalValue: number;
  totalProfit: number;
  dayChange: number;
  dayChangePercent: number;
  assets: LiveAssetData[];
  performanceMetrics: {
    sharpeRatio: number | null;
    volatility: number | null;
    beta: number | null;
    maxDrawdown: number | null;
  };
  marketInsights: {
    topPerformer: string;
    worstPerformer: string;
    marketTrend: 'bullish' | 'bearish' | 'neutral';
    riskLevel: 'low' | 'medium' | 'high';
  };
}

export interface LiveAssetData {
  coinId: string;
  symbol: string;
  name: string;
  amount: number;
  currentPrice: number;
  value: number;
  dayChange: number;
  dayChangePercent: number;
  allocation: number;
  beta: number | null;
  volatility: number | null;
  cointimeScore: number;
}

class RealTimePortfolioIntegrationService {
  private updateInterval: NodeJS.Timeout | null = null;
  private subscribers: Map<string, (data: LivePortfolioData) => void> = new Map();

  async startLiveUpdates(portfolioId: string, callback: (data: LivePortfolioData) => void): Promise<void> {
    // Subscribe to live updates
    this.subscribers.set(portfolioId, callback);

    // Initial data fetch
    await this.updatePortfolioData(portfolioId);

    // Set up periodic updates every 5 minutes
    if (!this.updateInterval) {
      this.updateInterval = setInterval(async () => {
        for (const [id] of this.subscribers) {
          await this.updatePortfolioData(id);
        }
      }, 5 * 60 * 1000); // 5 minutes
    }
  }

  stopLiveUpdates(portfolioId: string): void {
    this.subscribers.delete(portfolioId);
    
    if (this.subscribers.size === 0 && this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private async updatePortfolioData(portfolioId: string): Promise<void> {
    try {
      const callback = this.subscribers.get(portfolioId);
      if (!callback) return;

      const liveData = await this.getLivePortfolioData(portfolioId);
      callback(liveData);
    } catch (error) {
      console.error('Error updating portfolio data:', error);
    }
  }

  async getLivePortfolioData(portfolioId: string): Promise<LivePortfolioData> {
    try {
      // Get portfolio assets
      const { data: assets, error: assetsError } = await supabase
        .from('virtual_assets')
        .select(`
          *,
          virtual_coins!inner(symbol, name)
        `)
        .eq('portfolio_id', portfolioId);

      if (assetsError) throw assetsError;

      if (!assets || assets.length === 0) {
        return this.getEmptyPortfolioData(portfolioId);
      }

      // Get live prices
      const symbols = assets.map(asset => asset.virtual_coins.symbol);
      const livePrices = await fetchCoinPrices(symbols);

      // Calculate live asset data
      const liveAssets: LiveAssetData[] = await Promise.all(
        assets.map(async (asset) => {
          const symbol = asset.virtual_coins.symbol;
          const currentPrice = livePrices[symbol] || asset.average_price;
          const value = asset.total_amount * currentPrice;
          const dayChange = value - (asset.total_amount * asset.average_price);
          const dayChangePercent = asset.average_price > 0 ? (dayChange / (asset.total_amount * asset.average_price)) * 100 : 0;

          // Get enhanced metrics
          const [beta, volatility, cointimeAnalysis] = await Promise.all([
            enhancedPriceHistoryService.calculateBeta(symbol.toLowerCase()),
            enhancedPriceHistoryService.calculateVolatility(symbol.toLowerCase()),
            cointimeMetricsService.analyzeCointimeEconomics(symbol.toLowerCase())
          ]);

          return {
            coinId: asset.coin_id,
            symbol: asset.virtual_coins.symbol,
            name: asset.virtual_coins.name,
            amount: asset.total_amount,
            currentPrice,
            value,
            dayChange,
            dayChangePercent,
            allocation: 0, // Will be calculated after total value
            beta,
            volatility,
            cointimeScore: cointimeAnalysis.confidenceScore
          };
        })
      );

      // Calculate totals and allocations
      const totalValue = liveAssets.reduce((sum, asset) => sum + asset.value, 0);
      const totalCostBasis = assets.reduce((sum, asset) => sum + asset.cost_basis, 0);
      const totalProfit = totalValue - totalCostBasis;

      // Update allocations
      liveAssets.forEach(asset => {
        asset.allocation = totalValue > 0 ? (asset.value / totalValue) * 100 : 0;
      });

      // Get previous day's snapshot for day change calculation
      const snapshots = await portfolioPerformanceService.getPortfolioSnapshots(portfolioId, 2);
      const previousValue = snapshots.length > 1 ? snapshots[1].total_value : totalValue;
      const dayChange = totalValue - previousValue;
      const dayChangePercent = previousValue > 0 ? (dayChange / previousValue) * 100 : 0;

      // Get performance metrics
      const performanceMetrics = await portfolioPerformanceService.getPerformanceMetrics(portfolioId);

      // Calculate market insights
      const marketInsights = this.calculateMarketInsights(liveAssets);

      // Create daily snapshot if this is a significant update
      await this.maybeCreateSnapshot(portfolioId, totalValue, totalProfit, dayChange, dayChangePercent, liveAssets);

      return {
        portfolioId,
        totalValue,
        totalProfit,
        dayChange,
        dayChangePercent,
        assets: liveAssets,
        performanceMetrics: {
          sharpeRatio: performanceMetrics?.sharpe_ratio || null,
          volatility: performanceMetrics?.volatility || null,
          beta: performanceMetrics?.beta || null,
          maxDrawdown: performanceMetrics?.max_drawdown || null
        },
        marketInsights
      };

    } catch (error) {
      console.error('Error getting live portfolio data:', error);
      return this.getEmptyPortfolioData(portfolioId);
    }
  }

  private calculateMarketInsights(assets: LiveAssetData[]): {
    topPerformer: string;
    worstPerformer: string;
    marketTrend: 'bullish' | 'bearish' | 'neutral';
    riskLevel: 'low' | 'medium' | 'high';
  } {
    if (assets.length === 0) {
      return {
        topPerformer: 'N/A',
        worstPerformer: 'N/A',
        marketTrend: 'neutral',
        riskLevel: 'low'
      };
    }

    // Find top and worst performers
    const sortedByPerformance = [...assets].sort((a, b) => b.dayChangePercent - a.dayChangePercent);
    const topPerformer = sortedByPerformance[0]?.symbol || 'N/A';
    const worstPerformer = sortedByPerformance[sortedByPerformance.length - 1]?.symbol || 'N/A';

    // Calculate overall trend
    const averageChange = assets.reduce((sum, asset) => sum + asset.dayChangePercent, 0) / assets.length;
    const marketTrend: 'bullish' | 'bearish' | 'neutral' = averageChange > 2 ? 'bullish' : averageChange < -2 ? 'bearish' : 'neutral';

    // Calculate risk level based on volatility and beta
    const averageVolatility = assets
      .filter(asset => asset.volatility !== null)
      .reduce((sum, asset, _, arr) => sum + (asset.volatility! / arr.length), 0);
    
    const riskLevel: 'low' | 'medium' | 'high' = averageVolatility > 0.6 ? 'high' : averageVolatility > 0.3 ? 'medium' : 'low';

    return {
      topPerformer,
      worstPerformer,
      marketTrend,
      riskLevel
    };
  }

  private async maybeCreateSnapshot(
    portfolioId: string,
    totalValue: number,
    totalProfit: number,
    dayChange: number,
    dayChangePercent: number,
    assets: LiveAssetData[]
  ): Promise<void> {
    try {
      // Check if we already have a snapshot for today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingSnapshot } = await supabase
        .from('portfolio_daily_snapshots')
        .select('id')
        .eq('portfolio_id', portfolioId)
        .eq('snapshot_date', today)
        .single();

      if (existingSnapshot) return; // Snapshot already exists for today

      // Create new snapshot
      await portfolioPerformanceService.createDailySnapshot(portfolioId);
    } catch (error) {
      console.error('Error creating portfolio snapshot:', error);
    }
  }

  private getEmptyPortfolioData(portfolioId: string): LivePortfolioData {
    return {
      portfolioId,
      totalValue: 0,
      totalProfit: 0,
      dayChange: 0,
      dayChangePercent: 0,
      assets: [],
      performanceMetrics: {
        sharpeRatio: null,
        volatility: null,
        beta: null,
        maxDrawdown: null
      },
      marketInsights: {
        topPerformer: 'N/A',
        worstPerformer: 'N/A',
        marketTrend: 'neutral',
        riskLevel: 'low'
      }
    };
  }

  async refreshPortfolioData(portfolioId: string): Promise<LivePortfolioData> {
    return this.getLivePortfolioData(portfolioId);
  }
}

export const realTimePortfolioIntegrationService = new RealTimePortfolioIntegrationService();
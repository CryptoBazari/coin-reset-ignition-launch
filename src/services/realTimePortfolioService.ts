
import { supabase } from '@/integrations/supabase/client';
import { fetchCoinPrices } from './coinMarketCapService';
import { VirtualAsset } from '@/types/virtualPortfolio';

export interface RealTimePortfolioData {
  totalValue: number;
  totalProfit: number;
  dayChange: number;
  dayChangePercent: number;
  assets: Array<{
    id: string;
    symbol: string;
    name: string;
    amount: number;
    currentPrice: number;
    currentValue: number;
    profitLoss: number;
    profitLossPercent: number;
    priceChange24h: number;
    priceChangePercent24h: number;
  }>;
}

class RealTimePortfolioService {
  private cache = new Map<string, { data: RealTimePortfolioData; timestamp: number }>();
  private cacheExpiry = 60000; // 1 minute cache

  async getPortfolioRealTimeData(portfolioId: string): Promise<RealTimePortfolioData> {
    const cacheKey = `portfolio_${portfolioId}`;
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      console.log('📊 Using cached portfolio data');
      return this.cache.get(cacheKey)!.data;
    }

    try {
      console.log('🔄 Fetching real-time portfolio data for:', portfolioId);

      // Get portfolio assets
      const { data: assets, error } = await supabase
        .from('virtual_assets')
        .select(`
          *,
          virtual_coins!inner(symbol, name)
        `)
        .eq('portfolio_id', portfolioId)
        .gt('total_amount', 0);

      if (error) throw error;

      if (!assets || assets.length === 0) {
        const emptyData: RealTimePortfolioData = {
          totalValue: 0,
          totalProfit: 0,
          dayChange: 0,
          dayChangePercent: 0,
          assets: []
        };
        this.setCache(cacheKey, emptyData);
        return emptyData;
      }

      // Get live market data
      const symbols = assets.map(asset => asset.virtual_coins.symbol);
      const liveCoinsData = await fetchCoinPrices(symbols);

      // Calculate real-time metrics
      let totalValue = 0;
      let totalProfit = 0;
      let totalValueYesterday = 0;
      const assetData = [];

      for (const asset of assets) {
        const liveCoinData = liveCoinsData.find(coin => coin.symbol === asset.virtual_coins.symbol);
        const currentPrice = liveCoinData?.current_price || asset.average_price;
        const priceChange24h = liveCoinData?.price_change_24h || 0;
        const priceChangePercent24h = liveCoinData?.price_change_percentage_24h || 0;
        
        const currentValue = asset.total_amount * currentPrice;
        const profitLoss = asset.realized_profit + (currentValue - asset.cost_basis);
        const profitLossPercent = asset.cost_basis > 0 ? ((currentValue - asset.cost_basis) / asset.cost_basis) * 100 : 0;
        
        // Calculate yesterday's value for day change
        const yesterdayPrice = currentPrice - priceChange24h;
        const yesterdayValue = asset.total_amount * yesterdayPrice;
        
        totalValue += currentValue;
        totalProfit += profitLoss;
        totalValueYesterday += yesterdayValue;

        assetData.push({
          id: asset.id,
          symbol: asset.virtual_coins.symbol,
          name: asset.virtual_coins.name,
          amount: asset.total_amount,
          currentPrice,
          currentValue,
          profitLoss,
          profitLossPercent,
          priceChange24h,
          priceChangePercent24h
        });
      }

      const dayChange = totalValue - totalValueYesterday;
      const dayChangePercent = totalValueYesterday > 0 ? (dayChange / totalValueYesterday) * 100 : 0;

      const portfolioData: RealTimePortfolioData = {
        totalValue,
        totalProfit,
        dayChange,
        dayChangePercent,
        assets: assetData
      };

      // Cache the result
      this.setCache(cacheKey, portfolioData);

      console.log('✅ Real-time portfolio data fetched successfully');
      console.log(`📊 Total Value: $${totalValue.toLocaleString()}, Day Change: ${dayChangePercent.toFixed(2)}%`);

      return portfolioData;

    } catch (error) {
      console.error('❌ Error fetching real-time portfolio data:', error);
      
      // Return fallback data
      const fallbackData: RealTimePortfolioData = {
        totalValue: 0,
        totalProfit: 0,
        dayChange: 0,
        dayChangePercent: 0,
        assets: []
      };
      
      this.setCache(cacheKey, fallbackData);
      return fallbackData;
    }
  }

  async updatePortfolioTotals(portfolioId: string): Promise<void> {
    try {
      const realTimeData = await this.getPortfolioRealTimeData(portfolioId);
      
      // Update the portfolio totals in the database
      const { error } = await supabase
        .from('virtual_portfolios')
        .update({
          total_value: realTimeData.totalValue,
          all_time_profit: realTimeData.totalProfit,
          updated_at: new Date().toISOString()
        })
        .eq('id', portfolioId);

      if (error) {
        console.error('Error updating portfolio totals:', error);
      } else {
        console.log('✅ Portfolio totals updated successfully');
      }
    } catch (error) {
      console.error('Error in updatePortfolioTotals:', error);
    }
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    return cached && (Date.now() - cached.timestamp) < this.cacheExpiry;
  }

  private setCache(key: string, data: RealTimePortfolioData): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const realTimePortfolioService = new RealTimePortfolioService();

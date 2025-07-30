import { useState, useEffect, useCallback } from 'react';
import { realTimePortfolioService, RealTimePortfolioData } from '@/services/realTimePortfolioService';
import { supabase } from '@/integrations/supabase/client';

export interface UnifiedPortfolioData extends RealTimePortfolioData {
  allocations: Array<{
    symbol: string;
    name: string;
    value: number;
    percentage: number;
    color: string;
  }>;
  lastUpdated: Date;
}

const ALLOCATION_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export const useUnifiedPortfolioData = (portfolioId: string) => {
  const [portfolioData, setPortfolioData] = useState<UnifiedPortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolioData = useCallback(async () => {
    if (!portfolioId) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 [Unified] Fetching portfolio data for:', portfolioId);
      
      const realTimeData = await realTimePortfolioService.getPortfolioRealTimeData(portfolioId);
      
      // Calculate allocations from the real-time data
      const allocations = realTimeData.assets.map((asset, index) => ({
        symbol: asset.symbol,
        name: asset.name,
        value: asset.currentValue,
        percentage: realTimeData.totalValue > 0 ? (asset.currentValue / realTimeData.totalValue) * 100 : 0,
        color: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length]
      }));

      const unifiedData: UnifiedPortfolioData = {
        ...realTimeData,
        allocations,
        lastUpdated: new Date()
      };

      setPortfolioData(unifiedData);
      
      // Update database totals
      await realTimePortfolioService.updatePortfolioTotals(portfolioId);
      
      console.log('✅ [Unified] Portfolio data updated:', {
        totalValue: realTimeData.totalValue,
        allocations: allocations.length,
        timestamp: unifiedData.lastUpdated
      });
      
    } catch (err) {
      console.error('❌ [Unified] Error fetching portfolio data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio data');
    } finally {
      setLoading(false);
    }
  }, [portfolioId]);

  // Temporarily disabled real-time subscriptions to prevent multiple subscription errors
  // TODO: Implement singleton pattern for real-time subscriptions
  
  useEffect(() => {
    fetchPortfolioData();
    
    // Set up interval for periodic updates (every 2 minutes)
    const interval = setInterval(fetchPortfolioData, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchPortfolioData]);

  const refreshData = useCallback(() => {
    console.log('🔄 [Unified] Manual refresh triggered');
    realTimePortfolioService.clearCache();
    return fetchPortfolioData();
  }, [fetchPortfolioData]);

  return {
    portfolioData,
    loading,
    error,
    refreshData,
    lastUpdated: portfolioData?.lastUpdated
  };
};
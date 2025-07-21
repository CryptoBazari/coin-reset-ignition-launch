
import { useState, useEffect, useCallback } from 'react';
import { realTimePortfolioService, RealTimePortfolioData } from '@/services/realTimePortfolioService';

export const useRealTimePortfolio = (portfolioId: string) => {
  const [portfolioData, setPortfolioData] = useState<RealTimePortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolioData = useCallback(async () => {
    if (!portfolioId) return;

    try {
      setLoading(true);
      setError(null);
      
      const data = await realTimePortfolioService.getPortfolioRealTimeData(portfolioId);
      setPortfolioData(data);
      
      // Also update the database totals
      await realTimePortfolioService.updatePortfolioTotals(portfolioId);
      
    } catch (err) {
      console.error('Error fetching portfolio data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio data');
    } finally {
      setLoading(false);
    }
  }, [portfolioId]);

  useEffect(() => {
    fetchPortfolioData();
    
    // Set up interval for real-time updates (every 2 minutes)
    const interval = setInterval(fetchPortfolioData, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchPortfolioData]);

  return {
    portfolioData,
    loading,
    error,
    refetch: fetchPortfolioData
  };
};

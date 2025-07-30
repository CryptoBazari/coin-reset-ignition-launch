import { useState, useEffect, useMemo } from 'react';
import { AssetHolding, SortOption, SortOrder } from '@/types/assetHoldings';
import { useUnifiedPortfolioData } from './useUnifiedPortfolioData';

export const useUnifiedAssetHoldings = (portfolioId: string) => {
  const { portfolioData, loading, error, refreshData } = useUnifiedPortfolioData(portfolioId);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('value');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Transform unified portfolio data to AssetHolding format
  const assets: AssetHolding[] = useMemo(() => {
    if (!portfolioData || !portfolioData.assets) return [];

    return portfolioData.assets.map(asset => ({
      id: asset.id,
      coin_name: asset.name,
      coin_symbol: asset.symbol,
      total_amount: asset.amount,
      average_price: asset.currentPrice, // Using current price for now
      current_price: asset.currentPrice,
      cost_basis: asset.amount * asset.currentPrice - asset.profitLoss, // Calculate cost basis
      market_value: asset.currentValue,
      unrealized_pnl: asset.profitLoss,
      unrealized_pnl_percentage: asset.profitLossPercent,
      allocation_percentage: portfolioData.totalValue > 0 ? (asset.currentValue / portfolioData.totalValue) * 100 : 0,
      category: 'Bitcoin' // Default category - this should come from database
    }));
  }, [portfolioData]);

  // Filter and sort assets
  const filteredAssets: AssetHolding[] = useMemo(() => {
    let filtered = assets.filter(asset => {
      const matchesSearch = asset.coin_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           asset.coin_symbol.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || asset.category.toLowerCase() === categoryFilter.toLowerCase();
      
      return matchesSearch && matchesCategory;
    });

    // Sort assets
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.coin_name.localeCompare(b.coin_name);
          break;
        case 'value':
          comparison = a.market_value - b.market_value;
          break;
        case 'pnl':
          comparison = a.unrealized_pnl - b.unrealized_pnl;
          break;
        case 'allocation':
          comparison = a.allocation_percentage - b.allocation_percentage;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [assets, searchTerm, categoryFilter, sortBy, sortOrder]);

  return {
    assets,
    filteredAssets,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    liveCoinsData: [], // Not needed since we use unified data
    fetchAssets: refreshData // Use unified refresh
  };
};
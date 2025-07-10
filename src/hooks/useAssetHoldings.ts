import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchCoinPrices, CoinMarketCapCoin } from '@/services/coinMarketCapService';
import { AssetHolding, SortOption, SortOrder } from '@/types/assetHoldings';

export const useAssetHoldings = (portfolioId: string) => {
  const [assets, setAssets] = useState<AssetHolding[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<AssetHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('value');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [liveCoinsData, setLiveCoinsData] = useState<CoinMarketCapCoin[]>([]);

  useEffect(() => {
    fetchAssets();
  }, [portfolioId]);

  useEffect(() => {
    filterAndSortAssets();
  }, [assets, searchTerm, categoryFilter, sortBy, sortOrder]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      
      const { data: virtualAssets, error } = await supabase
        .from('virtual_assets')
        .select(`
          *,
          virtual_coins!inner(name, symbol)
        `)
        .eq('portfolio_id', portfolioId)
        .gt('total_amount', 0);

      if (error) throw error;

      if (!virtualAssets || virtualAssets.length === 0) {
        setAssets([]);
        setLiveCoinsData([]);
        return;
      }

      // Fetch live prices
      const symbols = virtualAssets.map(asset => asset.virtual_coins.symbol);
      let fetchedLiveCoinsData: CoinMarketCapCoin[] = [];
      
      try {
        fetchedLiveCoinsData = await fetchCoinPrices(symbols);
        setLiveCoinsData(fetchedLiveCoinsData);
        console.log('Fetched live prices for', fetchedLiveCoinsData.length, 'coins');
      } catch (error) {
        console.warn('Could not fetch live prices, using average prices:', error);
        setLiveCoinsData([]);
      }

      // Transform the data with real current prices
      const transformedAssets: AssetHolding[] = virtualAssets.map(asset => {
        // Use live price if available, otherwise use average price
        const liveCoinData = fetchedLiveCoinsData.find(coin => coin.symbol === asset.virtual_coins.symbol);
        const currentPrice = liveCoinData?.current_price || asset.average_price;
        const marketValue = asset.total_amount * currentPrice;
        const unrealizedPnl = marketValue - asset.cost_basis;
        const unrealizedPnlPercentage = asset.cost_basis > 0 ? (unrealizedPnl / asset.cost_basis) * 100 : 0;

        return {
          id: asset.id,
          coin_name: asset.virtual_coins.name,
          coin_symbol: asset.virtual_coins.symbol,
          total_amount: asset.total_amount,
          average_price: asset.average_price,
          current_price: currentPrice,
          cost_basis: asset.cost_basis,
          market_value: marketValue,
          unrealized_pnl: unrealizedPnl,
          unrealized_pnl_percentage: unrealizedPnlPercentage,
          allocation_percentage: 0, // Will be calculated after we have all assets
          category: asset.category
        };
      });

      // Calculate allocation percentages
      const totalValue = transformedAssets.reduce((sum, asset) => sum + asset.market_value, 0);
      const assetsWithAllocation = transformedAssets.map(asset => ({
        ...asset,
        allocation_percentage: totalValue > 0 ? (asset.market_value / totalValue) * 100 : 0
      }));

      setAssets(assetsWithAllocation);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortAssets = () => {
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

    setFilteredAssets(filtered);
  };

  return {
    assets,
    filteredAssets,
    loading,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    liveCoinsData,
    fetchAssets
  };
};
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, SortAsc, SortDesc, TrendingUp, TrendingDown, MoreVertical, Plus, Minus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface AssetHolding {
  id: string;
  coin_name: string;
  coin_symbol: string;
  total_amount: number;
  average_price: number;
  current_price: number;
  cost_basis: number;
  market_value: number;
  unrealized_pnl: number;
  unrealized_pnl_percentage: number;
  allocation_percentage: number;
  category: string;
}

interface AssetHoldingsProps {
  portfolioId: string;
}

const AssetHoldings = ({ portfolioId }: AssetHoldingsProps) => {
  const [assets, setAssets] = useState<AssetHolding[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<AssetHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'value' | 'pnl' | 'allocation'>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

      // Transform the data and add mock current prices for demonstration
      const transformedAssets: AssetHolding[] = virtualAssets.map(asset => {
        // Mock current price calculation (in a real app, this would come from a price service)
        const priceVariation = (Math.random() - 0.5) * 0.2; // -10% to +10% variation
        const currentPrice = asset.average_price * (1 + priceVariation);
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

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'bitcoin':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'ethereum':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'defi':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'altcoin':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const AssetCard = ({ asset }: { asset: AssetHolding }) => {
    const isProfit = asset.unrealized_pnl >= 0;
    const priceChange = asset.current_price - asset.average_price;
    const priceChangePercentage = asset.average_price > 0 ? (priceChange / asset.average_price) * 100 : 0;
    const isPriceUp = priceChange >= 0;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <div>
              <CardTitle className="text-lg font-semibold">{asset.coin_symbol}</CardTitle>
              <p className="text-sm text-muted-foreground">{asset.coin_name}</p>
            </div>
            <Badge className={getCategoryColor(asset.category)}>
              {asset.category}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Plus className="h-4 w-4 mr-2" />
                Buy More
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Minus className="h-4 w-4 mr-2" />
                Sell
              </DropdownMenuItem>
              <DropdownMenuItem>
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Holdings</p>
              <p className="font-medium">{asset.total_amount.toFixed(6)} {asset.coin_symbol}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Market Value</p>
              <p className="font-medium">${asset.market_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Price</p>
              <p className="font-medium">${asset.average_price.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Price</p>
              <div className="flex items-center gap-1">
                <p className="font-medium">${asset.current_price.toFixed(2)}</p>
                <div className={`flex items-center text-xs ${isPriceUp ? 'text-green-600' : 'text-red-600'}`}>
                  {isPriceUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {isPriceUp ? '+' : ''}{priceChangePercentage.toFixed(1)}%
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cost Basis</p>
              <p className="font-medium">${asset.cost_basis.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unrealized P&L</p>
              <div className={`font-medium ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                {isProfit ? '+' : ''}${asset.unrealized_pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-xs ml-1">
                  ({isProfit ? '+' : ''}{asset.unrealized_pnl_percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Portfolio Allocation</span>
              <Badge variant="outline">{asset.allocation_percentage.toFixed(1)}%</Badge>
            </div>
            <div className="mt-2 bg-muted rounded-full h-2">
              <div 
                className="bg-primary rounded-full h-2 transition-all duration-300"
                style={{ width: `${Math.min(asset.allocation_percentage, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const categories = ['all', ...Array.from(new Set(assets.map(asset => asset.category)))];
  const totalValue = assets.reduce((sum, asset) => sum + asset.market_value, 0);
  const totalUnrealizedPnl = assets.reduce((sum, asset) => sum + asset.unrealized_pnl, 0);
  const totalCostBasis = assets.reduce((sum, asset) => sum + asset.cost_basis, 0);
  const totalUnrealizedPnlPercentage = totalCostBasis > 0 ? (totalUnrealizedPnl / totalCostBasis) * 100 : 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading holdings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Holdings Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost Basis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalCostBasis.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unrealized P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalUnrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalUnrealizedPnl >= 0 ? '+' : ''}${totalUnrealizedPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <Badge 
              variant="secondary" 
              className={`mt-1 ${totalUnrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {totalUnrealizedPnl >= 0 ? '+' : ''}{totalUnrealizedPnlPercentage.toFixed(2)}%
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Asset Holdings
            <Badge variant="secondary">{filteredAssets.length} assets</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="value">Market Value</SelectItem>
                <SelectItem value="pnl">Unrealized P&L</SelectItem>
                <SelectItem value="allocation">Allocation</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
            </Button>
          </div>

          {filteredAssets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {assets.length === 0 ? 'No assets in portfolio' : 'No assets match your search criteria'}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredAssets.map(asset => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AssetHoldings;
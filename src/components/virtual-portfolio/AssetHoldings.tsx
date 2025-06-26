
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { VirtualAsset } from '@/types/virtualPortfolio';
import { fetchCoinPrices } from '@/services/coinMarketCapService';

interface AssetHoldingsProps {
  portfolioId: string;
}

const AssetHoldings = ({ portfolioId }: AssetHoldingsProps) => {
  const { data: assets, isLoading } = useQuery({
    queryKey: ['virtual-assets', portfolioId],
    queryFn: async () => {
      console.log('Fetching assets for portfolio:', portfolioId);
      
      const { data, error } = await supabase
        .from('virtual_assets')
        .select(`
          *,
          virtual_coins (symbol, name)
        `)
        .eq('portfolio_id', portfolioId)
        .gt('total_amount', 0.00000001)
        .order('cost_basis', { ascending: false });

      if (error) {
        console.error('Error fetching assets:', error);
        throw error;
      }
      
      console.log('Fetched assets:', data);
      return data as unknown as VirtualAsset[];
    }
  });

  // Fetch live prices and comprehensive coin data
  const { data: liveCoinsData, refetch: refetchPrices, isRefetching } = useQuery({
    queryKey: ['live-coins-data', assets?.map(a => a.virtual_coins.symbol)],
    queryFn: async () => {
      if (!assets || assets.length === 0) return [];
      const symbols = assets.map(asset => asset.virtual_coins.symbol);
      console.log('Fetching live coin data for symbols:', symbols);
      return await fetchCoinPrices(symbols);
    },
    enabled: !!assets && assets.length > 0,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // 2 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Asset Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading holdings...</div>
        </CardContent>
      </Card>
    );
  }

  if (!assets || assets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Asset Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No holdings yet. Add your first transaction to get started.
          </div>
        </CardContent>
      </Card>
    );
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Bitcoin': return 'bg-orange-100 text-orange-800';
      case 'Blue Chip': return 'bg-blue-100 text-blue-800';
      case 'Small-Cap': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLiveCoinData = (symbol: string) => {
    return liveCoinsData?.find(coin => coin.symbol === symbol) || null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Asset Holdings</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchPrices()}
            disabled={isRefetching}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh Prices
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assets.map((asset) => {
            const liveCoinData = getLiveCoinData(asset.virtual_coins.symbol);
            const currentPrice = liveCoinData?.current_price || asset.average_price;
            const currentValue = asset.total_amount * currentPrice;
            
            // Calculate unrealized profit/loss (current value - cost basis)
            const unrealizedPnL = currentValue - asset.cost_basis;
            const unrealizedPnLPercent = asset.cost_basis > 0 ? (unrealizedPnL / asset.cost_basis) * 100 : 0;
            
            // Total profit/loss = realized + unrealized
            const totalPnL = asset.realized_profit + unrealizedPnL;
            const totalPnLPercent = asset.cost_basis > 0 ? (totalPnL / asset.cost_basis) * 100 : 0;
            
            // Price change percentage
            const priceChange = liveCoinData ? ((liveCoinData.current_price - asset.average_price) / asset.average_price) * 100 : 0;

            console.log('Asset calculation:', {
              symbol: asset.virtual_coins.symbol,
              total_amount: asset.total_amount,
              currentPrice,
              currentValue,
              cost_basis: asset.cost_basis,
              unrealizedPnL,
              realized_profit: asset.realized_profit,
              totalPnL,
              liveCoinData
            });

            return (
              <div key={asset.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {liveCoinData?.logo && (
                      <img 
                        src={liveCoinData.logo} 
                        alt={asset.virtual_coins.symbol}
                        className="w-8 h-8 rounded-full"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        {asset.virtual_coins.symbol} - {asset.virtual_coins.name}
                      </h3>
                      <div className="flex gap-2 mt-1">
                        <Badge className={getCategoryColor(asset.category)}>
                          {asset.category}
                        </Badge>
                        {liveCoinData && (
                          <Badge variant="outline" className="text-xs">
                            Live Data
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-lg">
                      ${currentValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </div>
                    <div className={`text-sm font-medium ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)} ({totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%)
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Holdings:</span>
                    <div className="mt-1">{asset.total_amount.toFixed(8)} {asset.virtual_coins.symbol}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Current Price:</span>
                    <div className="mt-1">
                      ${currentPrice.toLocaleString()}
                      {liveCoinData && priceChange !== 0 && (
                        <div className={`text-xs ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Avg Buy Price:</span>
                    <div className="mt-1">${asset.average_price.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Cost Basis:</span>
                    <div className="mt-1">${asset.cost_basis.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Realized P&L:</span>
                    <div className={`mt-1 ${asset.realized_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${asset.realized_profit.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Unrealized P&L:</span>
                    <div className={`mt-1 ${unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${unrealizedPnL.toFixed(2)}
                    </div>
                  </div>
                </div>

                {liveCoinData && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs text-gray-500">
                      <div>
                        <span className="font-medium">Market Cap:</span>
                        <div>${liveCoinData.market_cap?.toLocaleString() || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="font-medium">24h Change:</span>
                        <div className={liveCoinData.price_change_24h >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {liveCoinData.price_change_24h >= 0 ? '+' : ''}{liveCoinData.price_change_24h?.toFixed(2)}%
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Data Source:</span>
                        <div>CoinMarketCap</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default AssetHoldings;

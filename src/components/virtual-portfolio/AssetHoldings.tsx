
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
      const { data, error } = await supabase
        .from('virtual_assets')
        .select(`
          *,
          virtual_coins (symbol, name, coinmarketcap_id)
        `)
        .eq('portfolio_id', portfolioId)
        .gt('total_amount', 0)
        .order('cost_basis', { ascending: false });

      if (error) throw error;
      return data as unknown as VirtualAsset[];
    }
  });

  // Fetch live prices for assets
  const { data: livePrices, refetch: refetchPrices, isRefetching } = useQuery({
    queryKey: ['live-prices', assets?.map(a => a.virtual_coins.symbol)],
    queryFn: async () => {
      if (!assets || assets.length === 0) return [];
      const symbols = assets.map(asset => asset.virtual_coins.symbol);
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

  const getLivePrice = (symbol: string) => {
    return livePrices?.find(price => price.symbol === symbol)?.current_price || null;
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
            const livePrice = getLivePrice(asset.virtual_coins.symbol);
            const currentPrice = livePrice || asset.average_price;
            const currentValue = asset.total_amount * currentPrice;
            const unrealizedPnL = currentValue - asset.cost_basis;
            const unrealizedPnLPercent = asset.cost_basis > 0 ? (unrealizedPnL / asset.cost_basis) * 100 : 0;
            const priceChange = livePrice ? ((livePrice - asset.average_price) / asset.average_price) * 100 : 0;

            return (
              <div key={asset.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-semibold">
                        {asset.virtual_coins.symbol} - {asset.virtual_coins.name}
                      </h3>
                      <div className="flex gap-2 mt-1">
                        <Badge className={getCategoryColor(asset.category)}>
                          {asset.category}
                        </Badge>
                        {livePrice && (
                          <Badge variant="outline" className="text-xs">
                            Live Price
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      ${currentValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </div>
                    <div className={`text-sm ${unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {unrealizedPnL >= 0 ? '+' : ''}${unrealizedPnL.toFixed(2)} ({unrealizedPnLPercent >= 0 ? '+' : ''}{unrealizedPnLPercent.toFixed(2)}%)
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Holdings:</span><br />
                    {asset.total_amount.toFixed(8)} {asset.virtual_coins.symbol}
                  </div>
                  <div>
                    <span className="font-medium">Current Price:</span><br />
                    ${currentPrice.toLocaleString()}
                    {livePrice && priceChange !== 0 && (
                      <div className={`text-xs ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Avg Buy Price:</span><br />
                    ${asset.average_price.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Cost Basis:</span><br />
                    ${asset.cost_basis.toFixed(2)}
                  </div>
                  <div>
                    <span className="font-medium">Realized P&L:</span><br />
                    <span className={asset.realized_profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${asset.realized_profit.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default AssetHoldings;


import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { VirtualAsset } from '@/types/virtualPortfolio';
import { fetchCoinPrices } from '@/services/coinMarketCapService';
import AssetHoldingCard from './AssetHoldingCard';

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
        .gt('total_amount', 0.000000001)
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

  const getLiveCoinData = (symbol: string) => {
    return liveCoinsData?.find(coin => coin.symbol === symbol) || null;
  };

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
          {assets.map((asset) => (
            <AssetHoldingCard 
              key={asset.id}
              asset={asset}
              liveCoinData={getLiveCoinData(asset.virtual_coins.symbol)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AssetHoldings;

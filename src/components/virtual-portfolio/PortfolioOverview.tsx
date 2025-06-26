
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchCoinPrices } from '@/services/coinMarketCapService';

interface Portfolio {
  id: string;
  name: string;
  total_value: number;
  all_time_profit: number;
  created_at: string;
}

interface PortfolioOverviewProps {
  portfolio: Portfolio;
}

const PortfolioOverview = ({ portfolio }: PortfolioOverviewProps) => {
  // Fetch detailed portfolio calculations
  const { data: portfolioMetrics, isLoading } = useQuery({
    queryKey: ['portfolio-metrics', portfolio.id],
    queryFn: async () => {
      console.log('Calculating portfolio metrics for:', portfolio.id);
      
      const { data: assets, error } = await supabase
        .from('virtual_assets')
        .select(`
          *,
          virtual_coins (symbol, name)
        `)
        .eq('portfolio_id', portfolio.id);

      if (error) throw error;

      if (!assets || assets.length === 0) {
        return {
          totalValue: 0,
          totalCostBasis: 0,
          realizedProfit: 0,
          unrealizedProfit: 0,
          totalProfit: 0,
          roi: 0
        };
      }

      // Get live prices for accurate calculations
      let liveCoinsData = [];
      try {
        const symbols = assets.map(asset => asset.virtual_coins.symbol);
        liveCoinsData = await fetchCoinPrices(symbols);
        console.log('Fetched live prices for metrics:', liveCoinsData.length);
      } catch (error) {
        console.warn('Could not fetch live prices for metrics:', error);
      }

      const getLivePrice = (symbol: string) => {
        const coinData = liveCoinsData.find(coin => coin.symbol === symbol);
        return coinData?.current_price || null;
      };

      // Calculate comprehensive metrics
      let totalValue = 0;
      let totalCostBasis = 0;
      let totalRealizedProfit = 0;
      let totalUnrealizedProfit = 0;

      assets.forEach(asset => {
        // Use live price if available, otherwise use average price
        const currentPrice = getLivePrice(asset.virtual_coins.symbol) || asset.average_price;
        const currentValue = asset.total_amount * currentPrice;
        
        // Add to totals
        totalValue += currentValue;
        totalCostBasis += asset.cost_basis;
        totalRealizedProfit += asset.realized_profit;
        
        // Calculate unrealized profit/loss for this asset
        const unrealizedPnL = currentValue - asset.cost_basis;
        totalUnrealizedProfit += unrealizedPnL;

        console.log(`Asset ${asset.virtual_coins.symbol} metrics:`, {
          total_amount: asset.total_amount,
          currentPrice,
          currentValue,
          cost_basis: asset.cost_basis,
          realized_profit: asset.realized_profit,
          unrealizedPnL
        });
      });

      // Total profit/loss = realized + unrealized
      const totalProfit = totalRealizedProfit + totalUnrealizedProfit;
      
      // ROI calculation based on cost basis
      const roi = totalCostBasis > 0 ? (totalProfit / totalCostBasis) * 100 : 0;

      console.log('Calculated portfolio metrics:', {
        totalValue,
        totalCostBasis,
        totalRealizedProfit,
        totalUnrealizedProfit,
        totalProfit,
        roi
      });

      return {
        totalValue,
        totalCostBasis,
        realizedProfit: totalRealizedProfit,
        unrealizedProfit: totalUnrealizedProfit,
        totalProfit,
        roi
      };
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metrics = portfolioMetrics || {
    totalValue: 0,
    totalCostBasis: 0,
    realizedProfit: 0,
    unrealizedProfit: 0,
    totalProfit: 0,
    roi: 0
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${metrics.totalValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Current market value
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Profit/Loss</CardTitle>
          {metrics.totalProfit >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            metrics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            ${metrics.totalProfit >= 0 ? '+' : ''}
            {metrics.totalProfit.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Realized: ${metrics.realizedProfit.toFixed(2)} | Unrealized: ${metrics.unrealizedProfit.toFixed(2)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Return (ROI)</CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            metrics.roi >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {metrics.roi >= 0 ? '+' : ''}
            {metrics.roi.toFixed(2)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.totalCostBasis > 0 ? `Cost basis: $${metrics.totalCostBasis.toFixed(2)}` : 'No investments yet'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {portfolio.name}
          </div>
          <p className="text-xs text-muted-foreground">
            Created {new Date(portfolio.created_at).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioOverview;

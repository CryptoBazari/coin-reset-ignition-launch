
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  // Fetch the total cost basis from all assets to calculate proper return percentage
  const { data: costBasisData } = useQuery({
    queryKey: ['portfolio-cost-basis', portfolio.id],
    queryFn: async () => {
      const { data: assets, error } = await supabase
        .from('virtual_assets')
        .select('cost_basis')
        .eq('portfolio_id', portfolio.id);

      if (error) throw error;

      const totalCostBasis = assets.reduce((sum, asset) => sum + asset.cost_basis, 0);
      return { totalCostBasis };
    }
  });

  // Calculate the return percentage based on cost basis (ROI)
  const totalCostBasis = costBasisData?.totalCostBasis || 0;
  const profitPercentage = totalCostBasis > 0 
    ? (portfolio.all_time_profit / totalCostBasis) * 100
    : 0;

  console.log('Portfolio calculations:', {
    total_value: portfolio.total_value,
    all_time_profit: portfolio.all_time_profit,
    totalCostBasis,
    profitPercentage
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${portfolio.total_value.toLocaleString(undefined, {
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
          {portfolio.all_time_profit >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            portfolio.all_time_profit >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            ${portfolio.all_time_profit >= 0 ? '+' : ''}
            {portfolio.all_time_profit.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Realized + Unrealized
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
            profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {profitPercentage >= 0 ? '+' : ''}
            {profitPercentage.toFixed(2)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {totalCostBasis > 0 ? `Cost basis: $${totalCostBasis.toFixed(2)}` : 'No investments yet'}
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

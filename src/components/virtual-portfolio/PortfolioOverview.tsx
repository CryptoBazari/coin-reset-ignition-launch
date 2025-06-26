
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';

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
  const profitPercentage = portfolio.total_value > 0 
    ? ((portfolio.all_time_profit / (portfolio.total_value - portfolio.all_time_profit)) * 100)
    : 0;

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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Return %</CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {profitPercentage >= 0 ? '+' : ''}
            {profitPercentage.toFixed(2)}%
          </div>
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

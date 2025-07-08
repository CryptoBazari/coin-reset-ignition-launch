import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Percent, Clock, Target } from 'lucide-react';

interface PortfolioMetricsProps {
  totalValue: number;
  allTimeProfit: number;
  dayChange?: number;
  dayChangePercent?: number;
  topPerformer?: {
    name: string;
    change: number;
  };
  worstPerformer?: {
    name: string;
    change: number;
  };
}

const PortfolioMetrics = ({
  totalValue,
  allTimeProfit,
  dayChange = 0,
  dayChangePercent = 0,
  topPerformer,
  worstPerformer
}: PortfolioMetricsProps) => {
  const profitPercent = totalValue > 0 ? (allTimeProfit / (totalValue - allTimeProfit)) * 100 : 0;

  const metrics = [
    {
      title: "Portfolio Value",
      value: `$${totalValue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-blue-600"
    },
    {
      title: "Total P&L",
      value: `${allTimeProfit >= 0 ? '+' : ''}$${allTimeProfit.toFixed(2)}`,
      subValue: `${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(2)}%`,
      icon: allTimeProfit >= 0 ? TrendingUp : TrendingDown,
      color: allTimeProfit >= 0 ? "text-green-600" : "text-red-600"
    },
    {
      title: "24h Change",
      value: `${dayChange >= 0 ? '+' : ''}$${dayChange.toFixed(2)}`,
      subValue: `${dayChangePercent >= 0 ? '+' : ''}${dayChangePercent.toFixed(2)}%`,
      icon: dayChange >= 0 ? TrendingUp : TrendingDown,
      color: dayChange >= 0 ? "text-green-600" : "text-red-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {metrics.map((metric, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {metric.title}
            </CardTitle>
            <metric.icon className={`h-4 w-4 ${metric.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metric.color}`}>
              {metric.value}
            </div>
            {metric.subValue && (
              <p className={`text-xs ${metric.color} mt-1`}>
                {metric.subValue}
              </p>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Performance Cards */}
      {topPerformer && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">
              Top Performer
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-700">
              {topPerformer.name}
            </div>
            <p className="text-sm text-green-600">
              +{topPerformer.change.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      )}

      {worstPerformer && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">
              Worst Performer
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-red-700">
              {worstPerformer.name}
            </div>
            <p className="text-sm text-red-600">
              {worstPerformer.change.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PortfolioMetrics;
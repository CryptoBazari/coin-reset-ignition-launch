import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Percent, Target, Calendar } from 'lucide-react';

interface PortfolioMetricsProps {
  totalValue: number;
  allTimeProfit: number;
  dayChange?: number;
  dayChangePercent?: number;
  totalInvested?: number;
  monthlyReturn?: number;
  yearlyReturn?: number;
}

const PortfolioMetrics = ({ 
  totalValue,
  allTimeProfit,
  dayChange = 0,
  dayChangePercent = 0,
  totalInvested = 0,
  monthlyReturn = 0,
  yearlyReturn = 0
}: PortfolioMetricsProps) => {
  const profitLossPercentage = totalInvested > 0 ? (allTimeProfit / totalInvested) * 100 : 0;
  const isProfit = allTimeProfit >= 0;
  const isDayProfit = dayChange >= 0;

  const metrics = [
    {
      title: "Current Value",
      value: `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      change: null,
      color: "text-foreground"
    },
    {
      title: "Total Invested",
      value: `$${totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: Target,
      change: null,
      color: "text-muted-foreground"
    },
    {
      title: "All-Time P&L",
      value: `${isProfit ? '+' : ''}$${allTimeProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: isProfit ? TrendingUp : TrendingDown,
      change: `${profitLossPercentage >= 0 ? '+' : ''}${profitLossPercentage.toFixed(2)}%`,
      color: isProfit ? "text-green-600" : "text-red-600"
    },
    {
      title: "Daily Change",
      value: `${isDayProfit ? '+' : ''}$${dayChange.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: isDayProfit ? TrendingUp : TrendingDown,
      change: `${dayChangePercent >= 0 ? '+' : ''}${dayChangePercent.toFixed(2)}%`,
      color: isDayProfit ? "text-green-600" : "text-red-600"
    },
    {
      title: "Monthly Return",
      value: `${monthlyReturn >= 0 ? '+' : ''}${monthlyReturn.toFixed(2)}%`,
      icon: Percent,
      change: null,
      color: monthlyReturn >= 0 ? "text-green-600" : "text-red-600"
    },
    {
      title: "Yearly Return",
      value: `${yearlyReturn >= 0 ? '+' : ''}${yearlyReturn.toFixed(2)}%`,
      icon: Calendar,
      change: null,
      color: yearlyReturn >= 0 ? "text-green-600" : "text-red-600"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-lg font-bold ${metric.color}`}>
                {metric.value}
              </div>
              {metric.change && (
                <Badge 
                  variant="secondary" 
                  className={`mt-1 text-xs ${metric.color}`}
                >
                  {metric.change}
                </Badge>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default PortfolioMetrics;
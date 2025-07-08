import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface AnalyticsSummaryProps {
  portfolioId: string;
}

const AnalyticsSummary = ({ portfolioId }: AnalyticsSummaryProps) => {
  const { data: summaryData, isLoading } = useQuery({
    queryKey: ['analytics-summary', portfolioId],
    queryFn: async () => {
      // Get portfolio data
      const { data: portfolio, error: portfolioError } = await supabase
        .from('virtual_portfolios')
        .select('*')
        .eq('id', portfolioId)
        .single();

      if (portfolioError) throw portfolioError;

      // Get transactions for analysis
      const { data: transactions, error: transError } = await supabase
        .from('virtual_transactions')
        .select(`
          *,
          virtual_coins (symbol, name)
        `)
        .eq('portfolio_id', portfolioId)
        .order('transaction_date', { ascending: false });

      if (transError) throw transError;

      // Get assets
      const { data: assets, error: assetsError } = await supabase
        .from('virtual_assets')
        .select(`
          *,
          virtual_coins (symbol, name)
        `)
        .eq('portfolio_id', portfolioId);

      if (assetsError) throw assetsError;

      return { portfolio, transactions, assets };
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <div className="text-gray-500">Loading summary...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summaryData) {
    return null;
  }

  const { portfolio, transactions, assets } = summaryData;

  // Calculate insights
  const totalTransactions = transactions.length;
  const buyTransactions = transactions.filter(t => t.transaction_type === 'buy').length;
  const sellTransactions = transactions.filter(t => t.transaction_type === 'sell').length;
  const averageTransactionValue = totalTransactions > 0 
    ? transactions.reduce((sum, t) => sum + t.value, 0) / totalTransactions 
    : 0;

  const lastTransactionDate = transactions.length > 0 
    ? new Date(transactions[0].transaction_date).toLocaleDateString()
    : null;

  const totalInvested = transactions
    .filter(t => t.transaction_type === 'buy')
    .reduce((sum, t) => sum + t.value + t.fee, 0);

  const currentValue = portfolio.total_value;
  const totalReturn = portfolio.all_time_profit;
  const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  // Portfolio health indicators
  const diversificationScore = Math.min(assets.length * 20, 100); // Max 5 assets for 100%
  const activityScore = Math.min(totalTransactions * 10, 100); // Max 10 transactions for 100%
  
  const insights = [
    {
      title: "Portfolio Return",
      value: `${totalReturnPercent >= 0 ? '+' : ''}${totalReturnPercent.toFixed(2)}%`,
      subValue: `$${totalReturn.toFixed(2)}`,
      icon: totalReturn >= 0 ? TrendingUp : TrendingDown,
      color: totalReturn >= 0 ? "text-green-600" : "text-red-600",
      bgColor: totalReturn >= 0 ? "bg-green-50" : "bg-red-50"
    },
    {
      title: "Total Invested",
      value: `$${totalInvested.toFixed(2)}`,
      subValue: `${buyTransactions} buy orders`,
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Portfolio Activity",
      value: `${totalTransactions} transactions`,
      subValue: `${sellTransactions} sell orders`,
      icon: Activity,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Last Transaction",
      value: lastTransactionDate || "No transactions",
      subValue: `Avg: $${averageTransactionValue.toFixed(2)}`,
      icon: Calendar,
      color: "text-gray-600",
      bgColor: "bg-gray-50"
    }
  ];

  const healthMetrics = [
    {
      name: "Diversification",
      score: diversificationScore,
      status: diversificationScore >= 60 ? "good" : diversificationScore >= 30 ? "moderate" : "poor"
    },
    {
      name: "Activity Level",
      score: activityScore,
      status: activityScore >= 50 ? "good" : activityScore >= 20 ? "moderate" : "poor"
    },
    {
      name: "Performance",
      score: Math.max(0, Math.min(100, 50 + totalReturnPercent * 2)),
      status: totalReturnPercent > 10 ? "good" : totalReturnPercent > -5 ? "moderate" : "poor"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Analytics Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {insights.map((insight, index) => (
            <div key={index} className={`p-4 rounded-lg ${insight.bgColor}`}>
              <div className="flex items-center justify-between mb-2">
                <insight.icon className={`h-5 w-5 ${insight.color}`} />
              </div>
              <div className={`text-lg font-bold ${insight.color}`}>
                {insight.value}
              </div>
              <div className="text-sm text-gray-600">{insight.title}</div>
              <div className="text-xs text-gray-500 mt-1">{insight.subValue}</div>
            </div>
          ))}
        </div>

        {/* Portfolio Health */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-3">Portfolio Health</h4>
          <div className="space-y-3">
            {healthMetrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {metric.status === 'good' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : metric.status === 'moderate' ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-medium">{metric.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        metric.status === 'good' ? 'bg-green-500' :
                        metric.status === 'moderate' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${metric.score}%` }}
                    />
                  </div>
                  <Badge variant={
                    metric.status === 'good' ? 'default' :
                    metric.status === 'moderate' ? 'secondary' : 'destructive'
                  }>
                    {metric.score.toFixed(0)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{assets.length}</div>
            <div className="text-sm text-gray-600">Assets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {((currentValue / totalInvested) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Value Ratio</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {(totalTransactions / 30).toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Trades/Month</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsSummary;
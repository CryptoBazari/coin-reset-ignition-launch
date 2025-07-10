import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, Award, AlertCircle } from 'lucide-react';
import { portfolioAnalyticsService, PortfolioAnalytics } from '@/services/portfolioAnalyticsService';

interface AnalyticsSummaryProps {
  portfolioId: string;
}

const AnalyticsSummary = ({ portfolioId }: AnalyticsSummaryProps) => {
  const [summary, setSummary] = useState<PortfolioAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const analytics = await portfolioAnalyticsService.calculatePortfolioAnalytics(portfolioId);
        setSummary(analytics);
      } catch (error) {
        console.error('Error fetching portfolio analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [portfolioId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            Loading summary...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Analytics Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Total Return</span>
            </div>
            <div className="text-xl font-bold text-green-600">
              +{summary.totalReturn.toFixed(1)}%
            </div>
          </div>

          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Award className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-muted-foreground">Best Asset</span>
            </div>
            <div className="text-lg font-bold">{summary.bestPerformingAsset.symbol}</div>
            <div className="text-sm text-green-600">+{summary.bestPerformingAsset.return.toFixed(1)}%</div>
          </div>

          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-muted-foreground">Worst Asset</span>
            </div>
            <div className="text-lg font-bold">{summary.worstPerformingAsset.symbol}</div>
            <div className="text-sm text-red-600">{summary.worstPerformingAsset.return.toFixed(1)}%</div>
          </div>

          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Annualized</span>
            </div>
            <div className="text-xl font-bold text-green-600">
              +{summary.annualizedReturn.toFixed(1)}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsSummary;
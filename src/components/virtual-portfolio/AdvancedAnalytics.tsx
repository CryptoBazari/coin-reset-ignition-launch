import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Target, AlertTriangle, Shield, Zap } from 'lucide-react';
import { portfolioAnalyticsService, AdvancedAnalytics as AdvancedAnalyticsData } from '@/services/portfolioAnalyticsService';

interface AdvancedAnalyticsProps {
  portfolioId: string;
}

const AdvancedAnalytics = ({ portfolioId }: AdvancedAnalyticsProps) => {
  const [analytics, setAnalytics] = useState<AdvancedAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdvancedAnalytics = async () => {
      try {
        setLoading(true);
        const advancedAnalytics = await portfolioAnalyticsService.calculateAdvancedAnalytics(portfolioId);
        setAnalytics(advancedAnalytics);
      } catch (error) {
        console.error('Error fetching advanced analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdvancedAnalytics();
  }, [portfolioId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Advanced Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Loading analytics...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Advanced Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Analytics data unavailable
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Advanced Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sharpe Ratio</span>
              <Badge variant={analytics.sharpeRatio > 1 ? "default" : "secondary"}>
                {analytics.sharpeRatio.toFixed(2)}
              </Badge>
            </div>
            <Progress value={Math.min(analytics.sharpeRatio * 25, 100)} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Risk Score</span>
              <Badge variant="outline">
                {analytics.riskScore.toFixed(1)}/10
              </Badge>
            </div>
            <Progress value={analytics.riskScore * 10} className="h-2" />
          </div>
        </div>

        {/* NPV Analysis Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Portfolio NPV</div>
            <div className={`text-lg font-bold ${analytics.npvAnalysis.portfolioNPV >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${analytics.npvAnalysis.portfolioNPV.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Projected Value (2Y)</div>
            <div className="text-lg font-bold text-blue-600">
              ${analytics.npvAnalysis.projectedValue.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Risk-Adj. Return</div>
            <div className={`text-lg font-bold ${analytics.npvAnalysis.riskAdjustedReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {analytics.npvAnalysis.riskAdjustedReturn >= 0 ? '+' : ''}{analytics.npvAnalysis.riskAdjustedReturn}%
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">Volatility</div>
            <div className="text-lg font-bold">{analytics.volatility}%</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">Max Drawdown</div>
            <div className="text-lg font-bold text-red-600">-{analytics.maxDrawdown}%</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">Win Rate</div>
            <div className="text-lg font-bold text-green-600">{analytics.winRate}%</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">Momentum</div>
            <div className={`text-lg font-bold ${analytics.momentum >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {analytics.momentum >= 0 ? '+' : ''}{analytics.momentum}%
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Target className="h-4 w-4" />
            AI Recommendations
          </h4>
          <div className="space-y-2">
            {analytics.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedAnalytics;
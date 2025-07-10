import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Target, AlertTriangle, Shield, Zap } from 'lucide-react';

interface AdvancedAnalyticsProps {
  portfolioId: string;
}

interface AnalyticsData {
  sharpeRatio: number;
  volatility: number;
  maxDrawdown: number;
  winRate: number;
  riskScore: number;
  diversificationScore: number;
  momentum: number;
  recommendations: string[];
}

const AdvancedAnalytics = ({ portfolioId }: AdvancedAnalyticsProps) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching analytics data
    const timer = setTimeout(() => {
      setAnalytics({
        sharpeRatio: 1.85,
        volatility: 35.2,
        maxDrawdown: -18.5,
        winRate: 67.3,
        riskScore: 7.2,
        diversificationScore: 8.4,
        momentum: 12.8,
        recommendations: [
          'Consider reducing exposure to high-volatility assets',
          'Portfolio shows strong momentum indicators',
          'Diversification is well-balanced across sectors',
          'Consider taking some profits at current levels'
        ]
      });
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
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
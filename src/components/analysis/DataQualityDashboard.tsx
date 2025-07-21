import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Eye,
  Zap
} from 'lucide-react';

interface DataQualityMetrics {
  totalCoins: number;
  coinsWithRealData: number;
  coinsWithPriceHistory: number;
  coinsWithGlassNodeData: number;
  recentUpdates: number;
  staleCutoff: string;
  lastSystemUpdate: string | null;
}

interface QualityIndicator {
  label: string;
  value: number;
  total: number;
  percentage: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  description: string;
}

export const DataQualityDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DataQualityMetrics | null>(null);
  const [qualityIndicators, setQualityIndicators] = useState<QualityIndicator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQualityMetrics = async () => {
    setIsLoading(true);
    
    try {
      const now = new Date();
      const staleCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

      // Get detailed counts
      const [
        { count: totalCoins },
        { count: coinsWithRealPrices },
        { count: coinsWithHistory },
        { count: coinsWithGlassNode },
        { count: recentUpdates }
      ] = await Promise.all([
        supabase.from('coins').select('*', { count: 'exact', head: true }),
        supabase.from('coins').select('*', { count: 'exact', head: true }).neq('current_price', 0),
        supabase.from('price_history_36m').select('coin_id', { count: 'exact', head: true }),
        supabase.from('cointime_metrics').select('coin_id', { count: 'exact', head: true }),
        supabase.from('coins').select('*', { count: 'exact', head: true }).gte('updated_at', staleCutoff.toISOString())
      ]);

      // Get last system update
      const { data: lastUpdate } = await supabase
        .from('coins')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      const qualityMetrics: DataQualityMetrics = {
        totalCoins: totalCoins || 0,
        coinsWithRealData: coinsWithRealPrices || 0,
        coinsWithPriceHistory: coinsWithHistory || 0,
        coinsWithGlassNodeData: coinsWithGlassNode || 0,
        recentUpdates: recentUpdates || 0,
        staleCutoff: staleCutoff.toISOString(),
        lastSystemUpdate: lastUpdate?.updated_at || null
      };

      setMetrics(qualityMetrics);

      // Calculate quality indicators
      const indicators: QualityIndicator[] = [
        {
          label: 'Real Price Data',
          value: qualityMetrics.coinsWithRealData,
          total: qualityMetrics.totalCoins,
          percentage: qualityMetrics.totalCoins > 0 ? (qualityMetrics.coinsWithRealData / qualityMetrics.totalCoins) * 100 : 0,
          status: getQualityStatus(qualityMetrics.coinsWithRealData, qualityMetrics.totalCoins, [90, 70, 50]),
          description: 'Coins with current market prices from real APIs'
        },
        {
          label: 'Price History Coverage',
          value: qualityMetrics.coinsWithPriceHistory,
          total: qualityMetrics.totalCoins,
          percentage: qualityMetrics.totalCoins > 0 ? (qualityMetrics.coinsWithPriceHistory / qualityMetrics.totalCoins) * 100 : 0,
          status: getQualityStatus(qualityMetrics.coinsWithPriceHistory, qualityMetrics.totalCoins, [80, 60, 40]),
          description: '36-month historical data for CAGR and volatility calculations'
        },
        {
          label: 'On-Chain Metrics',
          value: qualityMetrics.coinsWithGlassNodeData,
          total: qualityMetrics.totalCoins,
          percentage: qualityMetrics.totalCoins > 0 ? (qualityMetrics.coinsWithGlassNodeData / qualityMetrics.totalCoins) * 100 : 0,
          status: getQualityStatus(qualityMetrics.coinsWithGlassNodeData, qualityMetrics.totalCoins, [50, 30, 15]),
          description: 'Advanced Glass Node metrics for blockchain analysis'
        },
        {
          label: 'Data Freshness',
          value: qualityMetrics.recentUpdates,
          total: qualityMetrics.totalCoins,
          percentage: qualityMetrics.totalCoins > 0 ? (qualityMetrics.recentUpdates / qualityMetrics.totalCoins) * 100 : 0,
          status: getQualityStatus(qualityMetrics.recentUpdates, qualityMetrics.totalCoins, [85, 65, 45]),
          description: 'Coins updated within the last 24 hours'
        }
      ];

      setQualityIndicators(indicators);

    } catch (error) {
      console.error('Error fetching quality metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getQualityStatus = (value: number, total: number, thresholds: [number, number, number]): 'excellent' | 'good' | 'warning' | 'critical' => {
    if (total === 0) return 'critical';
    const percentage = (value / total) * 100;
    
    if (percentage >= thresholds[0]) return 'excellent';
    if (percentage >= thresholds[1]) return 'good';
    if (percentage >= thresholds[2]) return 'warning';
    return 'critical';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-4 w-4" />;
      case 'good': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const overallScore = qualityIndicators.length > 0 
    ? qualityIndicators.reduce((sum, indicator) => sum + indicator.percentage, 0) / qualityIndicators.length 
    : 0;

  useEffect(() => {
    fetchQualityMetrics();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">Loading data quality metrics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Data Quality Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-bold">{Math.round(overallScore)}%</div>
              <div className="text-sm text-muted-foreground">Overall data quality</div>
            </div>
            <Badge variant={overallScore >= 80 ? "default" : overallScore >= 60 ? "secondary" : "destructive"}>
              {overallScore >= 80 ? "EXCELLENT" : overallScore >= 60 ? "GOOD" : "NEEDS IMPROVEMENT"}
            </Badge>
          </div>
          <Progress value={overallScore} className="w-full" />
          
          {overallScore < 60 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Data quality is below optimal levels. Consider running the data population process to improve accuracy.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Quality Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {qualityIndicators.map((indicator) => (
          <Card key={indicator.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(indicator.status)}
                  <span className="font-medium">{indicator.label}</span>
                </div>
                <Badge variant="outline" className={getStatusColor(indicator.status)}>
                  {Math.round(indicator.percentage)}%
                </Badge>
              </div>
              
              <div className="text-sm text-muted-foreground mb-3">
                {indicator.value} of {indicator.total} coins
              </div>
              
              <Progress value={indicator.percentage} className="w-full mb-2" />
              
              <div className="text-xs text-muted-foreground">
                {indicator.description}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Status */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-bold">{metrics.totalCoins}</div>
                <div className="text-sm text-muted-foreground">Total Coins</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-bold">{metrics.recentUpdates}</div>
                <div className="text-sm text-muted-foreground">Recent Updates</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-bold">
                  {metrics.lastSystemUpdate ? new Date(metrics.lastSystemUpdate).toLocaleDateString() : 'Never'}
                </div>
                <div className="text-sm text-muted-foreground">Last Update</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DataQualityDashboard;
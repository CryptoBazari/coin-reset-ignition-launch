import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Activity, Lock, Droplets } from 'lucide-react';
import { cointimeMetricsService, CointimeAnalysis } from '@/services/cointimeMetricsService';

interface CointimeEconomicsCardProps {
  coinId: string;
  coinSymbol: string;
}

const CointimeEconomicsCard = ({ coinId, coinSymbol }: CointimeEconomicsCardProps) => {
  const [analysis, setAnalysis] = useState<CointimeAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCointimeData = async () => {
      try {
        const data = await cointimeMetricsService.analyzeCointimeEconomics(coinId);
        setAnalysis(data);
      } catch (error) {
        console.error('Error fetching cointime analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCointimeData();
  }, [coinId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Cointime Economics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Loading cointime data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis || analysis.confidenceScore === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Cointime Economics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            No cointime data available for {coinSymbol}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'bullish':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'bearish':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'bullish':
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'bearish':
        return 'bg-red-500/10 text-red-700 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Cointime Economics
          </div>
          <Badge variant="outline" className="text-xs">
            Confidence: {analysis.confidenceScore}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AVIV Ratio */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">AVIV Ratio</span>
            <div className="flex items-center gap-2">
              {getTrendIcon(analysis.avivTrend)}
              <Badge className={getTrendColor(analysis.avivTrend)}>
                {analysis.avivTrend}
              </Badge>
            </div>
          </div>
          {analysis.currentAviv !== null ? (
            <div className="flex items-center gap-2">
              <Progress value={analysis.currentAviv * 100} className="flex-1" />
              <span className="text-sm text-muted-foreground min-w-[3rem]">
                {(analysis.currentAviv * 100).toFixed(1)}%
              </span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No data available</div>
          )}
        </div>

        {/* Supply Distribution */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Supply Distribution</h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Active Supply</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {analysis.supplyDistribution.active.toFixed(1)}%
              </span>
            </div>
            <Progress value={analysis.supplyDistribution.active} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-green-500" />
                <span className="text-sm">Vaulted Supply</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {analysis.supplyDistribution.vaulted.toFixed(1)}%
              </span>
            </div>
            <Progress value={analysis.supplyDistribution.vaulted} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Liquid Supply</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {analysis.supplyDistribution.liquid.toFixed(1)}%
              </span>
            </div>
            <Progress value={analysis.supplyDistribution.liquid} className="h-2" />
          </div>
        </div>

        {/* Cointime Activity */}
        {(analysis.cointimeActivity.destroyed > 0 || analysis.cointimeActivity.created > 0) && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Cointime Activity</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Destroyed</div>
                <div className="font-medium">
                  {analysis.cointimeActivity.destroyed.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Created</div>
                <div className="font-medium">
                  {analysis.cointimeActivity.created.toLocaleString()}
                </div>
              </div>
            </div>
            {analysis.cointimeActivity.ratio > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">Destruction Ratio: </span>
                <span className="font-medium">{analysis.cointimeActivity.ratio.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Recommendation */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-sm">
            <span className="font-medium">Analysis: </span>
            {analysis.recommendation}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CointimeEconomicsCard;
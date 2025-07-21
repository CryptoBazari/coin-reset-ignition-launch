import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, TrendingUp, TrendingDown, Activity, Shield, AlertTriangle } from 'lucide-react';
import { LivePortfolioData, LiveAssetData } from '@/services/realTimePortfolioIntegrationService';

interface LivePortfolioDashboardProps {
  portfolioData: LivePortfolioData;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: Date | null;
}

const LivePortfolioDashboard = ({ 
  portfolioData, 
  onRefresh, 
  isRefreshing, 
  lastUpdated 
}: LivePortfolioDashboardProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low': return <Shield className="h-4 w-4 text-green-500" />;
      case 'medium': return <Activity className="h-4 w-4 text-yellow-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header with Live Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle>Live Portfolio Dashboard</CardTitle>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-muted-foreground">Live</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {lastUpdated && (
                <span className="text-sm text-muted-foreground">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total Value */}
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatCurrency(portfolioData.totalValue)}
              </div>
              <div className="text-sm text-muted-foreground">Total Value</div>
            </div>

            {/* Total Profit */}
            <div className="text-center">
              <div className={`text-2xl font-bold ${getChangeColor(portfolioData.totalProfit)}`}>
                {formatCurrency(portfolioData.totalProfit)}
              </div>
              <div className="text-sm text-muted-foreground">Total P&L</div>
            </div>

            {/* Day Change */}
            <div className="text-center">
              <div className={`flex items-center justify-center gap-1 text-xl font-bold ${getChangeColor(portfolioData.dayChange)}`}>
                {getTrendIcon(portfolioData.dayChange)}
                {formatCurrency(Math.abs(portfolioData.dayChange))}
              </div>
              <div className={`text-sm ${getChangeColor(portfolioData.dayChangePercent)}`}>
                {formatPercentage(portfolioData.dayChangePercent)}
              </div>
            </div>

            {/* Market Trend */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                {getRiskIcon(portfolioData.marketInsights.riskLevel)}
                <Badge variant={
                  portfolioData.marketInsights.marketTrend === 'bullish' ? 'default' :
                  portfolioData.marketInsights.marketTrend === 'bearish' ? 'destructive' : 'secondary'
                }>
                  {portfolioData.marketInsights.marketTrend}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">Market Trend</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold">
                {portfolioData.performanceMetrics.sharpeRatio?.toFixed(2) || 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">
                {portfolioData.performanceMetrics.volatility ? 
                  `${(portfolioData.performanceMetrics.volatility * 100).toFixed(1)}%` : 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">Volatility</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">
                {portfolioData.performanceMetrics.beta?.toFixed(2) || 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">Beta</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">
                {portfolioData.performanceMetrics.maxDrawdown ? 
                  `${(portfolioData.performanceMetrics.maxDrawdown * 100).toFixed(1)}%` : 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">Max Drawdown</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Market Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Top Performer</span>
              </div>
              <div className="text-lg font-bold text-green-900">
                {portfolioData.marketInsights.topPerformer}
              </div>
            </div>
            
            <div className="p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Worst Performer</span>
              </div>
              <div className="text-lg font-bold text-red-900">
                {portfolioData.marketInsights.worstPerformer}
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                {getRiskIcon(portfolioData.marketInsights.riskLevel)}
                <span className="text-sm font-medium text-blue-800">Risk Level</span>
              </div>
              <div className="text-lg font-bold text-blue-900 capitalize">
                {portfolioData.marketInsights.riskLevel}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Assets Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Live Asset Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {portfolioData.assets.map((asset) => (
              <div key={asset.coinId} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-semibold">{asset.name}</div>
                      <div className="text-sm text-muted-foreground">{asset.symbol}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(asset.value)}</div>
                    <div className={`text-sm ${getChangeColor(asset.dayChange)}`}>
                      {formatCurrency(asset.dayChange)} ({formatPercentage(asset.dayChangePercent)})
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Amount</div>
                    <div className="font-medium">{asset.amount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Price</div>
                    <div className="font-medium">{formatCurrency(asset.currentPrice)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Allocation</div>
                    <div className="font-medium">{asset.allocation.toFixed(1)}%</div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Portfolio Allocation</span>
                    <span>{asset.allocation.toFixed(1)}%</span>
                  </div>
                  <Progress value={asset.allocation} className="h-2" />
                </div>

                {(asset.beta || asset.volatility || asset.cointimeScore > 0) && (
                  <div className="mt-3 grid grid-cols-3 gap-4 text-xs">
                    {asset.beta && (
                      <div>
                        <div className="text-muted-foreground">Beta</div>
                        <div className="font-medium">{asset.beta.toFixed(2)}</div>
                      </div>
                    )}
                    {asset.volatility && (
                      <div>
                        <div className="text-muted-foreground">Volatility</div>
                        <div className="font-medium">{(asset.volatility * 100).toFixed(1)}%</div>
                      </div>
                    )}
                    {asset.cointimeScore > 0 && (
                      <div>
                        <div className="text-muted-foreground">Cointime Score</div>
                        <div className="font-medium">{asset.cointimeScore}%</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LivePortfolioDashboard;
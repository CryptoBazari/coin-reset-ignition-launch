import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { FinancialMetrics } from '@/types/investment';

interface EnhancedFinancialMetricsProps {
  metrics: FinancialMetrics;
  coinName: string;
}

export const EnhancedFinancialMetrics: React.FC<EnhancedFinancialMetricsProps> = ({
  metrics,
  coinName
}) => {
  const getMetricColor = (value: number, threshold: number = 0) => {
    if (value > threshold) return 'text-success';
    if (value > threshold * 0.5) return 'text-warning';
    return 'text-destructive';
  };

  const getPerformanceIcon = (value: number, threshold: number = 0) => {
    return value > threshold ? 
      <TrendingUp className="w-4 h-4 text-success" /> : 
      <TrendingDown className="w-4 h-4 text-destructive" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Enhanced Financial Analysis - {coinName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Core Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">NPV</div>
            <div className={`text-xl font-bold ${getMetricColor(metrics.npv)}`}>
              ${metrics.npv.toLocaleString()}
            </div>
            <div className="flex justify-center mt-1">
              {getPerformanceIcon(metrics.npv)}
            </div>
          </div>

          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">IRR</div>
            <div className={`text-xl font-bold ${getMetricColor(metrics.irr, 15)}`}>
              {metrics.irr.toFixed(1)}%
            </div>
            <div className="flex justify-center mt-1">
              {getPerformanceIcon(metrics.irr, 15)}
            </div>
          </div>

          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Price CAGR</div>
            <div className={`text-xl font-bold ${getMetricColor(metrics.cagr, 20)}`}>
              {metrics.cagr.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">Price Growth Only</div>
          </div>

          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Total Return CAGR</div>
            <div className={`text-xl font-bold ${getMetricColor(metrics.totalReturnCAGR, 25)}`}>
              {metrics.totalReturnCAGR.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">Including Staking</div>
          </div>
        </div>

        {/* ROI Breakdown */}
        <div>
          <h4 className="font-semibold mb-3">Return on Investment Breakdown</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground">Price ROI</div>
              <div className="text-lg font-semibold">{metrics.priceROI.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Asset appreciation</div>
            </div>
            
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground">Staking ROI</div>
              <div className="text-lg font-semibold">{metrics.stakingROI.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Staking rewards</div>
            </div>
            
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground">Total ROI</div>
              <div className="text-lg font-semibold">{metrics.roi.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Combined returns</div>
            </div>
          </div>
        </div>

        {/* Advanced Metrics */}
        <div>
          <h4 className="font-semibold mb-3">Advanced Risk-Adjusted Metrics</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground">Risk-Adjusted NPV</div>
              <div className="text-lg font-semibold">{metrics.riskAdjustedNPV.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">CAPM-adjusted value</div>
            </div>
            
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground">Expected Return (CAPM)</div>
              <div className="text-lg font-semibold">{metrics.expectedReturn.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Market model prediction</div>
            </div>
          </div>
        </div>

        {/* Data Quality Indicators */}
        <div className="flex gap-2">
          <Badge variant="outline">
            Beta: {metrics.betaConfidence} confidence
          </Badge>
          <Badge variant="outline">
            Data: {metrics.dataQuality}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
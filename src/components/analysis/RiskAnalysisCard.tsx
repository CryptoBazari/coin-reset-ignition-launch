import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, TrendingUp } from 'lucide-react';
import { FinancialMetrics } from '@/types/investment';

interface RiskAnalysisCardProps {
  metrics: FinancialMetrics;
  coinBasket: string;
}

export const RiskAnalysisCard: React.FC<RiskAnalysisCardProps> = ({
  metrics,
  coinBasket
}) => {
  const getBetaRiskLevel = (beta: number) => {
    if (beta < 1) return { level: 'Low', color: 'text-success', description: 'Less volatile than market' };
    if (beta < 1.5) return { level: 'Moderate', color: 'text-warning', description: 'Moderate market correlation' };
    if (beta < 2.0) return { level: 'High', color: 'text-orange-500', description: 'High market sensitivity' };
    return { level: 'Very High', color: 'text-destructive', description: 'Extreme volatility risk' };
  };

  const getVolatilityLevel = (volatility: number) => {
    if (volatility < 30) return { level: 'Low', color: 'text-success' };
    if (volatility < 50) return { level: 'Moderate', color: 'text-warning' };
    if (volatility < 70) return { level: 'High', color: 'text-orange-500' };
    return { level: 'Extreme', color: 'text-destructive' };
  };

  const getSharpeRating = (sharpe: number) => {
    if (sharpe > 1.5) return { rating: 'Excellent', color: 'text-success', description: 'Superior risk-adjusted returns' };
    if (sharpe > 1.0) return { rating: 'Good', color: 'text-warning', description: 'Adequate risk compensation' };
    if (sharpe > 0.5) return { rating: 'Fair', color: 'text-orange-500', description: 'Below average efficiency' };
    return { rating: 'Poor', color: 'text-destructive', description: 'Insufficient risk compensation' };
  };

  const getRiskFactorWarning = (riskFactor: number) => {
    if (riskFactor >= 4) {
      return {
        type: 'destructive' as const,
        icon: <AlertTriangle className="w-4 h-4" />,
        message: 'High Risk Investment: Consider position sizing carefully and ensure adequate diversification.'
      };
    }
    if (riskFactor >= 3) {
      return {
        type: 'default' as const,
        icon: <Shield className="w-4 h-4" />,
        message: 'Moderate Risk: Monitor market conditions and maintain appropriate allocation limits.'
      };
    }
    return null;
  };

  const betaRisk = getBetaRiskLevel(metrics.beta);
  const volatilityLevel = getVolatilityLevel(metrics.standardDeviation);
  const sharpeRating = getSharpeRating(metrics.sharpeRatio);
  const riskWarning = getRiskFactorWarning(metrics.riskFactor);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Risk Analysis - {coinBasket}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risk Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Beta Risk */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Systematic Risk (Beta)</div>
            <div className="flex items-center gap-2 mb-2">
              <div className={`text-2xl font-bold ${betaRisk.color}`}>
                {metrics.beta.toFixed(2)}
              </div>
              <Badge variant="outline">
                {metrics.betaConfidence}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {betaRisk.description}
            </div>
            <div className={`text-sm font-medium ${betaRisk.color} mt-1`}>
              {betaRisk.level} Risk
            </div>
          </div>

          {/* Volatility */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Volatility</div>
            <div className={`text-2xl font-bold ${volatilityLevel.color}`}>
              {metrics.standardDeviation.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Annualized Standard Deviation
            </div>
            <div className={`text-sm font-medium ${volatilityLevel.color} mt-1`}>
              {volatilityLevel.level} Volatility
            </div>
          </div>

          {/* Sharpe Ratio */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Sharpe Ratio</div>
            <div className={`text-2xl font-bold ${sharpeRating.color}`}>
              {metrics.sharpeRatio.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {sharpeRating.description}
            </div>
            <div className={`text-sm font-medium ${sharpeRating.color} mt-1`}>
              {sharpeRating.rating}
            </div>
          </div>
        </div>

        {/* Risk Composition */}
        <div>
          <h4 className="font-semibold mb-3">Risk Composition</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Market Risk (Beta)</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${Math.min(100, (metrics.beta / 3) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{(metrics.beta * 33.33).toFixed(0)}%</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Idiosyncratic Risk</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-muted rounded-full h-2">
                  <div 
                    className="bg-secondary h-2 rounded-full" 
                    style={{ width: `${Math.min(100, (metrics.standardDeviation / 100) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{Math.min(100, metrics.standardDeviation).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Factor Summary */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div>
            <div className="text-sm text-muted-foreground">Overall Risk Factor</div>
            <div className={`text-lg font-semibold ${metrics.riskFactor >= 4 ? 'text-destructive' : metrics.riskFactor >= 3 ? 'text-warning' : 'text-success'}`}>
              {metrics.riskFactor}/5
            </div>
          </div>
          <div className="text-right">
            <Badge variant={metrics.riskFactor >= 4 ? 'destructive' : metrics.riskFactor >= 3 ? 'secondary' : 'default'}>
              {metrics.riskFactor >= 4 ? 'High Risk' : metrics.riskFactor >= 3 ? 'Moderate Risk' : 'Low Risk'}
            </Badge>
          </div>
        </div>

        {/* Risk Warning */}
        {riskWarning && (
          <Alert variant={riskWarning.type}>
            {riskWarning.icon}
            <AlertDescription>
              {riskWarning.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Beta Data Quality */}
        <div className="text-xs text-muted-foreground">
          Beta calculation: {metrics.dataQuality} • Last updated: {new Date().toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
};
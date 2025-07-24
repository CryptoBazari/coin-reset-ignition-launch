import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, BarChart, Calculator, Target } from 'lucide-react';
import { BetaCalculationResult } from '@/services/comprehensiveBetaCalculationService';

interface BetaCalculationCardProps {
  betaDetails: BetaCalculationResult;
}

export function BetaCalculationCard({ betaDetails }: BetaCalculationCardProps) {
  const getConfidenceColor = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case 'high': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getBetaInterpretation = (beta: number) => {
    if (beta > 1.2) return 'High volatility - moves significantly more than benchmark';
    if (beta > 0.8) return 'Moderate volatility - similar to benchmark movements';
    if (beta > 0.5) return 'Low volatility - moves less than benchmark';
    return 'Very low volatility - minimal correlation to benchmark';
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(2)}%`;
  const formatNumber = (value: number, decimals = 6) => value.toFixed(decimals);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Beta Calculation Details
          </CardTitle>
          <Badge className={`${getConfidenceColor(betaDetails.confidence)} border`}>
            {betaDetails.confidence} Confidence
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Formula Section */}
        <div className="bg-muted/30 rounded-lg p-4 border border-border">
          <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            CAPM Beta Formula
          </h4>
          <div className="font-mono text-sm text-muted-foreground bg-background rounded p-2 border">
            β = Covariance(Asset, Benchmark) / Variance(Benchmark)
          </div>
        </div>

        {/* Key Results */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Final Beta</span>
            </div>
            <div className="text-2xl font-bold text-primary">
              {betaDetails.beta.toFixed(3)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              vs {betaDetails.benchmarkSymbol}
            </div>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <BarChart className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Data Points</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {betaDetails.dataPoints}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {betaDetails.startDate} to {betaDetails.endDate}
            </div>
          </div>
        </div>

        {/* Interpretation */}
        <div className="bg-accent/30 rounded-lg p-4 border border-accent/40">
          <h4 className="font-medium text-foreground mb-2">Beta Interpretation</h4>
          <p className="text-sm text-muted-foreground">
            {getBetaInterpretation(betaDetails.beta)}
          </p>
        </div>

        {/* Statistical Components */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-medium text-foreground text-sm">Mean Daily Returns</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{betaDetails.coinSymbol}:</span>
                <span className="text-sm font-mono text-foreground">
                  {formatPercentage(betaDetails.coinMeanReturn)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{betaDetails.benchmarkSymbol}:</span>
                <span className="text-sm font-mono text-foreground">
                  {formatPercentage(betaDetails.benchmarkMeanReturn)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-foreground text-sm">Statistical Measures</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Covariance:</span>
                <span className="text-sm font-mono text-foreground">
                  {formatNumber(betaDetails.covariance)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Benchmark Variance:</span>
                <span className="text-sm font-mono text-foreground">
                  {formatNumber(betaDetails.benchmarkVariance)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Volatility Analysis */}
        {betaDetails.annualizedVolatility && (
          <div className="bg-muted/20 rounded-lg p-4 border border-border">
            <h4 className="font-medium text-foreground mb-3 text-sm">Annualized Volatility</h4>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{betaDetails.coinSymbol} Volatility:</span>
              <span className="text-sm font-semibold text-foreground">
                {formatPercentage(betaDetails.annualizedVolatility)}
              </span>
            </div>
          </div>
        )}

        {/* Quality Indicators */}
        <div className="pt-2 border-t border-border">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Calculated: {new Date(betaDetails.calculationDate).toLocaleString()}</span>
            <span>Confidence: {betaDetails.confidence.toUpperCase()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
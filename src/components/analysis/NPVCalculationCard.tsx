import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Activity, Target, Zap, Calculator } from 'lucide-react';
import { NPVCalculationResult } from '@/services/hybridNPVCalculationService';

interface NPVCalculationCardProps {
  npvData: NPVCalculationResult;
  onRecalculateWithAdvancedBeta?: () => void;
  showRecalculateButton?: boolean;
  assetSymbol: string;
}

export default function NPVCalculationCard({ 
  npvData, 
  onRecalculateWithAdvancedBeta, 
  showRecalculateButton = true,
  assetSymbol 
}: NPVCalculationCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const getRecommendationColor = (npv: number) => {
    if (npv > 5000) return 'text-emerald-600';
    if (npv > 0) return 'text-green-600';
    if (npv > -2000) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-emerald-100 text-emerald-800';
    if (confidence >= 60) return 'bg-green-100 text-green-800';
    if (confidence >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getBenchmarkIcon = (benchmark: string) => {
    return benchmark === 'SP500' ? '📈' : '₿';
  };

  return (
    <Card className="border-2 border-primary/20 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5 text-primary" />
            NPV Analysis - {assetSymbol.toUpperCase()}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={getConfidenceColor(npvData.confidenceScore)}
            >
              {npvData.confidenceScore}% confidence
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {npvData.betaType === 'advanced' ? '🎯 Advanced Beta' : '📊 Basic Beta'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="text-2xl font-bold text-primary mb-1">
              {formatCurrency(npvData.npv)}
            </div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Target className="h-4 w-4" />
              Net Present Value
            </div>
          </div>

          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
            <div className="text-2xl font-bold text-emerald-700 mb-1">
              {formatPercentage(npvData.irr)}
            </div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Internal Rate of Return
            </div>
          </div>

          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="text-2xl font-bold text-blue-700 mb-1">
              {formatCurrency(npvData.terminalValue)}
            </div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Activity className="h-4 w-4" />
              Terminal Value
            </div>
          </div>

          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="text-2xl font-bold text-purple-700 mb-1">
              {formatPercentage(npvData.discountRate)}
            </div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Zap className="h-4 w-4" />
              Discount Rate
            </div>
          </div>
        </div>

        {/* Investment Recommendation */}
        <div className={`p-4 rounded-lg border-l-4 ${
          npvData.npv > 0 
            ? 'border-emerald-500 bg-emerald-50' 
            : 'border-red-500 bg-red-50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              {npvData.npv > 0 ? (
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
              Investment Recommendation
            </h3>
            <Badge 
              variant={npvData.npv > 0 ? "default" : "destructive"}
              className="text-xs"
            >
              {npvData.npv > 0 ? 'POSITIVE NPV' : 'NEGATIVE NPV'}
            </Badge>
          </div>
          <p className={`text-sm ${npvData.npv > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {npvData.npv > 0 
              ? `This investment shows positive NPV of ${formatCurrency(npvData.npv)}, suggesting potential value creation.`
              : `This investment shows negative NPV of ${formatCurrency(npvData.npv)}, suggesting potential value destruction.`
            }
          </p>
        </div>

        {/* Benchmark & Beta Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              {getBenchmarkIcon(npvData.benchmark)} Benchmark: {npvData.benchmark === 'SP500' ? 'S&P 500' : 'Bitcoin'}
            </h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>Risk-free Rate: {formatPercentage(npvData.calculation.riskFreeRate)}</div>
              <div>Market Return: {formatPercentage(npvData.calculation.marketReturn)}</div>
              <div>Beta Adjustment: {formatPercentage(npvData.calculation.betaAdjustment)}</div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Risk Profile
            </h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>Beta: {npvData.beta.toFixed(3)} ({npvData.betaType})</div>
              <div>Liquidity: {npvData.liquidity.status}</div>
              <div>Premium: {formatPercentage(npvData.liquidity.premium)}</div>
            </div>
          </div>
        </div>

        {/* Yearly Breakdown Table */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Table className="h-4 w-4" />
            Cash Flow Projection
          </h4>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead>Cash Flow</TableHead>
                  <TableHead>Present Value</TableHead>
                  <TableHead>Discount Factor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {npvData.yearlyBreakdown.map((year) => (
                  <TableRow key={year.year}>
                    <TableCell className="font-medium">{year.year}</TableCell>
                    <TableCell>{formatCurrency(year.cashFlow)}</TableCell>
                    <TableCell>{formatCurrency(year.presentValue)}</TableCell>
                    <TableCell>{year.discountFactor.toFixed(4)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Advanced Beta Recalculation Button */}
        {showRecalculateButton && npvData.betaType === 'basic' && onRecalculateWithAdvancedBeta && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-sm">Enhanced Analysis Available</h4>
                <p className="text-xs text-muted-foreground">
                  Recalculate NPV using comprehensive beta analysis for higher accuracy
                </p>
              </div>
              <Button 
                onClick={onRecalculateWithAdvancedBeta}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Calculate with Advanced Beta
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
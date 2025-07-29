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
  const formatCurrency = (value: number, mobile = false) => {
    if (mobile && Math.abs(value) >= 1000000) {
      return Math.abs(value) >= 1000000000 
        ? `$${(value / 1000000000).toFixed(1)}B`
        : `$${(value / 1000000).toFixed(1)}M`;
    }
    if (mobile && Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
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
      <CardHeader className="pb-2 sm:pb-3 lg:pb-4 p-2 sm:p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
          <CardTitle className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base lg:text-lg">
            <Calculator className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-primary shrink-0" />
            <span className="truncate">NPV Analysis - {assetSymbol.toUpperCase()}</span>
          </CardTitle>
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <Badge 
              variant="outline" 
              className={`${getConfidenceColor(npvData.confidenceScore)} text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1`}
            >
              {npvData.confidenceScore}% confidence
            </Badge>
            <Badge variant="secondary" className="text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1">
              {npvData.betaType === 'advanced' ? '🎯 Advanced Beta' : '📊 Basic Beta'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 sm:space-y-4 lg:space-y-6 p-2 sm:p-4 lg:p-6">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          <div className="text-center p-2 sm:p-3 lg:p-4 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="text-base sm:text-lg lg:text-2xl font-bold text-primary mb-1">
              <span className="hidden sm:inline">{formatCurrency(npvData.npv)}</span>
              <span className="sm:hidden">{formatCurrency(npvData.npv, true)}</span>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Target className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Net Present Value</span>
              <span className="sm:hidden">NPV</span>
            </div>
          </div>

          <div className="text-center p-2 sm:p-3 lg:p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
            <div className="text-base sm:text-lg lg:text-2xl font-bold text-emerald-700 mb-1">
              {formatPercentage(npvData.irr)}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Internal Rate of Return</span>
              <span className="sm:hidden">IRR</span>
            </div>
          </div>

          <div className="text-center p-2 sm:p-3 lg:p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="text-base sm:text-lg lg:text-2xl font-bold text-blue-700 mb-1">
              <span className="hidden sm:inline">{formatCurrency(npvData.terminalValue)}</span>
              <span className="sm:hidden">{formatCurrency(npvData.terminalValue, true)}</span>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Terminal Value</span>
              <span className="sm:hidden">Terminal</span>
            </div>
          </div>

          <div className="text-center p-2 sm:p-3 lg:p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="text-base sm:text-lg lg:text-2xl font-bold text-purple-700 mb-1">
              {formatPercentage(npvData.discountRate)}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Discount Rate</span>
              <span className="sm:hidden">Discount</span>
            </div>
          </div>
        </div>

        {/* Investment Recommendation */}
        <div className={`p-2 sm:p-3 lg:p-4 rounded-lg border-l-4 ${
          npvData.npv > 0 
            ? 'border-emerald-500 bg-emerald-50' 
            : 'border-red-500 bg-red-50'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
            <h3 className="font-semibold text-sm sm:text-base lg:text-lg flex items-center gap-1 sm:gap-2">
              {npvData.npv > 0 ? (
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
              ) : (
                <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              )}
              <span className="hidden sm:inline">Investment Recommendation</span>
              <span className="sm:hidden">Recommendation</span>
            </h3>
            <Badge 
              variant={npvData.npv > 0 ? "default" : "destructive"}
              className="text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1"
            >
              {npvData.npv > 0 ? 'POSITIVE NPV' : 'NEGATIVE NPV'}
            </Badge>
          </div>
          <p className={`text-xs sm:text-sm leading-relaxed ${npvData.npv > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {npvData.npv > 0 
              ? `This investment shows positive NPV of ${formatCurrency(npvData.npv)}, suggesting potential value creation.`
              : `This investment shows negative NPV of ${formatCurrency(npvData.npv)}, suggesting potential value destruction.`
            }
          </p>
        </div>

        {/* Benchmark & Beta Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
          <div className="p-2 sm:p-3 lg:p-4 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100">
            <h4 className="font-semibold mb-2 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm lg:text-base">
              <span className="text-sm sm:text-base">{getBenchmarkIcon(npvData.benchmark)}</span>
              <span className="hidden sm:inline">Benchmark: {npvData.benchmark === 'SP500' ? 'S&P 500' : 'Bitcoin'}</span>
              <span className="sm:hidden">{npvData.benchmark === 'SP500' ? 'S&P 500' : 'Bitcoin'}</span>
            </h4>
            <div className="space-y-1 text-[10px] sm:text-xs lg:text-sm text-muted-foreground">
              <div>Risk-free Rate: {formatPercentage(npvData.calculation.riskFreeRate)}</div>
              <div>Market Return: {formatPercentage(npvData.calculation.marketReturn)}</div>
              <div>Beta Adjustment: {formatPercentage(npvData.calculation.betaAdjustment)}</div>
            </div>
          </div>

          <div className="p-2 sm:p-3 lg:p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100">
            <h4 className="font-semibold mb-2 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm lg:text-base">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
              Risk Profile
            </h4>
            <div className="space-y-1 text-[10px] sm:text-xs lg:text-sm text-muted-foreground">
              <div>Beta: {npvData.beta.toFixed(3)} ({npvData.betaType})</div>
              <div>Liquidity: {npvData.liquidity.status}</div>
              <div>Premium: {formatPercentage(npvData.liquidity.premium)}</div>
            </div>
          </div>
        </div>

        {/* Yearly Breakdown Table */}
        <div>
          <h4 className="font-semibold mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm lg:text-base">
            <Table className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Cash Flow Projection</span>
            <span className="sm:hidden">Cash Flow</span>
          </h4>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Year</TableHead>
                  <TableHead className="text-xs sm:text-sm">
                    <span className="hidden sm:inline">Cash Flow</span>
                    <span className="sm:hidden">Cash</span>
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm">
                    <span className="hidden sm:inline">Present Value</span>
                    <span className="sm:hidden">PV</span>
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm">
                    <span className="hidden sm:inline">Discount Factor</span>
                    <span className="sm:hidden">Factor</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {npvData.yearlyBreakdown.map((year) => (
                  <TableRow key={year.year}>
                    <TableCell className="font-medium text-xs sm:text-sm">{year.year}</TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      <span className="hidden sm:inline">{formatCurrency(year.cashFlow)}</span>
                      <span className="sm:hidden">{formatCurrency(year.cashFlow, true)}</span>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      <span className="hidden sm:inline">{formatCurrency(year.presentValue)}</span>
                      <span className="sm:hidden">{formatCurrency(year.presentValue, true)}</span>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">{year.discountFactor.toFixed(4)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Advanced Beta Recalculation Button */}
        {showRecalculateButton && npvData.betaType === 'basic' && onRecalculateWithAdvancedBeta && (
          <div className="pt-2 sm:pt-3 lg:pt-4 border-t">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
              <div className="flex-1">
                <h4 className="font-semibold text-xs sm:text-sm">Enhanced Analysis Available</h4>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                  Recalculate NPV using comprehensive beta analysis for higher accuracy
                </p>
              </div>
              <Button 
                onClick={onRecalculateWithAdvancedBeta}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 w-full sm:w-auto"
              >
                <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Calculate with Advanced Beta</span>
                <span className="sm:hidden">Advanced Beta</span>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
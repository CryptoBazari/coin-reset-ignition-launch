
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { AnalysisResult } from '@/types/investment';

interface AnalysisResultsProps {
  result: AnalysisResult;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ result }) => {
  const { coin, metrics, recommendation, benchmarkComparison } = result;

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'Buy': return 'bg-green-500';
      case 'Buy Less': return 'bg-yellow-500';
      case 'Do Not Buy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk <= 2) return 'text-green-600';
    if (risk <= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      {/* Main Recommendation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{coin.name} Analysis</CardTitle>
            <Badge className={`${getRecommendationColor(recommendation.recommendation)} text-white px-4 py-2 text-lg`}>
              {recommendation.recommendation}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              {recommendation.worthInvesting ? (
                <CheckCircle className="text-green-500" size={20} />
              ) : (
                <XCircle className="text-red-500" size={20} />
              )}
              <span className="font-medium">Worth Investing</span>
            </div>
            
            <div className="flex items-center space-x-2">
              {recommendation.goodTiming ? (
                <CheckCircle className="text-green-500" size={20} />
              ) : (
                <AlertTriangle className="text-yellow-500" size={20} />
              )}
              <span className="font-medium">Good Timing</span>
            </div>
            
            <div className="flex items-center space-x-2">
              {recommendation.appropriateAmount ? (
                <CheckCircle className="text-green-500" size={20} />
              ) : (
                <AlertTriangle className="text-yellow-500" size={20} />
              )}
              <span className="font-medium">Appropriate Amount</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={`font-bold ${getRiskColor(recommendation.riskFactor)}`}>
                Risk: {recommendation.riskFactor}/5
              </span>
              <Progress value={recommendation.riskFactor * 20} className="w-16" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Present Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.npv)}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              {metrics.npv > 0 ? (
                <TrendingUp className="text-green-500 mr-1" size={16} />
              ) : (
                <TrendingDown className="text-red-500 mr-1" size={16} />
              )}
              {metrics.npv > 0 ? 'Positive' : 'Negative'} NPV
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Internal Rate of Return</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(metrics.irr)}
            </div>
            <div className="text-sm text-gray-600">
              Annualized return rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">CAGR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(metrics.cagr)}
            </div>
            <div className="text-sm text-gray-600">
              Compound annual growth
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(metrics.roi)}
            </div>
            <div className="text-sm text-gray-600">
              Total return on investment
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Benchmark Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Benchmark Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">{coin.name} (36M CAGR)</span>
              <span className="text-lg font-bold">
                {formatPercentage(benchmarkComparison.coinPerformance)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">{benchmarkComparison.benchmarkName} (36M CAGR)</span>
              <span className="text-lg font-bold">
                {formatPercentage(benchmarkComparison.benchmarkPerformance)}
              </span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">Performance vs Benchmark</span>
                <span className={`text-lg font-bold ${
                  benchmarkComparison.coinPerformance > benchmarkComparison.benchmarkPerformance 
                    ? 'text-green-600' : 'text-red-600'
                }`}>
                  {benchmarkComparison.coinPerformance > benchmarkComparison.benchmarkPerformance ? '+' : ''}
                  {formatPercentage(benchmarkComparison.coinPerformance - benchmarkComparison.benchmarkPerformance)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conditions and Risks */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Conditions & Risks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendation.conditions && (
            <div>
              <h4 className="font-semibold text-green-700 mb-2">Conditions</h4>
              <p className="text-sm text-gray-700">{recommendation.conditions}</p>
            </div>
          )}
          
          {recommendation.risks && (
            <div>
              <h4 className="font-semibold text-red-700 mb-2">Risks</h4>
              <p className="text-sm text-gray-700">{recommendation.risks}</p>
            </div>
          )}

          {recommendation.shouldDiversify && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-700 mb-1">Diversification Recommended</h4>
              <p className="text-sm text-blue-600">
                For {coin.basket} investments, consider diversifying across {
                  coin.basket === 'Blue Chip' ? '3-5 different coins' : '5-10 different coins'
                } to reduce concentration risk.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

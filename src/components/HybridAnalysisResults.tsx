import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Globe,
  TestTube,
  Database
} from 'lucide-react';
import type { DirectApiAnalysisResult } from '@/services/directApiAnalysisService';

interface HybridAnalysisResultsProps {
  result: DirectApiAnalysisResult | null;
  loading: boolean;
  error: string | null;
  coinSymbol?: string;
}

export const HybridAnalysisResults: React.FC<HybridAnalysisResultsProps> = ({
  result,
  loading,
  error,
  coinSymbol = 'Selected Asset'
}) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 animate-spin" />
            Analyzing with Real-Time Data...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse bg-gray-200 h-4 rounded w-3/4"></div>
            <div className="animate-pulse bg-gray-200 h-4 rounded w-1/2"></div>
            <div className="animate-pulse bg-gray-200 h-4 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Analysis failed: {error}. Please try again or check your connection.
        </AlertDescription>
      </Alert>
    );
  }

  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analysis Results</CardTitle>
          <CardDescription>
            Run an analysis to see detailed investment insights
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Get data source icon and styling
  const getDataSourceInfo = () => {
    if (result.dataQuality.isLive) {
      return {
        icon: <Globe className="h-4 w-4" />,
        badge: 'LIVE API DATA',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-200'
      };
    } else {
      return {
        icon: <TestTube className="h-4 w-4" />,
        badge: 'TEST DATA',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-200'
      };
    }
  };

  const dataSourceInfo = getDataSourceInfo();

  const getRecommendationColor = (action: string) => {
    switch (action) {
      case 'Buy':
      case 'STRONG BUY':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Sell':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'Hold':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Data Source Header */}
      <Card className={`${dataSourceInfo.borderColor} border-2`}>
        <CardHeader className={dataSourceInfo.bgColor}>
          <div className="flex items-center justify-between">
            <CardTitle className={`flex items-center gap-2 ${dataSourceInfo.textColor}`}>
              {dataSourceInfo.icon}
              {coinSymbol} Analysis Results
            </CardTitle>
            <Badge variant="outline" className={`${dataSourceInfo.bgColor} ${dataSourceInfo.textColor}`}>
              {dataSourceInfo.badge}
            </Badge>
          </div>
          <CardDescription>
            <div className={`text-sm ${dataSourceInfo.textColor}`}>
              {result.dataQuality.isLive ? (
                <>
                  <CheckCircle className="h-4 w-4 inline mr-2" />
                  Using live market data with {result.dataQuality.score}% confidence
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 inline mr-2" />
                  Using enhanced test data for demonstration - upgrade for live API access
                </>
              )}
            </div>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              NPV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${result.metrics.npv >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${result.metrics.npv.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Net Present Value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              CAGR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${result.metrics.cagr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {result.metrics.cagr.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Compound Annual Growth</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              Volatility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {result.metrics.volatility.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Annual Volatility</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-orange-600" />
              Risk Factor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {result.metrics.riskFactor}/10
            </div>
            <p className="text-xs text-gray-500 mt-1">Risk Level</p>
          </CardContent>
        </Card>
      </div>

      {/* Recommendation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Investment Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`p-4 rounded-lg border-2 ${getRecommendationColor(result.recommendation.action)}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-bold">{result.recommendation.action}</span>
              <Badge variant="outline" className="bg-white">
                {result.recommendation.confidence}% Confidence
              </Badge>
            </div>
            
            {result.recommendation.reasoning.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Supporting Factors:</h4>
                <ul className="space-y-1">
                  {result.recommendation.reasoning.map((reason, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 mt-0.5 text-green-600" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {result.recommendation.riskWarnings.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Risk Considerations:</h4>
                <ul className="space-y-1">
                  {result.recommendation.riskWarnings.map((warning, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <AlertTriangle className="h-3 w-3 mt-0.5 text-orange-600" />
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Internal Rate of Return</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-semibold ${result.metrics.irr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {result.metrics.irr.toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Return on Investment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-semibold ${result.metrics.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {result.metrics.roi.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Sharpe Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-semibold ${result.metrics.sharpeRatio > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {result.metrics.sharpeRatio.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Quality Footer */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="text-sm text-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4" />
              <strong>Data Quality:</strong> {result.dataQuality.score}% confidence ({result.dataQuality.freshness})
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <strong>Source:</strong> {result.dataQuality.source}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

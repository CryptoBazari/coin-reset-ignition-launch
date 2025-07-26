import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Calculator, 
  Activity, 
  BarChart3,
  Info,
  CheckCircle,
  AlertTriangle,
  Clock,
  Database,
  Zap
} from "lucide-react";
import { comprehensiveBetaWorkflowService } from "@/services/comprehensiveBetaWorkflowService";

interface ComprehensiveBetaAnalysisProps {
  selectedCoin?: string;
}

interface ComprehensiveBetaResult {
  asset: string;
  beta: number;
  beta_unadjusted: number;
  calculation_window: number;
  volatility_30d: number;
  median_daily_volume: number;
  liquidity_adjustment_factor: number;
  data_points: number;
  window_start_date: string;
  window_end_date: string;
  benchmark: string;
  benchmark_source: string;
  methodology: string;
  confidence_level: 'high' | 'medium' | 'low';
  data_quality_score: number;
  provisional_estimate?: boolean;
}

export const ComprehensiveBetaAnalysisCard: React.FC<ComprehensiveBetaAnalysisProps> = ({ 
  selectedCoin 
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComprehensiveBetaResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    if (!selectedCoin) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const betaResult = await comprehensiveBetaWorkflowService.calculateComprehensiveBeta(selectedCoin);
      setResult(betaResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceBadge = (level: string) => {
    const variants = {
      high: 'bg-green-100 text-green-800 border-green-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-red-100 text-red-800 border-red-300'
    };
    return variants[level as keyof typeof variants] || variants.medium;
  };

  const getBetaInterpretation = (beta: number) => {
    if (beta < 0) return { text: "Negative correlation", color: "text-purple-600", icon: TrendingUp };
    if (beta < 0.5) return { text: "Low volatility", color: "text-green-600", icon: CheckCircle };
    if (beta < 1) return { text: "Moderate volatility", color: "text-blue-600", icon: Activity };
    if (beta < 1.5) return { text: "High volatility", color: "text-orange-600", icon: AlertTriangle };
    return { text: "Very high volatility", color: "text-red-600", icon: TrendingUp };
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(decimals);
  };

  const formatPercentage = (num: number) => `${(num * 100).toFixed(2)}%`;

  return (
    <Card className="animate-fade-in">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <Calculator className="h-5 w-5 text-blue-600" />
          </div>
          <span className="text-xl font-bold">Comprehensive Adaptive Beta Analysis</span>
          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
            <Zap className="w-3 h-3 mr-1" />
            ADVANCED
          </Badge>
        </CardTitle>
        <CardDescription className="text-gray-600">
          Dynamic window selection with volume-adjusted beta calculation using live Glassnode and FRED data
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {!selectedCoin ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Please select a cryptocurrency to perform comprehensive beta analysis.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Analyzing: {selectedCoin.toUpperCase()}
                </span>
              </div>
              <Button 
                onClick={handleCalculate}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Calculating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Calculate Comprehensive Beta
                  </div>
                )}
              </Button>
            </div>

            {loading && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  Processing workflow phases...
                </div>
                <Progress value={33} className="h-2" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-500">
                  <div>✓ Data Collection</div>
                  <div>⏳ Window Selection</div>
                  <div>⏳ Liquidity Adjustment</div>
                </div>
              </div>
            )}

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {result && (
              <div className="space-y-6">
                {/* Main Beta Results */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Adjusted Beta (β)</span>
                      <Badge className={getConfidenceBadge(result.confidence_level)}>
                        {result.confidence_level}
                      </Badge>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {result.beta.toFixed(3)}
                    </div>
                    <div className="text-sm text-gray-600">
                      vs {result.benchmark} ({result.benchmark_source})
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Unadjusted Beta</span>
                      <Activity className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {result.beta_unadjusted.toFixed(3)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Before liquidity adjustment
                    </div>
                  </div>
                </div>

                {/* Beta Interpretation */}
                {(() => {
                  const interpretation = getBetaInterpretation(result.beta);
                  const Icon = interpretation.icon;
                  return (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`h-5 w-5 ${interpretation.color}`} />
                        <span className="font-medium">Beta Interpretation</span>
                      </div>
                      <p className={`text-sm ${interpretation.color}`}>
                        {interpretation.text} - This asset moves {result.beta > 1 ? 'more' : 'less'} than the benchmark.
                        A 1% change in {result.benchmark} typically results in a {Math.abs(result.beta).toFixed(1)}% change in {result.asset}.
                      </p>
                    </div>
                  );
                })()}

                {/* Calculation Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <div className="text-lg font-semibold text-gray-900">
                      {result.calculation_window}
                    </div>
                    <div className="text-xs text-gray-600">Days Window</div>
                  </div>
                  
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatPercentage(result.volatility_30d)}
                    </div>
                    <div className="text-xs text-gray-600">30D Volatility</div>
                  </div>
                  
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatNumber(result.median_daily_volume)}
                    </div>
                    <div className="text-xs text-gray-600">Median Volume</div>
                  </div>
                  
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <div className="text-lg font-semibold text-gray-900">
                      {result.liquidity_adjustment_factor.toFixed(2)}x
                    </div>
                    <div className="text-xs text-gray-600">Adjustment</div>
                  </div>
                </div>

                {/* Quality Metrics */}
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Data Quality Assessment
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Data Quality Score</span>
                        <span className="font-medium">{(result.data_quality_score * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={result.data_quality_score * 100} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Data Points:</span>
                        <span className="ml-2 font-medium">{result.data_points}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Period:</span>
                        <span className="ml-2 font-medium">
                          {result.window_start_date} to {result.window_end_date}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Methodology */}
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                  <h4 className="font-medium mb-2 text-blue-900">Methodology</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Calculation:</strong> {result.methodology}</p>
                    <p><strong>Window Selection:</strong> Adaptive based on 30-day volatility</p>
                    <p><strong>Liquidity Adjustment:</strong> Volume-based beta modification</p>
                    <p><strong>Data Sources:</strong> Glassnode (crypto) + {result.benchmark_source} (benchmark)</p>
                  </div>
                </div>

                {result.provisional_estimate && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-700">
                      This is a provisional estimate based on sector analysis due to insufficient historical data.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
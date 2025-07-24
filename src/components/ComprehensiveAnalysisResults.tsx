import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, BarChart3, Calculator, Database, TrendingUp, AlertTriangle, Target, Zap } from 'lucide-react';
import { ComprehensiveAnalysisResult } from '@/services/comprehensiveGlassNodeAnalyzer';
import { BetaCalculationCard } from '@/components/analysis/BetaCalculationCard';

interface ComprehensiveAnalysisResultsProps {
  result: ComprehensiveAnalysisResult;
}

export const ComprehensiveAnalysisResults: React.FC<ComprehensiveAnalysisResultsProps> = ({
  result
}) => {
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            Enhanced Analysis: {result.coinSymbol.toUpperCase()}
            <Badge variant={result.finalRecommendation.dataQuality > 80 ? 'default' : 'secondary'}>
              {result.finalRecommendation.dataQuality}% Data Quality
            </Badge>
            <Badge variant={result.enhancedNPV.confidenceScore > 70 ? 'default' : 'destructive'}>
              {result.enhancedNPV.confidenceScore}% Confidence
            </Badge>
          </CardTitle>
          <CardDescription>
            Time Horizon: {result.timeHorizon} months | 
            Region: {result.region} | 
            Profit Probability: {((1 - result.monteCarlo.probabilityOfLoss) * 100).toFixed(1)}%
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="enhanced-npv" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="enhanced-npv">Enhanced NPV</TabsTrigger>
          <TabsTrigger value="monte-carlo">Monte Carlo</TabsTrigger>
          <TabsTrigger value="beta">Monthly Beta</TabsTrigger>
          <TabsTrigger value="glassnode">Glass Node</TabsTrigger>
          <TabsTrigger value="recommendation">Final Result</TabsTrigger>
        </TabsList>

        <TabsContent value="enhanced-npv">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  Enhanced NPV
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>NPV:</span>
                  <span className={result.enhancedNPV.npv > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                    ${result.enhancedNPV.npv.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Adjusted NPV:</span>
                  <span className={result.enhancedNPV.adjustedNPV > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                    ${result.enhancedNPV.adjustedNPV.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>MVRV Ratio:</span>
                  <span className="font-semibold">{result.enhancedNPV.mvrv.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Confidence:</span>
                  <Badge variant={result.enhancedNPV.confidenceScore > 70 ? 'default' : 'secondary'}>
                    {result.enhancedNPV.confidenceScore}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Data Source:</span>
                  <Badge variant="outline">{result.enhancedNPV.dataSource}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monte-carlo">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Monte Carlo Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Expected Value:</span>
                  <span className={result.monteCarlo.expectedValue > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                    ${result.monteCarlo.expectedValue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>95% Confidence Low:</span>
                  <span className="text-red-600 font-semibold">
                    ${result.monteCarlo.confidenceInterval.lower.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>95% Confidence High:</span>
                  <span className="text-green-600 font-semibold">
                    ${result.monteCarlo.confidenceInterval.upper.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Probability of Loss:</span>
                  <Badge variant={result.monteCarlo.probabilityOfLoss < 0.4 ? 'default' : 'destructive'}>
                    {(result.monteCarlo.probabilityOfLoss * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Value at Risk:</span>
                  <span className="text-red-600 font-semibold">
                    ${result.monteCarlo.valueAtRisk.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Iterations:</span>
                  <span className="font-semibold">{result.monteCarlo.iterations.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Convergence:</span>
                  <Badge variant={result.monteCarlo.convergence ? 'default' : 'destructive'}>
                    {result.monteCarlo.convergence ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="beta">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Monthly Beta Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Beta:</span>
                    <span className="font-bold text-lg">{result.monthlyBetaAnalysis.beta.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Confidence:</span>
                    <Badge variant={result.monthlyBetaAnalysis.confidence === 'high' ? 'default' : 'secondary'}>
                      {result.monthlyBetaAnalysis.confidence}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Correlation:</span>
                    <span className="font-semibold">{result.monthlyBetaAnalysis.correlation.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Benchmark:</span>
                    <span className="font-semibold">{result.monthlyBetaAnalysis.benchmarkUsed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Data Points:</span>
                    <span className="font-semibold">{result.monthlyBetaAnalysis.dataPoints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frequency:</span>
                    <Badge variant="outline">{result.monthlyBetaAnalysis.dataFrequency}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Source:</span>
                    <Badge variant="outline">{result.monthlyBetaAnalysis.source}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Beta Calculation Details Card */}
            {result.betaCalculationDetails && (
              <BetaCalculationCard betaDetails={result.betaCalculationDetails} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="glassnode">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Glass Node Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>AVIV Ratio:</span>
                  <span className="font-semibold">{result.glassNodeMetrics.aviv_ratio.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Supply:</span>
                  <span className="font-semibold">{(result.glassNodeMetrics.active_supply * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Vaulted Supply:</span>
                  <span className="font-semibold">{(result.glassNodeMetrics.vaulted_supply * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Liquid Supply:</span>
                  <span className="font-semibold">{(result.glassNodeMetrics.liquid_supply * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>MVRV Z-Score:</span>
                  <span className="font-semibold">{result.glassNodeMetrics.mvrv_z_score.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Confidence:</span>
                  <Badge variant={result.glassNodeMetrics.confidence_score > 80 ? 'default' : 'secondary'}>
                    {result.glassNodeMetrics.confidence_score}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendation">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Final Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Action:</span>
                  <Badge variant={
                    result.finalRecommendation.action.includes('Buy') ? 'default' : 
                    result.finalRecommendation.action === 'Hold' ? 'secondary' : 'destructive'
                  }>
                    {result.finalRecommendation.action}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Confidence:</span>
                  <Badge variant={result.finalRecommendation.confidence > 70 ? 'default' : 'secondary'}>
                    {result.finalRecommendation.confidence}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Data Quality:</span>
                  <Badge variant={result.finalRecommendation.dataQuality > 80 ? 'default' : 'secondary'}>
                    {result.finalRecommendation.dataQuality}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Methodology:</span>
                  <Badge variant="outline">{result.finalRecommendation.methodology}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reasoning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.finalRecommendation.reasoning.map((reason, index) => (
                  <div key={index} className="p-2 border rounded text-sm">
                    {reason}
                  </div>
                ))}
              </CardContent>
            </Card>

            {result.finalRecommendation.riskWarnings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    Risk Warnings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.finalRecommendation.riskWarnings.map((warning, index) => (
                    <div key={index} className="p-2 border border-orange-200 rounded text-sm text-orange-700">
                      {warning}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
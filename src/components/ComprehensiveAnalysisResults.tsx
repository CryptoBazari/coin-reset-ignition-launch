import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, BarChart3, Calculator, Database, TrendingUp, AlertTriangle, Target, Zap } from 'lucide-react';
import { ComprehensiveAnalysisResult } from '@/services/comprehensiveGlassNodeAnalyzer';

interface ComprehensiveAnalysisResultsProps {
  result: ComprehensiveAnalysisResult;
}

export const ComprehensiveAnalysisResults: React.FC<ComprehensiveAnalysisResultsProps> = ({
  result
}) => {
  return (
    <div className="space-y-6">
      {/* Enhanced Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            Enhanced Glassnode Analysis: {result.coinId.toUpperCase()}
            <Badge variant={result.dataQuality.qualityScore > 80 ? 'default' : 'secondary'}>
              {result.dataQuality.qualityScore}% Data Quality
            </Badge>
            <Badge variant={result.enhancedNPV.confidenceLevel > 70 ? 'default' : 'destructive'}>
              {result.enhancedNPV.confidenceLevel}% NPV Confidence
            </Badge>
          </CardTitle>
          <CardDescription>
            Market Cycle: {result.enhancedNPV.marketCyclePosition.toUpperCase()} | 
            Benchmark: {result.benchmark === 'SP500' ? 'S&P 500' : 'Bitcoin'} | 
            Profit Probability: {(result.monteCarloAnalysis.riskMetrics.probabilityOfPositiveNPV * 100).toFixed(1)}%
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="enhanced-npv" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="enhanced-npv">Enhanced NPV</TabsTrigger>
          <TabsTrigger value="monte-carlo">Monte Carlo</TabsTrigger>
          <TabsTrigger value="metrics">Financial Metrics</TabsTrigger>
          <TabsTrigger value="data">Monthly Data</TabsTrigger>
          <TabsTrigger value="reasoning">Analysis Reasoning</TabsTrigger>
          <TabsTrigger value="quality">Data Quality</TabsTrigger>
        </TabsList>

        <TabsContent value="enhanced-npv">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Enhanced NPV Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  Glassnode-Powered NPV
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Data-Driven NPV:</span>
                  <span className={result.enhancedNPV.npv > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                    ${result.enhancedNPV.npv.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Inflation-Adjusted:</span>
                  <span className={result.enhancedNPV.adjustedNpv > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                    ${result.enhancedNPV.adjustedNpv.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Confidence Level:</span>
                  <Badge variant={result.enhancedNPV.confidenceLevel > 70 ? 'default' : 'secondary'}>
                    {result.enhancedNPV.confidenceLevel}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Market Cycle:</span>
                  <Badge variant="outline">{result.enhancedNPV.marketCyclePosition}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Risk-Adj. Rate:</span>
                  <span className="font-semibold">{(result.enhancedNPV.riskAdjustedDiscount * 100).toFixed(2)}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Price Projections */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">MVRV-Based Projections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.enhancedNPV.priceProjections.map((proj, index) => (
                    <div key={index} className="flex justify-between">
                      <span>Year {proj.year}:</span>
                      <span className="font-semibold">${proj.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Data Sources Used */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Real Data Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {result.enhancedNPV.dataSourcesUsed.map((source, index) => (
                    <Badge key={index} variant="outline" className="mr-1 mb-1 text-xs">
                      ✅ {source}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monte-carlo">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monte Carlo Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Monte Carlo Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Expected NPV:</span>
                  <span className={result.monteCarloAnalysis.expectedNPV > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                    ${result.monteCarloAnalysis.expectedNPV.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>90% Confidence Low:</span>
                  <span className="text-red-600 font-semibold">
                    ${result.monteCarloAnalysis.confidenceInterval.lower5.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>90% Confidence High:</span>
                  <span className="text-green-600 font-semibold">
                    ${result.monteCarloAnalysis.confidenceInterval.upper95.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Profit Probability:</span>
                  <Badge variant={result.monteCarloAnalysis.riskMetrics.probabilityOfPositiveNPV > 0.6 ? 'default' : 'destructive'}>
                    {(result.monteCarloAnalysis.riskMetrics.probabilityOfPositiveNPV * 100).toFixed(1)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Risk Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Value at Risk (5%):</span>
                  <span className="text-red-600 font-semibold">
                    ${result.monteCarloAnalysis.riskMetrics.valueAtRisk.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Expected Shortfall:</span>
                  <span className="text-red-600 font-semibold">
                    ${result.monteCarloAnalysis.riskMetrics.expectedShortfall.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Risk Level:</span>
                  <Badge variant={result.monteCarloAnalysis.riskMetrics.valueAtRisk > result.enhancedNPV.npv ? 'destructive' : 'default'}>
                    {result.monteCarloAnalysis.riskMetrics.valueAtRisk > result.enhancedNPV.npv ? 'HIGH' : 'MODERATE'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metrics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Core Financial Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>NPV:</span>
                  <span className={result.analysis.npv > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                    ${result.analysis.npv.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Inflation-Adjusted NPV:</span>
                  <span className={result.analysis.adjustedNpv > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                    ${result.analysis.adjustedNpv.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>IRR:</span>
                  <span className="font-semibold">{result.analysis.irr.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>CAGR:</span>
                  <span className="font-semibold">{result.analysis.cagr.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>ROI:</span>
                  <span className="font-semibold">{result.analysis.roi.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Beta:</span>
                  <span className="font-semibold">{result.analysis.beta.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Volatility:</span>
                  <span className="font-semibold">{result.analysis.volatility.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Sharpe Ratio:</span>
                  <span className="font-semibold">{result.analysis.sharpeRatio.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Drawdown:</span>
                  <span className="text-red-600 font-semibold">{(result.analysis.drawdown * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Liquidity Score:</span>
                  <span className="font-semibold">{result.analysis.liquidityScore}/100</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Advanced Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>MVRV Z-Score:</span>
                  <span className="font-semibold">{result.analysis.mvrv.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Realized P&L:</span>
                  <span className="font-semibold">{result.analysis.realizedProfitLoss.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Regional Data:</span>
                  <Badge variant="outline">Americas, APAC, EMEA</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Benchmark:</span>
                  <Badge variant="outline">{result.benchmark === 'SP500' ? 'S&P 500' : 'Bitcoin'}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Price and Returns Data</CardTitle>
              <CardDescription>
                Historical monthly data with calculated returns for both asset and benchmark
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Coin Price</TableHead>
                      <TableHead>Benchmark Price</TableHead>
                      <TableHead>Coin Return (%)</TableHead>
                      <TableHead>Benchmark Return (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.detailedCalculations.monthlyPricesTable.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>${row.coinPrice.toLocaleString()}</TableCell>
                        <TableCell>${row.benchmarkPrice.toLocaleString()}</TableCell>
                        <TableCell className={row.coinReturn > 0 ? 'text-green-600' : 'text-red-600'}>
                          {row.coinReturn > 0 ? '+' : ''}{row.coinReturn.toFixed(1)}%
                        </TableCell>
                        <TableCell className={row.benchmarkReturn > 0 ? 'text-green-600' : 'text-red-600'}>
                          {row.benchmarkReturn > 0 ? '+' : ''}{row.benchmarkReturn.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reasoning">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Enhanced Analysis Reasoning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.reasoning.map((step, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <p className="text-sm">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality">
          <div className="space-y-6">
            {/* Data Quality Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Quality Assessment
                  <Badge variant={result.dataQuality.qualityScore > 80 ? 'default' : 'secondary'}>
                    {result.dataQuality.qualityScore}% Quality
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-green-600 mb-2">Working Endpoints ({result.dataQuality.endpointsWorking.length})</h4>
                    <div className="space-y-1">
                      {result.dataQuality.endpointsWorking.map((endpoint, index) => (
                        <Badge key={index} variant="outline" className="mr-1 mb-1">
                          ✅ {endpoint}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {result.dataQuality.endpointsFailed.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-red-600 mb-2">Failed Endpoints ({result.dataQuality.endpointsFailed.length})</h4>
                      <div className="space-y-1">
                        {result.dataQuality.endpointsFailed.map((endpoint, index) => (
                          <Badge key={index} variant="destructive" className="mr-1 mb-1">
                            ❌ {endpoint}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Regional Data Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Regional Price Movement Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 border rounded">
                    <h5 className="font-semibold">Americas</h5>
                    <p className="text-sm text-muted-foreground">
                      {result.monthlyData.regionalReturns.americas.length} data points
                    </p>
                  </div>
                  <div className="p-3 border rounded">
                    <h5 className="font-semibold">Asia-Pacific</h5>
                    <p className="text-sm text-muted-foreground">
                      {result.monthlyData.regionalReturns.apac.length} data points
                    </p>
                  </div>
                  <div className="p-3 border rounded">
                    <h5 className="font-semibold">EMEA</h5>
                    <p className="text-sm text-muted-foreground">
                      {result.monthlyData.regionalReturns.emea.length} data points
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
};

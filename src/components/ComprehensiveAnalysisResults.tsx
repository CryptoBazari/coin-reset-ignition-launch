
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, BarChart3, Calculator, Database, TrendingUp, AlertTriangle } from 'lucide-react';
import { ComprehensiveAnalysisResult } from '@/services/comprehensiveGlassNodeAnalyzer';

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
            <Activity className="h-5 w-5 text-green-600" />
            Comprehensive Analysis Results: {result.coinId.toUpperCase()}
            <Badge variant={result.dataQuality.qualityScore > 80 ? 'default' : 'secondary'}>
              {result.dataQuality.qualityScore}% Data Quality
            </Badge>
          </CardTitle>
          <CardDescription>
            Benchmark: {result.benchmark === 'SP500' ? 'S&P 500' : 'Bitcoin'} | 
            Data Source: {result.dataSource} | 
            Last Updated: {result.dataQuality.dataFreshness}
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="metrics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="metrics">Financial Metrics</TabsTrigger>
          <TabsTrigger value="data">Monthly Data</TabsTrigger>
          <TabsTrigger value="calculations">Detailed Calculations</TabsTrigger>
          <TabsTrigger value="reasoning">Analysis Reasoning</TabsTrigger>
          <TabsTrigger value="quality">Data Quality</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Core Financial Metrics */}
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

            {/* Risk Metrics */}
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

            {/* Advanced Metrics */}
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

        <TabsContent value="calculations">
          <div className="space-y-6">
            {/* Formulas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Mathematical Formulas Used
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Net Present Value (NPV)</h4>
                  <code className="block p-2 bg-muted rounded text-sm">
                    {result.detailedCalculations.formulas.npvFormula}
                  </code>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Internal Rate of Return (IRR)</h4>
                  <code className="block p-2 bg-muted rounded text-sm">
                    {result.detailedCalculations.formulas.irrFormula}
                  </code>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Beta Coefficient</h4>
                  <code className="block p-2 bg-muted rounded text-sm">
                    {result.detailedCalculations.formulas.betaFormula}
                  </code>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Compound Annual Growth Rate (CAGR)</h4>
                  <code className="block p-2 bg-muted rounded text-sm">
                    {result.detailedCalculations.formulas.cagrFormula}
                  </code>
                </div>
              </CardContent>
            </Card>

            {/* Cash Flows */}
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Analysis</CardTitle>
                <CardDescription>
                  Projected cash flows including transaction costs and staking rewards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.detailedCalculations.cashFlows.map((flow, index) => (
                    <div key={index} className="flex justify-between p-2 border rounded">
                      <span>Period {index}:</span>
                      <span className={flow > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {flow > 0 ? '+' : ''}${flow.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reasoning">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Step-by-Step Analysis Reasoning
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

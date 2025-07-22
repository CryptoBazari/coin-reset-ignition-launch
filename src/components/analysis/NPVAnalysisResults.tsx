
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, DollarSign, Activity, Target } from 'lucide-react';
import type { NPVResults } from '@/services/comprehensiveGlassnodeService';

interface NPVAnalysisResultsProps {
  results: NPVResults;
}

export function NPVAnalysisResults({ results }: NPVAnalysisResultsProps) {
  const { inputs, calculations, metadata, benchmarkData } = results;
  
  // Prepare chart data
  const projectedPricesData = calculations.projectedPrices.map((price, index) => ({
    year: index + 1,
    price: Math.round(price),
    cashFlow: Math.round(calculations.cashFlows[index])
  }));

  const monthlyChangesData = calculations.historicalMonthlyChanges.slice(-12).map((change, index) => ({
    month: `M${index - 11}`,
    change: Number(change.toFixed(2))
  }));

  const isPositiveNPV = calculations.npv > 0;
  const npvInterpretation = isPositiveNPV 
    ? "Investment is expected to generate positive returns above the required rate of return"
    : "Investment is expected to generate negative returns below the required rate of return";

  const stakingYieldUsed = inputs.stakingYield > 0 && ['eth', 'ada', 'dot', 'sol', 'atom', 'avax', 'matic'].includes(inputs.coinSymbol.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`${isPositiveNPV ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Present Value</p>
                <p className={`text-2xl font-bold ${isPositiveNPV ? 'text-green-600' : 'text-red-600'}`}>
                  ${calculations.npv.toLocaleString()}
                </p>
              </div>
              {isPositiveNPV ? (
                <TrendingUp className="h-8 w-8 text-green-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-600" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {npvInterpretation}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Adjusted CAGR</p>
                <p className="text-2xl font-bold">{calculations.adjustedCagr.toFixed(2)}%</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Based on {benchmarkData.type === 'sp500' ? 'S&P 500' : 'Bitcoin'} benchmark
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Confidence Score</p>
                <p className="text-2xl font-bold">{metadata.confidenceScore}%</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Based on data quality and completeness
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Input Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Analysis Summary
          </CardTitle>
          <CardDescription>
            Your investment parameters and key metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cryptocurrency</p>
              <p className="text-lg font-semibold">{inputs.coinSymbol.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Investment Amount</p>
              <p className="text-lg font-semibold">${inputs.investmentAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Time Horizon</p>
              <p className="text-lg font-semibold">{inputs.projectionPeriods} years</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Risk-Free Rate</p>
              <p className="text-lg font-semibold">{inputs.riskFreeRate}%</p>
            </div>
          </div>

          {stakingYieldUsed && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-800">
                Staking Yield Included: {inputs.stakingYield}% annual yield added to cash flows
              </p>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Beta</p>
              <p className="text-lg font-semibold">{calculations.beta.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Discount Rate</p>
              <p className="text-lg font-semibold">{calculations.discountRate.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Market Premium</p>
              <p className="text-lg font-semibold">{calculations.marketPremium.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Benchmark</p>
              <p className="text-lg font-semibold">{benchmarkData.type === 'sp500' ? 'S&P 500' : 'Bitcoin'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Changes Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Historical Monthly Changes</CardTitle>
            <CardDescription>Last 12 months of price movements</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyChangesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}%`, 'Monthly Change']} />
                <Bar 
                  dataKey="change" 
                  fill={(dataKey) => dataKey > 0 ? '#22c55e' : '#ef4444'}
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Projected Prices Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Projected Price Growth</CardTitle>
            <CardDescription>Expected price trajectory based on CAGR</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={projectedPricesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Projected Price']} />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Projected Values Table */}
      <Card>
        <CardHeader>
          <CardTitle>Year-by-Year Projections</CardTitle>
          <CardDescription>Detailed breakdown of projected prices and cash flows</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead>Projected Price</TableHead>
                <TableHead>Cash Flow</TableHead>
                <TableHead>Present Value</TableHead>
                <TableHead>Cumulative NPV</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectedPricesData.map((row, index) => {
                const presentValue = calculations.cashFlows[index] / Math.pow(1 + calculations.discountRate / 100, index + 1);
                const cumulativeNPV = -inputs.investmentAmount + calculations.cashFlows.slice(0, index + 1).reduce((sum, cf, i) => {
                  return sum + cf / Math.pow(1 + calculations.discountRate / 100, i + 1);
                }, 0);
                
                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.year}</TableCell>
                    <TableCell>${row.price.toLocaleString()}</TableCell>
                    <TableCell>${row.cashFlow.toLocaleString()}</TableCell>
                    <TableCell>${Math.round(presentValue).toLocaleString()}</TableCell>
                    <TableCell className={cumulativeNPV >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${Math.round(cumulativeNPV).toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stress Test Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Stress Test Analysis
          </CardTitle>
          <CardDescription>
            NPV under worst-case scenario based on historical drawdowns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Base Case NPV</h4>
              <p className={`text-2xl font-bold ${isPositiveNPV ? 'text-green-600' : 'text-red-600'}`}>
                ${calculations.npv.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Using expected cash flows and discount rate
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Stress-Tested NPV</h4>
              <p className={`text-2xl font-bold ${calculations.stressTestedNpv > 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${calculations.stressTestedNpv.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Cash flows reduced by historical max drawdown
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warnings and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {metadata.liquidityWarning ? (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            Analysis Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Badge variant={isPositiveNPV ? "default" : "destructive"}>
              {isPositiveNPV ? "BUY" : "AVOID"}
            </Badge>
            <div>
              <p className="font-medium">Investment Recommendation</p>
              <p className="text-sm text-muted-foreground">
                {isPositiveNPV 
                  ? "The analysis suggests this investment may generate positive returns above your required rate of return."
                  : "The analysis suggests this investment may not meet your required rate of return expectations."
                }
              </p>
            </div>
          </div>

          {metadata.liquidityWarning && (
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                LIQUIDITY WARNING
              </Badge>
              <div>
                <p className="font-medium">Low Liquidity Detected</p>
                <p className="text-sm text-muted-foreground">
                  Transaction volume appears low, which may impact your ability to enter/exit positions at desired prices.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Badge variant="outline">
              {metadata.confidenceScore}% CONFIDENCE
            </Badge>
            <div>
              <p className="font-medium">Data Quality Assessment</p>
              <p className="text-sm text-muted-foreground">
                {metadata.confidenceScore >= 80 
                  ? "High-quality data available for reliable analysis"
                  : metadata.confidenceScore >= 60
                  ? "Moderate data quality - consider results as estimates"
                  : "Limited data available - results should be treated with caution"
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

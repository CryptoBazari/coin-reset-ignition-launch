
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, ChevronUp, Calculator, Database, TrendingUp, BarChart3, Activity, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { CalculationDetails } from '@/types/calculationDetails';

interface CalculationDetailsCardProps {
  calculationDetails: CalculationDetails;
  symbol: string;
}

export const CalculationDetailsCard: React.FC<CalculationDetailsCardProps> = ({ 
  calculationDetails, 
  symbol 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Prepare chart data for cash flows
  const cashFlowData = calculationDetails.npv.projectedCashFlows.map((flow, index) => ({
    month: `Month ${index + 1}`,
    projected: flow,
    present: calculationDetails.npv.presentValues[index]
  }));

  // Prepare price history chart data
  const priceHistoryData = calculationDetails.cagr.priceHistory.map(p => ({
    date: new Date(p.date).toLocaleDateString(),
    price: p.price
  }));

  return (
    <Card className="border-blue-200">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                Detailed Calculation Breakdown
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  {calculationDetails.dataSource.primary.toUpperCase()}
                </Badge>
              </div>
              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </CardTitle>
            <CardDescription>
              View detailed calculations, data sources, and methodology for all financial metrics
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <Tabs defaultValue="npv" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="npv">NPV</TabsTrigger>
                <TabsTrigger value="irr">IRR</TabsTrigger>
                <TabsTrigger value="cagr">CAGR</TabsTrigger>
                <TabsTrigger value="volatility">Volatility</TabsTrigger>
                <TabsTrigger value="beta">Beta</TabsTrigger>
                <TabsTrigger value="data">Data Sources</TabsTrigger>
              </TabsList>

              {/* NPV Calculation Details */}
              <TabsContent value="npv" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        NPV Components
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span>Risk-free Rate:</span>
                        <span className="font-mono">{(calculationDetails.npv.riskFreeRate * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Risk Premium:</span>
                        <span className="font-mono">{(calculationDetails.npv.riskPremium * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount Rate:</span>
                        <span className="font-mono text-blue-600">{(calculationDetails.npv.discountRate * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Initial Investment:</span>
                        <span className="font-mono">${calculationDetails.npv.initialInvestment.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Terminal Value:</span>
                        <span className="font-mono">${calculationDetails.npv.terminalValue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-green-600">
                        <span>Net Present Value:</span>
                        <span className="font-mono">${calculationDetails.npv.netPresentValue.toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Calculation Steps</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="text-sm space-y-2">
                        {calculationDetails.npv.calculationSteps.map((step, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs">
                              {index + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                </div>

                {/* Cash Flow Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Projected vs Present Value Cash Flows</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={cashFlowData.slice(0, 12)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                          />
                          <Bar dataKey="projected" fill="#3b82f6" name="Projected Cash Flow" />
                          <Bar dataKey="present" fill="#22c55e" name="Present Value" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* IRR Calculation Details */}
              <TabsContent value="irr" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">IRR Calculation Method</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span>Method:</span>
                        <span className="font-mono">{calculationDetails.irr.calculationMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Initial Guess:</span>
                        <span className="font-mono">{(calculationDetails.irr.initialGuess * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Iterations:</span>
                        <span className="font-mono">{calculationDetails.irr.iterations}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tolerance:</span>
                        <span className="font-mono">{calculationDetails.irr.convergenceTolerance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Converged:</span>
                        <Badge variant={calculationDetails.irr.converged ? "default" : "destructive"}>
                          {calculationDetails.irr.converged ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="flex justify-between font-semibold text-blue-600">
                        <span>Final IRR:</span>
                        <span className="font-mono">{calculationDetails.irr.finalIRR.toFixed(2)}%</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Monthly Cash Flows</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-48 overflow-y-auto">
                        <div className="space-y-1 text-sm">
                          {calculationDetails.irr.monthlyCashFlows.slice(0, 13).map((flow, index) => (
                            <div key={index} className="flex justify-between">
                              <span>{index === 0 ? 'Initial' : `Month ${index}`}:</span>
                              <span className={`font-mono ${flow < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                ${flow.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* CAGR Calculation Details */}
              <TabsContent value="cagr" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        CAGR Calculation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span>Start Price:</span>
                        <span className="font-mono">${calculationDetails.cagr.startPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>End Price:</span>
                        <span className="font-mono">${calculationDetails.cagr.endPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time Period:</span>
                        <span className="font-mono">{calculationDetails.cagr.timePeriodsYears.toFixed(1)} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Data Points:</span>
                        <span className="font-mono">{calculationDetails.cagr.dataPoints}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Data Source:</span>
                        <Badge variant="outline">
                          {calculationDetails.cagr.dataSource.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recent Price History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={priceHistoryData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip 
                              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Price']}
                            />
                            <Line type="monotone" dataKey="price" stroke="#8884d8" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Volatility Details */}
              <TabsContent value="volatility" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Volatility Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Data Points:</span>
                        <span className="font-mono">{calculationDetails.volatility.dataPoints}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Calculation Period:</span>
                        <span className="font-mono">{calculationDetails.volatility.calculationPeriod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mean Return:</span>
                        <span className="font-mono">{(calculationDetails.volatility.meanReturn * 100).toFixed(3)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Variance:</span>
                        <span className="font-mono">{calculationDetails.volatility.variance.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Standard Deviation:</span>
                        <span className="font-mono">{(calculationDetails.volatility.standardDeviation * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Annualization Factor:</span>
                        <span className="font-mono">{calculationDetails.volatility.annualizationFactor.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Beta Details */}
              <TabsContent value="beta" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Beta Calculation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Market Volatility:</span>
                      <span className="font-mono">{calculationDetails.beta.marketVolatility}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Asset Volatility:</span>
                      <span className="font-mono">{calculationDetails.beta.assetVolatility.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Correlation:</span>
                      <span className="font-mono">{calculationDetails.beta.correlation.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Calculation Method:</span>
                      <Badge variant="outline">
                        {calculationDetails.beta.calculationMethod.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Benchmark:</span>
                      <span className="font-mono">{calculationDetails.beta.benchmarkUsed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Confidence Level:</span>
                      <Badge variant={
                        calculationDetails.beta.confidenceLevel === 'high' ? 'default' :
                        calculationDetails.beta.confidenceLevel === 'medium' ? 'secondary' : 'outline'
                      }>
                        {calculationDetails.beta.confidenceLevel.toUpperCase()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Data Sources */}
              <TabsContent value="data" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Data Sources & Quality
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Primary Source:</span>
                          <Badge variant="default">
                            {calculationDetails.dataSource.primary.toUpperCase()}
                          </Badge>
                        </div>
                        {calculationDetails.dataSource.secondary && (
                          <div className="flex justify-between">
                            <span>Secondary Source:</span>
                            <Badge variant="outline">
                              {calculationDetails.dataSource.secondary.toUpperCase()}
                            </Badge>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Data Freshness:</span>
                          <span className="font-mono">{calculationDetails.dataSource.dataFreshness}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Months of Data:</span>
                          <span className="font-mono">{calculationDetails.dataSource.monthsOfData}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Quality Score:</span>
                          <span className="font-mono">{calculationDetails.dataSource.qualityScore}%</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <span className="font-medium">API Endpoints:</span>
                          <ul className="mt-2 space-y-1">
                            {calculationDetails.dataSource.apiEndpoints.map((endpoint, index) => (
                              <li key={index} className="text-sm bg-gray-100 p-2 rounded font-mono">
                                {endpoint}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {calculationDetails.dataSource.fallbacksUsed.length > 0 && (
                          <div>
                            <span className="font-medium text-orange-600">Fallbacks Used:</span>
                            <ul className="mt-2 space-y-1">
                              {calculationDetails.dataSource.fallbacksUsed.map((fallback, index) => (
                                <li key={index} className="text-sm">
                                  <Badge variant="outline" className="bg-orange-100 text-orange-800">
                                    {fallback}
                                  </Badge>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

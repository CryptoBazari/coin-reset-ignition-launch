import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Settings, TrendingUp } from 'lucide-react';
import { AnalysisInputs } from '@/services/comprehensiveGlassNodeAnalyzer';

interface ComprehensiveInvestmentFormProps {
  onSubmit: (inputs: AnalysisInputs) => void;
  loading?: boolean;
}

export const ComprehensiveInvestmentForm: React.FC<ComprehensiveInvestmentFormProps> = ({
  onSubmit,
  loading = false
}) => {
  const [inputs, setInputs] = useState<AnalysisInputs>({
    coinSymbol: 'BTC',
    investmentAmount: 10000,
    timeHorizon: 36,
    region: 'US',
    includeInflation: true,
    includeTransactionCosts: true,
    riskTolerance: 'moderate'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(inputs);
  };

  const updateInput = (key: keyof AnalysisInputs, value: string | number | boolean) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Comprehensive Investment Analyzer
        </CardTitle>
        <CardDescription>
          Advanced analysis with monthly beta calculations and real market data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Parameters</TabsTrigger>
              <TabsTrigger value="advanced">Risk Settings</TabsTrigger>
              <TabsTrigger value="costs">Additional Factors</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="coinSymbol">Cryptocurrency Symbol</Label>
                  <Input
                    id="coinSymbol"
                    value={inputs.coinSymbol}
                    onChange={(e) => updateInput('coinSymbol', e.target.value.toUpperCase())}
                    placeholder="BTC, ETH, SOL, etc."
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Benchmark: {inputs.coinSymbol.toUpperCase() === 'BTC' ? 'S&P 500' : 'Bitcoin'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="investmentAmount">Investment Amount ($)</Label>
                  <Input
                    id="investmentAmount"
                    type="number"
                    value={inputs.investmentAmount}
                    onChange={(e) => updateInput('investmentAmount', parseFloat(e.target.value))}
                    min="100"
                    step="100"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeHorizon">Time Horizon (months)</Label>
                  <Input
                    id="timeHorizon"
                    type="number"
                    value={inputs.timeHorizon}
                    onChange={(e) => updateInput('timeHorizon', Number(e.target.value))}
                    placeholder="36"
                    min="1"
                    max="120"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <select
                    id="region"
                    value={inputs.region}
                    onChange={(e) => updateInput('region', e.target.value as 'US' | 'EU' | 'ASIA' | 'GLOBAL')}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="US">United States</option>
                    <option value="EU">Europe</option>
                    <option value="ASIA">Asia</option>
                    <option value="GLOBAL">Global</option>
                  </select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Risk Tolerance
                  </CardTitle>
                  <CardDescription>Set your risk preference</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Label htmlFor="riskTolerance">Risk Tolerance</Label>
                    <select
                      id="riskTolerance"
                      value={inputs.riskTolerance}
                      onChange={(e) => updateInput('riskTolerance', e.target.value as 'conservative' | 'moderate' | 'aggressive')}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="conservative">Conservative</option>
                      <option value="moderate">Moderate</option>
                      <option value="aggressive">Aggressive</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="costs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Additional Factors
                  </CardTitle>
                  <CardDescription>Include additional analysis factors</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeInflation"
                        checked={inputs.includeInflation}
                        onChange={(e) => updateInput('includeInflation', e.target.checked)}
                      />
                      <Label htmlFor="includeInflation">Include Inflation Analysis</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeTransactionCosts"
                        checked={inputs.includeTransactionCosts}
                        onChange={(e) => updateInput('includeTransactionCosts', e.target.checked)}
                      />
                      <Label htmlFor="includeTransactionCosts">Include Transaction Costs</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Analysis Features</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Badge variant="outline">Monthly Beta Calculation</Badge>
                  <Badge variant="outline">Real Market Data</Badge>
                  <Badge variant="outline">Glass Node Metrics</Badge>
                  <Badge variant="outline">Regional Analysis</Badge>
                  <Badge variant="outline">Monte Carlo Simulation</Badge>
                  <Badge variant="outline">Enhanced NPV</Badge>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
            size="lg"
          >
            {loading ? (
              <>
                <TrendingUp className="mr-2 h-4 w-4 animate-spin" />
                Running Comprehensive Analysis...
              </>
            ) : (
              <>
                <Calculator className="mr-2 h-4 w-4" />
                Start Comprehensive Analysis
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
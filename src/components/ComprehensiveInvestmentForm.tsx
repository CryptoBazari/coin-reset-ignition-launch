
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
    holdingPeriod: 36,
    riskFreeRate: 0.03,
    marketPremium: 0.06,
    stakingYield: 0,
    transactionCosts: 0.5,
    inflationRate: 0.025
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(inputs);
  };

  const updateInput = (key: keyof AnalysisInputs, value: string | number) => {
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
          Advanced analysis with customizable assumptions, transaction costs, and inflation adjustments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Parameters</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
              <TabsTrigger value="costs">Costs & Adjustments</TabsTrigger>
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
                  <Label>Holding Period: {inputs.holdingPeriod} months</Label>
                  <Slider
                    value={[inputs.holdingPeriod]}
                    onValueChange={(value) => updateInput('holdingPeriod', value[0])}
                    max={60}
                    min={6}
                    step={6}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>6 months</span>
                    <span>5 years</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stakingYield">Staking Yield (%)</Label>
                  <Input
                    id="stakingYield"
                    type="number"
                    value={inputs.stakingYield * 100}
                    onChange={(e) => updateInput('stakingYield', parseFloat(e.target.value) / 100)}
                    min="0"
                    max="20"
                    step="0.1"
                  />
                  <p className="text-xs text-muted-foreground">
                    Annual staking rewards (0% if not staking)
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Risk-Free Rate: {(inputs.riskFreeRate * 100).toFixed(1)}%</Label>
                  <Slider
                    value={[inputs.riskFreeRate * 100]}
                    onValueChange={(value) => updateInput('riskFreeRate', value[0] / 100)}
                    max={6}
                    min={1}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Current 10-year Treasury yield approximation
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Market Risk Premium: {(inputs.marketPremium * 100).toFixed(1)}%</Label>
                  <Slider
                    value={[inputs.marketPremium * 100]}
                    onValueChange={(value) => updateInput('marketPremium', value[0] / 100)}
                    max={10}
                    min={3}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Expected return above risk-free rate
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Inflation Rate: {(inputs.inflationRate * 100).toFixed(1)}%</Label>
                  <Slider
                    value={[inputs.inflationRate * 100]}
                    onValueChange={(value) => updateInput('inflationRate', value[0] / 100)}
                    max={6}
                    min={1}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Annual inflation rate for real returns
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Transaction Costs: {inputs.transactionCosts.toFixed(1)}%</Label>
                  <Slider
                    value={[inputs.transactionCosts]}
                    onValueChange={(value) => updateInput('transactionCosts', value[0])}
                    max={2}
                    min={0.1}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Trading fees, spreads, and slippage
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="costs" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Cost Breakdown Analysis</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Initial Investment:</span>
                      <span>${inputs.investmentAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transaction Costs:</span>
                      <span>-${(inputs.investmentAmount * inputs.transactionCosts / 100).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Annual Staking Yield:</span>
                      <span>+{(inputs.stakingYield * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Net Initial Position:</span>
                      <span>${(inputs.investmentAmount * (1 - inputs.transactionCosts / 100)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Analysis Features</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Badge variant="outline">9 Glassnode Endpoints</Badge>
                    <Badge variant="outline">Regional Price Analysis</Badge>
                    <Badge variant="outline">Real S&P 500 Data</Badge>
                    <Badge variant="outline">Inflation Adjustment</Badge>
                    <Badge variant="outline">Liquidity Scoring</Badge>
                    <Badge variant="outline">MVRV Z-Score</Badge>
                    <Badge variant="outline">Realized P&L</Badge>
                    <Badge variant="outline">Transaction Costs</Badge>
                  </div>
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

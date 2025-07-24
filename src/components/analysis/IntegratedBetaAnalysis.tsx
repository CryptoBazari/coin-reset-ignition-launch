import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, Activity, Calculator, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { comprehensiveBetaCalculationService, BetaCalculationResult } from '@/services/comprehensiveBetaCalculationService';

interface IntegratedBetaAnalysisProps {
  selectedCoin?: string;
}

export const IntegratedBetaAnalysis = ({ selectedCoin }: IntegratedBetaAnalysisProps) => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<BetaCalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCalculateBeta = async () => {
    if (!selectedCoin) {
      toast({
        title: "Select a Coin",
        description: "Please select a cryptocurrency to calculate beta.",
        variant: "destructive"
      });
      return;
    }

    setIsCalculating(true);
    setError(null);
    setResult(null);

    try {
      const betaResult = await comprehensiveBetaCalculationService.calculateComprehensiveBeta(selectedCoin);
      setResult(betaResult);
      
      toast({
        title: "Beta Calculation Complete",
        description: `Beta for ${betaResult.coinSymbol} vs ${betaResult.benchmarkSymbol}: ${betaResult.beta}`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate beta';
      setError(errorMessage);
      toast({
        title: "Beta Calculation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const getBetaInterpretation = (beta: number): { text: string; color: "default" | "destructive" | "secondary" | "outline"; icon: any } => {
    if (beta > 1.5) return { text: 'High Volatility', color: 'destructive', icon: TrendingUp };
    if (beta > 1) return { text: 'More Volatile', color: 'secondary', icon: TrendingUp };
    if (beta > 0.5) return { text: 'Less Volatile', color: 'secondary', icon: TrendingDown };
    if (beta > 0) return { text: 'Low Volatility', color: 'secondary', icon: TrendingDown };
    return { text: 'Inverse Movement', color: 'destructive', icon: TrendingDown };
  };

  const getConfidenceBadge = (confidence: string): "default" | "destructive" | "secondary" | "outline" => {
    const colors = {
      high: 'default' as const,
      medium: 'secondary' as const,
      low: 'destructive' as const
    };
    return colors[confidence as keyof typeof colors] || 'default';
  };

  const getBenchmark = (coin: string): string => {
    const upperCoin = coin?.toUpperCase();
    if (upperCoin === 'BTC' || upperCoin === 'BITCOIN') {
      return 'S&P 500';
    }
    return 'Bitcoin';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Beta (β) Risk Analysis
        </CardTitle>
        <CardDescription>
          Calculate systematic risk using CAPM. {selectedCoin ? 
            `${selectedCoin.toUpperCase()} vs ${getBenchmark(selectedCoin)}` : 
            'Select a coin to analyze systematic risk'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedCoin ? 
              `Ready to calculate beta for ${selectedCoin.toUpperCase()}` : 
              'Please select a cryptocurrency from the coin selector above'
            }
          </div>
          <Button 
            onClick={handleCalculateBeta} 
            disabled={isCalculating || !selectedCoin}
            className="flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            {isCalculating ? 'Calculating...' : 'Calculate Beta'}
          </Button>
        </div>

        {isCalculating && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Fetching 3 years of historical data and calculating beta...
            </div>
            <Progress value={undefined} className="w-full" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-4">
            <Separator />
            
            <div className="space-y-4">
              {(() => {
                const interpretation = getBetaInterpretation(result.beta);
                const IconComponent = interpretation.icon;
                
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5" />
                        <span className="font-semibold">
                          {result.coinSymbol} vs {result.benchmarkSymbol}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getConfidenceBadge(result.confidence)}>
                          {result.confidence} confidence
                        </Badge>
                        {result.confidence === 'high' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-mono font-bold">{result.beta}</span>
                      <Badge variant={interpretation.color}>
                        {interpretation.text}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Data Points</div>
                        <div className="font-mono">{result.dataPoints}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Covariance</div>
                        <div className="font-mono">{result.covariance.toExponential(4)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Benchmark Variance</div>
                        <div className="font-mono">{result.benchmarkVariance.toExponential(4)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Annualized Volatility</div>
                        <div className="font-mono">{((result.annualizedVolatility || 0) * 100).toFixed(1)}%</div>
                      </div>
                    </div>

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Beta Interpretation:</strong> β = {result.beta} means {result.coinSymbol} is expected to move {Math.abs(result.beta).toFixed(2)}x 
                        {result.beta > 0 ? ' in the same direction' : ' in the opposite direction'} as {result.benchmarkSymbol}.
                        {result.beta > 1 ? ' Higher systematic risk.' : result.beta < 1 ? ' Lower systematic risk.' : ' Similar systematic risk.'}
                      </AlertDescription>
                    </Alert>

                    <div className="text-xs text-muted-foreground">
                      <div>Period: {result.startDate} to {result.endDate}</div>
                      <div>Calculated: {new Date(result.calculationDate).toLocaleString()}</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, Activity, Calculator, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { comprehensiveBetaCalculationService, BetaCalculationResult } from '@/services/comprehensiveBetaCalculationService';

export const ComprehensiveBetaAnalysis = () => {
  const [selectedCoin, setSelectedCoin] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<BetaCalculationResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const supportedCoins = [
    { value: 'BTC', label: 'Bitcoin (BTC)', benchmark: 'S&P 500' },
    { value: 'ethereum', label: 'Ethereum (ETH)', benchmark: 'Bitcoin' },
    { value: 'solana', label: 'Solana (SOL)', benchmark: 'Bitcoin' },
    { value: 'cardano', label: 'Cardano (ADA)', benchmark: 'Bitcoin' },
    { value: 'chainlink', label: 'Chainlink (LINK)', benchmark: 'Bitcoin' }
  ];

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

    try {
      const result = await comprehensiveBetaCalculationService.calculateComprehensiveBeta(selectedCoin);
      setResults(prev => [result, ...prev.filter(r => r.coinSymbol !== result.coinSymbol)]);
      
      toast({
        title: "Beta Calculation Complete",
        description: `Beta for ${result.coinSymbol} vs ${result.benchmarkSymbol}: ${result.beta}`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate beta';
      setError(errorMessage);
      toast({
        title: "Calculation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCalculateAll = async () => {
    setIsCalculating(true);
    setError(null);

    try {
      const coinSymbols = supportedCoins.map(coin => coin.value);
      const batchResults = await comprehensiveBetaCalculationService.calculateBetaForMultipleCoins(coinSymbols);
      setResults(batchResults);
      
      toast({
        title: "Batch Calculation Complete",
        description: `Calculated beta for ${batchResults.length} cryptocurrencies`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate beta';
      setError(errorMessage);
      toast({
        title: "Batch Calculation Failed",
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Comprehensive Beta (β) Calculation
          </CardTitle>
          <CardDescription>
            Calculate systematic risk using the Capital Asset Pricing Model (CAPM). 
            BTC beta vs S&P 500, other cryptos vs BTC. Based on 3 years of daily price data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Select Cryptocurrency</label>
              <Select value={selectedCoin} onValueChange={setSelectedCoin}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a cryptocurrency" />
                </SelectTrigger>
                <SelectContent>
                  {supportedCoins.map(coin => (
                    <SelectItem key={coin.value} value={coin.value}>
                      {coin.label} (vs {coin.benchmark})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleCalculateBeta} 
              disabled={isCalculating || !selectedCoin}
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              {isCalculating ? 'Calculating...' : 'Calculate Beta'}
            </Button>
            <Button 
              onClick={handleCalculateAll} 
              disabled={isCalculating}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Calculator className="h-4 w-4" />
              Calculate All
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
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Beta Calculation Results</h3>
          {results.map((result, index) => {
            const interpretation = getBetaInterpretation(result.beta);
            const IconComponent = interpretation.icon;
            
            return (
              <Card key={`${result.coinSymbol}-${index}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5" />
                      {result.coinSymbol} vs {result.benchmarkSymbol}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={getConfidenceBadge(result.confidence)}>
                        {result.confidence} confidence
                      </Badge>
                      {result.confidence === 'high' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </div>
                  </div>
                  <CardDescription>
                    Beta: <span className="font-mono text-lg font-bold">{result.beta}</span>
                    <Badge variant={interpretation.color} className="ml-2">
                      {interpretation.text}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Mean Daily Return ({result.coinSymbol})</div>
                      <div className="font-mono">{(result.coinMeanReturn * 100).toFixed(4)}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Mean Daily Return ({result.benchmarkSymbol})</div>
                      <div className="font-mono">{(result.benchmarkMeanReturn * 100).toFixed(4)}%</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="text-xs text-muted-foreground">
                    <div>Period: {result.startDate} to {result.endDate}</div>
                    <div>Calculated: {new Date(result.calculationDate).toLocaleString()}</div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Beta Interpretation:</strong> β = {result.beta} means {result.coinSymbol} is expected to move {Math.abs(result.beta).toFixed(2)}x 
                      {result.beta > 0 ? ' in the same direction' : ' in the opposite direction'} as {result.benchmarkSymbol}.
                      {result.beta > 1 ? ' Higher systematic risk.' : result.beta < 1 ? ' Lower systematic risk.' : ' Similar systematic risk.'}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
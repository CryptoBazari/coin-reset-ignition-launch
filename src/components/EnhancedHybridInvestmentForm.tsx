import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { advancedInvestmentService } from '@/services/advancedInvestmentCalculationService';
import { HybridAnalysisResults } from './HybridAnalysisResults';

interface FormData {
  coinSymbol: string;
  initialInvestment: number;
  projectionYears: number;
  stakingYield: number;
  riskFreeRate: number;
}

interface CoinOption {
  id: string;
  symbol: string;
  name: string;
  current_price?: number;
  price_change_24h?: number;
  logo_url?: string;
}

export const EnhancedHybridInvestmentForm: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [coinSearch, setCoinSearch] = useState('');
  const [availableCoins, setAvailableCoins] = useState<CoinOption[]>([]);

  // Stakeable coins list
  const stakeableCoins = ['eth', 'ada', 'sol', 'dot', 'atom', 'avax', 'near', 'algo', 'matic', 'one'];

  const [formData, setFormData] = useState<FormData>({
    coinSymbol: 'btc',
    initialInvestment: 10000,
    projectionYears: 5,
    stakingYield: 0,
    riskFreeRate: 3
  });

  // Check if selected coin is stakeable
  const isStakeable = (symbol: string) => {
    return stakeableCoins.includes(symbol.toLowerCase());
  };

  // Load popular coins on component mount
  useEffect(() => {
    loadPopularCoins();
  }, []);

  // Reset staking yield when coin changes to non-stakeable
  useEffect(() => {
    if (!isStakeable(formData.coinSymbol)) {
      setFormData(prev => ({ ...prev, stakingYield: 0 }));
    }
  }, [formData.coinSymbol]);

  const loadPopularCoins = async () => {
    try {
      // Popular crypto coins with their symbols
      const popularCoins = [
        { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin' },
        { id: 'ethereum', symbol: 'eth', name: 'Ethereum' },
        { id: 'cardano', symbol: 'ada', name: 'Cardano' },
        { id: 'solana', symbol: 'sol', name: 'Solana' },
        { id: 'polkadot', symbol: 'dot', name: 'Polkadot' },
        { id: 'cosmos', symbol: 'atom', name: 'Cosmos' },
        { id: 'avalanche-2', symbol: 'avax', name: 'Avalanche' },
        { id: 'near', symbol: 'near', name: 'NEAR Protocol' },
        { id: 'algorand', symbol: 'algo', name: 'Algorand' },
        { id: 'polygon', symbol: 'matic', name: 'Polygon' },
        { id: 'chainlink', symbol: 'link', name: 'Chainlink' },
        { id: 'uniswap', symbol: 'uni', name: 'Uniswap' },
        { id: 'litecoin', symbol: 'ltc', name: 'Litecoin' },
        { id: 'bitcoin-cash', symbol: 'bch', name: 'Bitcoin Cash' }
      ];

      setAvailableCoins(popularCoins);
    } catch (error) {
      console.error('Failed to load coins:', error);
      toast({
        title: "Warning",
        description: "Failed to load coin list. You can still enter symbols manually.",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.coinSymbol) {
      toast({
        title: "Error",
        description: "Please select a cryptocurrency",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const analysisResult = await advancedInvestmentService.calculateAdvancedNPV({
        coinSymbol: formData.coinSymbol,
        initialInvestment: formData.initialInvestment,
        projectionYears: formData.projectionYears,
        stakingYield: isStakeable(formData.coinSymbol) ? formData.stakingYield : undefined,
        riskFreeRate: formData.riskFreeRate
      });

      // For altcoins, fetch Bitcoin context
      let bitcoinContext = null;
      if (formData.coinSymbol.toLowerCase() !== 'btc') {
        // Mock Bitcoin context - in real implementation, this would come from cointime analysis
        bitcoinContext = {
          cointime: {
            aviv_ratio: 2.5,
            market_state: 'accumulation',
            confidence: 75
          }
        };
      }

      setResult({ ...analysisResult, bitcoinContext });

      toast({
        title: "Analysis Complete",
        description: `NPV calculation completed for ${formData.coinSymbol.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to complete analysis",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCoins = availableCoins.filter(coin =>
    coin.symbol.toLowerCase().includes(coinSearch.toLowerCase()) ||
    coin.name.toLowerCase().includes(coinSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Hybrid Crypto Investment Analyzer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Coin Selection */}
            <div className="space-y-2">
              <Label htmlFor="coinSymbol">Cryptocurrency *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="coinSearch"
                  placeholder="Search for a cryptocurrency..."
                  value={coinSearch}
                  onChange={(e) => setCoinSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {coinSearch && filteredCoins.length > 0 && (
                <div className="border rounded-md max-h-40 overflow-y-auto">
                  {filteredCoins.slice(0, 10).map((coin) => (
                    <div
                      key={coin.id}
                      className="p-2 hover:bg-muted cursor-pointer flex items-center justify-between"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, coinSymbol: coin.symbol }));
                        setCoinSearch('');
                      }}
                    >
                      <div className="flex items-center">
                        <span className="font-medium">{coin.symbol.toUpperCase()}</span>
                        <span className="ml-2 text-sm text-muted-foreground">{coin.name}</span>
                      </div>
                      {isStakeable(coin.symbol) && (
                        <Badge variant="secondary" className="text-xs">Stakeable</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center mt-2">
                <span className="text-sm text-muted-foreground mr-2">Selected:</span>
                <Badge variant="outline" className="uppercase">
                  {formData.coinSymbol || 'None'}
                </Badge>
                {formData.coinSymbol && isStakeable(formData.coinSymbol) && (
                  <Badge variant="secondary" className="ml-2 text-xs">Stakeable</Badge>
                )}
              </div>
            </div>

            {/* Investment Amount */}
            <div className="space-y-2">
              <Label htmlFor="initialInvestment">Initial Investment Amount ($)</Label>
              <Input
                id="initialInvestment"
                type="number"
                min="100"
                max="1000000"
                step="100"
                value={formData.initialInvestment}
                onChange={(e) => handleInputChange('initialInvestment', parseInt(e.target.value) || 0)}
              />
            </div>

            {/* Projection Years */}
            <div className="space-y-2">
              <Label htmlFor="projectionYears">
                Projection Period: {formData.projectionYears} years
              </Label>
              <Slider
                id="projectionYears"
                min={1}
                max={10}
                step={1}
                value={[formData.projectionYears]}
                onValueChange={(value) => handleInputChange('projectionYears', value[0])}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 year</span>
                <span>10 years</span>
              </div>
            </div>

            {/* Staking Yield - Only show for stakeable coins */}
            {isStakeable(formData.coinSymbol) && (
              <div className="space-y-2">
                <Label htmlFor="stakingYield">
                  Staking Yield: {formData.stakingYield}%
                </Label>
                <Slider
                  id="stakingYield"
                  min={0}
                  max={20}
                  step={0.5}
                  value={[formData.stakingYield]}
                  onValueChange={(value) => handleInputChange('stakingYield', value[0])}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>20%</span>
                </div>
              </div>
            )}

            {/* Risk-free Rate */}
            <div className="space-y-2">
              <Label htmlFor="riskFreeRate">
                Risk-free Rate: {formData.riskFreeRate}%
              </Label>
              <Slider
                id="riskFreeRate"
                min={2}
                max={6}
                step={0.1}
                value={[formData.riskFreeRate]}
                onValueChange={(value) => handleInputChange('riskFreeRate', value[0])}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>2%</span>
                <span>6%</span>
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !formData.coinSymbol}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Investment'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <HybridAnalysisResults 
          result={result} 
          formData={formData}
          bitcoinContext={result.bitcoinContext}
        />
      )}
    </div>
  );
};
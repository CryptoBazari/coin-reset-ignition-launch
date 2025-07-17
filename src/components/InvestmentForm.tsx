
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { CoinData, InvestmentInputs } from '@/types/investment';
import type { VirtualPortfolio, VirtualAsset } from '@/types/virtualPortfolio';

interface InvestmentFormProps {
  onSubmit: (inputs: InvestmentInputs) => void;
  loading: boolean;
}

export const InvestmentForm: React.FC<InvestmentFormProps> = ({ onSubmit, loading }) => {
  const { user } = useAuth();
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [portfolios, setPortfolios] = useState<VirtualPortfolio[]>([]);
  const [portfolioAssets, setPortfolioAssets] = useState<VirtualAsset[]>([]);
  const [formData, setFormData] = useState<InvestmentInputs>({
    coinId: '',
    investmentAmount: 100,
    totalPortfolio: 10000,
    portfolioId: undefined,
    investmentHorizon: 2,
    expectedPrice: undefined,
    stakingYield: undefined
  });

  useEffect(() => {
    fetchCoins();
    if (user) {
      fetchUserPortfolios();
    }
  }, [user]);

  const fetchCoins = async () => {
    const { data, error } = await supabase
      .from('coins')
      .select('*')
      .order('name');
    
    if (data && !error) {
      // Convert the database records to match our CoinData interface
      const convertedCoins: CoinData[] = data.map(coin => ({
        id: coin.id,
        coin_id: coin.coin_id,
        name: coin.name,
        basket: coin.basket as 'Bitcoin' | 'Blue Chip' | 'Small-Cap',
        current_price: coin.current_price,
        market_cap: coin.market_cap,
        price_history: coin.price_history,
        cagr_36m: coin.cagr_36m,
        fundamentals_score: coin.fundamentals_score,
        volatility: coin.volatility,
        aviv_ratio: coin.aviv_ratio,
        active_supply: coin.active_supply,
        vaulted_supply: coin.vaulted_supply,
        staking_yield: coin.staking_yield
      }));
      setCoins(convertedCoins);
    }
  };

  const fetchUserPortfolios = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('virtual_portfolios')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (data && !error) {
      setPortfolios(data);
      // Auto-select first portfolio and update total portfolio value
      if (data.length > 0 && !formData.portfolioId) {
        setFormData(prev => ({
          ...prev,
          portfolioId: data[0].id,
          totalPortfolio: data[0].total_value
        }));
        fetchPortfolioAssets(data[0].id);
      }
    }
  };

  const fetchPortfolioAssets = async (portfolioId: string) => {
    const { data, error } = await supabase
      .from('virtual_assets')
      .select(`
        *,
        virtual_coins (
          id,
          symbol,
          name,
          created_at
        )
      `)
      .eq('portfolio_id', portfolioId);
      
    if (data && !error) {
      // Type cast to ensure category matches the union type
      const typedAssets = data.map(asset => ({
        ...asset,
        category: asset.category as 'Bitcoin' | 'Blue Chip' | 'Small-Cap'
      }));
      setPortfolioAssets(typedAssets);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.coinId) {
      onSubmit(formData);
    }
  };

  const selectedCoin = coins.find(coin => coin.coin_id === formData.coinId);
  const selectedPortfolio = portfolios.find(p => p.id === formData.portfolioId);

  // Calculate current portfolio allocation
  const getPortfolioAllocation = () => {
    if (!portfolioAssets.length || !selectedPortfolio) return null;
    
    const totalValue = selectedPortfolio.total_value;
    const bitcoinValue = portfolioAssets
      .filter(asset => asset.category === 'Bitcoin')
      .reduce((sum, asset) => sum + asset.cost_basis, 0);
    const blueChipValue = portfolioAssets
      .filter(asset => asset.category === 'Blue Chip')
      .reduce((sum, asset) => sum + asset.cost_basis, 0);
    const smallCapValue = portfolioAssets
      .filter(asset => asset.category === 'Small-Cap')
      .reduce((sum, asset) => sum + asset.cost_basis, 0);
      
    return {
      bitcoin: totalValue > 0 ? (bitcoinValue / totalValue) * 100 : 0,
      blueChip: totalValue > 0 ? (blueChipValue / totalValue) * 100 : 0,
      smallCap: totalValue > 0 ? (smallCapValue / totalValue) * 100 : 0,
    };
  };

  const portfolioAllocation = getPortfolioAllocation();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Cryptocurrency Investment Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Portfolio Selection Section */}
          {user && portfolios.length > 0 && (
            <div className="space-y-4 p-4 bg-background border rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="portfolio">Select Portfolio (Optional)</Label>
                <Select 
                  value={formData.portfolioId || ''} 
                  onValueChange={(value) => {
                    const portfolio = portfolios.find(p => p.id === value);
                    setFormData({ 
                      ...formData, 
                      portfolioId: value || undefined,
                      totalPortfolio: portfolio?.total_value || formData.totalPortfolio 
                    });
                    if (value) fetchPortfolioAssets(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a portfolio for enhanced analysis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Manual Portfolio Analysis</SelectItem>
                    {portfolios.map((portfolio) => (
                      <SelectItem key={portfolio.id} value={portfolio.id}>
                        {portfolio.name} (${portfolio.total_value.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Portfolio Allocation Display */}
              {selectedPortfolio && portfolioAllocation && (
                <div className="space-y-2">
                  <Label>Current Portfolio Allocation</Label>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      Bitcoin: {portfolioAllocation.bitcoin.toFixed(1)}%
                    </Badge>
                    <Badge variant="secondary">
                      Blue Chip: {portfolioAllocation.blueChip.toFixed(1)}%
                    </Badge>
                    <Badge variant="secondary">
                      Small-Cap: {portfolioAllocation.smallCap.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coin">Select Cryptocurrency</Label>
              <Select 
                value={formData.coinId} 
                onValueChange={(value) => setFormData({ ...formData, coinId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a coin" />
                </SelectTrigger>
                <SelectContent>
                  {coins.map((coin) => (
                    <SelectItem key={coin.coin_id} value={coin.coin_id}>
                      {coin.name} ({coin.basket})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="investmentAmount">Investment Amount ($)</Label>
              <Input
                id="investmentAmount"
                type="number"
                value={formData.investmentAmount}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  investmentAmount: parseFloat(e.target.value) || 0 
                })}
                min="1"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalPortfolio">
                Total Portfolio Value ($)
                {selectedPortfolio && <span className="text-sm text-muted-foreground ml-1">(from selected portfolio)</span>}
              </Label>
              <Input
                id="totalPortfolio"
                type="number"
                value={formData.totalPortfolio}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  totalPortfolio: parseFloat(e.target.value) || 0 
                })}
                min="1"
                step="0.01"
                disabled={!!selectedPortfolio}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="investmentHorizon">Investment Horizon (Years)</Label>
              <Input
                id="investmentHorizon"
                type="number"
                value={formData.investmentHorizon}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  investmentHorizon: parseInt(e.target.value) || 2 
                })}
                min="1"
                max="10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedPrice">Expected Future Price ($) - Optional</Label>
              <Input
                id="expectedPrice"
                type="number"
                value={formData.expectedPrice || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  expectedPrice: e.target.value ? parseFloat(e.target.value) : undefined 
                })}
                placeholder="Auto-calculated if empty"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stakingYield">Expected Staking Yield (%) - Optional</Label>
              <Input
                id="stakingYield"
                type="number"
                value={formData.stakingYield || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  stakingYield: e.target.value ? parseFloat(e.target.value) : undefined 
                })}
                placeholder={selectedCoin?.staking_yield ? `Default: ${selectedCoin.staking_yield}%` : "0%"}
                step="0.01"
                min="0"
                max="50"
              />
            </div>
          </div>

          {selectedCoin && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Selected Coin Info</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Current Price: ${selectedCoin.current_price.toLocaleString()}</div>
                <div>Basket: {selectedCoin.basket}</div>
                <div>36M CAGR: {selectedCoin.cagr_36m || 'N/A'}%</div>
                <div>Volatility: {selectedCoin.volatility || 'N/A'}%</div>
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={!formData.coinId || loading}
          >
            {loading ? 'Analyzing...' : 'Analyze Investment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

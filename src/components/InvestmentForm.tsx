
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import type { CoinData, InvestmentInputs } from '@/types/investment';

interface InvestmentFormProps {
  onSubmit: (inputs: InvestmentInputs) => void;
  loading: boolean;
}

export const InvestmentForm: React.FC<InvestmentFormProps> = ({ onSubmit, loading }) => {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [formData, setFormData] = useState<InvestmentInputs>({
    coinId: '',
    investmentAmount: 100,
    totalPortfolio: 10000,
    investmentHorizon: 2,
    expectedPrice: undefined,
    stakingYield: undefined
  });

  useEffect(() => {
    fetchCoins();
  }, []);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.coinId) {
      onSubmit(formData);
    }
  };

  const selectedCoin = coins.find(coin => coin.coin_id === formData.coinId);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Cryptocurrency Investment Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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
              <Label htmlFor="totalPortfolio">Total Portfolio Value ($)</Label>
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

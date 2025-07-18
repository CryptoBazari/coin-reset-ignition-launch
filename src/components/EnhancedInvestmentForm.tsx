import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { enhancedInvestmentDataService } from '@/services/enhancedInvestmentDataService';
import { Activity, TrendingUp, Shield, Clock } from 'lucide-react';
import type { InvestmentInputs } from '@/types/investment';

interface EnhancedInvestmentFormProps {
  onSubmit: (inputs: InvestmentInputs) => void;
  loading: boolean;
}

export const EnhancedInvestmentForm: React.FC<EnhancedInvestmentFormProps> = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState<InvestmentInputs>({
    coinId: 'BTC',
    investmentAmount: 10000,
    totalPortfolio: 100000,
    investmentHorizon: 2
  });
  
  const [coinData, setCoinData] = useState<any>(null);
  const [glassnodeStatus, setGlassnodeStatus] = useState<'connecting' | 'connected' | 'limited' | 'disconnected'>('connecting');
  const [livePrice, setLivePrice] = useState<number | null>(null);
  
  const coins = [
    { id: 'BTC', name: 'Bitcoin', symbol: 'BTC' },
    { id: 'ETH', name: 'Ethereum', symbol: 'ETH' },
    { id: 'SOL', name: 'Solana', symbol: 'SOL' },
    { id: 'ADA', name: 'Cardano', symbol: 'ADA' }
  ];

  useEffect(() => {
    loadCoinData(formData.coinId);
  }, [formData.coinId]);

  const loadCoinData = async (coinId: string) => {
    setGlassnodeStatus('connecting');
    try {
      const data = await enhancedInvestmentDataService.fetchEnhancedCoinData(coinId);
      setCoinData(data);
      setLivePrice(data.current_price);
      
      // Check Glass Node data quality
      const hasLiveMetrics = data.liveMetrics.avivRatio !== 1.0 || data.onChainData.activeAddresses > 0;
      setGlassnodeStatus(hasLiveMetrics ? 'connected' : 'limited');
    } catch (error) {
      console.error('Failed to load coin data:', error);
      setGlassnodeStatus('disconnected');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof InvestmentInputs, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getStatusColor = () => {
    switch (glassnodeStatus) {
      case 'connected': return 'default';
      case 'limited': return 'secondary'; 
      case 'disconnected': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusText = () => {
    switch (glassnodeStatus) {
      case 'connected': return '🟢 Live Glass Node Data';
      case 'limited': return '🟡 Limited Data Available';
      case 'disconnected': return '🔴 Basic Data Only';
      default: return '⏳ Connecting...';
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Enhanced Investment Analysis</span>
          <Badge variant={getStatusColor()}>
            {getStatusText()}
          </Badge>
        </CardTitle>
        
        {/* Real-time data indicators */}
        {coinData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Live Price</p>
                <p className="font-semibold">${livePrice?.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <Activity className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">AVIV Ratio</p>
                <p className="font-semibold">{coinData.liveMetrics.avivRatio.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <Shield className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">Vaulted Supply</p>
                <p className="font-semibold">{coinData.liveMetrics.vaultedSupply.toFixed(1)}%</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">Network Growth</p>
                <p className="font-semibold">{coinData.onChainData.networkGrowth.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coin">Cryptocurrency</Label>
              <Select value={formData.coinId} onValueChange={(value) => handleInputChange('coinId', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {coins.map(coin => (
                    <SelectItem key={coin.id} value={coin.id}>
                      {coin.name} ({coin.symbol})
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
                onChange={(e) => handleInputChange('investmentAmount', Number(e.target.value))}
                min="100"
                step="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalPortfolio">Total Portfolio Value ($)</Label>
              <Input
                id="totalPortfolio"
                type="number"
                value={formData.totalPortfolio}
                onChange={(e) => handleInputChange('totalPortfolio', Number(e.target.value))}
                min="1000"
                step="1000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="investmentHorizon">Investment Horizon (Years)</Label>
              <Select 
                value={formData.investmentHorizon?.toString() || '2'} 
                onValueChange={(value) => handleInputChange('investmentHorizon', Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Year</SelectItem>
                  <SelectItem value="2">2 Years</SelectItem>
                  <SelectItem value="3">3 Years</SelectItem>
                  <SelectItem value="5">5 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || glassnodeStatus === 'connecting'}
          >
            {loading ? 'Analyzing...' : 'Analyze Investment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
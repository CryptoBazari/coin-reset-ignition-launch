
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Calculator, Globe, AlertCircle } from 'lucide-react';
import CoinSelector from '@/components/virtual-portfolio/CoinSelector';
import { symbolMappingService } from '@/services/symbolMappingService';
import type { CoinMarketCapCoin } from '@/services/coinMarketCapService';

const formSchema = z.object({
  coinId: z.string().min(1, 'Please select a cryptocurrency'),
  investmentAmount: z.number().min(100, 'Minimum investment is $100'),
  timeHorizon: z.number().min(1, 'Minimum time horizon is 1 year').max(10, 'Maximum time horizon is 10 years'),
});

interface HybridInvestmentFormProps {
  onSubmit: (data: {
    coinId: string;
    symbol: string;
    investmentAmount: number;
    timeHorizon: number;
    hasGlassNodeData: boolean;
  }) => void;
  loading: boolean;
  onCoinSelect?: (coinData: CoinMarketCapCoin) => void;
}

export const HybridInvestmentForm: React.FC<HybridInvestmentFormProps> = ({
  onSubmit,
  loading,
  onCoinSelect
}) => {
  const [selectedCoin, setSelectedCoin] = useState<CoinMarketCapCoin | null>(null);
  const [selectedCoinId, setSelectedCoinId] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<{
    coinId: string;
    investmentAmount: number;
    timeHorizon: number;
  }>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      coinId: '',
      investmentAmount: 10000,
      timeHorizon: 3,
    }
  });

  const handleCoinSelect = (coinId: string, coinData: CoinMarketCapCoin) => {
    console.log('🪙 Selected coin for hybrid analysis:', coinId, coinData);
    setSelectedCoin(coinData);
    setSelectedCoinId(coinId);
    setValue('coinId', coinId);
    
    // Call the parent callback if provided
    if (onCoinSelect) {
      onCoinSelect(coinData);
    }
  };

  const handleFormSubmit = (data: {
    coinId: string;
    investmentAmount: number;
    timeHorizon: number;
  }) => {
    if (!selectedCoin) return;
    
    const hasGlassNodeData = symbolMappingService.isGlassNodeSupported(selectedCoinId);
    
    console.log('📊 Submitting hybrid analysis:', {
      ...data,
      symbol: selectedCoin.symbol,
      hasGlassNodeData
    });
    
    onSubmit({
      coinId: selectedCoinId,
      symbol: selectedCoin.symbol,
      investmentAmount: data.investmentAmount,
      timeHorizon: data.timeHorizon,
      hasGlassNodeData
    });
  };

  const watchedValues = watch();
  const hasGlassNodeSupport = selectedCoinId ? symbolMappingService.isGlassNodeSupported(selectedCoinId) : false;

  return (
    <Card className="animate-fade-in hover-scale">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-t-lg">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calculator className="h-6 w-6 text-primary" />
          </div>
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-bold">
            Real-Time Investment Analysis
          </span>
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
            LIVE DATA
          </Badge>
        </CardTitle>
        <CardDescription className="text-muted-foreground/80">
          Professional cryptocurrency investment analysis with real-time market data
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Main Input Row - Horizontal Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cryptocurrency Selection */}
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="coinId" className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-blue-600" />
                Cryptocurrency
              </Label>
              <CoinSelector
                value={selectedCoinId}
                onValueChange={handleCoinSelect}
                placeholder="Search cryptocurrency..."
              />
              {errors.coinId && (
                <p className="text-xs text-red-600">{errors.coinId.message}</p>
              )}
            </div>

            {/* Investment Amount */}
            <div className="space-y-2">
              <Label htmlFor="investmentAmount" className="text-sm">Investment Amount ($)</Label>
              <Input
                id="investmentAmount"
                type="number"
                step="100"
                {...register('investmentAmount', { valueAsNumber: true })}
                placeholder="10000"
                className="h-10"
              />
              {errors.investmentAmount && (
                <p className="text-xs text-red-600">{errors.investmentAmount.message}</p>
              )}
            </div>

            {/* Time Horizon */}
            <div className="space-y-2">
              <Label htmlFor="timeHorizon" className="text-sm">Time Horizon (Years)</Label>
              <Input
                id="timeHorizon"
                type="number"
                min="1"
                max="10"
                {...register('timeHorizon', { valueAsNumber: true })}
                placeholder="3"
                className="h-10"
              />
              {errors.timeHorizon && (
                <p className="text-xs text-red-600">{errors.timeHorizon.message}</p>
              )}
            </div>
          </div>

          {/* Selected Coin Info - Compact */}
          {selectedCoin && (
            <div className={`p-3 rounded-lg border ${
              hasGlassNodeSupport 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  {hasGlassNodeSupport ? (
                    <Shield className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className="font-medium">{selectedCoin.name} ({selectedCoin.symbol})</span>
                  <Badge variant="outline" className={`text-xs ${
                    hasGlassNodeSupport 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {hasGlassNodeSupport ? 'Full Analysis' : 'Basic Analysis'}
                  </Badge>
                </div>
                <Badge variant="outline" className="text-xs">
                  {hasGlassNodeSupport ? 'On-chain + Price Data' : 'Price Data Only'}
                </Badge>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              type="submit"
              size="lg"
              disabled={loading || !selectedCoin}
              className="px-8"
            >
              {loading ? 'Analyzing...' : 'Run Analysis'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

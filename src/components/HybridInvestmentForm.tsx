
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Hybrid Crypto Investment Analysis
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            REAL API DATA
          </Badge>
        </CardTitle>
        <CardDescription>
          Select any cryptocurrency and get real-time analysis using live API data
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Cryptocurrency Selection */}
          <div className="space-y-2">
            <Label htmlFor="coinId" className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-600" />
              Cryptocurrency
              <Badge variant="outline" className="text-xs">
                1000+ Coins Available
              </Badge>
            </Label>
            <CoinSelector
              value={selectedCoinId}
              onValueChange={handleCoinSelect}
              placeholder="Search any cryptocurrency (e.g., Bitcoin, Ethereum, Solana)"
            />
            {errors.coinId && (
              <p className="text-sm text-red-600">{errors.coinId.message}</p>
            )}
            
            {selectedCoin && (
              <div className={`mt-2 p-3 rounded-lg border ${
                hasGlassNodeSupport 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
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
                    {hasGlassNodeSupport ? 'Full Glassnode Analysis' : 'Basic Price Analysis'}
                  </Badge>
                </div>
                <p className={`text-xs mt-1 ${
                  hasGlassNodeSupport ? 'text-green-700' : 'text-yellow-700'
                }`}>
                  {hasGlassNodeSupport 
                    ? 'Premium on-chain metrics available: AVIV ratio, supply metrics, volatility analysis'
                    : 'Analysis based on price data only - on-chain metrics not available'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Investment Amount */}
          <div className="space-y-2">
            <Label htmlFor="investmentAmount">Investment Amount ($)</Label>
            <Input
              id="investmentAmount"
              type="number"
              step="100"
              {...register('investmentAmount', { valueAsNumber: true })}
              placeholder="10000"
            />
            {errors.investmentAmount && (
              <p className="text-sm text-red-600">{errors.investmentAmount.message}</p>
            )}
          </div>

          {/* Time Horizon */}
          <div className="space-y-2">
            <Label htmlFor="timeHorizon">Time Horizon (Years)</Label>
            <Input
              id="timeHorizon"
              type="number"
              min="1"
              max="10"
              {...register('timeHorizon', { valueAsNumber: true })}
              placeholder="3"
            />
            {errors.timeHorizon && (
              <p className="text-sm text-red-600">{errors.timeHorizon.message}</p>
            )}
          </div>

          {/* Analysis Preview */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Analysis Preview</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• Investment: ${watchedValues.investmentAmount?.toLocaleString() || '10,000'}</p>
              <p>• Time Horizon: {watchedValues.timeHorizon || 3} years</p>
              <p>• Cryptocurrency: {selectedCoin?.name || 'None selected'}</p>
              <p>• Data Source: {hasGlassNodeSupport ? 'Glassnode + CoinMarketCap' : 'CoinMarketCap only'}</p>
              <p>• Analysis Type: {hasGlassNodeSupport ? 'Comprehensive' : 'Basic'}</p>
            </div>
          </div>

          {/* Data Quality Notice */}
          <div className="p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-gray-600 mt-0.5" />
              <div className="text-xs text-gray-600">
                <p className="font-medium">Real Data Only Policy:</p>
                <p>• All analysis uses live API data - no mock or estimated data</p>
                <p>• Clear indication when metrics are unavailable</p>
                <p>• Transparent data source labeling</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !selectedCoin}
          >
            {loading ? 'Analyzing...' : 'Run Real-Time Analysis'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

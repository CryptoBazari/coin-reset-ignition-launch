import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Shield, Calculator, Globe, AlertCircle, TrendingUp, Bitcoin, Zap } from 'lucide-react';
import CoinSelector from '@/components/virtual-portfolio/CoinSelector';
import { symbolMappingService } from '@/services/symbolMappingService';
import type { CoinMarketCapCoin } from '@/services/coinMarketCapService';

const formSchema = z.object({
  coinId: z.string().min(1, 'Please select a cryptocurrency'),
  investmentAmount: z.number().min(100, 'Minimum investment is $100').max(1000000, 'Maximum investment is $1,000,000'),
  projectionPeriods: z.number().min(1, 'Minimum projection period is 1 year').max(10, 'Maximum projection period is 10 years'),
  stakingYield: z.number().min(0, 'Staking yield cannot be negative').max(50, 'Maximum staking yield is 50%'),
  riskFreeRate: z.number().min(0.5, 'Minimum risk-free rate is 0.5%').max(10, 'Maximum risk-free rate is 10%'),
});

interface EnhancedHybridInvestmentFormProps {
  onSubmit: (data: {
    coinId: string;
    symbol: string;
    name: string;
    investmentAmount: number;
    projectionPeriods: number;
    stakingYield: number;
    riskFreeRate: number;
    hasGlassNodeData: boolean;
    isStakeable: boolean;
  }) => void;
  loading: boolean;
}

// List of stakeable cryptocurrencies
const STAKEABLE_COINS = ['eth', 'ada', 'sol', 'dot', 'atom', 'near', 'algo', 'tezos', 'avax'];

export const EnhancedHybridInvestmentForm: React.FC<EnhancedHybridInvestmentFormProps> = ({
  onSubmit,
  loading
}) => {
  const [selectedCoin, setSelectedCoin] = useState<CoinMarketCapCoin | null>(null);
  const [selectedCoinId, setSelectedCoinId] = useState<string>('');
  const [isStakeable, setIsStakeable] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<{
    coinId: string;
    investmentAmount: number;
    projectionPeriods: number;
    stakingYield: number;
    riskFreeRate: number;
  }>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      coinId: '',
      investmentAmount: 10000,
      projectionPeriods: 5,
      stakingYield: 0,
      riskFreeRate: 3,
    }
  });

  const watchedValues = watch();
  const hasGlassNodeSupport = selectedCoinId ? symbolMappingService.isGlassNodeSupported(selectedCoinId) : false;
  const isBitcoin = selectedCoin?.symbol?.toLowerCase() === 'btc';

  const handleCoinSelect = (coinId: string, coinData: CoinMarketCapCoin) => {
    console.log('🪙 Selected coin for enhanced analysis:', coinId, coinData);
    setSelectedCoin(coinData);
    setSelectedCoinId(coinId);
    setValue('coinId', coinId);
    
    // Check if coin is stakeable
    const isStakeableCoin = STAKEABLE_COINS.includes(coinData.symbol.toLowerCase());
    setIsStakeable(isStakeableCoin);
    
    // Reset staking yield if coin is not stakeable
    if (!isStakeableCoin) {
      setValue('stakingYield', 0);
    }
  };

  const handleFormSubmit = (data: {
    coinId: string;
    investmentAmount: number;
    projectionPeriods: number;
    stakingYield: number;
    riskFreeRate: number;
  }) => {
    if (!selectedCoin) return;
    
    const hasGlassNodeData = symbolMappingService.isGlassNodeSupported(selectedCoinId);
    
    console.log('📊 Submitting enhanced hybrid analysis:', {
      ...data,
      symbol: selectedCoin.symbol,
      name: selectedCoin.name,
      hasGlassNodeData,
      isStakeable
    });
    
    onSubmit({
      coinId: selectedCoinId,
      symbol: selectedCoin.symbol,
      name: selectedCoin.name,
      investmentAmount: data.investmentAmount,
      projectionPeriods: data.projectionPeriods,
      stakingYield: isStakeable ? data.stakingYield : 0,
      riskFreeRate: data.riskFreeRate,
      hasGlassNodeData,
      isStakeable
    });
  };

  // Calculate expected cash flows for preview
  const expectedAnnualCashFlow = watchedValues.investmentAmount * 0.2; // 20% base flow
  const stakingIncome = isStakeable ? (watchedValues.stakingYield / 100) * watchedValues.investmentAmount : 0;
  const totalAnnualCashFlow = expectedAnnualCashFlow + stakingIncome;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Enhanced Crypto Investment Analysis
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            REAL GLASSNODE API
          </Badge>
        </CardTitle>
        <CardDescription>
          Advanced NPV calculations with real Glassnode data, benchmark analysis, and comprehensive risk assessment
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
                isBitcoin 
                  ? 'bg-orange-50 border-orange-200'
                  : hasGlassNodeSupport 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center gap-2 text-sm">
                  {isBitcoin ? (
                    <Bitcoin className="h-4 w-4 text-orange-600" />
                  ) : hasGlassNodeSupport ? (
                    <Shield className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className="font-medium">{selectedCoin.name} ({selectedCoin.symbol})</span>
                  <Badge variant="outline" className={`text-xs ${
                    isBitcoin 
                      ? 'bg-orange-100 text-orange-800'
                      : hasGlassNodeSupport 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {isBitcoin ? 'Full Cointime + S&P 500 Benchmark' : hasGlassNodeSupport ? 'Glassnode + Bitcoin Benchmark' : 'Basic Analysis + Bitcoin Benchmark'}
                  </Badge>
                  {isStakeable && (
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 text-xs">
                      STAKEABLE
                    </Badge>
                  )}
                </div>
                <p className={`text-xs mt-1 ${
                  isBitcoin 
                    ? 'text-orange-700'
                    : hasGlassNodeSupport ? 'text-green-700' : 'text-yellow-700'
                }`}>
                  {isBitcoin 
                    ? 'Bitcoin analysis includes AVIV ratio, Active Supply, Vaulted Supply, and S&P 500 benchmark'
                    : hasGlassNodeSupport 
                      ? 'Comprehensive Glassnode metrics available with Bitcoin as benchmark'
                      : 'Analysis based on price data only with Bitcoin as benchmark'
                  }
                  {isStakeable && ' • Staking rewards can be included in cash flows'}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Investment Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Investment Amount */}
            <div className="space-y-2">
              <Label htmlFor="investmentAmount">Initial Investment (C₀)</Label>
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
              <p className="text-xs text-gray-600">Minimum: $100 • Maximum: $1,000,000</p>
            </div>

            {/* Projection Periods */}
            <div className="space-y-2">
              <Label htmlFor="projectionPeriods">Projection Period (n years)</Label>
              <Input
                id="projectionPeriods"
                type="number"
                min="1"
                max="10"
                {...register('projectionPeriods', { valueAsNumber: true })}
                placeholder="5"
              />
              {errors.projectionPeriods && (
                <p className="text-sm text-red-600">{errors.projectionPeriods.message}</p>
              )}
              <p className="text-xs text-gray-600">1-10 years for NPV calculations</p>
            </div>
          </div>

          {/* Advanced Parameters */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Advanced Parameters</h4>
            
            {/* Risk-Free Rate Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="riskFreeRate">Risk-Free Rate (%)</Label>
                <span className="text-sm font-medium text-blue-600">
                  {watchedValues.riskFreeRate}%
                </span>
              </div>
              <Slider
                value={[watchedValues.riskFreeRate]}
                onValueChange={(values) => setValue('riskFreeRate', values[0])}
                min={0.5}
                max={8}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-gray-600">
                Used for discount rate calculation • Typical range: 2-4%
              </p>
            </div>

            {/* Staking Yield (conditional) */}
            {isStakeable && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="stakingYield" className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-purple-600" />
                    Staking Yield (%)
                  </Label>
                  <span className="text-sm font-medium text-purple-600">
                    {watchedValues.stakingYield}%
                  </span>
                </div>
                <Slider
                  value={[watchedValues.stakingYield]}
                  onValueChange={(values) => setValue('stakingYield', values[0])}
                  min={0}
                  max={20}
                  step={0.5}
                  className="w-full"
                />
                <p className="text-xs text-gray-600">
                  Annual staking rewards • Added to cash flows if provided
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Analysis Preview */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analysis Preview
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div className="space-y-2">
                <p>• <strong>Investment:</strong> ${watchedValues.investmentAmount?.toLocaleString() || '10,000'}</p>
                <p>• <strong>Time Horizon:</strong> {watchedValues.projectionPeriods || 5} years</p>
                <p>• <strong>Risk-Free Rate:</strong> {watchedValues.riskFreeRate || 3}%</p>
                <p>• <strong>Cryptocurrency:</strong> {selectedCoin?.name || 'None selected'}</p>
              </div>
              <div className="space-y-2">
                <p>• <strong>Data Source:</strong> {isBitcoin ? 'Glassnode + S&P 500' : hasGlassNodeSupport ? 'Glassnode + Bitcoin' : 'CoinMarketCap + Bitcoin'}</p>
                <p>• <strong>Analysis Type:</strong> {isBitcoin ? 'Full Cointime' : 'Standard Financial'}</p>
                {isStakeable && (
                  <p>• <strong>Staking Income:</strong> ${stakingIncome.toLocaleString()}/year</p>
                )}
                <p>• <strong>Expected Cash Flow:</strong> ${totalAnnualCashFlow.toLocaleString()}/year</p>
              </div>
            </div>
          </div>

          {/* Methodology Notice */}
          <div className="p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-gray-600 mt-0.5" />
              <div className="text-xs text-gray-600">
                <p className="font-medium">Enhanced NPV Methodology:</p>
                <p>• Projected prices calculated using real historical CAGR from Glassnode</p>
                <p>• Cash flows: Base flow (20% of investment) + optional staking rewards</p>
                <p>• Discount rate: Risk-free rate + Beta × Market premium</p>
                <p>• Bitcoin benchmark: S&P 500 • Altcoin benchmark: Bitcoin</p>
                <p>• MVRV Z-Score adjustments for market overvaluation risk</p>
                <p>• Stress testing with historical drawdown scenarios</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !selectedCoin}
          >
            {loading ? 'Calculating NPV with Real Data...' : 'Run Enhanced NPV Analysis'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
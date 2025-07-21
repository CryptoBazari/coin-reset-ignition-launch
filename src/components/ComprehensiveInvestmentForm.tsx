
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, Calculator, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import EnhancedCoinSelector from '@/components/EnhancedCoinSelector';
import type { AnalysisInputs } from '@/services/comprehensiveGlassNodeAnalyzer';
import type { GlassNodeAsset } from '@/services/glassNodeAssetService';

const formSchema = z.object({
  coinSymbol: z.string().min(1, 'Please select a cryptocurrency'),
  investmentAmount: z.number().min(100, 'Minimum investment is $100'),
  timeHorizon: z.number().min(1, 'Minimum time horizon is 1 year').max(10, 'Maximum time horizon is 10 years'),
  region: z.enum(['US', 'EU', 'ASIA', 'GLOBAL']),
  includeInflation: z.boolean(),
  includeTransactionCosts: z.boolean(),
  riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']),
});

interface ComprehensiveInvestmentFormProps {
  onSubmit: (data: AnalysisInputs) => void;
  loading: boolean;
}

export const ComprehensiveInvestmentForm: React.FC<ComprehensiveInvestmentFormProps> = ({
  onSubmit,
  loading
}) => {
  const [selectedCoin, setSelectedCoin] = useState<GlassNodeAsset | null>(null);
  const [selectedCoinId, setSelectedCoinId] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<AnalysisInputs>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      coinSymbol: '',
      investmentAmount: 10000,
      timeHorizon: 3,
      region: 'US',
      includeInflation: true,
      includeTransactionCosts: true,
      riskTolerance: 'moderate'
    }
  });

  const handleCoinSelect = (coinId: string, coinData: GlassNodeAsset) => {
    console.log('🪙 Selected coin for analysis:', coinId, coinData);
    setSelectedCoin(coinData);
    setSelectedCoinId(coinId);
    setValue('coinSymbol', coinData.symbol);
  };

  const handleFormSubmit = (data: AnalysisInputs) => {
    console.log('📊 Submitting comprehensive analysis:', data);
    console.log('🪙 Selected coin data:', selectedCoin);
    
    // Pass the actual coinId (like 'bitcoin') instead of symbol (like 'BTC')
    const analysisData = {
      ...data,
      coinSymbol: selectedCoinId || data.coinSymbol, // Use coinId for backend processing
      coinData: selectedCoin // Include full coin data for reference
    };
    
    onSubmit(analysisData);
  };

  const watchedValues = watch();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Investment Analysis Parameters
          <Badge variant="outline" className="bg-green-100 text-green-800">
            GLASSNODE DATA
          </Badge>
        </CardTitle>
        <CardDescription>
          Configure your investment analysis with real Glassnode API data
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Cryptocurrency Selection */}
          <div className="space-y-2">
            <Label htmlFor="coinSymbol" className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              Cryptocurrency
              <Badge variant="outline" className="text-xs">
                Glassnode Supported Only
              </Badge>
            </Label>
            <EnhancedCoinSelector
              value={selectedCoinId}
              onValueChange={handleCoinSelect}
              placeholder="Select a Glassnode-supported cryptocurrency"
              showOnlyGlassNodeSupported={true}
            />
            {errors.coinSymbol && (
              <p className="text-sm text-red-600">{errors.coinSymbol.message}</p>
            )}
            {selectedCoin && (
              <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{selectedCoin.name} ({selectedCoin.symbol})</span>
                  <Badge variant="outline" className="text-xs">
                    {selectedCoin.glass_node_data_quality}/10 Data Quality
                  </Badge>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  Premium Glassnode metrics available • Last update: {selectedCoin.last_glass_node_update ? new Date(selectedCoin.last_glass_node_update).toLocaleDateString() : 'Recent'}
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

          {/* Region */}
          <div className="space-y-2">
            <Label htmlFor="region" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Region
            </Label>
            <Select onValueChange={(value) => setValue('region', value as any)} defaultValue="US">
              <SelectTrigger>
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="EU">European Union</SelectItem>
                <SelectItem value="ASIA">Asia Pacific</SelectItem>
                <SelectItem value="GLOBAL">Global</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Risk Tolerance */}
          <div className="space-y-2">
            <Label htmlFor="riskTolerance">Risk Tolerance</Label>
            <Select onValueChange={(value) => setValue('riskTolerance', value as any)} defaultValue="moderate">
              <SelectTrigger>
                <SelectValue placeholder="Select risk tolerance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conservative">Conservative</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="aggressive">Aggressive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeInflation"
                {...register('includeInflation')}
                defaultChecked={true}
              />
              <Label htmlFor="includeInflation" className="text-sm">
                Include inflation adjustment (recommended)
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeTransactionCosts"
                {...register('includeTransactionCosts')}
                defaultChecked={true}
              />
              <Label htmlFor="includeTransactionCosts" className="text-sm">
                Include transaction costs
              </Label>
            </div>
          </div>

          {/* Analysis Summary */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Analysis Summary</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• Investment: ${watchedValues.investmentAmount?.toLocaleString() || '10,000'}</p>
              <p>• Time Horizon: {watchedValues.timeHorizon || 3} years</p>
              <p>• Region: {watchedValues.region || 'US'}</p>
              <p>• Risk Profile: {watchedValues.riskTolerance || 'Moderate'}</p>
              <p>• Cryptocurrency: {selectedCoin?.name || 'None selected'}</p>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !selectedCoin}
          >
            {loading ? 'Analyzing...' : 'Run Comprehensive Analysis'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

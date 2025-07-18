
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, TrendingUp, Activity } from 'lucide-react';
import EnhancedCoinSelector from '@/components/EnhancedCoinSelector';
import { GlassNodeAsset } from '@/services/glassNodeAssetService';
import type { InvestmentInputs } from '@/types/investment';

interface InvestmentFormProps {
  onSubmit: (inputs: InvestmentInputs) => void;
  loading: boolean;
}

export const InvestmentForm: React.FC<InvestmentFormProps> = ({ onSubmit, loading }) => {
  const [selectedAsset, setSelectedAsset] = useState<GlassNodeAsset | null>(null);
  const [formData, setFormData] = useState<InvestmentInputs>({
    coinId: '',
    investmentAmount: 100,
    totalPortfolio: 10000,
    investmentHorizon: 2,
    expectedPrice: undefined,
    stakingYield: undefined
  });

  const handleAssetChange = (coinId: string, assetData: GlassNodeAsset) => {
    setSelectedAsset(assetData);
    setFormData({ 
      ...formData, 
      coinId,
      stakingYield: assetData.staking_yield || undefined
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.coinId) {
      onSubmit(formData);
    }
  };

  

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
              <EnhancedCoinSelector
                value={formData.coinId}
                onValueChange={handleAssetChange}
                placeholder="Choose a cryptocurrency"
                showOnlyGlassNodeSupported={false}
              />
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
                placeholder={selectedAsset?.staking_yield ? `Default: ${selectedAsset.staking_yield}%` : "0%"}
                step="0.01"
                min="0"
                max="50"
              />
            </div>
          </div>

          {selectedAsset && (
            <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">{selectedAsset.name}</h3>
                <div className="flex items-center gap-2">
                  {selectedAsset.glass_node_supported && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <Shield className="h-3 w-3 mr-1" />
                      Glass Node
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-gray-600">
                    {selectedAsset.basket}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="font-medium">Current Price</div>
                    <div className="text-lg font-bold text-blue-600">
                      ${selectedAsset.current_price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: selectedAsset.current_price < 1 ? 6 : 2
                      })}
                    </div>
                  </div>
                </div>

                {selectedAsset.cagr_36m && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="font-medium">36M CAGR</div>
                      <div className="text-lg font-bold text-green-600">
                        {selectedAsset.cagr_36m.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )}

                {selectedAsset.volatility && (
                  <div>
                    <div className="font-medium text-gray-600">Volatility</div>
                    <div className="text-lg font-bold text-orange-600">
                      {selectedAsset.volatility.toFixed(1)}%
                    </div>
                  </div>
                )}

                {selectedAsset.staking_yield && (
                  <div>
                    <div className="font-medium text-gray-600">Staking Yield</div>
                    <div className="text-lg font-bold text-purple-600">
                      {selectedAsset.staking_yield.toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>

              {selectedAsset.glass_node_supported && selectedAsset.last_glass_node_update && (
                <div className="mt-3 text-xs text-gray-500">
                  Last Glass Node update: {new Date(selectedAsset.last_glass_node_update).toLocaleDateString()}
                </div>
              )}
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

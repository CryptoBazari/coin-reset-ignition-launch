
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { RiskAnalysisCard } from './analysis/RiskAnalysisCard';
import { PriceHistoryCard } from './analysis/PriceHistoryCard';

interface HybridAnalysisResultsProps {
  result: {
    npv: number;
    irr: number;
    roi: number;
    cagr: number;
    beta: number;
    discountRate: number;
    projectedPrices: number[];
    cashFlows: number[];
    stressTestedNPV: number;
    marketPremium: number;
    monthlyChanges: number[];
    isStakeable: boolean;
    benchmark: string;
    riskAdjustments: {
      mvrvAdjustment: number;
      liquidityAdjustment: number;
      drawdownRisk: number;
    };
    priceHistory: Array<{ date: string; price: number }>;
  };
  formData: {
    coinSymbol: string;
    initialInvestment: number;
    projectionYears: number;
    stakingYield: number;
    riskFreeRate: number;
  };
  bitcoinContext?: {
    cointime: {
      aviv_ratio: number;
      market_state: string;
      confidence: number;
    };
  };
}

export const HybridAnalysisResults: React.FC<HybridAnalysisResultsProps> = ({
  result,
  formData,
  bitcoinContext
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getRecommendation = () => {
    if (result.npv > formData.initialInvestment * 0.5) {
      return { text: 'STRONG BUY', color: 'bg-green-500', icon: TrendingUp };
    } else if (result.npv > 0) {
      return { text: 'BUY', color: 'bg-green-400', icon: TrendingUp };
    } else if (result.npv > -formData.initialInvestment * 0.2) {
      return { text: 'HOLD', color: 'bg-yellow-500', icon: AlertTriangle };
    } else {
      return { text: 'SELL', color: 'bg-red-500', icon: TrendingDown };
    }
  };

  const recommendation = getRecommendation();
  const RecommendationIcon = recommendation.icon;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              {formData.coinSymbol.toUpperCase()} Investment Analysis
            </CardTitle>
            <Badge className={`${recommendation.color} text-white`}>
              <RecommendationIcon className="w-4 h-4 mr-1" />
              {recommendation.text}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(result.npv)}
              </div>
              <div className="text-sm text-muted-foreground">Net Present Value</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatPercentage(result.irr)}
              </div>
              <div className="text-sm text-muted-foreground">Internal Rate of Return</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatPercentage(result.roi)}
              </div>
              <div className="text-sm text-muted-foreground">Return on Investment</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatPercentage(result.cagr)}
              </div>
              <div className="text-sm text-muted-foreground">CAGR</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Analysis Card */}
      <RiskAnalysisCard 
        metrics={{
          beta: result.beta,
          standardDeviation: result.monthlyChanges.length > 0 
            ? Math.sqrt(result.monthlyChanges.reduce((acc, val) => acc + val * val, 0) / result.monthlyChanges.length) * Math.sqrt(12) * 100
            : 0,
          sharpeRatio: (result.cagr - formData.riskFreeRate) / (result.monthlyChanges.length > 0 
            ? Math.sqrt(result.monthlyChanges.reduce((acc, val) => acc + val * val, 0) / result.monthlyChanges.length) * Math.sqrt(12) * 100
            : 1),
          riskFactor: result.beta > 1.5 ? 4 : result.beta > 1.2 ? 3 : 2,
          betaConfidence: 'high',
          dataQuality: 'calculated'
        }}
        coinBasket={formData.coinSymbol.toUpperCase()}
      />

      {/* Price History Card */}
      <PriceHistoryCard priceHistory={result.priceHistory} />

      {/* Bitcoin Context Card */}
      {formData.coinSymbol.toLowerCase() !== 'btc' && bitcoinContext && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="mr-2">₿</span>
              Bitcoin Market Context
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {bitcoinContext.cointime.aviv_ratio.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">AVIV Ratio</div>
              </div>
              <div className="text-center">
                <Badge variant={bitcoinContext.cointime.market_state === 'accumulation' ? 'default' : 'secondary'}>
                  {bitcoinContext.cointime.market_state.toUpperCase()}
                </Badge>
                <div className="text-sm text-muted-foreground mt-1">Market State</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-medium">
                  {bitcoinContext.cointime.confidence}%
                </div>
                <div className="text-sm text-muted-foreground">Confidence</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

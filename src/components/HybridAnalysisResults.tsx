
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
    volatility?: number; // Real Glassnode volatility
    avivRatio?: number; // Real Bitcoin AVIV ratio
    standardDeviation?: number; // Calculated from historical prices
    dataQuality?: {
      volatilityFromAPI: boolean;
      avivFromAPI: boolean;
      priceDataPoints: number;
    };
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

  // Use REAL volatility from Glassnode API if available
  const realVolatility = result.volatility || 0;
  const realStandardDeviation = result.standardDeviation || 0;
  const realAvivRatio = result.avivRatio || bitcoinContext?.cointime?.aviv_ratio || 0;

  // Data quality indicators
  const DataQualityBadge = ({ isFromAPI, label }: { isFromAPI: boolean; label: string }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant={isFromAPI ? "default" : "secondary"} className="text-xs">
            {isFromAPI ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isFromAPI ? 'Real Glassnode API Data' : 'Calculated/Fallback Data'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

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

      {/* Real Glassnode Data Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="w-5 h-5 mr-2" />
            Real Glassnode API Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">
                {formatPercentage(realVolatility)}
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                {formData.coinSymbol.toUpperCase()} Volatility
              </div>
              <DataQualityBadge 
                isFromAPI={result.dataQuality?.volatilityFromAPI || false} 
                label="Volatility"
              />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {formatPercentage(realStandardDeviation)}
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                Standard Deviation
              </div>
              <Badge variant="default" className="text-xs">
                {result.dataQuality?.priceDataPoints || 0} Price Points
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {realAvivRatio.toFixed(3)}
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                Bitcoin AVIV Ratio
              </div>
              <DataQualityBadge 
                isFromAPI={result.dataQuality?.avivFromAPI || false} 
                label="AVIV"
              />
            </div>
          </div>
          
          {/* Data Quality Summary */}
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">
              <strong>Data Sources:</strong> Using {result.dataQuality?.volatilityFromAPI ? 'real' : 'fallback'} volatility data, 
              {result.dataQuality?.avivFromAPI ? ' real' : ' fallback'} AVIV data, 
              and {result.dataQuality?.priceDataPoints || 0} historical price points for calculations.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Analysis Card - Using Real Volatility */}
      <RiskAnalysisCard 
        metrics={{
          npv: result.npv,
          irr: result.irr,
          cagr: result.cagr,
          totalReturnCAGR: result.cagr,
          roi: result.roi,
          priceROI: result.roi,
          stakingROI: 0,
          riskAdjustedNPV: result.stressTestedNPV,
          expectedReturn: result.cagr,
          beta: result.beta,
          standardDeviation: realStandardDeviation, // Use real calculated standard deviation
          sharpeRatio: realStandardDeviation > 0 
            ? (result.cagr - formData.riskFreeRate) / realStandardDeviation 
            : 0,
          riskFactor: result.beta > 1.5 ? 4 : result.beta > 1.2 ? 3 : 2,
          betaConfidence: 'high',
          dataQuality: result.dataQuality?.volatilityFromAPI ? 'api' : 'calculated'
        }}
        coinBasket={formData.coinSymbol.toUpperCase()}
      />

      {/* Price History Card */}
      <PriceHistoryCard priceHistory={result.priceHistory} />

      {/* Bitcoin Context Card - Enhanced with Real AVIV */}
      {formData.coinSymbol.toLowerCase() !== 'btc' && (realAvivRatio > 0 || bitcoinContext) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="mr-2">₿</span>
              Bitcoin Market Context (Real Glassnode Data)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {realAvivRatio.toFixed(3)}
                </div>
                <div className="text-sm text-muted-foreground mb-2">AVIV Ratio</div>
                <DataQualityBadge 
                  isFromAPI={result.dataQuality?.avivFromAPI || false} 
                  label="Real API"
                />
              </div>
              <div className="text-center">
                <Badge variant={bitcoinContext?.cointime?.market_state === 'accumulation' ? 'default' : 'secondary'}>
                  {(bitcoinContext?.cointime?.market_state || 'NEUTRAL').toUpperCase()}
                </Badge>
                <div className="text-sm text-muted-foreground mt-1">Market State</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-medium">
                  {bitcoinContext?.cointime?.confidence || 50}%
                </div>
                <div className="text-sm text-muted-foreground">Confidence</div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">
                <strong>AVIV Analysis:</strong> {realAvivRatio < 0.7 ? 'Undervalued' : realAvivRatio > 2.5 ? 'Overvalued' : 'Fair Value'} 
                {result.dataQuality?.avivFromAPI && ' (Real Glassnode API Data)'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

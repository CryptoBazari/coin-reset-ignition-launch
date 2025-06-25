
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Target } from 'lucide-react';
import type { AnalysisResult } from '@/types/investment';

interface AnalysisResultsProps {
  result: AnalysisResult;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ result }) => {
  const { coin, metrics, recommendation, marketConditions, benchmarkComparison } = result;

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'Buy': return 'bg-green-500';
      case 'Buy Less': return 'bg-yellow-500';
      case 'Do Not Buy': return 'bg-orange-500';
      case 'Sell': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk <= 2) return 'text-green-600';
    if (risk <= 3) return 'text-yellow-600';
    if (risk <= 4) return 'text-orange-600';
    return 'text-red-600';
  };

  const getBitcoinStateColor = (state: string) => {
    switch (state) {
      case 'bullish': return 'text-green-600';
      case 'bearish': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Recommendation Card */}
      <Card className="border-2">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl mb-4">Investment Analysis for {coin.name}</CardTitle>
          <div className="flex justify-center items-center space-x-4">
            <Badge className={`${getRecommendationColor(recommendation.recommendation)} text-white px-6 py-2 text-lg`}>
              {recommendation.recommendation}
            </Badge>
            <div className="text-right">
              <div className="font-semibold">Risk Factor</div>
              <div className={`text-2xl font-bold ${getRiskColor(metrics.riskFactor)}`}>
                {metrics.riskFactor}/5
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Investment Evaluation
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Worth Investing:</span>
                  <Badge variant={recommendation.worthInvesting ? "default" : "destructive"}>
                    {recommendation.worthInvesting ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Good Timing:</span>
                  <Badge variant={recommendation.goodTiming ? "default" : "secondary"}>
                    {recommendation.goodTiming ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Appropriate Amount:</span>
                  <Badge variant={recommendation.appropriateAmount ? "default" : "destructive"}>
                    {recommendation.appropriateAmount ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Should Diversify:</span>
                  <Badge variant={recommendation.shouldDiversify ? "default" : "secondary"}>
                    {recommendation.shouldDiversify ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Market Conditions</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Bitcoin State:</span>
                  <span className={`font-semibold capitalize ${getBitcoinStateColor(marketConditions.bitcoinState)}`}>
                    {marketConditions.bitcoinState}
                  </span>
                </div>
                {marketConditions.avivRatio && (
                  <div className="flex justify-between">
                    <span>AVIV Ratio:</span>
                    <span className={marketConditions.avivRatio > 2.5 ? 'text-red-600' : marketConditions.avivRatio < 0.55 ? 'text-green-600' : 'text-yellow-600'}>
                      {marketConditions.avivRatio.toFixed(2)}
                    </span>
                  </div>
                )}
                {marketConditions.vaultedSupply && (
                  <div className="flex justify-between">
                    <span>Vaulted Supply:</span>
                    <span className={marketConditions.vaultedSupply > 70 ? 'text-green-600' : 'text-yellow-600'}>
                      {marketConditions.vaultedSupply.toFixed(1)}%
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Smart Money:</span>
                  <span className={marketConditions.smartMoneyActivity ? 'text-red-600' : 'text-green-600'}>
                    {marketConditions.smartMoneyActivity ? 'Selling' : 'Holding'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Fed Rate Impact:</span>
                  <span className={
                    marketConditions.fedRateChange > 0 ? 'text-red-600' : 
                    marketConditions.fedRateChange < 0 ? 'text-green-600' : 'text-gray-600'
                  }>
                    {marketConditions.fedRateChange > 0 ? 'Hawkish' : 
                     marketConditions.fedRateChange < 0 ? 'Dovish' : 'Neutral'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Financial Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">NPV</div>
              <div className={`text-xl font-bold ${metrics.npv > 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${metrics.npv.toFixed(2)}
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">IRR</div>
              <div className="text-xl font-bold text-blue-600">
                {metrics.irr.toFixed(2)}%
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">CAGR</div>
              <div className="text-xl font-bold text-purple-600">
                {metrics.cagr.toFixed(2)}%
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">ROI</div>
              <div className="text-xl font-bold text-indigo-600">
                {metrics.roi.toFixed(2)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benchmark Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Benchmark Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>{coin.name} (36M CAGR)</span>
              <span className="font-bold text-lg">{benchmarkComparison.coinPerformance.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>{benchmarkComparison.benchmarkName} (36M CAGR)</span>
              <span className="font-bold text-lg">{benchmarkComparison.benchmarkPerformance.toFixed(2)}%</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center font-semibold">
              <span>Outperformance</span>
              <span className={`text-lg ${
                benchmarkComparison.coinPerformance > benchmarkComparison.benchmarkPerformance 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {(benchmarkComparison.coinPerformance - benchmarkComparison.benchmarkPerformance).toFixed(2)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Analysis & Recommendations */}
      {recommendation.marketAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle>Market Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{recommendation.marketAnalysis}</p>
          </CardContent>
        </Card>
      )}

      {/* Conditions & Risks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recommendation.conditions && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-700">Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{recommendation.conditions}</p>
            </CardContent>
          </Card>
        )}

        {recommendation.risks && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-700 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Risks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{recommendation.risks}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Rebalancing Actions */}
      {recommendation.rebalancingActions && recommendation.rebalancingActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Rebalancing Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendation.rebalancingActions.map((action, index) => (
                <li key={index} className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700">{action}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Coin Details */}
      <Card>
        <CardHeader>
          <CardTitle>Coin Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Basket:</span>
              <div className="font-semibold">{coin.basket}</div>
            </div>
            <div>
              <span className="text-gray-600">Current Price:</span>
              <div className="font-semibold">${coin.current_price.toLocaleString()}</div>
            </div>
            {coin.market_cap && (
              <div>
                <span className="text-gray-600">Market Cap:</span>
                <div className="font-semibold">${(coin.market_cap / 1e9).toFixed(1)}B</div>
              </div>
            )}
            {coin.volatility && (
              <div>
                <span className="text-gray-600">Volatility:</span>
                <div className="font-semibold">{coin.volatility.toFixed(1)}%</div>
              </div>
            )}
            {coin.fundamentals_score && (
              <div>
                <span className="text-gray-600">Fundamentals:</span>
                <div className="font-semibold">{coin.fundamentals_score}/10</div>
              </div>
            )}
            {coin.staking_yield && (
              <div>
                <span className="text-gray-600">Staking Yield:</span>
                <div className="font-semibold">{coin.staking_yield.toFixed(1)}%</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

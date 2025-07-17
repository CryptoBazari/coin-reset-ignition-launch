
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Target, Activity, Shield, BarChart3 } from 'lucide-react';
import type { AnalysisResult } from '@/types/investment';
import { EnhancedFinancialMetrics } from '@/components/analysis/EnhancedFinancialMetrics';
import { RiskAnalysisCard } from '@/components/analysis/RiskAnalysisCard';
import { AllocationAnalysisCard } from '@/components/analysis/AllocationAnalysisCard';
import { MarketConditionsCard } from '@/components/analysis/MarketConditionsCard';

interface AnalysisResultsProps {
  result: AnalysisResult;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ result }) => {
  const { coin, metrics, recommendation, marketConditions, benchmarkComparison } = result;

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'Buy': return 'bg-success text-success-foreground';
      case 'Buy Less': return 'bg-warning text-warning-foreground';
      case 'Do Not Buy': return 'bg-destructive text-destructive-foreground';
      case 'Sell': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk <= 2) return 'text-success';
    if (risk <= 3) return 'text-warning';
    if (risk <= 4) return 'text-orange-500';
    return 'text-destructive';
  };

  const getBitcoinStateColor = (state: string) => {
    switch (state) {
      case 'bullish': return 'text-success';
      case 'bearish': return 'text-destructive';
      default: return 'text-warning';
    }
  };

  const getBetaRiskLevel = (beta: number) => {
    if (beta < 1) return { level: 'Low', color: 'text-success' };
    if (beta < 1.5) return { level: 'Moderate', color: 'text-warning' };
    if (beta < 2.0) return { level: 'High', color: 'text-orange-500' };
    return { level: 'Very High', color: 'text-destructive' };
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
                  <span className={marketConditions.avivRatio > 2.5 ? 'text-destructive' : marketConditions.avivRatio < 0.55 ? 'text-success' : 'text-warning'}>
                    {marketConditions.avivRatio.toFixed(2)}
                  </span>
                </div>
                )}
                {marketConditions.vaultedSupply && (
                  <div className="flex justify-between">
                    <span>Vaulted Supply:</span>
                    <span className={marketConditions.vaultedSupply > 70 ? 'text-success' : 'text-warning'}>
                      {marketConditions.vaultedSupply.toFixed(1)}%
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Smart Money:</span>
                  <span className={marketConditions.smartMoneyActivity ? 'text-destructive' : 'text-success'}>
                    {marketConditions.smartMoneyActivity ? 'Selling' : 'Holding'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Fed Rate Impact:</span>
                  <span className={
                    marketConditions.fedRateChange > 0 ? 'text-destructive' : 
                    marketConditions.fedRateChange < 0 ? 'text-success' : 'text-muted-foreground'
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

      {/* Enhanced Financial Metrics Component */}
      <EnhancedFinancialMetrics 
        metrics={metrics}
        coinName={coin.name}
      />

      {/* Risk Analysis Component */}
      <RiskAnalysisCard 
        metrics={metrics}
        coinBasket={coin.basket}
      />

      {/* Market Conditions Component */}
      <MarketConditionsCard 
        marketConditions={marketConditions}
      />

      {/* Allocation Analysis Component - Mock data for now since allocation isn't in AnalysisResult yet */}
      <AllocationAnalysisCard 
        allocation={{
          portfolioPercentage: 45, // This would come from the enhanced analysis
          status: 'underexposed' as const,
          recommendation: 'increase' as const,
          message: `${coin.basket} allocation analysis based on enhanced basket rules`,
          targetRange: coin.basket === 'Bitcoin' ? [60, 75] : 
                      coin.basket === 'Blue Chip' ? [20, 35] : 
                      [5, 10] as [number, number]
        }}
        coinBasket={coin.basket}
        coinName={coin.name}
      />

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
                  ? 'text-success' 
                  : 'text-destructive'
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
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Market Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground mb-4">{recommendation.marketAnalysis}</p>
          </CardContent>
        </Card>
      )}

      {/* Conditions & Risks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recommendation.conditions && (
          <Card>
            <CardHeader>
              <CardTitle className="text-success">Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground">{recommendation.conditions}</p>
            </CardContent>
          </Card>
        )}

        {recommendation.risks && (
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Risks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground">{recommendation.risks}</p>
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
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-foreground">{action}</span>
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
              <span className="text-muted-foreground">Basket:</span>
              <div className="font-semibold">{coin.basket}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Current Price:</span>
              <div className="font-semibold">${coin.current_price.toLocaleString()}</div>
            </div>
            {coin.market_cap && (
              <div>
                <span className="text-muted-foreground">Market Cap:</span>
                <div className="font-semibold">${(coin.market_cap / 1e9).toFixed(1)}B</div>
              </div>
            )}
            {coin.volatility && (
              <div>
                <span className="text-muted-foreground">Volatility:</span>
                <div className="font-semibold">{coin.volatility.toFixed(1)}%</div>
              </div>
            )}
            {coin.fundamentals_score && (
              <div>
                <span className="text-muted-foreground">Fundamentals:</span>
                <div className="font-semibold">{coin.fundamentals_score}/10</div>
              </div>
            )}
            {coin.staking_yield && (
              <div>
                <span className="text-muted-foreground">Staking Yield:</span>
                <div className="font-semibold">{coin.staking_yield.toFixed(1)}%</div>
              </div>
            )}
            {coin.beta && (
              <div>
                <span className="text-muted-foreground">Beta:</span>
                <div className="font-semibold">{coin.beta.toFixed(2)}</div>
              </div>
            )}
            {coin.sharpe_ratio && (
              <div>
                <span className="text-muted-foreground">Sharpe Ratio:</span>
                <div className="font-semibold">{coin.sharpe_ratio.toFixed(2)}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

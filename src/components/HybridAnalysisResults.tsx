
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Globe, AlertCircle, TrendingUp, Activity, Bitcoin, Coins } from 'lucide-react';
import type { DirectAnalysisResult } from '@/services/directApiAnalysisService';
import { BetaCalculationCard } from '@/components/analysis/BetaCalculationCard';


interface HybridAnalysisResultsProps {
  result: DirectAnalysisResult;
}

export const HybridAnalysisResults: React.FC<HybridAnalysisResultsProps> = ({ result }) => {
  const isGlassNodeData = result.dataSource === 'glassnode';
  const isBitcoin = result.isBitcoin;
  
  return (
    <div className="space-y-6">
      {/* Analysis Type Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isBitcoin ? (
              <Bitcoin className="h-5 w-5 text-orange-600" />
            ) : (
              <Coins className="h-5 w-5 text-blue-600" />
            )}
            {isBitcoin ? 'Bitcoin Analysis' : 'Altcoin Analysis'}: {result.name} ({result.symbol})
            <Badge variant="outline" className={`${
              isBitcoin 
                ? 'bg-orange-100 text-orange-800' 
                : isGlassNodeData 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
            }`}>
              {isBitcoin ? 'FULL COINTIME ANALYSIS' : isGlassNodeData ? 'GLASSNODE DATA' : 'COINMARKETCAP DATA'}
            </Badge>
          </CardTitle>
          <CardDescription>
            {isBitcoin 
              ? 'Comprehensive Bitcoin analysis with cointime metrics (AVIV, Active Supply, etc.)'
              : isGlassNodeData 
                ? 'Standard financial analysis using real Glassnode data'
                : 'Basic financial analysis using CoinMarketCap price data'
            }
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Bitcoin Market Context - Always shown */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bitcoin className="h-5 w-5 text-orange-600" />
            Bitcoin Market Context
            <Badge variant="outline" className={`${
              result.bitcoinMarketState.condition === 'bullish' ? 'bg-green-100 text-green-800' :
              result.bitcoinMarketState.condition === 'bearish' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {result.bitcoinMarketState.condition.toUpperCase()}
            </Badge>
          </CardTitle>
          <CardDescription>
            Current Bitcoin market state affects all cryptocurrency investments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Market State:</span>
              <span className={`${
                result.bitcoinMarketState.condition === 'bullish' ? 'text-green-700' :
                result.bitcoinMarketState.condition === 'bearish' ? 'text-red-700' :
                'text-yellow-700'
              }`}>
                {result.bitcoinMarketState.condition} ({result.bitcoinMarketState.confidence}% confidence)
              </span>
            </div>
            <p className="text-sm text-gray-600">{result.bitcoinMarketState.summary}</p>
          </div>
        </CardContent>
      </Card>

      {/* Basic Market Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Market Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ${result.currentPrice.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: result.currentPrice < 1 ? 6 : 2
                })}
              </div>
              <div className="text-sm text-gray-600">Current Price</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                result.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {result.priceChange24h >= 0 ? '+' : ''}{result.priceChange24h.toFixed(2)}%
              </div>
              <div className="text-sm text-gray-600">24h Change</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                ${(result.marketCap / 1000000000).toFixed(2)}B
              </div>
              <div className="text-sm text-gray-600">Market Cap</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bitcoin Cointime Metrics (only for Bitcoin) */}
      {isBitcoin && result.cointimeMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-600" />
              Bitcoin Cointime Metrics
              <Badge variant="outline" className="bg-orange-100 text-orange-800 text-xs">
                EXCLUSIVE TO BITCOIN
              </Badge>
            </CardTitle>
            <CardDescription>
              Advanced on-chain metrics available only for Bitcoin analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-xl font-bold text-orange-700">
                  {result.cointimeMetrics.avivRatio.toFixed(3)}
                </div>
                <div className="text-sm text-orange-600">AVIV Ratio</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold text-blue-700">
                  {result.cointimeMetrics.activeSupply.toFixed(1)}%
                </div>
                <div className="text-sm text-blue-600">Active Supply</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-xl font-bold text-purple-700">
                  {result.cointimeMetrics.vaultedSupply.toFixed(1)}%
                </div>
                <div className="text-sm text-purple-600">Vaulted Supply</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-700">
                  {result.cointimeMetrics.cointimeDestroyed.toFixed(0)}
                </div>
                <div className="text-sm text-green-600">Cointime Destroyed</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-xl font-bold text-red-700">
                  ${result.cointimeMetrics.cointimePrice.toFixed(2)}
                </div>
                <div className="text-sm text-red-600">Cointime Price</div>
              </div>
              <div className="text-center p-3 bg-indigo-50 rounded-lg">
                <div className="text-xl font-bold text-indigo-700">
                  {(result.cointimeMetrics.liquidSupply / 1000000).toFixed(2)}M
                </div>
                <div className="text-sm text-indigo-600">Liquid Supply</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Metrics (for all coins) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Financial Analysis
            <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
              REAL DATA CALCULATIONS
            </Badge>
          </CardTitle>
          <CardDescription>
            Standard financial metrics calculated from {isGlassNodeData ? 'real Glassnode' : 'CoinMarketCap'} data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className={`text-xl font-bold ${
                result.financialMetrics.npv > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${result.financialMetrics.npv.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">NPV</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-xl font-bold text-blue-700">
                {result.financialMetrics.irr.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">IRR</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-xl font-bold text-purple-700">
                {result.financialMetrics.cagr.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">CAGR</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-xl font-bold text-orange-700">
                {result.financialMetrics.roi.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">ROI</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-xl font-bold text-red-700">
                {result.financialMetrics.volatility.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Volatility</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-xl font-bold text-indigo-700">
                {result.financialMetrics.beta.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Beta</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Beta Calculation Details (when available) */}
      {result.betaCalculationDetails && (
        <BetaCalculationCard betaDetails={result.betaCalculationDetails} />
      )}


      {/* Investment Recommendation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Investment Recommendation
            {isBitcoin && (
              <Badge variant="outline" className="bg-orange-100 text-orange-800 text-xs">
                BITCOIN ENHANCED
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                result.recommendation.action === 'Buy' ? 'bg-green-100 text-green-800' :
                result.recommendation.action === 'Hold' ? 'bg-blue-100 text-blue-800' :
                result.recommendation.action === 'Sell' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {result.recommendation.action}
              </div>
              <div className="text-sm text-gray-600">
                {result.recommendation.confidence}% confidence
              </div>
              <Badge variant="outline" className="text-xs">
                {isBitcoin ? 'Cointime Enhanced' : isGlassNodeData ? 'Glassnode Data' : 'Limited Data'}
              </Badge>
            </div>
            
            {result.recommendation.reasoning.length > 0 && (
              <div>
                <h5 className="font-semibold text-green-700 mb-2">Supporting Factors:</h5>
                <ul className="text-sm space-y-1">
                  {result.recommendation.reasoning.map((reason, index) => (
                    <li key={index} className="text-green-700">✅ {reason}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {result.recommendation.riskWarnings.length > 0 && (
              <div>
                <h5 className="font-semibold text-red-700 mb-2">Risk Warnings:</h5>
                <ul className="text-sm space-y-1">
                  {result.recommendation.riskWarnings.map((warning, index) => (
                    <li key={index} className="text-red-700">⚠️ {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Quality Information */}
      <Card className="border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-gray-600 mt-0.5" />
            <div className="text-xs text-gray-600">
              <p className="font-medium">Analysis Quality Information:</p>
              <p>• Analysis type: {isBitcoin ? 'Bitcoin with cointime metrics' : 'Altcoin standard financial analysis'}</p>
              <p>• Data quality score: {result.dataQuality.score}%</p>
              <p>• Data source: {result.dataQuality.source}</p>
              <p>• Freshness: {result.dataQuality.freshness}</p>
              <p>• Last updated: {new Date(result.lastUpdated).toLocaleString()}</p>
              {isBitcoin && (
                <p>• Bitcoin gets exclusive cointime metrics (AVIV, Active Supply, etc.)</p>
              )}
              {!isBitcoin && (
                <p>• Altcoins use standard financial metrics (NPV, CAGR, IRR, ROI, Beta)</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

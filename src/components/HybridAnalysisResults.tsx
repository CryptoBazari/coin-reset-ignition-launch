
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Globe, AlertCircle, TrendingUp, Activity, Bitcoin, Coins, Calculator, BarChart3 } from 'lucide-react';
import type { DirectAnalysisResult } from '@/services/directApiAnalysisService';
import { BetaCalculationCard } from '@/components/analysis/BetaCalculationCard';
import { CAGRCalculationCard } from '@/components/CAGRCalculationCard';
import { ComprehensiveBetaAnalysisCard } from '@/components/analysis/ComprehensiveBetaAnalysisCard';

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
            {isBitcoin ? 'Enhanced Bitcoin Analysis' : 'Enhanced Altcoin Analysis'}: {result.name} ({result.symbol})
            <Badge variant="outline" className={`${
              isBitcoin 
                ? 'bg-orange-100 text-orange-800' 
                : isGlassNodeData 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
            }`}>
              {isBitcoin ? 'FULL COINTIME' : isGlassNodeData ? 'GLASS NODE DATA' : 'COINMARKETCAP DATA'}
            </Badge>
          </CardTitle>
          <CardDescription>
            {isBitcoin 
              ? 'Comprehensive Bitcoin analysis with cointime metrics and direct CAGR calculation from Glassnode API'
              : isGlassNodeData 
                ? 'Enhanced altcoin financial analysis using real Glassnode data with direct CAGR calculation'
                : 'Enhanced altcoin financial analysis using CoinMarketCap data with direct CAGR calculation'
            }
          </CardDescription>
        </CardHeader>
      </Card>

      {/* CAGR Calculation Details (Enhanced for Hybrid Analyzer) */}
      {result.cagrCalculationDetails && (
        <CAGRCalculationCard cagrDetails={result.cagrCalculationDetails} />
      )}

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
                  {result.cointimeMetrics.stockToFlowRatio.toFixed(2)}
                </div>
                <div className="text-sm text-red-600">Stock-to-Flow Ratio</div>
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
            Enhanced Financial Analysis
            <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
              DIRECT CAGR CALCULATION
            </Badge>
          </CardTitle>
          <CardDescription>
            Enhanced financial metrics with direct CAGR calculation from {isGlassNodeData ? 'Glassnode API' : 'database'}
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
            <div className="text-center p-3 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg border-2 border-purple-200">
              <div className="text-xl font-bold text-purple-700 flex items-center justify-center gap-1">
                <Calculator className="h-4 w-4" />
                {result.financialMetrics.cagr.toFixed(1)}%
              </div>
              <div className="text-sm text-purple-600 font-medium">Volatility-Adjusted CAGR (Primary)</div>
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

      {/* Standard Beta Calculation Details (when available) */}
      {result.betaCalculationDetails && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Standard 3-Year Beta Analysis</h3>
            <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">
              TRADITIONAL METHOD
            </Badge>
          </div>
          <p className="text-sm text-gray-600">
            Classic beta calculation using 3 years of daily price data with standard statistical methods
          </p>
          <BetaCalculationCard betaDetails={result.betaCalculationDetails} />
        </div>
      )}

      {/* Comprehensive Adaptive Beta Analysis */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-800">Comprehensive Adaptive Beta Analysis</h3>
          <Badge variant="outline" className="bg-purple-100 text-purple-800 text-xs">
            ADVANCED WORKFLOW
          </Badge>
        </div>
        <p className="text-sm text-gray-600">
          Next-generation beta calculation with dynamic window selection, volume adjustments, and live API data integration
        </p>
        <ComprehensiveBetaAnalysisCard selectedCoin={result.symbol} />
      </div>

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
            <Badge variant="outline" className="bg-purple-100 text-purple-800 text-xs">
              GLASS NODE DATA
            </Badge>
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
                Cointime
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

      {/* Enhanced Data Quality Information */}
      <Card className="border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-gray-600 mt-0.5" />
            <div className="text-xs text-gray-600">
              <p className="font-medium">Enhanced Analysis Quality Information:</p>
              <p>• Analysis type: {isBitcoin ? 'Bitcoin with cointime metrics + direct CAGR' : 'Enhanced altcoin with direct CAGR calculation'}</p>
              <p>• Data quality score: {result.dataQuality.score}%</p>
              <p>• Data source: {result.dataQuality.source}</p>
              <p>• Freshness: {result.dataQuality.freshness}</p>
              <p>• CAGR calculation: Direct from {result.cagrCalculationDetails?.dataSource || 'API'} ({result.cagrCalculationDetails?.dataPoints || 0} data points)</p>
              <p>• Last updated: {new Date(result.lastUpdated).toLocaleString()}</p>
              {isBitcoin && (
                <p>• Bitcoin gets exclusive cointime metrics + direct CAGR from Glassnode</p>
              )}
              {!isBitcoin && (
                <p>• Altcoins use enhanced financial metrics + direct CAGR calculation</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

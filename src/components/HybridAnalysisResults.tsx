
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Globe, AlertCircle, TrendingUp, Activity } from 'lucide-react';
import type { DirectAnalysisResult } from '@/services/directApiAnalysisService';

interface HybridAnalysisResultsProps {
  result: DirectAnalysisResult;
}

export const HybridAnalysisResults: React.FC<HybridAnalysisResultsProps> = ({ result }) => {
  const isGlassNodeData = result.dataSource === 'glassnode';
  
  return (
    <div className="space-y-6">
      {/* Data Source Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isGlassNodeData ? (
              <Shield className="h-5 w-5 text-green-600" />
            ) : (
              <Globe className="h-5 w-5 text-blue-600" />
            )}
            Analysis Results: {result.name} ({result.symbol})
            <Badge variant="outline" className={`${
              isGlassNodeData 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {isGlassNodeData ? 'GLASSNODE DATA' : 'COINMARKETCAP DATA'}
            </Badge>
          </CardTitle>
          <CardDescription>
            {isGlassNodeData 
              ? 'Comprehensive analysis using real Glassnode on-chain data'
              : 'Basic analysis using CoinMarketCap price data (Glassnode unavailable)'
            }
          </CardDescription>
        </CardHeader>
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

      {/* Glassnode Metrics (only if available) */}
      {isGlassNodeData && result.glassNodeMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              On-Chain Metrics
              <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                REAL GLASSNODE DATA
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-700">
                  {result.glassNodeMetrics.avivRatio.toFixed(3)}
                </div>
                <div className="text-sm text-green-600">AVIV Ratio</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold text-blue-700">
                  {result.glassNodeMetrics.activeSupply.toFixed(1)}%
                </div>
                <div className="text-sm text-blue-600">Active Supply</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-xl font-bold text-purple-700">
                  {result.glassNodeMetrics.vaultedSupply.toFixed(1)}%
                </div>
                <div className="text-sm text-purple-600">Vaulted Supply</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-xl font-bold text-orange-700">
                  {result.glassNodeMetrics.realizedVolatility.toFixed(1)}%
                </div>
                <div className="text-sm text-orange-600">Realized Volatility</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-xl font-bold text-red-700">
                  {result.glassNodeMetrics.cagr36m.toFixed(1)}%
                </div>
                <div className="text-sm text-red-600">36M CAGR</div>
              </div>
              <div className="text-center p-3 bg-indigo-50 rounded-lg">
                <div className="text-xl font-bold text-indigo-700">
                  {result.glassNodeMetrics.onChainStrength.toFixed(1)}
                </div>
                <div className="text-sm text-indigo-600">On-Chain Strength</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Analysis</CardTitle>
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
                {result.financialMetrics.sharpeRatio.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Sharpe Ratio</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment Recommendation */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Recommendation</CardTitle>
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
                {isGlassNodeData ? 'High Quality Data' : 'Limited Data'}
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

      {/* Data Quality Notice */}
      <Card className="border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-gray-600 mt-0.5" />
            <div className="text-xs text-gray-600">
              <p className="font-medium">Data Quality Information:</p>
              <p>• Analysis updated: {new Date(result.lastUpdated).toLocaleString()}</p>
              <p>• Data source: {result.dataSource === 'glassnode' ? 'Glassnode API + CoinMarketCap' : 'CoinMarketCap API only'}</p>
              <p>• Real-time data: {result.hasRealData ? 'Yes' : 'Limited'}</p>
              {!isGlassNodeData && (
                <p>• Note: For comprehensive analysis, select a Glassnode-supported cryptocurrency</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

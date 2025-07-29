
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Shield, Globe, AlertCircle, TrendingUp, Activity, Bitcoin, Coins, Calculator, BarChart3, ChevronDown } from 'lucide-react';
import type { DirectAnalysisResult } from '@/services/directApiAnalysisService';
import { BetaCalculationCard } from '@/components/analysis/BetaCalculationCard';
import { CAGRCalculationCard } from '@/components/CAGRCalculationCard';
import { ComprehensiveBetaAnalysisCard } from '@/components/analysis/ComprehensiveBetaAnalysisCard';
import NPVCalculationCard from '@/components/analysis/NPVCalculationCard';

interface HybridAnalysisResultsProps {
  result: DirectAnalysisResult;
  onRecalculateNPV?: () => void;
}

export const HybridAnalysisResults: React.FC<HybridAnalysisResultsProps> = ({ result, onRecalculateNPV }) => {
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

      {/* Main Content - 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column - Key Summary & Metrics */}
        <div className="space-y-6">
          
          {/* Investment Recommendation Summary */}
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
                  <div className={`px-6 py-3 rounded-full text-lg font-bold ${
                    result.recommendation.action === 'Buy' ? 'bg-green-100 text-green-800' :
                    result.recommendation.action === 'Hold' ? 'bg-blue-100 text-blue-800' :
                    result.recommendation.action === 'Sell' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {result.recommendation.action}
                  </div>
                  <div className="text-lg font-semibold text-gray-700">
                    {result.recommendation.confidence}% confidence
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Financial Metrics Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Key Metrics Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className={`text-2xl font-bold ${
                    (result.npvCalculationDetails?.npv ?? result.financialMetrics.npv) > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${(result.npvCalculationDetails?.npv ?? result.financialMetrics.npv).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    NPV
                    {result.npvCalculationDetails && (
                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                        {result.npvCalculationDetails.betaType}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg border-2 border-purple-200">
                  <div className="text-2xl font-bold text-purple-700 flex items-center justify-center gap-1">
                    <Calculator className="h-5 w-5" />
                    {result.financialMetrics.cagr.toFixed(1)}%
                  </div>
                  <div className="text-sm text-purple-600 font-medium">CAGR</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">
                    ${result.currentPrice.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: result.currentPrice < 1 ? 6 : 2
                    })}
                  </div>
                  <div className="text-sm text-gray-600">Current Price</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-700">
                    {(result.npvCalculationDetails?.betaDetails?.beta ?? result.financialMetrics.beta).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    Beta
                    {result.npvCalculationDetails?.betaDetails && (
                      <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700">
                        {result.npvCalculationDetails.betaType}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bitcoin Market Context */}
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
        </div>

        {/* Right Column - Detailed Analysis (Collapsible) */}
        <div className="space-y-6">
          
          <Accordion type="multiple" className="space-y-4">
            
            {/* CAGR Calculation Details */}
            {result.cagrCalculationDetails && (
              <AccordionItem value="cagr" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">CAGR Calculation Details</span>
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 text-xs">
                      {result.cagrCalculationDetails.dataPoints} DATA POINTS
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <CAGRCalculationCard cagrDetails={result.cagrCalculationDetails} />
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Enhanced Financial Analysis Details */}
            <AccordionItem value="financial" className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Enhanced Financial Analysis</span>
                  <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                    DIRECT CAGR
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xl font-bold text-blue-700">
                      {result.financialMetrics.irr.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">IRR</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-xl font-bold text-orange-700">
                      {result.financialMetrics.roi.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">ROI</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-xl font-bold text-red-700">
                      {result.financialMetrics.volatility.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Volatility</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-xl font-bold text-purple-700">
                      ${(result.marketCap / 1000000000).toFixed(2)}B
                    </div>
                    <div className="text-sm text-gray-600">Market Cap</div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Bitcoin Cointime Metrics */}
            {isBitcoin && result.cointimeMetrics && (
              <AccordionItem value="cointime" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Bitcoin Cointime Metrics</span>
                    <Badge variant="outline" className="bg-orange-100 text-orange-800 text-xs">
                      EXCLUSIVE
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Beta Calculation Details */}
            {result.betaCalculationDetails && (
              <AccordionItem value="beta" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Standard 3-Year Beta Analysis</span>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">
                      TRADITIONAL
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <BetaCalculationCard betaDetails={result.betaCalculationDetails} />
                </AccordionContent>
              </AccordionItem>
            )}

            {/* NPV Analysis Details */}
            {result.npvCalculationDetails && (
              <AccordionItem value="npv" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">NPV Analysis Details</span>
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 text-xs">
                      {result.npvCalculationDetails.betaType.toUpperCase()}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <NPVCalculationCard 
                    npvData={result.npvCalculationDetails} 
                    assetSymbol={result.symbol}
                    onRecalculateWithAdvancedBeta={onRecalculateNPV}
                    showRecalculateButton={result.npvCalculationDetails.betaType === 'basic'}
                  />
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Comprehensive Beta Analysis */}
            <AccordionItem value="comprehensive-beta" className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Comprehensive Adaptive Beta Analysis</span>
                  <Badge variant="outline" className="bg-purple-100 text-purple-800 text-xs">
                    ADVANCED
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <ComprehensiveBetaAnalysisCard selectedCoin={result.symbol} />
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>
      </div>

      {/* Investment Recommendation Details */}
      <Accordion type="single" collapsible className="mt-6">
        <AccordionItem value="recommendation-details" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="font-medium">Investment Recommendation Details</span>
              <Badge variant="outline" className="text-xs">
                Click to expand
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>

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

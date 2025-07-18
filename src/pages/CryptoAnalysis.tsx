import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from '@/components/Navbar';
import { EnhancedInvestmentForm } from '@/components/EnhancedInvestmentForm';
import { EnhancedAnalysisResults } from '@/components/EnhancedAnalysisResults';
import SubscriptionButton from '@/components/subscription/SubscriptionButton';
import MarketOverview from '@/components/analysis/MarketOverview';
import AssetLiveData from '@/components/analysis/AssetLiveData';
import GlassNodeDashboard from '@/components/analysis/GlassNodeDashboard';
import { useSubscription } from '@/hooks/useSubscription';
import { useEnhancedInvestmentAnalysis } from '@/hooks/useEnhancedInvestmentAnalysis';
import { Lock, BarChart3, Globe, TrendingUp, Calculator, Activity } from 'lucide-react';
import { useRealInvestmentAnalysis } from '@/hooks/useRealInvestmentAnalysis';
import type { InvestmentInputs } from '@/types/investment';
import type { CoinData } from '@/services/realTimeMarketService';

const CryptoAnalysis = () => {
  const [realAnalysisResult, setRealAnalysisResult] = useState(null);
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null);
  const [selectedCoinSymbol, setSelectedCoinSymbol] = useState<string>('BTC');
  const { hasActiveSubscription, user } = useSubscription();
  const { analyzeInvestment, loading, error } = useRealInvestmentAnalysis();

  const handleRealAnalysis = async (inputs: InvestmentInputs) => {
    console.log('🚀 Starting REAL Glass Node analysis (no more mock data!)');
    console.log('📊 Analysis inputs:', inputs);
    
    const result = await analyzeInvestment(inputs);
    if (result) {
      console.log('✅ REAL analysis completed:', result);
      setRealAnalysisResult(result);
    } else {
      console.error('❌ REAL analysis failed');
    }
  };

  const handleCoinSelect = (coinData: CoinData) => {
    setSelectedCoin(coinData);
    const symbol = coinData.symbol?.toUpperCase() || 'BTC';
    setSelectedCoinSymbol(symbol);
    console.log('Selected coin for REAL Glass Node analysis:', symbol);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Real-Time Crypto Investment Analyzer
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-semibold mr-2">
              REAL DATA
            </span>
            Make informed investment decisions with REAL Glass Node data, Monte Carlo projections, 
            and calculated volatility. No more mock data - everything is live and accurate.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {!user ? (
            <Card className="text-center p-8">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <Lock className="h-16 w-16 text-muted-foreground" />
                </div>
                <CardTitle>Sign In Required</CardTitle>
                <CardDescription>
                  Please sign in to access the real-time crypto investment analyzer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubscriptionButton feature="real-time analysis tools" size="lg" />
              </CardContent>
            </Card>
          ) : !hasActiveSubscription ? (
            <Card className="text-center p-8">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <Lock className="h-16 w-16 text-muted-foreground" />
                </div>
                <CardTitle>Premium Feature</CardTitle>
                <CardDescription>
                  Upgrade to access real-time crypto investment analysis with live Glass Node data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubscriptionButton feature="real-time analysis tools" size="lg" />
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview" className="gap-2">
                  <Globe className="h-4 w-4" />
                  Market Overview
                </TabsTrigger>
                <TabsTrigger value="live-data" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Live Data
                </TabsTrigger>
                <TabsTrigger value="onchain" className="gap-2">
                  <Activity className="h-4 w-4" />
                  On-Chain Analytics
                </TabsTrigger>
                <TabsTrigger value="analysis" className="gap-2">
                  <Calculator className="h-4 w-4" />
                  <span className="bg-green-500 text-white px-1 py-0.5 rounded text-xs ml-1">REAL</span>
                  Real Analysis
                </TabsTrigger>
                <TabsTrigger value="insights" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  AI Insights
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <MarketOverview />
              </TabsContent>

              <TabsContent value="live-data">
                <AssetLiveData onCoinSelect={handleCoinSelect} />
              </TabsContent>

              <TabsContent value="onchain">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Glass Node On-Chain Analytics
                      </CardTitle>
                      <CardDescription>
                        Real-time blockchain data and metrics for {selectedCoinSymbol}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <GlassNodeDashboard coinSymbol={selectedCoinSymbol} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="analysis" className="space-y-6">
                <div className="space-y-6">
                  {/* Data Quality Banner */}
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-green-800">
                        <Activity className="h-5 w-5" />
                        <div>
                          <div className="font-semibold">REAL Data Analysis Active</div>
                          <div className="text-sm">
                            Using live Glass Node API, Monte Carlo projections, and calculated volatility.
                            No mock data - all calculations based on real historical prices and metrics.
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {error && (
                    <Card className="border-yellow-200 bg-yellow-50">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm">
                            {error} - Falling back to available data sources.
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  <EnhancedInvestmentForm onSubmit={handleRealAnalysis} loading={loading} />
                  
                  {realAnalysisResult && (
                    <div className="space-y-6">
                      {/* Real Analysis Results */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-green-600" />
                            Real-Time Analysis Results
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                              {realAnalysisResult.dataQualityScore}% Data Quality
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            Analysis powered by live Glass Node data and Monte Carlo simulation
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Financial Metrics */}
                            <div className="space-y-3">
                              <h4 className="font-semibold text-lg">Financial Metrics</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span>NPV:</span>
                                  <span className={realAnalysisResult.financialMetrics.npv > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                                    ${realAnalysisResult.financialMetrics.npv.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>IRR:</span>
                                  <span className="font-semibold">{realAnalysisResult.financialMetrics.irr.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Real 36M CAGR:</span>
                                  <span className="font-semibold">{realAnalysisResult.financialMetrics.realCAGR.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Real Volatility:</span>
                                  <span className="font-semibold">{realAnalysisResult.financialMetrics.realVolatility.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Sharpe Ratio:</span>
                                  <span className="font-semibold">{realAnalysisResult.financialMetrics.sharpeRatio.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Monte Carlo Results */}
                            <div className="space-y-3">
                              <h4 className="font-semibold text-lg">Monte Carlo Projection</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span>Expected Value:</span>
                                  <span className="font-semibold text-blue-600">
                                    ${realAnalysisResult.monteCarloProjection.expectedValue.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>95% Confidence:</span>
                                  <span className="text-sm">
                                    ${realAnalysisResult.monteCarloProjection.confidenceInterval.lower.toLocaleString()} - 
                                    ${realAnalysisResult.monteCarloProjection.confidenceInterval.upper.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Probability of Loss:</span>
                                  <span className={realAnalysisResult.monteCarloProjection.probabilityOfLoss > 0.3 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                                    {(realAnalysisResult.monteCarloProjection.probabilityOfLoss * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Value at Risk:</span>
                                  <span className="text-red-600 font-semibold">
                                    ${realAnalysisResult.monteCarloProjection.valueAtRisk.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Real-Time Data */}
                            <div className="space-y-3">
                              <h4 className="font-semibold text-lg">Live Glass Node Data</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span>AVIV Ratio:</span>
                                  <span className="font-semibold">{realAnalysisResult.realTimeData.avivRatio.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Active Supply:</span>
                                  <span className="font-semibold">{realAnalysisResult.realTimeData.activeSupply.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Vaulted Supply:</span>
                                  <span className="font-semibold">{realAnalysisResult.realTimeData.vaultedSupply.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Beta:</span>
                                  <span className="font-semibold">{realAnalysisResult.betaAnalysis.beta.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Data Quality:</span>
                                  <Badge variant={realAnalysisResult.realTimeData.dataQuality > 80 ? 'default' : 'secondary'}>
                                    {realAnalysisResult.realTimeData.dataQuality}%
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Recommendation */}
                          <div className="mt-6 p-4 rounded-lg bg-slate-50">
                            <div className="flex items-center gap-2 mb-3">
                              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                realAnalysisResult.recommendation.action === 'Buy' ? 'bg-green-100 text-green-800' :
                                realAnalysisResult.recommendation.action === 'Buy Less' ? 'bg-yellow-100 text-yellow-800' :
                                realAnalysisResult.recommendation.action === 'Sell' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {realAnalysisResult.recommendation.action}
                              </div>
                              <span className="text-sm text-gray-600">
                                {realAnalysisResult.recommendation.confidence}% confidence
                              </span>
                            </div>
                            
                            {realAnalysisResult.recommendation.reasoning.length > 0 && (
                              <div className="mb-3">
                                <h5 className="font-semibold text-green-700 mb-1">Supporting Factors:</h5>
                                <ul className="text-sm space-y-1">
                                  {realAnalysisResult.recommendation.reasoning.map((reason, index) => (
                                    <li key={index} className="text-green-700">✅ {reason}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {realAnalysisResult.recommendation.riskWarnings.length > 0 && (
                              <div>
                                <h5 className="font-semibold text-red-700 mb-1">Risk Warnings:</h5>
                                <ul className="text-sm space-y-1">
                                  {realAnalysisResult.recommendation.riskWarnings.map((warning, index) => (
                                    <li key={index} className="text-red-700">⚠️ {warning}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="insights">
                <Card>
                  <CardHeader>
                    <CardTitle>AI-Powered Market Insights</CardTitle>
                    <CardDescription>
                      Advanced AI analysis and predictions powered by Glass Node data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {realAnalysisResult?.insights ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Market Analysis</h3>
                            <div className="space-y-2">
                              <p className="text-sm"><strong>Risk Profile:</strong> {realAnalysisResult.insights.riskProfile}</p>
                              <p className="text-sm"><strong>Market Timing:</strong> {realAnalysisResult.insights.marketTiming}</p>
                              <p className="text-sm"><strong>Position Sizing:</strong> {realAnalysisResult.insights.positionSizing}</p>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Glass Node Insights</h3>
                            <ul className="text-sm space-y-1">
                              {realAnalysisResult.insights.glassnodeInsights.map((insight, index) => (
                                <li key={index}>• {insight}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-lg font-semibold mb-3 text-red-600">Key Risks</h3>
                            <ul className="text-sm space-y-1">
                              {realAnalysisResult.insights.keyRisks.map((risk, index) => (
                                <li key={index} className="text-red-700">⚠️ {risk}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold mb-3 text-green-600">Opportunities</h3>
                            <ul className="text-sm space-y-1">
                              {realAnalysisResult.insights.opportunities.map((opportunity, index) => (
                                <li key={index} className="text-green-700">✅ {opportunity}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">Run Enhanced Analysis</h3>
                        <p>Perform an investment analysis to see AI-powered insights based on Glass Node data.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default CryptoAnalysis;

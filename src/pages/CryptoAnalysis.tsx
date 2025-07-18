
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
import type { InvestmentInputs } from '@/types/investment';
import type { CoinData } from '@/services/realTimeMarketService';

const CryptoAnalysis = () => {
  const [enhancedAnalysisResult, setEnhancedAnalysisResult] = useState(null);
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null);
  const [selectedCoinSymbol, setSelectedCoinSymbol] = useState<string>('BTC');
  const { hasActiveSubscription, user } = useSubscription();
  const { analyzeInvestment, loading, error } = useEnhancedInvestmentAnalysis();

  const handleEnhancedAnalysis = async (inputs: InvestmentInputs) => {
    console.log('🚀 Starting enhanced Glass Node analysis with inputs:', inputs);
    const result = await analyzeInvestment(inputs);
    if (result) {
      console.log('✅ Enhanced analysis completed:', result);
      setEnhancedAnalysisResult(result);
    } else {
      console.error('❌ Enhanced analysis failed');
    }
  };

  const handleCoinSelect = (coinData: CoinData) => {
    setSelectedCoin(coinData);
    const symbol = coinData.symbol?.toUpperCase() || 'BTC';
    setSelectedCoinSymbol(symbol);
    console.log('Selected coin for Glass Node analysis:', symbol);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Enhanced Crypto Investment Analyzer
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Make informed investment decisions with our advanced analysis tools powered by Glass Node on-chain data. 
            Get personalized recommendations based on real-time blockchain metrics and your portfolio requirements.
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
                  Please sign in to access the enhanced crypto investment analyzer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubscriptionButton feature="enhanced analysis tools" size="lg" />
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
                  Upgrade to access advanced crypto investment analysis with live Glass Node data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubscriptionButton feature="enhanced analysis tools" size="lg" />
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
                  Enhanced Analysis
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
                  {error && (
                    <Card className="border-yellow-200 bg-yellow-50">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm">
                            {error} - Analysis will use available data sources.
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  <EnhancedInvestmentForm onSubmit={handleEnhancedAnalysis} loading={loading} />
                  
                  {enhancedAnalysisResult && (
                    <div className="space-y-6">
                      <EnhancedAnalysisResults result={enhancedAnalysisResult} />
                      
                      {enhancedAnalysisResult.dataQuality && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Activity className="h-5 w-5" />
                              Enhanced Data Quality Report
                            </CardTitle>
                            <CardDescription>
                              Analysis powered by {enhancedAnalysisResult.dataQuality.glassnodeConnection ? 'Live Glass Node Data' : 'Basic Market Data'}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <span className="text-sm font-medium">Data Source</span>
                                <div className="text-2xl font-bold">
                                  {enhancedAnalysisResult.dataQuality.glassnodeConnection ? '🟢 Live' : '🟡 Basic'}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {enhancedAnalysisResult.dataQuality.glassnodeConnection ? 
                                    'Real-time Glass Node metrics' : 'Market price data only'}
                                </p>
                              </div>
                              
                              <div className="space-y-2">
                                <span className="text-sm font-medium">Confidence Score</span>
                                <div className="text-2xl font-bold">
                                  {enhancedAnalysisResult.dataQuality.confidenceScore}%
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Analysis reliability score
                                </p>
                              </div>
                              
                              <div className="space-y-2">
                                <span className="text-sm font-medium">Data Completeness</span>
                                <div className="text-2xl font-bold">
                                  {enhancedAnalysisResult.dataQuality.dataCompleteness || 'N/A'}%
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Available metrics coverage
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
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
                    {enhancedAnalysisResult?.insights ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Market Analysis</h3>
                            <div className="space-y-2">
                              <p className="text-sm"><strong>Risk Profile:</strong> {enhancedAnalysisResult.insights.riskProfile}</p>
                              <p className="text-sm"><strong>Market Timing:</strong> {enhancedAnalysisResult.insights.marketTiming}</p>
                              <p className="text-sm"><strong>Position Sizing:</strong> {enhancedAnalysisResult.insights.positionSizing}</p>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Glass Node Insights</h3>
                            <ul className="text-sm space-y-1">
                              {enhancedAnalysisResult.insights.glassnodeInsights.map((insight, index) => (
                                <li key={index}>• {insight}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-lg font-semibold mb-3 text-red-600">Key Risks</h3>
                            <ul className="text-sm space-y-1">
                              {enhancedAnalysisResult.insights.keyRisks.map((risk, index) => (
                                <li key={index} className="text-red-700">⚠️ {risk}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold mb-3 text-green-600">Opportunities</h3>
                            <ul className="text-sm space-y-1">
                              {enhancedAnalysisResult.insights.opportunities.map((opportunity, index) => (
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


import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from '@/components/Navbar';
import { InvestmentForm } from '@/components/InvestmentForm';
import { AnalysisResults } from '@/components/AnalysisResults';
import SubscriptionButton from '@/components/subscription/SubscriptionButton';
import MarketOverview from '@/components/analysis/MarketOverview';
import AssetLiveData from '@/components/analysis/AssetLiveData';
import GlassNodeDashboard from '@/components/analysis/GlassNodeDashboard';
import { useSubscription } from '@/hooks/useSubscription';
import { useInvestmentAnalysis } from '@/hooks/useInvestmentAnalysis';
import { Lock, BarChart3, Globe, TrendingUp, Calculator, Activity } from 'lucide-react';
import type { InvestmentInputs, AnalysisResult } from '@/types/investment';
import type { CoinData } from '@/services/realTimeMarketService';

const CryptoAnalysis = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null);
  const [selectedCoinSymbol, setSelectedCoinSymbol] = useState<string>('BTC');
  const { hasActiveSubscription, user } = useSubscription();
  const { analyzeInvestment, loading, error } = useInvestmentAnalysis();

  const handleAnalysis = async (inputs: InvestmentInputs) => {
    const result = await analyzeInvestment(inputs);
    if (result) {
      setAnalysisResult(result);
    }
  };

  const handleCoinSelect = (coinData: CoinData) => {
    setSelectedCoin(coinData);
    // Extract symbol from coin data for Glass Node
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
            Crypto Investment Analyzer
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Make informed investment decisions with our advanced analysis tools powered by Glass Node on-chain data. 
            Get personalized recommendations based on your portfolio and risk tolerance.
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
                  Please sign in to access the crypto investment analyzer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubscriptionButton feature="analysis tools" size="lg" />
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
                  Upgrade to access advanced crypto investment analysis tools with Glass Node data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubscriptionButton feature="analysis tools" size="lg" />
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
                  Investment Analysis
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
                  
                  <InvestmentForm onSubmit={handleAnalysis} loading={loading} />
                  {analysisResult && (
                    <div className="space-y-6">
                      <AnalysisResults result={analysisResult} />
                      
                      {analysisResult.glassNodeData && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Activity className="h-5 w-5" />
                              Glass Node Enhanced Metrics
                            </CardTitle>
                            <CardDescription>
                              Additional insights from on-chain analysis
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <span className="text-sm font-medium">Cointime Price</span>
                                <div className="text-2xl font-bold">
                                  ${analysisResult.glassNodeData.cointimeMetrics.cointimePrice.toFixed(2)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Price adjusted for cointime destruction
                                </p>
                              </div>
                              
                              <div className="space-y-2">
                                <span className="text-sm font-medium">Cointime Ratio</span>
                                <div className="text-2xl font-bold">
                                  {analysisResult.glassNodeData.cointimeMetrics.cointimeRatio.toFixed(2)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Current vs historical average
                                </p>
                              </div>
                              
                              <div className="space-y-2">
                                <span className="text-sm font-medium">On-Chain Health</span>
                                <div className="text-2xl font-bold">
                                  {analysisResult.metrics.onChainScore || 'N/A'}/10
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Network health composite score
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
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">Enhanced AI Insights Coming Soon</h3>
                      <p>AI-powered analysis combining Glass Node on-chain data with market sentiment and technical indicators will be available soon.</p>
                    </div>
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

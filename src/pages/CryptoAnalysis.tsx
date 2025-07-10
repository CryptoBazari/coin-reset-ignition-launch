import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from '@/components/Navbar';
import { InvestmentForm } from '@/components/InvestmentForm';
import { AnalysisResults } from '@/components/AnalysisResults';
import SubscriptionButton from '@/components/subscription/SubscriptionButton';
import MarketOverview from '@/components/analysis/MarketOverview';
import AssetLiveData from '@/components/analysis/AssetLiveData';
import { useSubscription } from '@/hooks/useSubscription';
import { useInvestmentAnalysis } from '@/hooks/useInvestmentAnalysis';
import { Lock, BarChart3, Globe, TrendingUp, Calculator } from 'lucide-react';
import type { InvestmentInputs, AnalysisResult } from '@/types/investment';
import type { CoinData } from '@/services/realTimeMarketService';

const CryptoAnalysis = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null);
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
    // Could auto-populate the investment form with selected coin data
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
            Make informed investment decisions with our advanced analysis tools. 
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
                  Upgrade to access advanced crypto investment analysis tools
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubscriptionButton feature="analysis tools" size="lg" />
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="gap-2">
                  <Globe className="h-4 w-4" />
                  Market Overview
                </TabsTrigger>
                <TabsTrigger value="live-data" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Live Data
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

              <TabsContent value="analysis" className="space-y-6">
                <InvestmentForm onSubmit={handleAnalysis} loading={loading} />
                {analysisResult && <AnalysisResults result={analysisResult} />}
              </TabsContent>

              <TabsContent value="insights">
                <Card>
                  <CardHeader>
                    <CardTitle>AI-Powered Market Insights</CardTitle>
                    <CardDescription>
                      Advanced AI analysis and predictions coming soon
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      AI insights feature will be available soon
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
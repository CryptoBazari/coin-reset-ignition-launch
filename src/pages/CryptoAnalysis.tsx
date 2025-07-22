import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from '@/components/Navbar';
import { EnhancedInvestmentForm } from '@/components/EnhancedInvestmentForm';
import { RealDataStatus } from '@/components/analysis/RealDataStatus';
import SubscriptionButton from '@/components/subscription/SubscriptionButton';
import MarketOverview from '@/components/analysis/MarketOverview';
import AssetLiveData from '@/components/analysis/AssetLiveData';
import GlassNodeDashboard from '@/components/analysis/GlassNodeDashboard';
import { EnhancedHybridInvestmentForm } from '@/components/EnhancedHybridInvestmentForm';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { useRealInvestmentAnalysis } from '@/hooks/useRealInvestmentAnalysis';
import { useRealDataPopulation } from '@/hooks/useRealDataPopulation';
import { enhancedGlassNodeAnalyzer } from '@/services/enhancedGlassNodeAnalyzer';
import { Lock, BarChart3, Globe, TrendingUp, Calculator, Activity, Shield, Zap } from 'lucide-react';
import type { InvestmentInputs } from '@/types/investment';
import type { CoinData } from '@/services/realTimeMarketService';
import { ComprehensiveInvestmentForm } from '@/components/ComprehensiveInvestmentForm';
import { ComprehensiveAnalysisResults } from '@/components/ComprehensiveAnalysisResults';
import { comprehensiveGlassNodeAnalyzer, AnalysisInputs, ComprehensiveAnalysisResult } from '@/services/comprehensiveGlassNodeAnalyzer';
import { useGlassnodeDataInitialization } from '@/hooks/useGlassnodeDataInitialization';

const CryptoAnalysis = () => {
  const [realAnalysisResult, setRealAnalysisResult] = useState(null);
  const [comprehensiveResult, setComprehensiveResult] = useState<ComprehensiveAnalysisResult | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null);
  const [selectedCoinSymbol, setSelectedCoinSymbol] = useState<string>('BTC');
  const [dataStatus, setDataStatus] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [dataInitialized, setDataInitialized] = useState(false);
  
  const { hasAccess, hasActiveSubscription, isAdmin, accessType, user } = useAdminAccess();
  const { analyzeInvestment, loading, error } = useRealInvestmentAnalysis();
  const { checkDataStatus } = useRealDataPopulation();
  const { 
    loading: initLoading, 
    initializeAllData, 
    initializeSingleCoin,
    checkDataFreshness 
  } = useGlassnodeDataInitialization();

  useEffect(() => {
    const loadDataStatus = async () => {
      const status = await checkDataStatus();
      setDataStatus(status);
    };
    loadDataStatus();
  }, [checkDataStatus]);

  const handleRealAnalysis = async (inputs: InvestmentInputs) => {
    console.log('🚀 Starting REAL Glass Node analysis with actual API data');
    console.log('📊 Analysis inputs:', inputs);
    
    const result = await analyzeInvestment(inputs);
    if (result) {
      console.log('✅ REAL analysis completed with actual data:', result);
      setRealAnalysisResult(result);
    } else {
      console.error('❌ REAL analysis failed');
    }
  };

  const handleCoinSelect = async (coinData: CoinData) => {
    setSelectedCoin(coinData);
    const symbol = coinData.symbol?.toUpperCase() || 'BTC';
    const coinId = coinData.id || symbol.toLowerCase();
    setSelectedCoinSymbol(symbol);
    
    console.log(`🚀 Auto-starting analysis for: ${symbol} (${coinId})`);
    
    try {
      const result = await enhancedGlassNodeAnalyzer.analyzeInvestment(symbol, 10000, 36);
      console.log('✅ Auto-analysis completed with real data:', result);
      setRealAnalysisResult(result);
    } catch (error) {
      console.error('❌ Auto-analysis failed:', error);
    }
  };

  const handleComprehensiveAnalysis = async (inputs: AnalysisInputs) => {
    setAnalysisLoading(true);
    console.log('🚀 Starting comprehensive Glass Node analysis with REAL DATA');
    console.log('📊 Analysis inputs:', inputs);
    
    try {
      const result = await comprehensiveGlassNodeAnalyzer.analyzeInvestment(inputs);
      console.log('✅ Comprehensive analysis completed with REAL DATA:', result);
      setComprehensiveResult(result);
    } catch (error) {
      console.error('❌ Comprehensive analysis failed:', error);
    } finally {
      setAnalysisLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Real Data Status Banner */}
        <div className="mb-6">
          <RealDataStatus />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Hybrid Crypto Investment Analyzer
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-semibold mr-2">
              REAL API DATA ONLY
            </span>
            Choose any cryptocurrency from 1000+ options. Get comprehensive Glassnode analysis for supported coins, or basic analysis for others.
            {isAdmin && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-semibold ml-2">
                <Shield className="inline h-3 w-3 mr-1" />
                ADMIN ACCESS
              </span>
            )}
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
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
                <SubscriptionButton feature="real-time crypto analysis" size="lg" />
              </CardContent>
            </Card>
          ) : !hasAccess ? (
            <Card className="text-center p-8">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <Lock className="h-16 w-16 text-muted-foreground" />
                </div>
                <CardTitle>Premium Feature</CardTitle>
                <CardDescription>
                  Upgrade to access real-time crypto investment analysis with live API data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubscriptionButton feature="real-time crypto analysis" size="lg" />
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="analysis" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
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
                  Investment Analyzer
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs ml-1">
                    1000+ COINS
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <MarketOverview />
              </TabsContent>

              <TabsContent value="live-data">
                <AssetLiveData onCoinSelect={handleCoinSelect} />
              </TabsContent>

              <TabsContent value="analysis">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Comprehensive Investment Analyzer
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">
                          REAL GLASSNODE DATA
                        </Badge>
                        <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                          1000+ COINS
                        </Badge>
                        {accessType === 'admin' && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            ADMIN ACCESS
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Advanced NPV calculations with Bitcoin cointime analysis (AVIV, Active Supply) and S&P 500 benchmark. Altcoins use Bitcoin as benchmark.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <EnhancedHybridInvestmentForm />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default CryptoAnalysis;

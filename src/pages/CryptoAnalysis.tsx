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
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { useRealInvestmentAnalysis } from '@/hooks/useRealInvestmentAnalysis';
import { useRealDataPopulation } from '@/hooks/useRealDataPopulation';
import { enhancedGlassNodeAnalyzer } from '@/services/enhancedGlassNodeAnalyzer';
import { Lock, BarChart3, Globe, TrendingUp, Calculator, Activity, Shield } from 'lucide-react';
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

  // Auto-initialize data on component mount if needed
  useEffect(() => {
    const autoInitializeData = async () => {
      if (hasAccess && !dataInitialized) {
        try {
          console.log('🔄 Auto-initializing Glassnode data...');
          await initializeAllData();
          setDataInitialized(true);
          console.log('✅ Auto-initialization completed');
        } catch (error) {
          console.error('❌ Auto-initialization failed:', error);
        }
      }
    };

    autoInitializeData();
  }, [hasAccess, dataInitialized, initializeAllData]);

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
      // Check if we have fresh data for this coin
      const freshness = await checkDataFreshness(coinId);
      if (!freshness.hasData || freshness.dataAge > 24) {
        console.log(`📊 Initializing fresh data for ${coinId}...`);
        await initializeSingleCoin(coinId);
      }
      
      // Start analysis with real data
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
          {initLoading && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="text-blue-700">Initializing real Glassnode data...</span>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Comprehensive Crypto Investment Analyzer
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-semibold mr-2">
              REAL GLASSNODE DATA
            </span>
            Advanced investment analysis using real Glassnode API data for accurate NPV, CAGR, Beta, IRR, and ROI calculations.
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
                  Please sign in to access the real-time crypto investment analyzer with Glassnode data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubscriptionButton feature="real Glassnode analysis tools" size="lg" />
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
                  Upgrade to access real-time crypto investment analysis with live Glassnode API data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubscriptionButton feature="real Glassnode analysis tools" size="lg" />
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="comprehensive" className="space-y-6">
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
                <TabsTrigger value="comprehensive" className="gap-2">
                  <Calculator className="h-4 w-4" />
                  <Badge variant="outline" className="bg-green-100 text-green-800 text-xs ml-1">
                    REAL DATA
                  </Badge>
                  Advanced Analysis
                </TabsTrigger>
                <TabsTrigger value="legacy" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Legacy Analysis
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
                        {accessType === 'admin' && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            ADMIN ACCESS
                          </Badge>
                        )}
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

              <TabsContent value="comprehensive">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Comprehensive Investment Analysis
                        <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                          REAL GLASSNODE DATA
                        </Badge>
                        {accessType === 'admin' && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            ADMIN ACCESS
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Advanced NPV, IRR, ROI, and Beta calculations using real Glassnode API data
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                          <ComprehensiveInvestmentForm 
                            onSubmit={handleComprehensiveAnalysis}
                            loading={analysisLoading || initLoading}
                          />
                        </div>
                        <div>
                          {comprehensiveResult && (
                            <ComprehensiveAnalysisResults 
                              result={comprehensiveResult}
                            />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="legacy">
                <div className="space-y-6">
                  {/* Data Quality Banner */}
                  <Card className={`${dataStatus?.isPopulated ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
                    <CardContent className="pt-6">
                      <div className={`flex items-center gap-2 ${dataStatus?.isPopulated ? 'text-green-800' : 'text-yellow-800'}`}>
                        <Activity className="h-5 w-5" />
                        <div>
                          <div className="font-semibold">
                            {dataStatus?.isPopulated ? 'REAL Data Analysis Active' : 'Data Initialization Required'}
                            {accessType === 'admin' && (
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs ml-2">
                                <Shield className="h-3 w-3 mr-1" />
                                ADMIN ACCESS
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm">
                            {dataStatus?.isPopulated 
                              ? `Using live Glass Node API, Monte Carlo projections, and calculated volatility. ${dataStatus.coinsWithRealData}/${dataStatus.totalCoins} coins with real data (${dataStatus.dataQuality}% quality).`
                              : 'Initialize the database above to start using real market data for calculations.'
                            }
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
                            {error} - Check data initialization status above.
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
                            {accessType === 'admin' && (
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                ADMIN ACCESS
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            Analysis powered by {dataStatus?.isPopulated ? 'live database data' : 'available market data'} and Monte Carlo simulation
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
                                  <span className="font-semibold">{realAnalysisResult.realTimeData.vaulted_supply.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Beta:</span>
                                  <span className="font-semibold">{realAnalysisResult.betaAnalysis.beta.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Data Source:</span>
                                  <Badge variant={dataStatus?.isPopulated ? 'default' : 'secondary'}>
                                    {dataStatus?.isPopulated ? 'Database' : 'Fallback'}
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
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default CryptoAnalysis;

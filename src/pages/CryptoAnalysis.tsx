import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from '@/components/Navbar';

import { RealDataStatus } from '@/components/analysis/RealDataStatus';
import SubscriptionButton from '@/components/subscription/SubscriptionButton';
import MarketOverview from '@/components/analysis/MarketOverview';
import AssetLiveData from '@/components/analysis/AssetLiveData';
import GlassNodeDashboard from '@/components/analysis/GlassNodeDashboard';
import { HybridInvestmentForm } from '@/components/HybridInvestmentForm';
import { HybridAnalysisResults } from '@/components/HybridAnalysisResults';
import { CalculationDebugger } from '@/components/analysis/CalculationDebugger';
import { useAdminAccess } from '@/hooks/useAdminAccess';

import { useRealDataPopulation } from '@/hooks/useRealDataPopulation';

import { directApiAnalysisService, DirectAnalysisResult } from '@/services/directApiAnalysisService';
import { hybridNPVCalculationService } from '@/services/hybridNPVCalculationService';
import { Lock, BarChart3, Globe, TrendingUp, Calculator, Activity, Shield, Zap, Download } from 'lucide-react';
import type { InvestmentInputs } from '@/types/investment';
import type { CoinData } from '@/services/realTimeMarketService';
import { useGlassnodeDataInitialization } from '@/hooks/useGlassnodeDataInitialization';
import { priceHistoryExportService } from '@/services/priceHistoryExportService';
import { betaCalculationExportService } from '@/services/betaCalculationExportService';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BetaCalculationCard } from '@/components/analysis/BetaCalculationCard';


const CryptoAnalysis = () => {
  const [hybridResult, setHybridResult] = useState<DirectAnalysisResult | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null);
  const [selectedCoinSymbol, setSelectedCoinSymbol] = useState<string>('BTC');
  const [dataStatus, setDataStatus] = useState<any>(null);
  
  const [hybridLoading, setHybridLoading] = useState(false);
  const [dataInitialized, setDataInitialized] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  
  const { hasAccess, hasActiveSubscription, isAdmin, accessType, user } = useAdminAccess();
  
  const { checkDataStatus } = useRealDataPopulation();
  const { toast } = useToast();
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


  const handleCoinSelect = async (coinData: CoinData) => {
    setSelectedCoin(coinData);
    const symbol = coinData.symbol?.toUpperCase() || 'BTC';
    const coinId = coinData.id || symbol.toLowerCase();
    setSelectedCoinSymbol(symbol);
    
    console.log(`🚀 Auto-starting analysis for: ${symbol} (${coinId})`);
    
  };


  const handleHybridAnalysis = async (data: {
    coinId: string;
    symbol: string;
    investmentAmount: number;
    timeHorizon: number;
    hasGlassNodeData: boolean;
  }) => {
    setHybridLoading(true);
    console.log('🚀 Starting hybrid analysis with real API data only');
    console.log('📊 Analysis inputs:', data);
    
    try {
      const result = await directApiAnalysisService.analyzeInvestment(
        data.coinId,
        data.symbol,
        data.investmentAmount,
        data.timeHorizon
      );
      console.log('✅ Hybrid analysis completed:', result);
      setHybridResult(result);
    } catch (error) {
      console.error('❌ Hybrid analysis failed:', error);
    } finally {
      setHybridLoading(false);
    }
  };

  const handleRecalculateNPV = async () => {
    if (!hybridResult?.npvCalculationDetails) return;
    
    setHybridLoading(true);
    try {
      console.log('🔄 Recalculating NPV with advanced beta...');
      
      // Get comprehensive beta from the existing result
      const advancedBeta = hybridResult.betaCalculationDetails?.beta || hybridResult.financialMetrics.beta;
      
      const amount = hybridResult.npvCalculationDetails.yearlyBreakdown.reduce((sum, year) => sum + year.cashFlow, 0);
      const years = hybridResult.npvCalculationDetails.yearlyBreakdown.length;
      
      // Use the hybrid NPV service directly with correct types
      const updatedNPV = await hybridNPVCalculationService.calculateHybridNPV(
        hybridResult.symbol,
        amount,
        years,
        advancedBeta
      );
      
      // Update the result with new NPV data
      setHybridResult({
        ...hybridResult,
        npvCalculationDetails: updatedNPV
      });
      
      toast({
        title: "NPV Recalculated",
        description: `Updated NPV: $${updatedNPV.npv.toFixed(2)} using advanced beta (${updatedNPV.beta.toFixed(3)})`,
      });
      
      console.log('✅ NPV recalculation completed');
    } catch (error) {
      console.error('❌ NPV recalculation failed:', error);
      toast({
        title: "Recalculation Failed",
        description: error instanceof Error ? error.message : "Failed to recalculate NPV",
        variant: "destructive",
      });
    } finally {
      setHybridLoading(false);
    }
  };

  const handleExportBTCHistory = async () => {
    setExportLoading(true);
    try {
      toast({
        title: "Export Started",
        description: "Fetching BTC price history...",
      });

      await priceHistoryExportService.exportBTCHistoricalData();
      
      toast({
        title: "Export Completed",
        description: "BTC 36-month price history downloaded successfully",
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportSP500History = async () => {
    setExportLoading(true);
    try {
      toast({
        title: "Export Started",
        description: "Fetching S&P 500 data...",
      });

      await priceHistoryExportService.exportSP500HistoricalData();
      
      toast({
        title: "Export Completed",
        description: "S&P 500 36-month data downloaded successfully",
      });
    } catch (error) {
      console.error('S&P 500 export failed:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export S&P 500 data",
        variant: "destructive",
      });
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportETHHistory = async () => {
    setExportLoading(true);
    try {
      toast({
        title: "Export Started",
        description: "Fetching ETH price history...",
      });

      await priceHistoryExportService.exportETHHistoricalData();
      
      toast({
        title: "Export Completed",
        description: "ETH 36-month price history downloaded successfully",
      });
    } catch (error) {
      console.error('ETH export failed:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export ETH data",
        variant: "destructive",
      });
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportSOLHistory = async () => {
    setExportLoading(true);
    try {
      toast({
        title: "Export Started",
        description: "Fetching SOL price history...",
      });

      await priceHistoryExportService.exportSOLHistoricalData();
      
      toast({
        title: "Export Completed",
        description: "SOL 36-month price history downloaded successfully",
      });
    } catch (error) {
      console.error('SOL export failed:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export SOL data",
        variant: "destructive",
      });
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportBetaCalculation = async () => {
    setExportLoading(true);
    try {
      toast({
        title: "Export Started",
        description: `Calculating beta for ${selectedCoinSymbol}...`,
      });

      const csvData = await betaCalculationExportService.downloadCalculationCSV(selectedCoinSymbol);
      
      // Create and download CSV file
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedCoinSymbol}_beta_calculation_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Completed",
        description: `Beta calculation data for ${selectedCoinSymbol} downloaded successfully`,
      });
    } catch (error) {
      console.error('Beta calculation export failed:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export beta calculation data",
        variant: "destructive",
      });
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex gap-2">
              {selectedCoinSymbol === 'BTC' && hasAccess && (
                <Button
                  onClick={handleExportBTCHistory}
                  disabled={exportLoading}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  {exportLoading ? 'Exporting...' : 'Export BTC Data'}
                </Button>
              )}
              {selectedCoinSymbol === 'ETH' && hasAccess && (
                <Button
                  onClick={handleExportETHHistory}
                  disabled={exportLoading}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  {exportLoading ? 'Exporting...' : 'Export ETH Data'}
                </Button>
              )}
              {selectedCoinSymbol === 'SOL' && hasAccess && (
                <Button
                  onClick={handleExportSOLHistory}
                  disabled={exportLoading}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  {exportLoading ? 'Exporting...' : 'Export SOL Data'}
                </Button>
              )}
              {hasAccess && (
                <Button
                  onClick={handleExportSP500History}
                  disabled={exportLoading}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  {exportLoading ? 'Exporting...' : 'Export S&P 500'}
                </Button>
              )}
              {hasAccess && (
                <Button
                  onClick={handleExportBetaCalculation}
                  disabled={exportLoading}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  {exportLoading ? 'Exporting...' : `Export ${selectedCoinSymbol} Beta`}
                </Button>
              )}
            </div>
          </div>
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
            <Tabs defaultValue="hybrid" className="space-y-6">
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
                <TabsTrigger value="hybrid" className="gap-2">
                  <Zap className="h-4 w-4" />
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs ml-1">
                    1000+ COINS
                  </Badge>
                  Hybrid Analysis
                </TabsTrigger>
                <TabsTrigger value="debug" className="gap-2">
                  <Calculator className="h-4 w-4" />
                  API Debug
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

              <TabsContent value="hybrid">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <HybridInvestmentForm 
                      onSubmit={handleHybridAnalysis}
                      loading={hybridLoading}
                      onCoinSelect={(coinData) => {
                        setSelectedCoinSymbol(coinData.symbol?.toUpperCase() || 'BTC');
                      }}
                    />
                  </div>
                  <div>
                    {hybridResult && (
                      <HybridAnalysisResults 
                        result={hybridResult}
                        onRecalculateNPV={handleRecalculateNPV}
                      />
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="debug">
                <CalculationDebugger />
              </TabsContent>

            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default CryptoAnalysis;
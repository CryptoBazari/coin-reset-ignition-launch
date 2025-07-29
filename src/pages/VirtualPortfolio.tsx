import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Navbar from '@/components/Navbar';
import AddTransactionDialog from '@/components/virtual-portfolio/AddTransactionDialog';
import CreatePortfolioDialog from '@/components/virtual-portfolio/CreatePortfolioDialog';
import SubscriptionButton from '@/components/subscription/SubscriptionButton';
import { useSubscription } from '@/hooks/useSubscription';
import { useRealTimePortfolio } from '@/hooks/useRealTimePortfolio';
import { useVirtualPortfolioAnalysis } from '@/hooks/useVirtualPortfolioAnalysis';
import { fetchCoinListings } from '@/services/coinMarketCapService';
import { realTimeDataService } from '@/services/realTimeDataService';
import { VirtualPortfolio as VirtualPortfolioType, VirtualAsset } from '@/types/virtualPortfolio';
import { Lock, Database, RefreshCw, CheckCircle, AlertCircle, Plus, TrendingUp, TrendingDown } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const VirtualPortfolio = () => {
  // Portfolio state
  const [portfolios, setPortfolios] = useState<VirtualPortfolioType[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [cryptoList, setCryptoList] = useState([]);
  const [dataQualityStatus, setDataQualityStatus] = useState<any>(null);
  const [initializingData, setInitializingData] = useState(false);
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});

  const { hasActiveSubscription, user } = useSubscription();
  const { portfolioData, refetch: refetchPortfolioData } = useRealTimePortfolio(selectedPortfolioId || '');
  const { analyzeVirtualPortfolio } = useVirtualPortfolioAnalysis();

  // Portfolio analysis results
  const [portfolioAnalysis, setPortfolioAnalysis] = useState<any>(null);
  const [avivData, setAvivData] = useState<any>(null);
  const [riskAnalysis, setRiskAnalysis] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    if (user && hasActiveSubscription) {
      fetchPortfolios();
      checkDataQuality();
      fetchCryptocurrencies();
    } else {
      setLoading(false);
    }
  }, [user, hasActiveSubscription]);

  useEffect(() => {
    if (selectedPortfolioId) {
      analyzePortfolio();
    }
  }, [selectedPortfolioId, portfolioData]);

  const fetchPortfolios = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('virtual_portfolios')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPortfolios(data || []);
      
      if (data && data.length > 0 && !selectedPortfolioId) {
        setSelectedPortfolioId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCryptocurrencies = async () => {
    try {
      const coins = await fetchCoinListings(100);
      setCryptoList(coins);
      
      // Extract current prices for holdings calculation
      const prices: Record<string, number> = {};
      coins.forEach((coin: any) => {
        prices[coin.symbol.toLowerCase()] = coin.current_price;
      });
      setCurrentPrices(prices);
    } catch (error) {
      console.error('Error fetching cryptocurrencies:', error);
    }
  };

  const analyzePortfolio = async () => {
    if (!selectedPortfolioId) return;

    try {
      const analysis = await analyzeVirtualPortfolio(selectedPortfolioId);
      if (analysis) {
        setPortfolioAnalysis(analysis);
        setRiskAnalysis(analysis.riskAnalysis);
        setRecommendations(analysis.riskAnalysis?.rebalanceRecommendations || []);
        
        // Extract AVIV data if available
        setAvivData({
          avivRatio: analysis.marketTiming?.bitcoinAvivRatio || 0,
          marketCondition: analysis.marketTiming?.recommendation || 'NEUTRAL'
        });
      }
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
    }
  };

  const checkDataQuality = async () => {
    try {
      const status = await realTimeDataService.getDataQualityStatus();
      setDataQualityStatus(status);
    } catch (error) {
      console.error('Error checking data quality:', error);
    }
  };

  const initializeRealDataPipeline = async () => {
    try {
      setInitializingData(true);
      const result = await realTimeDataService.initializeRealDataPipeline();
      
      if (result.success) {
        console.log('Real data pipeline initialized successfully:', result);
        await checkDataQuality();
      } else {
        console.error('Failed to initialize real data pipeline:', result.error);
      }
    } catch (error) {
      console.error('Error initializing real data pipeline:', error);
    } finally {
      setInitializingData(false);
    }
  };

  const selectedPortfolio = portfolios.find(p => p.id === selectedPortfolioId);
  const enhancedPortfolio = selectedPortfolio && portfolioData ? {
    ...selectedPortfolio,
    total_value: portfolioData.totalValue,
    all_time_profit: portfolioData.totalProfit
  } : selectedPortfolio;

  const handleTransactionSuccess = async () => {
    await fetchPortfolios();
    await refetchPortfolioData();
    await analyzePortfolio();
  };

  const isDataEmpty = dataQualityStatus && (
    dataQualityStatus.priceHistoryRecords === 0 || 
    dataQualityStatus.healthyCoins === 0
  );

  // Calculate portfolio metrics
  const portfolioValue = enhancedPortfolio?.total_value || 0;
  const totalInvestment = 1000; // Will be properly calculated after migration
  const unrealizedPL = enhancedPortfolio?.all_time_profit || 0;
  const realizedPL = 0; // Will be populated by migration service
  const roi = totalInvestment > 0 ? (unrealizedPL / totalInvestment) * 100 : 0;

  // Prepare data for allocation chart
  const allocationData = {
    labels: ['Bitcoin', 'Blue Chip', 'Small Cap'],
    datasets: [
      {
        data: riskAnalysis ? [
          riskAnalysis.allocations?.bitcoin || 0,
          riskAnalysis.allocations?.bluechip || 0,
          riskAnalysis.allocations?.smallcap || 0
        ] : [0, 0, 0],
        backgroundColor: [
          'hsl(var(--warning))',
          'hsl(var(--primary))', 
          'hsl(var(--accent))'
        ],
        borderColor: [
          'hsl(var(--warning))',
          'hsl(var(--primary))',
          'hsl(var(--accent))'
        ],
        borderWidth: 1
      }
    ]
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="text-center p-8">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <Lock className="h-16 w-16 text-muted-foreground" />
              </div>
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>
                Please sign in to access the virtual portfolio manager
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubscriptionButton feature="portfolio management" size="lg" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="text-center p-8">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <Lock className="h-16 w-16 text-muted-foreground" />
              </div>
              <CardTitle>Premium Feature</CardTitle>
              <CardDescription>
                Upgrade to access advanced virtual portfolio management tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubscriptionButton feature="portfolio management" size="lg" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading portfolios...</div>
          </div>
        </div>
      </div>
    );
  }

  if (portfolios.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Create Your First Portfolio</h2>
            <p className="text-muted-foreground mb-6">Start tracking your crypto investments</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Portfolio
            </Button>
          </div>
          <CreatePortfolioDialog
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            onSuccess={fetchPortfolios}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Data Quality Status */}
        {dataQualityStatus && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Real Data Pipeline Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{dataQualityStatus.totalCoins}</div>
                  <div className="text-sm text-muted-foreground">Total Coins</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{dataQualityStatus.healthyCoins}</div>
                  <div className="text-sm text-muted-foreground">Healthy APIs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{dataQualityStatus.priceHistoryRecords}</div>
                  <div className="text-sm text-muted-foreground">Price Records</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{dataQualityStatus.glassNodeMetricsRecords}</div>
                  <div className="text-sm text-muted-foreground">Glass Node Records</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={dataQualityStatus.dataQualityScore > 70 ? "default" : "destructive"}
                    className="flex items-center gap-1"
                  >
                    {dataQualityStatus.dataQualityScore > 70 ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <AlertCircle className="h-3 w-3" />
                    )}
                    Data Quality: {dataQualityStatus.dataQualityScore}%
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={checkDataQuality}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  
                  {isDataEmpty && (
                    <Button 
                      onClick={initializeRealDataPipeline}
                      disabled={initializingData}
                      className="flex items-center gap-2"
                    >
                      {initializingData ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Initializing...
                        </>
                      ) : (
                        <>
                          <Database className="h-4 w-4" />
                          Initialize Real Data
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {isDataEmpty && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your database is empty. Click "Initialize Real Data" to populate it with real market data, 
                    price history, and Glass Node metrics. This process may take a few minutes.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Portfolio Header */}
        <div className="mb-8 p-6 bg-card rounded-xl border">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">SALOME Portfolio</h1>
              <select 
                className="mt-2 p-2 border rounded-lg bg-background"
                value={selectedPortfolioId || ''}
                onChange={(e) => setSelectedPortfolioId(e.target.value)}
              >
                {portfolios.map(portfolio => (
                  <option key={portfolio.id} value={portfolio.id}>
                    {portfolio.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground">Portfolio Value</p>
              <p className="text-4xl font-bold">${portfolioValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
              <p className={`text-lg ${roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {roi.toFixed(2)}% ROI
              </p>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-muted-foreground">Total Investment</p>
              <p className="text-xl font-semibold">${totalInvestment.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-muted-foreground">Unrealized P/L</p>
              <p className={`text-xl font-semibold flex items-center gap-1 ${unrealizedPL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {unrealizedPL >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                ${unrealizedPL.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-muted-foreground">Realized P/L</p>
              <p className={`text-xl font-semibold flex items-center gap-1 ${realizedPL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {realizedPL >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                ${realizedPL.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </p>
            </div>
            <Button 
              onClick={() => setShowAddTransaction(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-lg flex items-center justify-center"
            >
              <Plus className="h-5 w-5 mr-1" />
              Add Transaction
            </Button>
          </div>
        </div>
        
        {/* Market Indicator */}
        {avivData && (
          <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-warning to-warning/80 text-warning-foreground">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Market Condition</h3>
                <p className="text-2xl font-bold">{avivData.marketCondition.replace(/_/g, ' ')}</p>
                <p className="text-sm mt-1">
                  {avivData.marketCondition === 'STRONG_BUY' 
                    ? 'Bitcoin AVIV indicates extreme undervaluation - maximum opportunity' 
                    : avivData.marketCondition === 'STRONG_SELL'
                    ? 'Bitcoin AVIV shows extreme overvaluation - reduce exposure'
                    : 'Market is in equilibrium - maintain positions'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm">Bitcoin AVIV</p>
                <p className="text-3xl font-mono">{avivData.avivRatio.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Portfolio Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Allocation Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Pie data={allocationData} />
              </div>
            </CardContent>
          </Card>
          
          {/* Risk Analysis */}
          {riskAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle>Risk Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Compliance Status:</span>
                    <span className={`font-bold ${riskAnalysis.complianceStatus === 'compliant' ? 'text-green-500' : 'text-red-500'}`}>
                      {riskAnalysis.complianceStatus?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Bitcoin:</span>
                      <span>{(riskAnalysis.allocations?.bitcoin || 0).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div 
                        className="bg-warning h-2.5 rounded-full" 
                        style={{ width: `${Math.min(riskAnalysis.allocations?.bitcoin || 0, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Blue Chip:</span>
                      <span>{(riskAnalysis.allocations?.bluechip || 0).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div 
                        className="bg-primary h-2.5 rounded-full" 
                        style={{ width: `${Math.min(riskAnalysis.allocations?.bluechip || 0, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Small Cap:</span>
                      <span>{(riskAnalysis.allocations?.smallcap || 0).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div 
                        className="bg-accent h-2.5 rounded-full" 
                        style={{ width: `${Math.min(riskAnalysis.allocations?.smallcap || 0, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              {recommendations.length > 0 ? (
                <div className="space-y-3">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="p-3 bg-muted rounded-lg border">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{rec.message || rec.recommendation}</p>
                          <p className="text-sm text-muted-foreground">{rec.action || rec.confidence}</p>
                        </div>
                        <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
                          HIGH
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-400 mb-2" />
                  <p>Your portfolio is compliant with risk guidelines</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Holdings Table */}
        {portfolioData?.assets && portfolioData.assets.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Asset Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Asset</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Holdings</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg. Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Market Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Unrealized P/L</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {portfolioData.assets.map((asset: any) => {
                      const unrealizedPL = asset.currentValue - (asset.totalAmount * asset.averagePrice);
                      
                      return (
                        <tr key={asset.coinId}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium">{asset.coinName}</div>
                                <div className="text-sm text-muted-foreground">{asset.coinSymbol}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={
                              asset.category === 'Bitcoin' ? 'default' :
                              asset.category === 'Blue Chip' ? 'secondary' : 'outline'
                            }>
                              {asset.category}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {asset.totalAmount.toLocaleString('en-US', { maximumFractionDigits: 8 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            ${asset.averagePrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            ${asset.currentPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            ${asset.currentValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                            unrealizedPL >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            ${unrealizedPL.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dialogs */}
        <CreatePortfolioDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={fetchPortfolios}
        />

        {selectedPortfolio && (
          <AddTransactionDialog
            open={showAddTransaction}
            onOpenChange={setShowAddTransaction}
            portfolioId={selectedPortfolio.id}
            onSuccess={handleTransactionSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default VirtualPortfolio;
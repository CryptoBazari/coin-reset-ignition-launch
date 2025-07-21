
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Navbar from '@/components/Navbar';
import PortfolioDashboard from '@/components/virtual-portfolio/PortfolioDashboard';
import AddTransactionDialog from '@/components/virtual-portfolio/AddTransactionDialog';
import TransactionHistory from '@/components/virtual-portfolio/TransactionHistory';
import EmptyPortfolioState from '@/components/virtual-portfolio/EmptyPortfolioState';
import CreatePortfolioDialog from '@/components/virtual-portfolio/CreatePortfolioDialog';
import SubscriptionButton from '@/components/subscription/SubscriptionButton';
import { useSubscription } from '@/hooks/useSubscription';
import { useRealTimePortfolio } from '@/hooks/useRealTimePortfolio';
import { realTimeDataService } from '@/services/realTimeDataService';
import { VirtualPortfolio as VirtualPortfolioType } from '@/types/virtualPortfolio';
import { Lock, Database, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

const VirtualPortfolio = () => {
  const [portfolios, setPortfolios] = useState<VirtualPortfolioType[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [dataQualityStatus, setDataQualityStatus] = useState<any>(null);
  const [initializingData, setInitializingData] = useState(false);
  const { hasActiveSubscription, user } = useSubscription();

  // Real-time portfolio data
  const { portfolioData, refetch: refetchPortfolioData } = useRealTimePortfolio(selectedPortfolioId || '');

  useEffect(() => {
    if (user && hasActiveSubscription) {
      fetchPortfolios();
      checkDataQuality();
    } else {
      setLoading(false);
    }
  }, [user, hasActiveSubscription]);

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
      
      // Auto-select first portfolio if none selected
      if (data && data.length > 0 && !selectedPortfolioId) {
        setSelectedPortfolioId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error);
    } finally {
      setLoading(false);
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
        await checkDataQuality(); // Refresh data quality status
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

  // Update portfolio with real-time data if available
  const enhancedPortfolio = selectedPortfolio && portfolioData ? {
    ...selectedPortfolio,
    total_value: portfolioData.totalValue,
    all_time_profit: portfolioData.totalProfit
  } : selectedPortfolio;

  const handleTransactionSuccess = async () => {
    await fetchPortfolios();
    await refetchPortfolioData();
  };

  const isDataEmpty = dataQualityStatus && (
    dataQualityStatus.priceHistoryRecords === 0 || 
    dataQualityStatus.healthyCoins === 0
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Virtual Portfolio</h1>
          <p className="text-muted-foreground text-lg">
            Track and analyze your crypto investments with advanced portfolio management tools
          </p>
        </div>

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

        {!user ? (
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
        ) : !hasActiveSubscription ? (
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
        ) : loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading portfolios...</div>
          </div>
        ) : portfolios.length === 0 ? (
          <EmptyPortfolioState onCreatePortfolio={() => setShowCreateDialog(true)} />
        ) : (
          <PortfolioDashboard
            portfolios={portfolios}
            selectedPortfolio={enhancedPortfolio!}
            selectedPortfolioId={selectedPortfolioId}
            onSelectPortfolio={setSelectedPortfolioId}
            onShowTransactionHistory={() => setShowTransactionHistory(true)}
            onAddTransaction={() => setShowAddTransaction(true)}
          />
        )}

        {/* Dialogs */}
        <CreatePortfolioDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={fetchPortfolios}
        />

        {selectedPortfolio && (
          <>
            <AddTransactionDialog
              open={showAddTransaction}
              onOpenChange={setShowAddTransaction}
              portfolioId={selectedPortfolio.id}
              onSuccess={handleTransactionSuccess}
            />

            <TransactionHistory
              open={showTransactionHistory}
              onOpenChange={setShowTransactionHistory}
              portfolioId={selectedPortfolio.id}
              onTransactionUpdated={handleTransactionSuccess}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default VirtualPortfolio;


import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import PortfolioDashboard from '@/components/virtual-portfolio/PortfolioDashboard';
import AddTransactionDialog from '@/components/virtual-portfolio/AddTransactionDialog';
import TransactionHistory from '@/components/virtual-portfolio/TransactionHistory';
import EmptyPortfolioState from '@/components/virtual-portfolio/EmptyPortfolioState';
import CreatePortfolioDialog from '@/components/virtual-portfolio/CreatePortfolioDialog';
import SubscriptionButton from '@/components/subscription/SubscriptionButton';
import { useSubscription } from '@/hooks/useSubscription';
import { useRealTimePortfolio } from '@/hooks/useRealTimePortfolio';
import { VirtualPortfolio as VirtualPortfolioType } from '@/types/virtualPortfolio';
import { Lock } from 'lucide-react';

const VirtualPortfolio = () => {
  const [portfolios, setPortfolios] = useState<VirtualPortfolioType[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const { hasActiveSubscription, user } = useSubscription();

  // Real-time portfolio data
  const { portfolioData, refetch: refetchPortfolioData } = useRealTimePortfolio(selectedPortfolioId || '');

  useEffect(() => {
    if (user && hasActiveSubscription) {
      fetchPortfolios();
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

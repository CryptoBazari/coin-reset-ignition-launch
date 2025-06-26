import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, Wallet, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PortfolioOverview from '@/components/virtual-portfolio/PortfolioOverview';
import CreatePortfolioDialog from '@/components/virtual-portfolio/CreatePortfolioDialog';
import AddTransactionDialog from '@/components/virtual-portfolio/AddTransactionDialog';
import TransactionHistory from '@/components/virtual-portfolio/TransactionHistory';
import AssetHoldings from '@/components/virtual-portfolio/AssetHoldings';
import { VirtualPortfolio as VirtualPortfolioType } from '@/types/virtualPortfolio';

const VirtualPortfolio = () => {
  const [showCreatePortfolio, setShowCreatePortfolio] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch user's portfolios
  const { data: portfolios, isLoading, refetch } = useQuery({
    queryKey: ['virtual-portfolios'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('virtual_portfolios' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as VirtualPortfolioType[];
    }
  });

  // Auto-select first portfolio if none selected
  if (portfolios && portfolios.length > 0 && !selectedPortfolioId) {
    setSelectedPortfolioId(portfolios[0].id);
  }

  const selectedPortfolio = portfolios?.find(p => p.id === selectedPortfolioId);

  const handleCreatePortfolio = () => {
    refetch();
    setShowCreatePortfolio(false);
    toast({
      title: "Portfolio Created",
      description: "Your new portfolio has been created successfully.",
    });
  };

  const handleTransactionAdded = () => {
    refetch();
    setShowAddTransaction(false);
    toast({
      title: "Transaction Added",
      description: "Your transaction has been recorded successfully.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading your portfolios...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Virtual Portfolio</h1>
            <p className="text-gray-600 mt-2">
              Practice cryptocurrency investing without financial risk
            </p>
          </div>
          <div className="flex gap-2">
            {!portfolios || portfolios.length === 0 ? (
              <Button onClick={() => setShowCreatePortfolio(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create First Portfolio
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShowCreatePortfolio(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Portfolio
                </Button>
                <Button onClick={() => setShowAddTransaction(true)} className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Add Transaction
                </Button>
              </>
            )}
          </div>
        </div>

        {!portfolios || portfolios.length === 0 ? (
          <Card className="text-center py-12">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Start Your Virtual Portfolio Journey</CardTitle>
              <CardDescription>
                Create your first portfolio to begin simulating cryptocurrency investments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowCreatePortfolio(true)} className="flex items-center gap-2 mx-auto">
                <Plus className="h-4 w-4" />
                Create Your First Portfolio
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Portfolio Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Selection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {portfolios.map(portfolio => (
                    <Button
                      key={portfolio.id}
                      variant={selectedPortfolioId === portfolio.id ? "default" : "outline"}
                      onClick={() => setSelectedPortfolioId(portfolio.id)}
                    >
                      {portfolio.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {selectedPortfolio && (
              <>
                {/* Portfolio Overview */}
                <PortfolioOverview portfolio={selectedPortfolio} />

                {/* Asset Holdings */}
                <AssetHoldings portfolioId={selectedPortfolio.id} />

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button onClick={() => setShowTransactionHistory(true)} variant="outline" className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Transaction History
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Dialogs */}
        <CreatePortfolioDialog
          open={showCreatePortfolio}
          onOpenChange={setShowCreatePortfolio}
          onSuccess={handleCreatePortfolio}
        />

        {selectedPortfolioId && (
          <>
            <AddTransactionDialog
              open={showAddTransaction}
              onOpenChange={setShowAddTransaction}
              portfolioId={selectedPortfolioId}
              onSuccess={handleTransactionAdded}
            />

            <TransactionHistory
              open={showTransactionHistory}
              onOpenChange={setShowTransactionHistory}
              portfolioId={selectedPortfolioId}
              onTransactionUpdated={() => refetch()}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default VirtualPortfolio;

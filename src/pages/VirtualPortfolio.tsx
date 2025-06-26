
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CreatePortfolioDialog from '@/components/virtual-portfolio/CreatePortfolioDialog';
import AddTransactionDialog from '@/components/virtual-portfolio/AddTransactionDialog';
import TransactionHistory from '@/components/virtual-portfolio/TransactionHistory';
import PortfolioHeader from '@/components/virtual-portfolio/PortfolioHeader';
import EmptyPortfolioState from '@/components/virtual-portfolio/EmptyPortfolioState';
import PortfolioDashboard from '@/components/virtual-portfolio/PortfolioDashboard';
import { VirtualPortfolio as VirtualPortfolioType } from '@/types/virtualPortfolio';

const VirtualPortfolio = () => {
  const navigate = useNavigate();
  const [showCreatePortfolio, setShowCreatePortfolio] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);  
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [user, setUser] = useState(null);
  const { toast } = useToast();

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
    };
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Fetch user's portfolios
  const { data: portfolios, isLoading, refetch } = useQuery({
    queryKey: ['virtual-portfolios', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      console.log('Fetching portfolios for user:', user.id);
      
      const { data, error } = await supabase
        .from('virtual_portfolios')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching portfolios:', error);
        throw error;
      }
      
      console.log('Fetched portfolios:', data);
      return data as unknown as VirtualPortfolioType[];
    },
    enabled: !!user
  });

  // Auto-select first portfolio if none selected
  useEffect(() => {
    if (portfolios && portfolios.length > 0 && !selectedPortfolioId) {
      setSelectedPortfolioId(portfolios[0].id);
      console.log('Auto-selected portfolio:', portfolios[0].id);
    }
  }, [portfolios, selectedPortfolioId]);

  const selectedPortfolio = portfolios?.find(p => p.id === selectedPortfolioId);
  const hasPortfolios = portfolios && portfolios.length > 0;

  const handleCreatePortfolio = () => {
    refetch();
    setShowCreatePortfolio(false);
    toast({
      title: "Portfolio Created",
      description: "Your new portfolio has been created successfully.",
    });
  };

  const handleTransactionAdded = () => {
    console.log('Transaction added, refreshing data...');
    refetch();
    setShowAddTransaction(false);
    toast({
      title: "Transaction Added",
      description: "Your transaction has been recorded successfully.",
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Checking authentication...</div>
          </div>
        </div>
      </div>
    );
  }

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
        <PortfolioHeader
          hasPortfolios={!!hasPortfolios}
          onCreatePortfolio={() => setShowCreatePortfolio(true)}
          onAddTransaction={() => setShowAddTransaction(true)}
        />

        {!hasPortfolios ? (
          <EmptyPortfolioState onCreatePortfolio={() => setShowCreatePortfolio(true)} />
        ) : (
          selectedPortfolio && (
            <PortfolioDashboard
              portfolios={portfolios}
              selectedPortfolio={selectedPortfolio}
              selectedPortfolioId={selectedPortfolioId}
              onSelectPortfolio={setSelectedPortfolioId}
              onShowTransactionHistory={() => setShowTransactionHistory(true)}
            />
          )
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

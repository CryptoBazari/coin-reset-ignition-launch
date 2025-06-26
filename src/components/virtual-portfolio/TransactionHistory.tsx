
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { portfolioService } from '@/services/portfolioService';
import { VirtualTransaction } from '@/types/virtualPortfolio';

interface TransactionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolioId: string;
  onTransactionUpdated: () => void;
}

const TransactionHistory = ({ open, onOpenChange, portfolioId, onTransactionUpdated }: TransactionHistoryProps) => {
  const { toast } = useToast();

  const { data: transactions, isLoading, refetch } = useQuery({
    queryKey: ['virtual-transactions', portfolioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('virtual_transactions')
        .select(`
          *,
          virtual_coins (symbol, name)
        `)
        .eq('portfolio_id', portfolioId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as VirtualTransaction[];
    },
    enabled: open
  });

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      await portfolioService.deleteTransaction(transactionId);
      refetch();
      onTransactionUpdated();
      toast({
        title: "Transaction Deleted",
        description: "Transaction has been removed successfully.",
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Error",
        description: "Failed to delete transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Bitcoin': return 'bg-orange-100 text-orange-800';
      case 'Blue Chip': return 'bg-blue-100 text-blue-800';
      case 'Small-Cap': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Transaction History</DialogTitle>
        </DialogHeader>
        
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-4">Loading transactions...</div>
          ) : !transactions || transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transactions yet. Add your first transaction to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">
                            {transaction.virtual_coins.symbol}
                          </span>
                          <Badge className={getTypeColor(transaction.transaction_type)}>
                            {transaction.transaction_type.toUpperCase()}
                          </Badge>
                          <Badge className={getCategoryColor(transaction.category)}>
                            {transaction.category}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {transaction.amount.toFixed(8)} @ ${transaction.price.toLocaleString()} = ${transaction.value.toFixed(2)}
                        </div>
                        {transaction.note && (
                          <div className="text-xs text-gray-500 mt-1">
                            {transaction.note}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm text-gray-600">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTransaction(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionHistory;

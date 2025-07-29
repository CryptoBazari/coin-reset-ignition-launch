
import { supabase } from '@/integrations/supabase/client';
import { TransactionData } from '@/types/portfolio';
import { portfolioTotalsService } from './portfolioTotalsService';

class VirtualTransactionService {
  async createTransaction(portfolioId: string, coinId: string, assetId: string, transactionData: TransactionData) {
    const { error: transactionError } = await supabase
      .from('virtual_transactions')
      .insert([{
        portfolio_id: portfolioId,
        coin_id: coinId,
        asset_id: assetId,
        transaction_type: transactionData.transaction_type,
        category: transactionData.category,
        amount: transactionData.amount,
        price: transactionData.price,
        value: transactionData.value,
        fee: transactionData.fee,
        note: transactionData.note
      }]);

    if (transactionError) throw transactionError;

    // Update portfolio totals and create snapshot after transaction
    await portfolioTotalsService.updatePortfolioTotals(portfolioId);
  }

  async getTransaction(transactionId: string) {
    const { data: transaction, error: fetchError } = await supabase
      .from('virtual_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (fetchError) throw fetchError;
    return transaction;
  }

  async deleteTransaction(transactionId: string) {
    // Get transaction details before deletion to update portfolio
    const transaction = await this.getTransaction(transactionId);
    
    const { error: deleteError } = await supabase
      .from('virtual_transactions')
      .delete()
      .eq('id', transactionId);

    if (deleteError) throw deleteError;

    // Update portfolio totals after transaction deletion
    await portfolioTotalsService.updatePortfolioTotals(transaction.portfolio_id);
  }
}

export const virtualTransactionService = new VirtualTransactionService();

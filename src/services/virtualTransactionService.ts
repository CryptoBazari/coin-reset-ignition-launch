
import { supabase } from '@/integrations/supabase/client';
import { TransactionData } from '@/types/portfolio';

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
    const { error: deleteError } = await supabase
      .from('virtual_transactions')
      .delete()
      .eq('id', transactionId);

    if (deleteError) throw deleteError;
  }
}

export const virtualTransactionService = new VirtualTransactionService();

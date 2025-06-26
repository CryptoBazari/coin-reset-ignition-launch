
import { supabase } from '@/integrations/supabase/client';
import { virtualCoinService } from './virtualCoinService';
import { virtualAssetService } from './virtualAssetService';
import { virtualTransactionService } from './virtualTransactionService';
import { portfolioTotalsService } from './portfolioTotalsService';
import { VirtualCoinData, TransactionData } from '@/types/portfolio';

class PortfolioService {
  async ensureVirtualCoin(coinData: VirtualCoinData) {
    return virtualCoinService.ensureVirtualCoin(coinData);
  }

  async addTransaction(portfolioId: string, transactionData: TransactionData) {
    console.log('Adding transaction:', { portfolioId, transactionData });

    try {
      // First ensure the coin exists
      const coinId = await this.ensureVirtualCoin({
        symbol: transactionData.coin_symbol,
        name: transactionData.coin_symbol,
      });

      console.log('Coin ensured with ID:', coinId);

      // Find or create asset
      const asset = await virtualAssetService.findOrCreateAsset(
        portfolioId, 
        coinId, 
        transactionData.category
      );

      console.log('Asset found/created:', asset);

      // Update asset based on transaction
      await virtualAssetService.updateAssetForTransaction(asset.id, asset, transactionData);

      console.log('Asset updated for transaction');

      // Add transaction record
      await virtualTransactionService.createTransaction(
        portfolioId, 
        coinId, 
        asset.id, 
        transactionData
      );

      console.log('Transaction record created');

      // Update portfolio totals
      await portfolioTotalsService.updatePortfolioTotals(portfolioId);

      console.log('Portfolio totals updated');
    } catch (error) {
      console.error('Error in addTransaction:', error);
      throw error;
    }
  }

  async deleteTransaction(transactionId: string) {
    console.log('Deleting transaction:', transactionId);
    
    try {
      // Get transaction details first
      const transaction = await virtualTransactionService.getTransaction(transactionId);

      // Get asset details
      const { data: asset, error: assetError } = await supabase
        .from('virtual_assets')
        .select('*')
        .eq('id', transaction.asset_id)
        .single();

      if (assetError) throw assetError;

      // Reverse the transaction effects
      await virtualAssetService.reverseAssetForTransaction(asset, transaction);

      // Delete transaction
      await virtualTransactionService.deleteTransaction(transactionId);

      // Update portfolio totals
      await portfolioTotalsService.updatePortfolioTotals(transaction.portfolio_id);
    } catch (error) {
      console.error('Error in deleteTransaction:', error);
      throw error;
    }
  }

  async updatePortfolioTotals(portfolioId: string) {
    return portfolioTotalsService.updatePortfolioTotals(portfolioId);
  }
}

export const portfolioService = new PortfolioService();

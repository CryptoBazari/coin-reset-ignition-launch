
import { supabase } from '@/integrations/supabase/client';
import { virtualCoinService } from './virtualCoinService';
import { virtualAssetService } from './virtualAssetService';
import { virtualTransactionService } from './virtualTransactionService';
import { portfolioTotalsService } from './portfolioTotalsService';
import { VirtualCoinData, TransactionData } from '@/types/portfolio';

class PortfolioService {
  async ensureVirtualCoin(coinData: VirtualCoinData) {
    console.log('PortfolioService: Ensuring virtual coin exists:', coinData);
    return virtualCoinService.ensureVirtualCoin(coinData);
  }

  async addTransaction(portfolioId: string, transactionData: TransactionData) {
    console.log('PortfolioService: Adding transaction:', { portfolioId, transactionData });

    try {
      // Validate required data
      if (!transactionData.coin_symbol || !transactionData.category) {
        throw new Error('Missing required transaction data: coin_symbol and category are required');
      }

      // First ensure the coin exists
      console.log('PortfolioService: Ensuring coin exists for symbol:', transactionData.coin_symbol);
      const coinId = await this.ensureVirtualCoin({
        symbol: transactionData.coin_symbol,
        name: transactionData.coin_symbol, // Use symbol as name if not provided
      });

      console.log('PortfolioService: Coin ensured with ID:', coinId);

      // Find or create asset - user chooses category, no automatic categorization
      console.log('PortfolioService: Finding or creating asset with user-selected category:', transactionData.category);
      const asset = await virtualAssetService.findOrCreateAsset(
        portfolioId, 
        coinId, 
        transactionData.category
      );

      console.log('PortfolioService: Asset found/created:', asset);

      // Update asset based on transaction
      console.log('PortfolioService: Updating asset for transaction');
      await virtualAssetService.updateAssetForTransaction(asset.id, asset, transactionData);

      console.log('PortfolioService: Asset updated successfully');

      // Add transaction record
      console.log('PortfolioService: Creating transaction record');
      await virtualTransactionService.createTransaction(
        portfolioId, 
        coinId, 
        asset.id, 
        transactionData
      );

      console.log('PortfolioService: Transaction record created successfully');

      // Update portfolio totals
      console.log('PortfolioService: Updating portfolio totals');
      await portfolioTotalsService.updatePortfolioTotals(portfolioId);

      console.log('PortfolioService: Portfolio totals updated successfully');
    } catch (error) {
      console.error('PortfolioService: Detailed error in addTransaction:', error);
      
      // Re-throw with more context
      if (error instanceof Error) {
        throw new Error(`Failed to add transaction: ${error.message}`);
      } else {
        throw new Error('Failed to add transaction: Unknown error occurred');
      }
    }
  }

  async deleteTransaction(transactionId: string) {
    console.log('PortfolioService: Deleting transaction:', transactionId);
    
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
      console.error('PortfolioService: Error in deleteTransaction:', error);
      throw error;
    }
  }

  async updatePortfolioTotals(portfolioId: string) {
    console.log('PortfolioService: Updating portfolio totals for:', portfolioId);
    return portfolioTotalsService.updatePortfolioTotals(portfolioId);
  }
}

export const portfolioService = new PortfolioService();


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

    // First ensure the coin exists
    const coinId = await this.ensureVirtualCoin({
      symbol: transactionData.coin_symbol,
      name: transactionData.coin_symbol,
    });

    // Find or create asset
    const asset = await virtualAssetService.findOrCreateAsset(
      portfolioId, 
      coinId, 
      transactionData.category
    );

    // Update asset based on transaction
    await virtualAssetService.updateAssetForTransaction(asset.id, asset, transactionData);

    // Add transaction record
    await virtualTransactionService.createTransaction(
      portfolioId, 
      coinId, 
      asset.id, 
      transactionData
    );

    // Update portfolio totals
    await portfolioTotalsService.updatePortfolioTotals(portfolioId);
  }

  async deleteTransaction(transactionId: string) {
    console.log('Deleting transaction:', transactionId);
    
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
  }

  async updatePortfolioTotals(portfolioId: string) {
    return portfolioTotalsService.updatePortfolioTotals(portfolioId);
  }
}

export const portfolioService = new PortfolioService();

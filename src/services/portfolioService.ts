
import { supabase } from '@/integrations/supabase/client';

export interface TransactionData {
  coin_id: string;
  transaction_type: 'buy' | 'sell';
  category: 'Bitcoin' | 'Blue Chip' | 'Small-Cap';
  amount: number;
  price: number;
  value: number;
  fee?: number;
  note?: string | null;
}

class PortfolioService {
  async addTransaction(portfolioId: string, transactionData: TransactionData) {
    console.log('Adding transaction:', { portfolioId, transactionData });

    // Get or create asset
    const { data: existingAsset } = await supabase
      .from('virtual_assets')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .eq('coin_id', transactionData.coin_id)
      .eq('category', transactionData.category)
      .single();

    let asset = existingAsset;

    if (!asset) {
      // Create new asset
      const { data: newAsset, error: assetError } = await supabase
        .from('virtual_assets')
        .insert([{
          portfolio_id: portfolioId,
          coin_id: transactionData.coin_id,
          category: transactionData.category,
          total_amount: 0,
          average_price: 0,
          cost_basis: 0,
          realized_profit: 0
        }])
        .select()
        .single();

      if (assetError) throw assetError;
      asset = newAsset;
    }

    // Calculate new asset values based on transaction type
    let newAmount = asset.total_amount;
    let newCostBasis = asset.cost_basis;
    let newRealizedProfit = asset.realized_profit;
    let newAveragePrice = asset.average_price;

    if (transactionData.transaction_type === 'buy') {
      newAmount += transactionData.amount;
      newCostBasis += transactionData.value;
      newAveragePrice = newAmount > 0 ? newCostBasis / newAmount : 0;
    } else {
      // Sell transaction
      if (newAmount < transactionData.amount) {
        throw new Error('Insufficient holdings for sell transaction');
      }
      
      const sellProfit = (transactionData.price - asset.average_price) * transactionData.amount;
      newRealizedProfit += sellProfit;
      
      const proportionalCostBasis = (transactionData.amount / newAmount) * newCostBasis;
      newCostBasis -= proportionalCostBasis;
      newAmount -= transactionData.amount;
      
      if (newAmount <= 0) {
        newAmount = 0;
        newCostBasis = 0;
        newAveragePrice = 0;
      }
    }

    // Update asset
    const { error: updateError } = await supabase
      .from('virtual_assets')
      .update({
        total_amount: newAmount,
        cost_basis: newCostBasis,
        average_price: newAveragePrice,
        realized_profit: newRealizedProfit,
        updated_at: new Date().toISOString()
      })
      .eq('id', asset.id);

    if (updateError) throw updateError;

    // Insert transaction
    const { error: transactionError } = await supabase
      .from('virtual_transactions')
      .insert([{
        portfolio_id: portfolioId,
        coin_id: transactionData.coin_id,
        asset_id: asset.id,
        transaction_type: transactionData.transaction_type,
        category: transactionData.category,
        amount: transactionData.amount,
        price: transactionData.price,
        value: transactionData.value,
        fee: transactionData.fee || 0,
        note: transactionData.note
      }]);

    if (transactionError) throw transactionError;

    // Update portfolio metrics
    await this.updatePortfolioMetrics(portfolioId);
  }

  async deleteTransaction(transactionId: string) {
    console.log('Deleting transaction:', transactionId);

    // Get transaction details
    const { data: transaction, error: getError } = await supabase
      .from('virtual_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (getError) throw getError;
    if (!transaction) throw new Error('Transaction not found');

    // Get associated asset
    const { data: asset, error: assetError } = await supabase
      .from('virtual_assets')
      .select('*')
      .eq('id', transaction.asset_id)
      .single();

    if (assetError) throw assetError;
    if (!asset) throw new Error('Asset not found');

    // Reverse the transaction effects
    let newAmount = asset.total_amount;
    let newCostBasis = asset.cost_basis;
    let newRealizedProfit = asset.realized_profit;
    let newAveragePrice = asset.average_price;

    if (transaction.transaction_type === 'buy') {
      // Reverse buy transaction
      newAmount -= transaction.amount;
      newCostBasis -= transaction.value;
      
      if (newAmount <= 0) {
        newAmount = 0;
        newCostBasis = 0;
        newAveragePrice = 0;
      } else {
        newAveragePrice = newCostBasis / newAmount;
      }
    } else {
      // Reverse sell transaction
      const sellProfit = (transaction.price - asset.average_price) * transaction.amount;
      newRealizedProfit -= sellProfit;
      newAmount += transaction.amount;
      
      const proportionalCostBasis = (transaction.amount / (newAmount - transaction.amount)) * (newCostBasis);
      newCostBasis += proportionalCostBasis;
      newAveragePrice = newAmount > 0 ? newCostBasis / newAmount : 0;
    }

    // Update or delete asset
    if (newAmount <= 0) {
      // Delete asset if no holdings remain
      const { error: deleteAssetError } = await supabase
        .from('virtual_assets')
        .delete()
        .eq('id', asset.id);

      if (deleteAssetError) throw deleteAssetError;
    } else {
      // Update asset
      const { error: updateError } = await supabase
        .from('virtual_assets')
        .update({
          total_amount: newAmount,
          cost_basis: newCostBasis,
          average_price: newAveragePrice,
          realized_profit: newRealizedProfit,
          updated_at: new Date().toISOString()
        })
        .eq('id', asset.id);

      if (updateError) throw updateError;
    }

    // Delete transaction
    const { error: deleteError } = await supabase
      .from('virtual_transactions')
      .delete()
      .eq('id', transactionId);

    if (deleteError) throw deleteError;

    // Update portfolio metrics
    await this.updatePortfolioMetrics(transaction.portfolio_id);
  }

  async updatePortfolioMetrics(portfolioId: string) {
    console.log('Updating portfolio metrics for:', portfolioId);

    // Calculate total value and realized profit from assets
    const { data: assets, error: assetsError } = await supabase
      .from('virtual_assets')
      .select('*')
      .eq('portfolio_id', portfolioId);

    if (assetsError) throw assetsError;

    const totalValue = assets?.reduce((sum: number, asset: any) => {
      return sum + (asset.total_amount * asset.average_price);
    }, 0) || 0;

    const allTimeProfit = assets?.reduce((sum: number, asset: any) => {
      return sum + asset.realized_profit;
    }, 0) || 0;

    // Update portfolio
    const { error: updateError } = await supabase
      .from('virtual_portfolios')
      .update({
        total_value: totalValue,
        all_time_profit: allTimeProfit,
        updated_at: new Date().toISOString()
      })
      .eq('id', portfolioId);

    if (updateError) throw updateError;
  }
}

export const portfolioService = new PortfolioService();

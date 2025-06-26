
import { supabase } from '@/integrations/supabase/client';
import { TransactionData } from '@/types/portfolio';

class VirtualAssetService {
  async findOrCreateAsset(portfolioId: string, coinId: string, category: string) {
    const { data: existingAsset } = await supabase
      .from('virtual_assets')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .eq('coin_id', coinId)
      .eq('category', category)
      .maybeSingle();

    if (existingAsset) {
      return existingAsset;
    }

    const { data: newAsset, error: assetError } = await supabase
      .from('virtual_assets')
      .insert([{
        portfolio_id: portfolioId,
        coin_id: coinId,
        category,
        total_amount: 0,
        average_price: 0,
        cost_basis: 0,
        realized_profit: 0
      }])
      .select()
      .single();

    if (assetError) throw assetError;
    return newAsset;
  }

  async updateAssetForTransaction(assetId: string, currentAsset: any, transactionData: TransactionData) {
    let newTotalAmount: number;
    let newCostBasis: number;
    let newAveragePrice: number;
    let newRealizedProfit = currentAsset.realized_profit;

    if (transactionData.transaction_type === 'buy') {
      newTotalAmount = currentAsset.total_amount + transactionData.amount;
      newCostBasis = currentAsset.cost_basis + transactionData.value + transactionData.fee;
      newAveragePrice = newTotalAmount > 0 ? newCostBasis / newTotalAmount : 0;
    } else {
      // Sell transaction
      newTotalAmount = Math.max(0, currentAsset.total_amount - transactionData.amount);
      const sellValue = transactionData.value - transactionData.fee;
      const costBasisReduction = currentAsset.average_price * transactionData.amount;
      newCostBasis = Math.max(0, currentAsset.cost_basis - costBasisReduction);
      newRealizedProfit = currentAsset.realized_profit + (sellValue - costBasisReduction);
      newAveragePrice = currentAsset.average_price; // Keep same average price
    }

    console.log('Calculated new asset values:', {
      newTotalAmount,
      newCostBasis,
      newAveragePrice,
      newRealizedProfit
    });

    const { error: updateError } = await supabase
      .from('virtual_assets')
      .update({
        total_amount: newTotalAmount,
        cost_basis: newCostBasis,
        average_price: newAveragePrice,
        realized_profit: newRealizedProfit,
        updated_at: new Date().toISOString()
      })
      .eq('id', assetId);

    if (updateError) throw updateError;
  }

  async reverseAssetForTransaction(asset: any, transaction: any) {
    let newTotalAmount: number;
    let newCostBasis: number;
    let newAveragePrice: number;
    let newRealizedProfit = asset.realized_profit;

    if (transaction.transaction_type === 'buy') {
      // Reverse a buy
      newTotalAmount = Math.max(0, asset.total_amount - transaction.amount);
      newCostBasis = Math.max(0, asset.cost_basis - transaction.value - transaction.fee);
      newAveragePrice = newTotalAmount > 0 ? newCostBasis / newTotalAmount : 0;
    } else {
      // Reverse a sell
      newTotalAmount = asset.total_amount + transaction.amount;
      const costBasisIncrease = asset.average_price * transaction.amount;
      newCostBasis = asset.cost_basis + costBasisIncrease;
      const sellValue = transaction.value - transaction.fee;
      newRealizedProfit = asset.realized_profit - (sellValue - costBasisIncrease);
      newAveragePrice = asset.average_price;
    }

    const { error: updateError } = await supabase
      .from('virtual_assets')
      .update({
        total_amount: newTotalAmount,
        cost_basis: newCostBasis,
        average_price: newAveragePrice,
        realized_profit: newRealizedProfit,
        updated_at: new Date().toISOString()
      })
      .eq('id', asset.id);

    if (updateError) throw updateError;
  }
}

export const virtualAssetService = new VirtualAssetService();

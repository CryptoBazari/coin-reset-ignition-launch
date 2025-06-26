import { supabase } from '@/integrations/supabase/client';
import { TransactionData } from '@/types/portfolio';

class VirtualAssetService {
  async findOrCreateAsset(portfolioId: string, coinId: string, category: string) {
    console.log('VirtualAssetService: Finding or creating asset:', { portfolioId, coinId, category });
    
    // Validate inputs
    if (!portfolioId || !coinId || !category) {
      throw new Error('Missing required parameters for asset creation');
    }

    try {
      const { data: existingAsset, error: findError } = await supabase
        .from('virtual_assets')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .eq('coin_id', coinId)
        .eq('category', category)
        .maybeSingle();

      if (findError) {
        console.error('VirtualAssetService: Error finding existing asset:', findError);
        throw findError;
      }

      if (existingAsset) {
        console.log('VirtualAssetService: Found existing asset:', existingAsset.id);
        return existingAsset;
      }

      console.log('VirtualAssetService: Creating new asset');
      const { data: newAsset, error: createError } = await supabase
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

      if (createError) {
        console.error('VirtualAssetService: Error creating asset:', createError);
        throw createError;
      }
      
      console.log('VirtualAssetService: Created new asset:', newAsset.id);
      return newAsset;
    } catch (error) {
      console.error('VirtualAssetService: Error in findOrCreateAsset:', error);
      throw error;
    }
  }

  async updateAssetForTransaction(assetId: string, currentAsset: any, transactionData: TransactionData) {
    console.log('VirtualAssetService: Updating asset for transaction:', { assetId, transactionData });
    
    try {
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

      console.log('VirtualAssetService: Calculated new asset values:', {
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

      if (updateError) {
        console.error('VirtualAssetService: Error updating asset:', updateError);
        throw updateError;
      }
      
      console.log('VirtualAssetService: Asset updated successfully');
    } catch (error) {
      console.error('VirtualAssetService: Error in updateAssetForTransaction:', error);
      throw error;
    }
  }

  async reverseAssetForTransaction(asset: any, transaction: any) {
    console.log('Reversing asset for transaction:', { asset, transaction });
    
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

    if (updateError) {
      console.error('Error reversing asset:', updateError);
      throw updateError;
    }
    
    console.log('Asset reversed successfully');
  }
}

export const virtualAssetService = new VirtualAssetService();

import { supabase } from '@/integrations/supabase/client';

export interface VirtualCoinData {
  symbol: string;
  name: string;
}

export interface TransactionData {
  coin_symbol: string;
  transaction_type: 'buy' | 'sell';
  category: 'Bitcoin' | 'Blue Chip' | 'Small-Cap';
  amount: number;
  price: number;
  value: number;
  fee: number;
  note: string | null;
}

class PortfolioService {
  async ensureVirtualCoin(coinData: VirtualCoinData) {
    console.log('Ensuring virtual coin exists:', coinData);
    
    // Check if coin already exists
    const { data: existingCoin } = await supabase
      .from('virtual_coins')
      .select('id')
      .eq('symbol', coinData.symbol)
      .maybeSingle();

    if (existingCoin) {
      console.log('Coin already exists:', existingCoin.id);
      return existingCoin.id;
    }

    // Create new coin - only include fields that exist in the table
    const insertData = {
      symbol: coinData.symbol,
      name: coinData.name
    };

    const { data: newCoin, error } = await supabase
      .from('virtual_coins')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating virtual coin:', error);
      throw error;
    }
    
    console.log('Created new coin:', newCoin.id);
    return newCoin.id;
  }

  async addTransaction(portfolioId: string, transactionData: TransactionData) {
    console.log('Adding transaction:', { portfolioId, transactionData });

    // First ensure the coin exists
    const coinId = await this.ensureVirtualCoin({
      symbol: transactionData.coin_symbol,
      name: transactionData.coin_symbol,
    });

    // Find or create asset
    const { data: existingAsset } = await supabase
      .from('virtual_assets')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .eq('coin_id', coinId)
      .eq('category', transactionData.category)
      .maybeSingle();

    let assetId: string;

    if (existingAsset) {
      assetId = existingAsset.id;
    } else {
      const { data: newAsset, error: assetError } = await supabase
        .from('virtual_assets')
        .insert([{
          portfolio_id: portfolioId,
          coin_id: coinId,
          category: transactionData.category,
          total_amount: 0,
          average_price: 0,
          cost_basis: 0,
          realized_profit: 0
        }])
        .select()
        .single();

      if (assetError) throw assetError;
      assetId = newAsset.id;
    }

    // Calculate new values based on transaction type
    const currentAsset = existingAsset || {
      total_amount: 0,
      average_price: 0,
      cost_basis: 0,
      realized_profit: 0
    };

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

    // Update asset
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

    // Add transaction record
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

    // Update portfolio totals
    await this.updatePortfolioTotals(portfolioId);
  }

  async updatePortfolioTotals(portfolioId: string) {
    console.log('Updating portfolio totals for:', portfolioId);
    
    const { data: assets, error } = await supabase
      .from('virtual_assets')
      .select('*')
      .eq('portfolio_id', portfolioId);

    if (error) throw error;

    // Calculate total value using current market values (average_price * total_amount)
    const totalValue = assets.reduce((sum, asset) => {
      const currentValue = asset.total_amount * asset.average_price;
      return sum + currentValue;
    }, 0);

    // Calculate total realized profit
    const allTimeProfit = assets.reduce((sum, asset) => {
      return sum + asset.realized_profit;
    }, 0);

    console.log('Calculated portfolio totals:', { totalValue, allTimeProfit });

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

  async deleteTransaction(transactionId: string) {
    console.log('Deleting transaction:', transactionId);
    
    // Get transaction details first
    const { data: transaction, error: fetchError } = await supabase
      .from('virtual_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (fetchError) throw fetchError;

    // Reverse the transaction effects
    const { data: asset, error: assetError } = await supabase
      .from('virtual_assets')
      .select('*')
      .eq('id', transaction.asset_id)
      .single();

    if (assetError) throw assetError;

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

    // Update asset
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

    // Delete transaction
    const { error: deleteError } = await supabase
      .from('virtual_transactions')
      .delete()
      .eq('id', transactionId);

    if (deleteError) throw deleteError;

    // Update portfolio totals
    await this.updatePortfolioTotals(transaction.portfolio_id);
  }
}

export const portfolioService = new PortfolioService();

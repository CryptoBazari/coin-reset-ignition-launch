import { supabase } from '@/integrations/supabase/client';
import { portfolioTotalsService } from './portfolioTotalsService';

class HistoricalSnapshotService {
  async generateHistoricalSnapshots(portfolioId: string, daysToGenerate: number = 30) {
    console.log(`Generating ${daysToGenerate} days of historical snapshots for portfolio: ${portfolioId}`);
    
    try {
      // Get all transactions for this portfolio to reconstruct historical values
      const { data: transactions, error: txError } = await supabase
        .from('virtual_transactions')
        .select(`
          *,
          virtual_coins (symbol, name)
        `)
        .eq('portfolio_id', portfolioId)
        .order('transaction_date', { ascending: true });

      if (txError) throw txError;

      if (!transactions || transactions.length === 0) {
        console.log('No transactions found, skipping historical snapshot generation');
        return { success: true, generated: 0 };
      }

      const snapshots = [];
      
      for (let i = daysToGenerate; i >= 1; i--) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - i);
        const targetDateStr = targetDate.toISOString().split('T')[0];
        
        // Check if snapshot already exists
        const { data: existingSnapshot } = await supabase
          .from('portfolio_daily_snapshots')
          .select('id')
          .eq('portfolio_id', portfolioId)
          .eq('snapshot_date', targetDateStr)
          .maybeSingle();

        if (existingSnapshot) {
          console.log(`Snapshot already exists for ${targetDateStr}, skipping`);
          continue;
        }

        // Calculate portfolio value at this historical date
        const portfolioValue = this.calculatePortfolioValueAtDate(transactions, targetDate);
        
        // Get previous day's value for change calculation
        const previousDate = new Date(targetDate);
        previousDate.setDate(previousDate.getDate() - 1);
        const previousValue = this.calculatePortfolioValueAtDate(transactions, previousDate);
        
        const dayChange = portfolioValue - previousValue;
        const dayChangePercent = previousValue > 0 ? (dayChange / previousValue) * 100 : 0;

        snapshots.push({
          portfolio_id: portfolioId,
          snapshot_date: targetDateStr,
          total_value: portfolioValue,
          total_profit: portfolioValue - this.calculateCostBasisAtDate(transactions, targetDate),
          day_change: dayChange,
          day_change_percent: dayChangePercent,
          asset_breakdown: []
        });
      }

      if (snapshots.length > 0) {
        const { error: insertError } = await supabase
          .from('portfolio_daily_snapshots')
          .insert(snapshots);

        if (insertError) throw insertError;
        
        console.log(`Generated ${snapshots.length} historical snapshots`);
      }

      return { success: true, generated: snapshots.length };
    } catch (error) {
      console.error('Error generating historical snapshots:', error);
      throw error;
    }
  }

  private calculatePortfolioValueAtDate(transactions: any[], targetDate: Date): number {
    // Filter transactions up to target date
    const relevantTransactions = transactions.filter(tx => 
      new Date(tx.transaction_date) <= targetDate
    );

    // Calculate asset holdings at this date
    const holdings = new Map();
    
    relevantTransactions.forEach(tx => {
      const symbol = tx.virtual_coins.symbol;
      const currentHolding = holdings.get(symbol) || { amount: 0, totalCost: 0 };
      
      if (tx.transaction_type === 'buy') {
        currentHolding.amount += tx.amount;
        currentHolding.totalCost += tx.value;
      } else if (tx.transaction_type === 'sell') {
        const sellRatio = tx.amount / currentHolding.amount;
        currentHolding.amount -= tx.amount;
        currentHolding.totalCost -= currentHolding.totalCost * sellRatio;
      }
      
      holdings.set(symbol, currentHolding);
    });

    // For simplicity, use the average price from transactions as historical price
    // In a real scenario, you'd fetch historical price data
    let totalValue = 0;
    holdings.forEach((holding, symbol) => {
      if (holding.amount > 0) {
        const avgPrice = holding.totalCost / holding.amount;
        totalValue += holding.amount * avgPrice;
      }
    });

    return totalValue;
  }

  private calculateCostBasisAtDate(transactions: any[], targetDate: Date): number {
    const relevantTransactions = transactions.filter(tx => 
      new Date(tx.transaction_date) <= targetDate && tx.transaction_type === 'buy'
    );

    return relevantTransactions.reduce((total, tx) => total + tx.value, 0);
  }
}

export const historicalSnapshotService = new HistoricalSnapshotService();
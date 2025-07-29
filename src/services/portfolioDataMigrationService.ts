import { supabase } from '@/integrations/supabase/client';
import { portfolioTotalsService } from './portfolioTotalsService';

class PortfolioDataMigrationService {
  async migrateExistingPortfolios() {
    console.log('Starting portfolio data migration...');
    
    try {
      // Get all existing portfolios
      const { data: portfolios, error } = await supabase
        .from('virtual_portfolios')
        .select('id, name, user_id, total_invested, realized_profit, unrealized_profit');

      if (error) {
        console.error('Error fetching portfolios for migration:', error);
        throw error;
      }

      if (!portfolios || portfolios.length === 0) {
        console.log('No portfolios found for migration');
        return { success: true, processed: 0, message: 'No portfolios to migrate' };
      }

      console.log(`Found ${portfolios.length} portfolios to migrate`);

      let processedCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Process each portfolio
      for (const portfolio of portfolios) {
        try {
          console.log(`Migrating portfolio: ${portfolio.name} (ID: ${portfolio.id})`);
          
          // Call the portfolio totals service to recalculate everything
          await portfolioTotalsService.updatePortfolioTotals(portfolio.id);
          
          processedCount++;
          console.log(`✅ Successfully migrated portfolio: ${portfolio.name}`);
        } catch (error) {
          errorCount++;
          const errorMessage = `Failed to migrate portfolio ${portfolio.name} (${portfolio.id}): ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMessage);
          errors.push(errorMessage);
        }
      }

      const result = {
        success: errorCount === 0,
        processed: processedCount,
        errors: errorCount,
        errorDetails: errors,
        message: `Migration completed. Processed: ${processedCount}, Errors: ${errorCount}`
      };

      console.log('Portfolio migration completed:', result);
      return result;
    } catch (error) {
      console.error('Portfolio migration failed:', error);
      throw error;
    }
  }

  async migrateSpecificPortfolio(portfolioId: string) {
    console.log(`Starting migration for specific portfolio: ${portfolioId}`);
    
    try {
      // Verify portfolio exists
      const { data: portfolio, error } = await supabase
        .from('virtual_portfolios')
        .select('id, name, user_id')
        .eq('id', portfolioId)
        .single();

      if (error || !portfolio) {
        throw new Error(`Portfolio not found: ${portfolioId}`);
      }

      console.log(`Migrating portfolio: ${portfolio.name}`);
      
      // Recalculate portfolio totals
      await portfolioTotalsService.updatePortfolioTotals(portfolioId);
      
      console.log(`✅ Successfully migrated portfolio: ${portfolio.name}`);
      
      return {
        success: true,
        portfolioId,
        portfolioName: portfolio.name,
        message: `Portfolio ${portfolio.name} migrated successfully`
      };
    } catch (error) {
      console.error(`Failed to migrate portfolio ${portfolioId}:`, error);
      throw error;
    }
  }
}

export const portfolioDataMigrationService = new PortfolioDataMigrationService();
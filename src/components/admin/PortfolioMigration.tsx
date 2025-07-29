import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { portfolioDataMigrationService } from '@/services/portfolioDataMigrationService';
import { toast } from 'sonner';

const PortfolioMigration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [specificPortfolioId, setSpecificPortfolioId] = useState('');
  const [migrationResult, setMigrationResult] = useState<any>(null);

  const handleMigrateAll = async () => {
    setIsLoading(true);
    setMigrationResult(null);
    
    try {
      const result = await portfolioDataMigrationService.migrateExistingPortfolios();
      setMigrationResult(result);
      
      if (result.success) {
        toast.success(`Migration completed successfully! Processed ${result.processed} portfolios.`);
      } else {
        toast.error(`Migration completed with ${'errors' in result ? result.errors : 0} errors. Check details below.`);
      }
    } catch (error) {
      console.error('Migration failed:', error);
      toast.error('Migration failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleMigrateSpecific = async () => {
    if (!specificPortfolioId.trim()) {
      toast.error('Please enter a portfolio ID');
      return;
    }

    setIsLoading(true);
    setMigrationResult(null);
    
    try {
      const result = await portfolioDataMigrationService.migrateSpecificPortfolio(specificPortfolioId.trim());
      setMigrationResult(result);
      toast.success(`Portfolio "${result.portfolioName}" migrated successfully!`);
    } catch (error) {
      console.error('Specific migration failed:', error);
      toast.error('Migration failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Portfolio Data Migration
        </CardTitle>
        <CardDescription>
          Recalculate portfolio totals and create daily snapshots for existing portfolios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This will recalculate total_invested, realized_profit, and unrealized_profit for all portfolios.
            It will also create daily snapshots needed for performance tracking.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium mb-2">Migrate All Portfolios</h4>
            <Button 
              onClick={handleMigrateAll} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Migrating...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Migrate All Portfolios
                </>
              )}
            </Button>
          </div>

          <div className="border-t pt-3">
            <h4 className="text-sm font-medium mb-2">Migrate Specific Portfolio</h4>
            <div className="flex gap-2">
              <Input
                placeholder="Enter portfolio ID"
                value={specificPortfolioId}
                onChange={(e) => setSpecificPortfolioId(e.target.value)}
                disabled={isLoading}
              />
              <Button 
                onClick={handleMigrateSpecific} 
                disabled={isLoading || !specificPortfolioId.trim()}
                variant="outline"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Migrate'
                )}
              </Button>
            </div>
          </div>
        </div>

        {migrationResult && (
          <Alert className={migrationResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <div className="flex items-center gap-2">
              {migrationResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">{migrationResult.message}</p>
                  {'processed' in migrationResult && migrationResult.processed && (
                    <p className="text-sm">Processed: {migrationResult.processed} portfolios</p>
                  )}
                  {'errors' in migrationResult && migrationResult.errors > 0 && (
                    <div className="text-sm space-y-1">
                      <p className="text-red-600">Errors: {migrationResult.errors}</p>
                      {'errorDetails' in migrationResult && migrationResult.errorDetails && migrationResult.errorDetails.map((error: string, index: number) => (
                        <p key={index} className="text-xs text-red-500 pl-2">• {error}</p>
                      ))}
                    </div>
                  )}
                  {migrationResult.portfolioName && (
                    <p className="text-sm">Portfolio: {migrationResult.portfolioName}</p>
                  )}
                </div>
              </AlertDescription>
            </div>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioMigration;
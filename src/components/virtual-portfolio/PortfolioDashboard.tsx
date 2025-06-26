
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';
import { VirtualPortfolio } from '@/types/virtualPortfolio';
import PortfolioOverview from './PortfolioOverview';
import AssetHoldings from './AssetHoldings';
import PortfolioSelection from './PortfolioSelection';
import PortfolioAllocationChart from './PortfolioAllocationChart';
import PortfolioMovementChart from './PortfolioMovementChart';

interface PortfolioDashboardProps {
  portfolios: VirtualPortfolio[];
  selectedPortfolio: VirtualPortfolio;
  selectedPortfolioId: string | null;
  onSelectPortfolio: (portfolioId: string) => void;
  onShowTransactionHistory: () => void;
}

const PortfolioDashboard = ({ 
  portfolios, 
  selectedPortfolio, 
  selectedPortfolioId, 
  onSelectPortfolio, 
  onShowTransactionHistory 
}: PortfolioDashboardProps) => {
  return (
    <div className="space-y-6">
      {/* Portfolio Selection */}
      <PortfolioSelection
        portfolios={portfolios}
        selectedPortfolioId={selectedPortfolioId}
        onSelectPortfolio={onSelectPortfolio}
      />

      {/* Portfolio Overview */}
      <PortfolioOverview portfolio={selectedPortfolio} />

      {/* Charts Section - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PortfolioAllocationChart portfolioId={selectedPortfolio.id} />
        <PortfolioMovementChart portfolioId={selectedPortfolio.id} />
      </div>

      {/* Asset Holdings */}
      <AssetHoldings portfolioId={selectedPortfolio.id} />

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button onClick={onShowTransactionHistory} variant="outline" className="flex items-center gap-2">
          <History className="h-4 w-4" />
          Transaction History
        </Button>
      </div>
    </div>
  );
};

export default PortfolioDashboard;

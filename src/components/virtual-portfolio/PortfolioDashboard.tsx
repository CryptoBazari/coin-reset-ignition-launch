
import { useState } from 'react';
import { VirtualPortfolio } from '@/types/virtualPortfolio';
import PortfolioOverview from './PortfolioOverview';
import AssetHoldings from './AssetHoldings';
import PortfolioSelection from './PortfolioSelection';
import PortfolioAllocationChart from './PortfolioAllocationChart';
import PortfolioMovementChart from './PortfolioMovementChart';
import PortfolioMetrics from './PortfolioMetrics';
import QuickActions from './QuickActions';
import PortfolioComparison from './PortfolioComparison';
import AdvancedAnalytics from './AdvancedAnalytics';
import AnalyticsSummary from './AnalyticsSummary';
import RiskAnalysisCard from './RiskAnalysisCard';
import PortfolioAnalysisModal from './PortfolioAnalysisModal';

interface PortfolioDashboardProps {
  portfolios: VirtualPortfolio[];
  selectedPortfolio: VirtualPortfolio;
  selectedPortfolioId: string | null;
  onSelectPortfolio: (portfolioId: string) => void;
  onShowTransactionHistory: () => void;
  onAddTransaction: () => void;
}

const PortfolioDashboard = ({ 
  portfolios, 
  selectedPortfolio, 
  selectedPortfolioId, 
  onSelectPortfolio, 
  onShowTransactionHistory,
  onAddTransaction
}: PortfolioDashboardProps) => {
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  const handleAnalyzePortfolio = () => {
    setShowAnalysisModal(true);
  };

  const handleExportData = () => {
    // TODO: Implement export functionality
    console.log('Export data functionality to be implemented');
  };

  const handleSharePortfolio = () => {
    // TODO: Implement share functionality
    console.log('Share portfolio functionality to be implemented');
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Selection */}
      <PortfolioSelection
        portfolios={portfolios}
        selectedPortfolioId={selectedPortfolioId}
        onSelectPortfolio={onSelectPortfolio}
      />

      {/* Enhanced Portfolio Metrics */}
      <PortfolioMetrics
        totalValue={selectedPortfolio.total_value}
        allTimeProfit={selectedPortfolio.all_time_profit}
        dayChange={0} // TODO: Calculate from real data
        dayChangePercent={0} // TODO: Calculate from real data
      />

      {/* Quick Actions */}
      <QuickActions
        onAddTransaction={onAddTransaction}
        onShowTransactionHistory={onShowTransactionHistory}
        onAnalyzePortfolio={handleAnalyzePortfolio}
        onExportData={handleExportData}
        onSharePortfolio={handleSharePortfolio}
      />

      {/* Portfolio Overview */}
      <PortfolioOverview portfolio={selectedPortfolio} />

      {/* Charts Section - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PortfolioAllocationChart portfolioId={selectedPortfolio.id} />
        <PortfolioMovementChart portfolioId={selectedPortfolio.id} />
      </div>

      {/* Analytics Summary */}
      <AnalyticsSummary portfolioId={selectedPortfolio.id} />

      {/* Risk Analysis */}
      <RiskAnalysisCard portfolioId={selectedPortfolio.id} />

      {/* Advanced Analytics Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <PortfolioComparison 
          portfolios={portfolios}
          currentPortfolioId={selectedPortfolio.id}
        />
        <AdvancedAnalytics portfolioId={selectedPortfolio.id} />
      </div>

      {/* Asset Holdings */}
      <AssetHoldings portfolioId={selectedPortfolio.id} />

      {/* Analysis Modal */}
      <PortfolioAnalysisModal
        open={showAnalysisModal}
        onOpenChange={setShowAnalysisModal}
        portfolioId={selectedPortfolio.id}
        portfolioName={selectedPortfolio.name}
      />
    </div>
  );
};

export default PortfolioDashboard;

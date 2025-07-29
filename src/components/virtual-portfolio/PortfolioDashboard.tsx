
import { useState, useEffect } from 'react';
import { VirtualPortfolio } from '@/types/virtualPortfolio';
import { portfolioPerformanceCalculator, PortfolioPerformanceData } from '@/services/portfolioPerformanceCalculator';
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
  const [performanceData, setPerformanceData] = useState<PortfolioPerformanceData | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch performance data when portfolio changes
  useEffect(() => {
    if (selectedPortfolioId) {
      setLoading(true);
      portfolioPerformanceCalculator.getPortfolioPerformanceData(selectedPortfolioId)
        .then(data => {
          setPerformanceData(data);
        })
        .catch(error => {
          console.error('Error fetching performance data:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [selectedPortfolioId]);

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
      {loading ? (
        <div className="text-center py-8">Loading performance data...</div>
      ) : (
        <PortfolioMetrics
          totalValue={performanceData?.totalValue || selectedPortfolio.total_value}
          allTimeProfit={performanceData?.allTimeProfit || selectedPortfolio.all_time_profit}
          dayChange={performanceData?.dayChange || 0}
          dayChangePercent={performanceData?.dayChangePercent || 0}
          totalInvested={performanceData?.totalInvested || 0}
          monthlyReturn={performanceData?.monthlyReturn || 0}
          yearlyReturn={performanceData?.yearlyReturn || 0}
        />
      )}

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


import { Button } from '@/components/ui/button';
import { Plus, TrendingUp } from 'lucide-react';

interface PortfolioHeaderProps {
  hasPortfolios: boolean;
  onCreatePortfolio: () => void;
  onAddTransaction: () => void;
}

const PortfolioHeader = ({ hasPortfolios, onCreatePortfolio, onAddTransaction }: PortfolioHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Virtual Portfolio</h1>
        <p className="text-gray-600 mt-2">
          Practice cryptocurrency investing without financial risk
        </p>
      </div>
      <div className="flex gap-2">
        {!hasPortfolios ? (
          <Button onClick={onCreatePortfolio} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create First Portfolio
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={onCreatePortfolio} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Portfolio
            </Button>
            <Button onClick={onAddTransaction} className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Add Transaction
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default PortfolioHeader;

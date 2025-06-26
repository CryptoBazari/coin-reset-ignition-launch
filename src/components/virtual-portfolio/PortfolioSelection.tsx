
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VirtualPortfolio } from '@/types/virtualPortfolio';

interface PortfolioSelectionProps {
  portfolios: VirtualPortfolio[];
  selectedPortfolioId: string | null;
  onSelectPortfolio: (portfolioId: string) => void;
}

const PortfolioSelection = ({ portfolios, selectedPortfolioId, onSelectPortfolio }: PortfolioSelectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Selection</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 flex-wrap">
          {portfolios.map(portfolio => (
            <Button
              key={portfolio.id}
              variant={selectedPortfolioId === portfolio.id ? "default" : "outline"}
              onClick={() => onSelectPortfolio(portfolio.id)}
            >
              {portfolio.name}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioSelection;

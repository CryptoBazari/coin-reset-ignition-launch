
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Wallet } from 'lucide-react';

interface EmptyPortfolioStateProps {
  onCreatePortfolio: () => void;
}

const EmptyPortfolioState = ({ onCreatePortfolio }: EmptyPortfolioStateProps) => {
  return (
    <Card className="text-center py-12">
      <CardHeader>
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Wallet className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle>Start Your Virtual Portfolio Journey</CardTitle>
        <CardDescription>
          Create your first portfolio to begin simulating cryptocurrency investments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={onCreatePortfolio} className="flex items-center gap-2 mx-auto">
          <Plus className="h-4 w-4" />
          Create Your First Portfolio
        </Button>
      </CardContent>
    </Card>
  );
};

export default EmptyPortfolioState;

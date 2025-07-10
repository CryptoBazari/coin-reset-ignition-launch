import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Wallet, ArrowRight } from "lucide-react";

interface Portfolio {
  id: string;
  name: string;
  total_value: number;
  all_time_profit: number;
}

interface PortfolioOverviewProps {
  portfolios: Portfolio[];
}

const PortfolioOverview = ({ portfolios }: PortfolioOverviewProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Your Portfolios
        </CardTitle>
        <CardDescription>
          Recent virtual portfolio activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        {portfolios.length > 0 ? (
          <div className="space-y-4">
            {portfolios.map((portfolio) => (
              <div key={portfolio.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{portfolio.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Total Value: ${portfolio.total_value?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    portfolio.all_time_profit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {portfolio.all_time_profit >= 0 ? '+' : ''}
                    ${portfolio.all_time_profit?.toLocaleString() || '0'}
                  </p>
                  <p className="text-xs text-muted-foreground">P&L</p>
                </div>
              </div>
            ))}
            <Button asChild className="w-full" variant="outline">
              <Link to="/virtual-portfolio">
                View All Portfolios <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="text-center py-8">
            <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-medium mb-2">No portfolios yet</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first virtual portfolio to start tracking investments
            </p>
            <Button asChild>
              <Link to="/virtual-portfolio">Create Portfolio</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioOverview;
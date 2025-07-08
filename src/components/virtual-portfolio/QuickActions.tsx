import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, TrendingUp, Download, Share2, Calculator, History } from 'lucide-react';

interface QuickActionsProps {
  onAddTransaction: () => void;
  onShowTransactionHistory: () => void;
  onAnalyzePortfolio?: () => void;
  onExportData?: () => void;
  onSharePortfolio?: () => void;
}

const QuickActions = ({
  onAddTransaction,
  onShowTransactionHistory,
  onAnalyzePortfolio,
  onExportData,
  onSharePortfolio
}: QuickActionsProps) => {
  const actions = [
    {
      title: "Add Transaction",
      description: "Record a new buy or sell",
      icon: Plus,
      onClick: onAddTransaction,
      variant: "default" as const,
      className: "bg-blue-600 hover:bg-blue-700"
    },
    {
      title: "View History",
      description: "See all transactions",
      icon: History,
      onClick: onShowTransactionHistory,
      variant: "outline" as const
    },
    {
      title: "Analyze",
      description: "Get portfolio insights",
      icon: Calculator,
      onClick: onAnalyzePortfolio,
      variant: "outline" as const,
      disabled: !onAnalyzePortfolio
    },
    {
      title: "Export",
      description: "Download portfolio data",
      icon: Download,
      onClick: onExportData,
      variant: "outline" as const,
      disabled: !onExportData
    },
    {
      title: "Share",
      description: "Share portfolio view",
      icon: Share2,
      onClick: onSharePortfolio,
      variant: "outline" as const,
      disabled: !onSharePortfolio
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              onClick={action.onClick}
              disabled={action.disabled}
              className={`h-auto p-4 flex flex-col items-center gap-2 ${action.className || ''}`}
            >
              <action.icon className="h-5 w-5" />
              <div className="text-center">
                <div className="font-medium text-sm">{action.title}</div>
                <div className="text-xs opacity-80">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
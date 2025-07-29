import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Play
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Recommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: 'market' | 'allocation' | 'risk' | 'opportunity';
  message: string;
  action: string;
}

interface PortfolioRecommendationsProps {
  recommendations: Recommendation[];
  portfolioId: string;
}

export default function PortfolioRecommendations({ 
  recommendations, 
  portfolioId 
}: PortfolioRecommendationsProps) {
  const [executing, setExecuting] = useState<string | null>(null);
  const { toast } = useToast();

  const executeAction = async (recommendation: Recommendation, index: number) => {
    setExecuting(`${recommendation.type}-${index}`);
    
    try {
      // For demonstration, we'll show a toast instead of actual execution
      // In production, this would call the execute-actions function
      
      const { data, error } = await supabase.functions.invoke('execute-actions', {
        body: {
          action: recommendation.type,
          portfolioId,
          params: {
            message: recommendation.message,
            action: recommendation.action
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Action Executed",
        description: `${recommendation.action} - This is a simulation`,
        duration: 3000
      });
      
    } catch (error) {
      console.error('Action execution failed:', error);
      toast({
        title: "Execution Failed", 
        description: error.message || "Failed to execute action",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setExecuting(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'market': return <TrendingUp className="h-4 w-4" />;
      case 'allocation': return <Target className="h-4 w-4" />;
      case 'risk': return <Shield className="h-4 w-4" />;
      case 'opportunity': return <TrendingDown className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Portfolio Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              No specific recommendations at this time. Your portfolio appears well-balanced for current market conditions.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          Recommended Actions
          <Badge variant="secondary">{recommendations.length}</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {recommendations.map((rec, index) => (
          <div 
            key={index} 
            className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={getPriorityColor(rec.priority)}>
                    {rec.priority.toUpperCase()}
                  </Badge>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    {getTypeIcon(rec.type)}
                    <span className="text-sm capitalize">{rec.type}</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground">{rec.message}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{rec.action}</p>
                </div>
              </div>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => executeAction(rec, index)}
                disabled={executing !== null}
                className="ml-4 flex-shrink-0"
              >
                {executing === `${rec.type}-${index}` ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1"></div>
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 mr-1" />
                    Execute
                  </>
                )}
              </Button>
            </div>
            
            {rec.priority === 'critical' && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  This is a critical recommendation that requires immediate attention based on current market conditions.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ))}
        
        <div className="pt-4 border-t text-center">
          <p className="text-xs text-muted-foreground">
            Recommendations are based on Bitcoin AVIV analysis, portfolio tier rules, and current market conditions.
            All actions are simulated for demonstration purposes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
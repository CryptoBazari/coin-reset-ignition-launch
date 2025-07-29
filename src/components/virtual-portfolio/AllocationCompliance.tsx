import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react';

interface AllocationComplianceProps {
  allocations: {
    bitcoin: number;
    bluechip: number;
    smallcap: number;
  };
  rules: {
    minBtc: number;
    maxBluechip: number;
    maxSmallcap: number;
  };
  complianceStatus: string;
  issues: string[];
}

export default function AllocationCompliance({ 
  allocations, 
  rules, 
  complianceStatus, 
  issues 
}: AllocationComplianceProps) {
  const complianceItems = [
    { 
      label: "Bitcoin", 
      current: allocations.bitcoin, 
      required: rules.minBtc,
      type: "min" as const,
      compliant: allocations.bitcoin >= rules.minBtc
    },
    { 
      label: "Blue-Chip", 
      current: allocations.bluechip, 
      required: rules.maxBluechip,
      type: "max" as const,
      compliant: allocations.bluechip <= rules.maxBluechip
    },
    { 
      label: "Small-Cap", 
      current: allocations.smallcap, 
      required: rules.maxSmallcap,
      type: "max" as const,
      compliant: allocations.smallcap <= rules.maxSmallcap
    }
  ];

  const isCompliant = complianceStatus === 'compliant';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Allocation Compliance
          </div>
          <Badge variant={isCompliant ? "default" : "destructive"}>
            {isCompliant ? (
              <CheckCircle className="h-3 w-3 mr-1" />
            ) : (
              <AlertTriangle className="h-3 w-3 mr-1" />
            )}
            {isCompliant ? 'Compliant' : 'Non-Compliant'}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {complianceItems.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">{item.label}</span>
                {item.compliant ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                )}
              </div>
              <div className="text-right">
                <span className="font-semibold">
                  {Math.round(item.current * 100)}%
                </span>
                <span className="text-sm text-muted-foreground ml-1">
                  {item.type === 'min' ? 'of' : 'max'} {Math.round(item.required * 100)}%
                </span>
              </div>
            </div>
            
            <div className="relative">
              <Progress 
                value={item.current * 100} 
                className={`h-3 ${!item.compliant ? 'bg-red-100' : ''}`}
              />
              
              {/* Requirement line */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-border"
                style={{ left: `${item.required * 100}%` }}
              >
                <div className="absolute -top-1 left-0 w-3 h-5 bg-border transform -translate-x-1/2">
                  <div className="text-xs font-mono text-center mt-1">
                    {item.type === 'min' ? '▲' : '▼'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {item.type === 'min' ? 'Minimum' : 'Maximum'} required: {Math.round(item.required * 100)}%
              {!item.compliant && (
                <span className="text-orange-600 ml-2">
                  ({item.type === 'min' ? 'Too low' : 'Too high'})
                </span>
              )}
            </div>
          </div>
        ))}

        {!isCompliant && issues.length > 0 && (
          <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h4 className="font-semibold text-orange-800 mb-2">Compliance Issues:</h4>
            <ul className="space-y-1">
              {issues.map((issue, index) => (
                <li key={index} className="text-sm text-orange-700 flex items-start gap-2">
                  <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}

        {isCompliant && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="font-semibold">Portfolio is fully compliant</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              All allocation rules are satisfied based on your portfolio tier and current market conditions.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
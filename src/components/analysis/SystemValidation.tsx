import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Zap } from 'lucide-react';
import { validateEnhancedFinancialSystem, testEnhancedCashFlows, testBasketAllocationRules } from '@/utils/validationUtils';

interface ValidationResult {
  generateCashFlowsFixed: boolean;
  cagrCalculationFixed: boolean;
  basketAllocationRulesActive: boolean;
  betaIntegrationActive: boolean;
  enhancedRecommendationsActive: boolean;
  enhancedMetricsActive: boolean;
}

export const SystemValidation: React.FC = () => {
  const [validationResults, setValidationResults] = useState<ValidationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    runValidation();
  }, []);

  const runValidation = async () => {
    setIsRunning(true);
    try {
      // Run comprehensive system validation
      const results = validateEnhancedFinancialSystem();
      const cashFlowTest = testEnhancedCashFlows();
      const allocationTest = testBasketAllocationRules();
      
      setValidationResults(results);
      
      // Log detailed test results
      console.log('💯 Enhanced Financial System Validation Complete');
      console.log('Cash Flow Tests:', cashFlowTest);
      console.log('Allocation Rules:', allocationTest);
      
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? 
      <CheckCircle className="w-5 h-5 text-success" /> : 
      <XCircle className="w-5 h-5 text-destructive" />;
  };

  const getStatusBadge = (status: boolean) => {
    return (
      <Badge variant={status ? 'default' : 'destructive'}>
        {status ? 'Active' : 'Failed'}
      </Badge>
    );
  };

  if (!validationResults) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 animate-pulse" />
            Running System Validation...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Validating enhanced financial system components...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const allSystemsOperational = Object.values(validationResults).every(Boolean);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Phase 2-4 Enhanced System Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Status */}
        <Alert variant={allSystemsOperational ? 'default' : 'destructive'}>
          <div className="flex items-center gap-2">
            {allSystemsOperational ? 
              <CheckCircle className="w-4 h-4" /> : 
              <AlertTriangle className="w-4 h-4" />
            }
            <AlertDescription>
              <strong>
                {allSystemsOperational 
                  ? '🎉 All Enhanced Systems Operational!' 
                  : '⚠️ System Issues Detected'
                }
              </strong>
              <br />
              {allSystemsOperational 
                ? 'Phase 2-4 critical fixes and enhancements are active and functional.'
                : 'Some enhanced features may not be working correctly.'
              }
            </AlertDescription>
          </div>
        </Alert>

        {/* Detailed Component Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-semibold">Phase 2: Critical Fixes</h4>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(validationResults.generateCashFlowsFixed)}
                <span className="text-sm">Enhanced Cash Flow Generation</span>
              </div>
              {getStatusBadge(validationResults.generateCashFlowsFixed)}
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(validationResults.cagrCalculationFixed)}
                <span className="text-sm">Fixed CAGR Calculation</span>
              </div>
              {getStatusBadge(validationResults.cagrCalculationFixed)}
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(validationResults.basketAllocationRulesActive)}
                <span className="text-sm">Basket Allocation Rules</span>
              </div>
              {getStatusBadge(validationResults.basketAllocationRulesActive)}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Phase 3-4: Enhancements</h4>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(validationResults.betaIntegrationActive)}
                <span className="text-sm">Beta Risk Analysis</span>
              </div>
              {getStatusBadge(validationResults.betaIntegrationActive)}
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(validationResults.enhancedRecommendationsActive)}
                <span className="text-sm">Enhanced Recommendations</span>
              </div>
              {getStatusBadge(validationResults.enhancedRecommendationsActive)}
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(validationResults.enhancedMetricsActive)}
                <span className="text-sm">Enhanced Financial Metrics</span>
              </div>
              {getStatusBadge(validationResults.enhancedMetricsActive)}
            </div>
          </div>
        </div>

        {/* Key Improvements Summary */}
        <div>
          <h4 className="font-semibold mb-3">Key Improvements Active</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span>Cash flows now use coin quantity with compounding staking</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span>CAGR separated into price appreciation vs total return</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span>Basket allocation rules: 60% Bitcoin, 40% Blue-chip, 15% Small-cap</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span>Beta risk analysis with systematic risk calculation</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span>Enhanced recommendation logic with market overlays</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span>Risk-adjusted NPV using CAPM methodology</span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="p-4 bg-muted/30 rounded-lg">
          <h4 className="font-semibold mb-2">System Performance</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Components Loaded:</span>
              <span className="font-semibold ml-2">
                {Object.values(validationResults).filter(Boolean).length}/6
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Success Rate:</span>
              <span className="font-semibold ml-2">
                {Math.round((Object.values(validationResults).filter(Boolean).length / 6) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button 
            onClick={runValidation}
            disabled={isRunning}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50"
          >
            {isRunning ? 'Running...' : 'Re-validate System'}
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
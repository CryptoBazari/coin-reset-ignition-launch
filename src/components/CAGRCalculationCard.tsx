
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, Database, Clock, TestTube } from 'lucide-react';
import type { RealTimeCAGRResult } from '@/services/realTimeCAGRCalculationService';

interface CAGRCalculationCardProps {
  cagrDetails: RealTimeCAGRResult;
}

export const CAGRCalculationCard: React.FC<CAGRCalculationCardProps> = ({ cagrDetails }) => {
  const getConfidenceBadgeColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDataSourceBadgeColor = (dataSource: string) => {
    switch (dataSource) {
      case 'glassnode':
        return 'bg-blue-100 text-blue-800';
      case 'database':
        return 'bg-purple-100 text-purple-800';
      case 'test_data':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDataSourceIcon = (dataSource: string) => {
    switch (dataSource) {
      case 'glassnode':
        return <TrendingUp className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'test_data':
        return <TestTube className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getDataSourceLabel = (dataSource: string) => {
    switch (dataSource) {
      case 'glassnode':
        return 'LIVE GLASSNODE DATA';
      case 'database':
        return 'HISTORICAL DATABASE';
      case 'test_data':
        return 'REALISTIC TEST DATA';
      default:
        return 'UNKNOWN DATA SOURCE';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-blue-600" />
          CAGR Calculation Details
          <div className="flex items-center gap-1">
            {getDataSourceIcon(cagrDetails.dataSource)}
            <Badge variant="outline" className={getDataSourceBadgeColor(cagrDetails.dataSource)}>
              {getDataSourceLabel(cagrDetails.dataSource)}
            </Badge>
          </div>
          <Badge variant="outline" className={getConfidenceBadgeColor(cagrDetails.confidence)}>
            {cagrDetails.confidence.toUpperCase()} CONFIDENCE
          </Badge>
        </CardTitle>
        <CardDescription>
          7-step CAGR calculation using {cagrDetails.dataPoints} data points from {cagrDetails.dataSource}
          {cagrDetails.dataSource === 'test_data' && (
            <span className="text-orange-600 font-medium"> • Test data used due to API limitations</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* CAGR Result */}
          <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-700">
              {cagrDetails.cagr.toFixed(2)}%
            </div>
            <div className="text-sm text-blue-600">
              Compound Annual Growth Rate ({cagrDetails.timeperiodYears.toFixed(2)} years)
            </div>
          </div>

          {/* Data Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Initial Value</span>
              </div>
              <div className="text-xl font-bold text-green-700">
                ${cagrDetails.initialValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Final Value</span>
              </div>
              <div className="text-xl font-bold text-blue-700">
                ${cagrDetails.finalValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Clock className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Time Period</span>
              </div>
              <div className="text-xl font-bold text-purple-700">
                {cagrDetails.timeperiodYears.toFixed(2)} years
              </div>
            </div>
          </div>

          {/* 7-Step Calculation Breakdown */}
          <div>
            <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              7-Step CAGR Formula Breakdown
            </h5>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded">
                <span className="text-sm font-medium">Step 1: Initial Value</span>
                <span className="font-bold text-blue-700">
                  ${cagrDetails.calculationSteps.step1_initialValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 px-3 bg-green-50 rounded">
                <span className="text-sm font-medium">Step 2: Final Value</span>
                <span className="font-bold text-green-700">
                  ${cagrDetails.calculationSteps.step2_finalValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 px-3 bg-purple-50 rounded">
                <span className="text-sm font-medium">Step 3: Time Period (n)</span>
                <span className="font-bold text-purple-700">
                  {cagrDetails.calculationSteps.step3_timeperiodYears.toFixed(3)} years
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 px-3 bg-orange-50 rounded">
                <span className="text-sm font-medium">Step 4: Growth Ratio (FV/IV)</span>
                <span className="font-bold text-orange-700">
                  {cagrDetails.calculationSteps.step4_growthRatio.toFixed(6)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 px-3 bg-indigo-50 rounded">
                <span className="text-sm font-medium">Step 5: Exponent (1/n)</span>
                <span className="font-bold text-indigo-700">
                  {cagrDetails.calculationSteps.step5_exponent.toFixed(6)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 px-3 bg-teal-50 rounded">
                <span className="text-sm font-medium">Step 6: CAGR Base (Ratio^Exponent)</span>
                <span className="font-bold text-teal-700">
                  {cagrDetails.calculationSteps.step6_cagrBase.toFixed(6)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 px-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded border-2 border-blue-200">
                <span className="text-sm font-medium">Step 7: Final CAGR ((Base-1)*100)</span>
                <span className="font-bold text-xl text-blue-700">
                  {cagrDetails.calculationSteps.step7_finalCAGR.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Data Quality Information */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              {getDataSourceIcon(cagrDetails.dataSource)}
              <span>
                Data Quality: {cagrDetails.dataPoints} data points over {cagrDetails.timeperiodYears.toFixed(2)} years from {cagrDetails.dataSource} • Confidence: {cagrDetails.confidence}
                {cagrDetails.dataSource === 'test_data' && (
                  <span className="text-orange-600 font-medium"> • Realistic test data used when live APIs are unavailable</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

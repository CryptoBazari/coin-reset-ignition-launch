
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, Database, Clock, TestTube } from 'lucide-react';
import type { StandaloneCAGRResult } from '@/services/standaloneCAGRCalculationService';

interface CAGRCalculationCardProps {
  cagrDetails: StandaloneCAGRResult;
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
    <Card className="w-full">
      <CardHeader className="p-2 sm:p-3 lg:p-4">
        <CardTitle className="flex flex-col gap-1 sm:gap-2 text-xs sm:text-sm lg:text-base">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <Calculator className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-blue-600 shrink-0" />
            <span className="truncate text-xs sm:text-sm lg:text-base font-semibold">CAGR Calculation Details</span>
          </div>
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 sm:h-4 sm:w-4 shrink-0">
                {getDataSourceIcon(cagrDetails.dataSource)}
              </div>
              <Badge variant="outline" className={`${getDataSourceBadgeColor(cagrDetails.dataSource)} text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1`}>
                {getDataSourceLabel(cagrDetails.dataSource)}
              </Badge>
            </div>
            <Badge variant="outline" className={`${getConfidenceBadgeColor(cagrDetails.confidence)} text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1`}>
              {cagrDetails.confidence.toUpperCase()} CONFIDENCE
            </Badge>
          </div>
        </CardTitle>
        <CardDescription className="text-[10px] sm:text-xs lg:text-sm leading-relaxed mt-1">
          7-step CAGR calculation using {cagrDetails.dataPoints} data points from {cagrDetails.dataSource}
          {cagrDetails.dataSource === 'test_data' && (
            <span className="text-orange-600 font-medium"> • Test data used due to API limitations</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
        <div className="space-y-4 sm:space-y-6">
          {/* CAGR Results - Basic and Adjusted */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg min-w-0">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-700 whitespace-nowrap">
                {cagrDetails.basic.toFixed(2)}%
              </div>
              <div className="text-xs sm:text-sm text-blue-600">
                Basic CAGR ({cagrDetails.timeperiodYears.toFixed(2)} years)
              </div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200 min-w-0">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-700 whitespace-nowrap">
                {cagrDetails.adjusted.toFixed(2)}%
              </div>
              <div className="text-xs sm:text-sm text-purple-600">
                Volatility-Adjusted CAGR (Primary)
              </div>
            </div>
          </div>

          {/* Data Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center p-2 sm:p-3 bg-slate-50 rounded-lg min-w-0">
              <div className="flex items-center justify-center gap-1 mb-1 sm:mb-2">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 shrink-0" />
                <span className="text-xs sm:text-sm font-medium truncate">Start Price</span>
              </div>
              <div className="text-sm sm:text-lg font-bold text-green-700 truncate" title={`$${cagrDetails.startPrice.toLocaleString()}`}>
                ${cagrDetails.startPrice < 1 
                  ? cagrDetails.startPrice.toFixed(4)
                  : cagrDetails.startPrice.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2
                    })
                }
              </div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-slate-50 rounded-lg min-w-0">
              <div className="flex items-center justify-center gap-1 mb-1 sm:mb-2">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 shrink-0" />
                <span className="text-xs sm:text-sm font-medium truncate">End Price</span>
              </div>
              <div className="text-sm sm:text-lg font-bold text-blue-700 truncate" title={`$${cagrDetails.endPrice.toLocaleString()}`}>
                ${cagrDetails.endPrice < 1 
                  ? cagrDetails.endPrice.toFixed(4)
                  : cagrDetails.endPrice.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2
                    })
                }
              </div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-slate-50 rounded-lg min-w-0">
              <div className="flex items-center justify-center gap-1 mb-1 sm:mb-2">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 shrink-0" />
                <span className="text-xs sm:text-sm font-medium truncate">90D Volatility</span>
              </div>
              <div className="text-sm sm:text-lg font-bold text-purple-700 whitespace-nowrap">
                {(cagrDetails.volatility90d * 100).toFixed(2)}%
              </div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-slate-50 rounded-lg min-w-0">
              <div className="flex items-center justify-center gap-1 mb-1 sm:mb-2">
                <Database className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600 shrink-0" />
                <span className="text-xs sm:text-sm font-medium truncate">Liquidity</span>
              </div>
              <div className="text-sm sm:text-lg font-bold text-orange-700 capitalize truncate">
                {cagrDetails.liquidityStatus}
              </div>
            </div>
          </div>

          {/* 8-Step Enhanced Calculation Breakdown */}
          <div>
            <h5 className="font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
              <Calculator className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">8-Step Enhanced CAGR Formula Breakdown</span>
            </h5>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 bg-blue-50 rounded min-w-0">
                <span className="text-xs sm:text-sm font-medium">Step 1: Initial Price</span>
                <span className="font-bold text-blue-700 text-xs sm:text-base truncate">
                  ${cagrDetails.calculationSteps.step1_initialValue < 1 
                    ? cagrDetails.calculationSteps.step1_initialValue.toFixed(4)
                    : cagrDetails.calculationSteps.step1_initialValue.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2
                      })
                  }
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 bg-green-50 rounded min-w-0">
                <span className="text-xs sm:text-sm font-medium">Step 2: Final Price</span>
                <span className="font-bold text-green-700 text-xs sm:text-base truncate">
                  ${cagrDetails.calculationSteps.step2_finalValue < 1 
                    ? cagrDetails.calculationSteps.step2_finalValue.toFixed(4)
                    : cagrDetails.calculationSteps.step2_finalValue.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2
                      })
                  }
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 bg-purple-50 rounded min-w-0">
                <span className="text-xs sm:text-sm font-medium">Step 3: Time Period (n)</span>
                <span className="font-bold text-purple-700 text-xs sm:text-base whitespace-nowrap">
                  {cagrDetails.calculationSteps.step3_timeperiodYears.toFixed(3)} years
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 bg-orange-50 rounded min-w-0">
                <span className="text-xs sm:text-sm font-medium">Step 4: Growth Ratio (FV/IV)</span>
                <span className="font-bold text-orange-700 text-xs sm:text-base whitespace-nowrap">
                  {cagrDetails.calculationSteps.step4_growthRatio.toFixed(6)}
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 bg-indigo-50 rounded min-w-0">
                <span className="text-xs sm:text-sm font-medium">Step 5: Exponent (1/n)</span>
                <span className="font-bold text-indigo-700 text-xs sm:text-base whitespace-nowrap">
                  {cagrDetails.calculationSteps.step5_exponent.toFixed(6)}
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 bg-teal-50 rounded min-w-0">
                <span className="text-xs sm:text-sm font-medium">Step 6: CAGR Base (Ratio^Exponent)</span>
                <span className="font-bold text-teal-700 text-xs sm:text-base whitespace-nowrap">
                  {cagrDetails.calculationSteps.step6_cagrBase.toFixed(6)}
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded border border-blue-200 min-w-0">
                <span className="text-xs sm:text-sm font-medium">Step 7: Basic CAGR ((Base-1)*100)</span>
                <span className="font-bold text-sm sm:text-lg text-blue-700 whitespace-nowrap">
                  {cagrDetails.calculationSteps.step7_finalCAGR.toFixed(2)}%
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded border-2 border-purple-200 min-w-0">
                <span className="text-xs sm:text-sm font-medium">Step 8: Volatility-Adjusted CAGR</span>
                <span className="font-bold text-base sm:text-xl text-purple-700 whitespace-nowrap">
                  {cagrDetails.calculationSteps.step8_adjustedCAGR.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Data Quality Information */}
          <div className="pt-3 sm:pt-4 border-t border-gray-200">
            <div className="flex items-start gap-2 text-xs text-gray-600">
              {getDataSourceIcon(cagrDetails.dataSource)}
              <span className="leading-relaxed">
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

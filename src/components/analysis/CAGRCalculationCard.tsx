import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CAGRCalculationResult } from "@/services/comprehensiveCAGRCalculationService";
import { TrendingUp, Calendar, Calculator, BarChart3, AlertTriangle, CheckCircle } from "lucide-react";

interface CAGRCalculationCardProps {
  result: CAGRCalculationResult;
}

export const CAGRCalculationCard = ({ result }: CAGRCalculationCardProps) => {
  const getQualityColor = (quality: number) => {
    if (quality >= 80) return "text-success";
    if (quality >= 60) return "text-warning";
    return "text-destructive";
  };

  const getQualityBadgeVariant = (quality: number) => {
    if (quality >= 80) return "default";
    if (quality >= 60) return "secondary";
    return "destructive";
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          CAGR Calculation Details
          <Badge 
            variant={getQualityBadgeVariant(result.dataQuality)}
            className="ml-auto"
          >
            {result.dataQuality}% Quality
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Final Result */}
        <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="text-2xl font-bold text-primary">
            {result.cagrPercent.toFixed(2)}%
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Compound Annual Growth Rate
          </p>
          <p className="text-xs text-muted-foreground">
            Over {result.numYears.toFixed(2)} years
          </p>
        </div>

        {/* Input Data */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Input Data & Period
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Beginning:</span>
              <div className="font-mono">
                {result.beginningDate}
              </div>
              <div className="font-mono text-primary">
                ${result.beginningPrice.toFixed(2)}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Ending:</span>
              <div className="font-mono">
                {result.endingDate}
              </div>
              <div className="font-mono text-primary">
                ${result.endingPrice.toFixed(2)}
              </div>
            </div>
          </div>
          <div className="mt-3 p-2 bg-accent/50 rounded text-xs">
            <span className="text-muted-foreground">Period:</span> {result.totalDays} days = {result.numYears.toFixed(4)} years
          </div>
        </div>

        <Separator />

        {/* Step-by-Step Calculation */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Calculation Steps
          </h4>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-accent/30 rounded-lg">
              <div className="font-mono text-xs mb-1 text-muted-foreground">
                CAGR = (Ending Price / Beginning Price) ^ (1 / Years) - 1
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>1. Growth Ratio:</span>
                  <span className="font-mono">
                    ${result.endingPrice.toFixed(2)} ÷ ${result.beginningPrice.toFixed(2)} = {result.growthRatio.toFixed(4)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>2. Exponent:</span>
                  <span className="font-mono">
                    1 ÷ {result.numYears.toFixed(4)} = {result.exponent.toFixed(6)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>3. Annualized Growth:</span>
                  <span className="font-mono">
                    {result.growthRatio.toFixed(4)} ^ {result.exponent.toFixed(6)} = {result.annualizedGrowth.toFixed(6)}
                  </span>
                </div>
                
                <div className="flex justify-between font-semibold text-primary">
                  <span>4. CAGR:</span>
                  <span className="font-mono">
                    {result.annualizedGrowth.toFixed(6)} - 1 = {result.cagr.toFixed(6)} ({result.cagrPercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Data Quality & Metadata */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Data Quality & Metadata
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Data Points:</span>
              <div className="font-mono">{result.dataPoints.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Source:</span>
              <div className="font-mono capitalize">{result.dataSource}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Minimum Data:</span>
              <div className="flex items-center gap-1">
                {result.hasMinimumData ? (
                  <CheckCircle className="h-3 w-3 text-success" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-destructive" />
                )}
                <span className={result.hasMinimumData ? "text-success" : "text-destructive"}>
                  {result.hasMinimumData ? "Yes" : "No"}
                </span>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Complete Period:</span>
              <div className="flex items-center gap-1">
                {result.hasCompletePeriod ? (
                  <CheckCircle className="h-3 w-3 text-success" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-destructive" />
                )}
                <span className={result.hasCompletePeriod ? "text-success" : "text-destructive"}>
                  {result.hasCompletePeriod ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-3 p-2 bg-accent/50 rounded text-xs">
            <span className="text-muted-foreground">Quality Score:</span>
            <span className={`ml-2 font-semibold ${getQualityColor(result.dataQuality)}`}>
              {result.dataQuality}%
            </span>
          </div>
        </div>

        {/* Warnings */}
        {result.warnings.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2 text-warning">
                <AlertTriangle className="h-4 w-4" />
                Warnings & Notes
              </h4>
              <div className="space-y-1">
                {result.warnings.map((warning, index) => (
                  <div key={index} className="text-xs p-2 bg-warning/10 border border-warning/20 rounded text-warning">
                    {warning}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Interpretation */}
        <div className="text-xs text-muted-foreground p-3 bg-accent/20 rounded-lg">
          <p className="font-semibold mb-1">Interpretation:</p>
          <p>
            CAGR assumes reinvestment of returns and represents the smoothed annual rate of return. 
            This calculation uses daily price data spanning {result.numYears.toFixed(2)} years 
            with {result.dataPoints.toLocaleString()} data points from {result.dataSource}.
            {result.numYears < 1 && " Note: Period is less than 1 year - interpret as short-term growth rate."}
          </p>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Calculated at: {new Date(result.calculatedAt).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
};
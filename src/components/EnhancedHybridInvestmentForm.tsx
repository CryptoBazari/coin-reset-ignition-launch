
import React, { useState } from 'react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Info } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { HybridAnalysisResults } from './HybridAnalysisResults';
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { enhancedInvestmentCalculationService } from '@/services/enhancedInvestmentCalculationService';
import { bitcoinGlassNodeService } from '@/services/bitcoinGlassNodeService';
import CoinSelector from '@/components/virtual-portfolio/CoinSelector';
import { CoinMarketCapCoin } from '@/services/coinMarketCapService';

interface AnalysisResult {
  npv: number;
  irr: number;
  roi: number;
  cagr: number;
  beta: number;
  discountRate: number;
  projectedPrices: number[];
  cashFlows: number[];
  stressTestedNPV: number;
  marketPremium: number;
  monthlyChanges: number[];
  isStakeable: boolean;
  benchmark: string;
  volatility?: number; // Real Glassnode volatility
  avivRatio?: number; // Real Bitcoin AVIV ratio
  standardDeviation?: number; // Calculated from historical prices
  dataQuality?: {
    volatilityFromAPI: boolean;
    avivFromAPI: boolean;
    priceDataPoints: number;
  };
  riskAdjustments: {
    mvrvAdjustment: number;
    liquidityAdjustment: number;
    drawdownRisk: number;
  };
  priceHistory: Array<{ date: string; price: number }>;
}

const formSchema = z.object({
  coinSymbol: z.string().min(1, {
    message: "Coin symbol must be selected.",
  }),
  initialInvestment: z.number().min(1, {
    message: "Initial investment must be at least $1.",
  }),
  projectionYears: z.number().min(1, {
    message: "Projection years must be at least 1.",
  }),
  stakingYield: z.number(),
  riskFreeRate: z.number(),
})

export const EnhancedHybridInvestmentForm = () => {
  const [formData, setFormData] = useState({
    coinSymbol: 'BTC',
    initialInvestment: 10000,
    projectionYears: 5,
    stakingYield: 5,
    riskFreeRate: 2,
  });
  const [selectedCoinData, setSelectedCoinData] = useState<CoinMarketCapCoin | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bitcoinContext, setBitcoinContext] = useState<any>(null);
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      coinSymbol: formData.coinSymbol,
      initialInvestment: formData.initialInvestment,
      projectionYears: formData.projectionYears,
      stakingYield: formData.stakingYield,
      riskFreeRate: formData.riskFreeRate,
    },
  })

  function updateFormData(values: z.infer<typeof formSchema>) {
    setFormData({
      coinSymbol: values.coinSymbol || 'BTC',
      initialInvestment: values.initialInvestment || 10000,
      projectionYears: values.projectionYears || 5,
      stakingYield: values.stakingYield || 5,
      riskFreeRate: values.riskFreeRate || 2,
    });
  }

  const handleCoinSelection = (coinId: string, coinData: CoinMarketCapCoin) => {
    console.log('Coin selected in form:', coinId, coinData);
    setSelectedCoinData(coinData);
    setFormData(prev => ({
      ...prev,
      coinSymbol: coinData.symbol
    }));
    form.setValue('coinSymbol', coinData.symbol);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Starting analysis with form data:', formData);
      console.log('Selected coin data:', selectedCoinData);

      // Use the enhanced service that now bypasses database completely
      const analysisResult = await enhancedInvestmentCalculationService.calculateInvestmentAnalysis({
        coinId: formData.coinSymbol.toLowerCase(),
        investmentAmount: formData.initialInvestment,
        investmentHorizon: formData.projectionYears,
        totalPortfolio: formData.initialInvestment
      });

      setResult(analysisResult);

      // Fetch Bitcoin market context if not BTC
      if (formData.coinSymbol.toLowerCase() !== 'btc') {
        const bitcoinData = await bitcoinGlassNodeService.getBitcoinCointimeData();
        setBitcoinContext({
          cointime: {
            aviv_ratio: bitcoinData.cointimeEconomics.avivRatio,
            market_state: 'accumulation', // Placeholder
            confidence: 75 // Placeholder
          }
        });
      } else {
        setBitcoinContext(null);
      }

    } catch (err) {
      console.error('❌ Analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
      toast({
        title: "Analysis Failed",
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold text-center mb-8">
        Enhanced Hybrid Investment Analysis
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Investment Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(updateFormData)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="coinSymbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cryptocurrency</FormLabel>
                      <FormControl>
                        <CoinSelector
                          value={selectedCoinData?.id.toString() || ''}
                          onValueChange={handleCoinSelection}
                          placeholder="Select a cryptocurrency"
                        />
                      </FormControl>
                      <FormDescription>
                        Search and select the cryptocurrency for analysis.
                      </FormDescription>
                      {selectedCoinData && (
                        <div className="text-sm text-gray-600 mt-2">
                          Selected: {selectedCoinData.symbol} - {selectedCoinData.name} 
                          (${selectedCoinData.current_price.toLocaleString()})
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="initialInvestment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Investment ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="10000" 
                          {...field} 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the amount you plan to invest.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="projectionYears"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Projection Years</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="5" 
                          {...field} 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the number of years for the investment projection.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stakingYield"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Staking Yield (%)
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 ml-1 inline-block" />
                            </TooltipTrigger>
                            <TooltipContent>
                              Annual staking rewards as a percentage.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="5" 
                          {...field} 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        If the coin is stakeable, enter the annual yield.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="riskFreeRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Risk-Free Rate (%)
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 ml-1 inline-block" />
                            </TooltipTrigger>
                            <TooltipContent>
                              The return on a risk-free investment, like a
                              government bond.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="2" 
                          {...field} 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the current risk-free rate.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  Update Parameters
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Run Analysis</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col space-y-4">
            <div className="space-y-2">
              <Label htmlFor="selectedCoin">Selected Cryptocurrency</Label>
              <Input
                id="selectedCoin"
                value={selectedCoinData ? `${selectedCoinData.symbol} - ${selectedCoinData.name}` : 'No coin selected'}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="initialInvestment">Initial Investment</Label>
              <Input
                id="initialInvestment"
                value={`$${formData.initialInvestment.toLocaleString()}`}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectionYears">Projection Years</Label>
              <Input
                id="projectionYears"
                value={formData.projectionYears.toString()}
                disabled
              />
            </div>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !selectedCoinData}
              className="w-full"
            >
              {loading ? "Analyzing..." : "Analyze Investment"}
            </Button>
            {!selectedCoinData && (
              <p className="text-amber-600 text-sm">Please select a cryptocurrency first</p>
            )}
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </CardContent>
        </Card>
      </div>

      {result && (
        <div className="mt-10">
          <h2 className="text-2xl font-bold text-center mb-6">
            Analysis Results
          </h2>
          <HybridAnalysisResults
            result={result}
            formData={formData}
            bitcoinContext={bitcoinContext}
          />
        </div>
      )}
    </div>
  );
};

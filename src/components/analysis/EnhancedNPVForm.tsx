
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calculator, TrendingUp } from 'lucide-react';

// Define stakeable coins
const STAKEABLE_COINS = ['eth', 'ada', 'dot', 'sol', 'atom', 'avax', 'matic'];

const npvFormSchema = z.object({
  coinSymbol: z.string().min(1, "Coin symbol is required").toLowerCase(),
  investmentAmount: z.number().min(100, "Minimum investment is $100").max(1000000, "Maximum investment is $1,000,000"),
  projectionPeriods: z.number().min(1, "Minimum 1 year").max(10, "Maximum 10 years"),
  stakingYield: z.number().min(0).max(50).optional(),
  riskFreeRate: z.number().min(2, "Minimum 2%").max(4, "Maximum 4%"),
});

export type NPVFormData = z.infer<typeof npvFormSchema>;

interface EnhancedNPVFormProps {
  onSubmit: (data: NPVFormData) => void;
  loading?: boolean;
}

export function EnhancedNPVForm({ onSubmit, loading = false }: EnhancedNPVFormProps) {
  const form = useForm<NPVFormData>({
    resolver: zodResolver(npvFormSchema),
    defaultValues: {
      coinSymbol: 'btc',
      investmentAmount: 10000,
      projectionPeriods: 5,
      stakingYield: 0,
      riskFreeRate: 3,
    },
  });

  const watchedCoinSymbol = form.watch('coinSymbol');
  const isStakeableCoin = STAKEABLE_COINS.includes(watchedCoinSymbol?.toLowerCase() || '');

  const handleSubmit = (data: NPVFormData) => {
    // Don't include staking yield for non-stakeable coins
    if (!isStakeableCoin) {
      data.stakingYield = 0;
    }
    onSubmit(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          NPV Analysis Configuration
        </CardTitle>
        <CardDescription>
          Configure your investment parameters for comprehensive NPV analysis using real Glassnode data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="coinSymbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cryptocurrency Symbol</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="btc, eth, etc." 
                        {...field}
                        className="uppercase"
                        onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the coin symbol (e.g., 'btc' for Bitcoin, 'eth' for Ethereum)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="investmentAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Investment Amount ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="10000"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Your initial investment amount in USD
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projectionPeriods"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Projection Period (Years)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="5"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of years to project into the future
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
                    <FormLabel>Risk-Free Rate (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        placeholder="3.0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Risk-free rate for NPV calculations (2-4%)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isStakeableCoin && (
                <FormField
                  control={form.control}
                  name="stakingYield"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Staking Yield (% Annual)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
                          placeholder="5.0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Expected annual staking yield for {watchedCoinSymbol?.toUpperCase()} (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <TrendingUp className="mr-2 h-4 w-4 animate-spin" />
                  Calculating NPV...
                </>
              ) : (
                <>
                  <Calculator className="mr-2 h-4 w-4" />
                  Calculate NPV Analysis
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

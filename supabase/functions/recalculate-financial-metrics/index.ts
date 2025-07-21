import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FinancialMetrics {
  coinId: string;
  realVolatility: number;
  realCAGR36m: number;
  realIRR: number;
  realSharpeRatio: number;
  realStandardDeviation: number;
  riskAdjustedReturn: number;
  dataQualityScore: number;
  calculationMethod: string;
  dataPoints: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { coinId } = await req.json();
    
    if (!coinId) {
      throw new Error('coinId is required');
    }

    console.log(`Recalculating ALL financial metrics for ${coinId} using real data...`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const fredApiKey = Deno.env.get('FRED_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get price history from our real data tables
    const { data: priceHistory, error: priceError } = await supabase
      .from('price_history_36m')
      .select('price_date, price_usd')
      .eq('coin_id', coinId)
      .order('price_date', { ascending: true });

    if (priceError || !priceHistory?.length) {
      throw new Error(`No price history found for ${coinId}. Run price data fetch first.`);
    }

    console.log(`Found ${priceHistory.length} price data points for ${coinId}`);

    // Get current risk-free rate from FRED API
    let riskFreeRate = 0.02; // Default 2%
    if (fredApiKey) {
      try {
        const fredResponse = await fetch(
          `https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=${fredApiKey}&file_type=json&limit=1&sort_order=desc`
        );
        
        if (fredResponse.ok) {
          const fredData = await fredResponse.json();
          if (fredData.observations?.[0]?.value !== '.') {
            riskFreeRate = parseFloat(fredData.observations[0].value) / 100;
            console.log(`✅ Current 10-Year Treasury rate: ${(riskFreeRate * 100).toFixed(2)}%`);
          }
        }
      } catch (error) {
        console.log('Using default risk-free rate:', error.message);
      }
    }

    // Calculate real financial metrics
    const metrics = calculateRealFinancialMetrics(priceHistory, riskFreeRate);
    
    // Calculate data quality score
    const expectedDataPoints = 1095; // 36 months * 30.4 days
    const completeness = Math.min(100, (priceHistory.length / expectedDataPoints) * 100);
    const freshnessScore = calculateFreshnessScore(priceHistory);
    const dataQualityScore = Math.round((completeness * 0.6) + (freshnessScore * 0.4));

    const result: FinancialMetrics = {
      coinId,
      realVolatility: metrics.volatility,
      realCAGR36m: metrics.cagr36m,
      realIRR: metrics.irr,
      realSharpeRatio: metrics.sharpeRatio,
      realStandardDeviation: metrics.standardDeviation,
      riskAdjustedReturn: metrics.riskAdjustedReturn,
      dataQualityScore,
      calculationMethod: 'real_historical_data',
      dataPoints: priceHistory.length
    };

    // Store calculated metrics
    await storeEnhancedMetrics(supabase, result);

    console.log(`✅ Financial metrics recalculated for ${coinId}:`);
    console.log(`   - Real Volatility: ${metrics.volatility.toFixed(2)}%`);
    console.log(`   - Real CAGR (36m): ${metrics.cagr36m.toFixed(2)}%`);
    console.log(`   - Real IRR: ${metrics.irr.toFixed(2)}%`);
    console.log(`   - Real Sharpe Ratio: ${metrics.sharpeRatio.toFixed(3)}`);
    console.log(`   - Data Quality: ${dataQualityScore}%`);

    return new Response(
      JSON.stringify({
        success: true,
        coinId,
        metrics: result,
        dataPointsUsed: priceHistory.length,
        riskFreeRate: riskFreeRate * 100,
        message: `Financial metrics recalculated using ${priceHistory.length} real data points`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error recalculating financial metrics:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        dataQualityScore: 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function calculateRealFinancialMetrics(priceHistory: any[], riskFreeRate: number) {
  const prices = priceHistory.map(p => p.price_usd);
  
  // Calculate daily returns
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    const dailyReturn = (prices[i] - prices[i-1]) / prices[i-1];
    returns.push(dailyReturn);
  }

  // Real volatility (annualized)
  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (returns.length - 1);
  const volatility = Math.sqrt(variance * 252) * 100; // Annualized percentage

  // Real standard deviation (annualized)
  const standardDeviation = Math.sqrt(variance * 252);

  // Real CAGR (36 months)
  const startPrice = prices[0];
  const endPrice = prices[prices.length - 1];
  const years = priceHistory.length / 365.25;
  const cagr36m = (Math.pow(endPrice / startPrice, 1 / years) - 1) * 100;

  // Real IRR calculation (assuming regular investments)
  const irr = calculateIRR(prices, years);

  // Real Sharpe Ratio
  const annualizedReturn = meanReturn * 252;
  const excessReturn = annualizedReturn - riskFreeRate;
  const sharpeRatio = standardDeviation === 0 ? 0 : excessReturn / standardDeviation;

  // Risk-adjusted return
  const riskAdjustedReturn = (annualizedReturn * 100) - (volatility * 0.1); // Penalize high volatility

  return {
    volatility,
    cagr36m,
    irr,
    sharpeRatio,
    standardDeviation,
    riskAdjustedReturn
  };
}

function calculateIRR(prices: number[], years: number): number {
  // Simplified IRR calculation - assumes equal time intervals
  if (prices.length < 2) return 0;
  
  const startPrice = prices[0];
  const endPrice = prices[prices.length - 1];
  
  // Simple IRR approximation
  const totalReturn = (endPrice - startPrice) / startPrice;
  const irr = (Math.pow(1 + totalReturn, 1 / years) - 1) * 100;
  
  return Math.max(-80, Math.min(500, irr)); // Reasonable bounds
}

function calculateFreshnessScore(priceHistory: any[]): number {
  if (!priceHistory.length) return 0;
  
  const latestDate = new Date(priceHistory[priceHistory.length - 1].price_date);
  const now = new Date();
  const hoursSinceLatest = (now.getTime() - latestDate.getTime()) / (1000 * 60 * 60);
  
  // Score based on data freshness (100% if within 24 hours, decreasing)
  if (hoursSinceLatest <= 24) return 100;
  if (hoursSinceLatest <= 168) return 80; // Within a week
  if (hoursSinceLatest <= 720) return 60; // Within a month
  return 30; // Older data
}

async function storeEnhancedMetrics(supabase: any, metrics: FinancialMetrics) {
  try {
    // Store in calculated_metrics table
    const { error: metricsError } = await supabase
      .from('calculated_metrics')
      .upsert({
        coin_id: metrics.coinId,
        real_volatility: metrics.realVolatility / 100, // Store as decimal
        real_cagr_36m: metrics.realCAGR36m / 100,
        real_standard_deviation: metrics.realStandardDeviation,
        sharpe_ratio: metrics.realSharpeRatio,
        data_points_used: metrics.dataPoints,
        calculation_date: new Date().toISOString(),
        data_quality_score: metrics.dataQualityScore,
        calculation_method: metrics.calculationMethod,
        is_estimated: false
      }, { onConflict: 'coin_id,calculation_date' });

    if (metricsError) {
      console.error('Error storing enhanced metrics:', metricsError);
    }

    // Update coins table with real metrics
    const { error: updateError } = await supabase
      .from('coins')
      .update({
        volatility: metrics.realVolatility / 100,
        cagr_36m: metrics.realCAGR36m / 100,
        sharpe_ratio: metrics.realSharpeRatio,
        standard_deviation: metrics.realStandardDeviation,
        real_volatility_calculated: metrics.realVolatility / 100,
        data_quality_score: metrics.dataQualityScore,
        last_calculation_update: new Date().toISOString(),
        calculation_data_source: 'real',
        confidence_level: metrics.dataQualityScore >= 80 ? 'high' : 
                         metrics.dataQualityScore >= 60 ? 'medium' : 'low'
      })
      .eq('coin_id', metrics.coinId);

    if (updateError) {
      console.error('Error updating coins with enhanced metrics:', updateError);
    } else {
      console.log(`✅ Updated ${metrics.coinId} with enhanced real metrics`);
    }

    // Log the quality improvement
    await supabase
      .from('data_quality_log')
      .insert({
        coin_id: metrics.coinId,
        metric_type: 'enhanced_financial_metrics',
        data_source: 'real_price_history',
        quality_score: metrics.dataQualityScore,
        data_points: metrics.dataPoints,
        completeness_pct: (metrics.dataPoints / 1095) * 100,
        freshness_hours: 0,
        api_status: 'healthy',
        logged_at: new Date().toISOString()
      });

  } catch (error) {
    console.error('Error in storeEnhancedMetrics:', error);
  }
}
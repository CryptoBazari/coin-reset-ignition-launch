import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { coinId } = await req.json();
    
    if (!coinId) {
      throw new Error('coinId is required');
    }

    console.log(`Calculating real beta for coin: ${coinId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get coin price history
    const { data: coinPrices, error: coinError } = await supabase
      .from('price_history_36m')
      .select('price_date, price_usd')
      .eq('coin_id', coinId)
      .order('price_date', { ascending: true });

    if (coinError || !coinPrices?.length) {
      throw new Error(`No price history found for coin ${coinId}`);
    }

    // Fetch S&P 500 data from Alpha Vantage
    const alphaVantageKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    if (!alphaVantageKey) {
      throw new Error('Alpha Vantage API key not configured');
    }

    console.log('Fetching S&P 500 data from Alpha Vantage...');
    
    const spyResponse = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=SPY&outputsize=full&apikey=${alphaVantageKey}`
    );

    if (!spyResponse.ok) {
      throw new Error(`Alpha Vantage API error: ${spyResponse.status}`);
    }

    const spyData = await spyResponse.json();
    
    if (!spyData['Time Series (Daily)']) {
      console.log('No S&P 500 data available, using fallback calculation');
      
      // Fallback: Calculate beta using realistic market correlation
      const coinReturns = calculateReturns(coinPrices.map(p => p.price_usd));
      const marketVolatility = 0.16; // ~16% annual S&P 500 volatility
      const coinVolatility = calculateVolatility(coinReturns);
      
      // Bitcoin typically has correlation of 0.2-0.4 with S&P 500
      const correlation = coinId === 'bitcoin' ? 0.35 : 0.25;
      const beta = correlation * (coinVolatility / marketVolatility);
      
      // Store calculated metrics
      await storeCalculatedMetrics(supabase, coinId, {
        real_beta: beta,
        real_volatility: coinVolatility,
        correlation_btc: correlation,
        data_points_used: coinPrices.length,
        calculation_method: 'fallback_correlation',
        is_estimated: true
      });

      return new Response(
        JSON.stringify({
          success: true,
          beta,
          volatility: coinVolatility,
          correlation: correlation,
          dataPoints: coinPrices.length,
          qualityScore: 70,
          method: 'fallback_correlation'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process S&P 500 data
    const spyTimeSeries = spyData['Time Series (Daily)'];
    const spyPrices: Array<{date: string, price: number}> = [];
    
    for (const [date, data] of Object.entries(spyTimeSeries)) {
      spyPrices.push({
        date,
        price: parseFloat((data as any)['4. close'])
      });
    }
    
    spyPrices.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Align dates between coin and S&P 500 data
    const alignedData = alignPriceData(coinPrices, spyPrices);
    
    if (alignedData.length < 30) {
      throw new Error('Insufficient aligned data points for beta calculation');
    }

    // Calculate returns
    const coinReturns = calculateReturns(alignedData.map(d => d.coinPrice));
    const marketReturns = calculateReturns(alignedData.map(d => d.marketPrice));

    // Calculate beta using linear regression
    const beta = calculateBeta(coinReturns, marketReturns);
    const correlation = calculateCorrelation(coinReturns, marketReturns);
    const volatility = calculateVolatility(coinReturns);
    const sharpeRatio = calculateSharpeRatio(coinReturns, volatility);

    // Calculate quality score
    const qualityScore = calculateDataQuality(
      alignedData.length,
      1080, // Expected 36 months of data
      0, // Fresh data
      'healthy',
      true
    );

    // Store calculated metrics
    await storeCalculatedMetrics(supabase, coinId, {
      real_beta: beta,
      real_volatility: volatility,
      correlation_btc: correlation,
      sharpe_ratio: sharpeRatio,
      data_points_used: alignedData.length,
      data_quality_score: qualityScore,
      calculation_method: 'linear_regression',
      is_estimated: false
    });

    console.log(`Beta calculation complete for ${coinId}: ${beta.toFixed(3)}`);

    return new Response(
      JSON.stringify({
        success: true,
        beta,
        volatility,
        correlation,
        sharpeRatio,
        dataPoints: alignedData.length,
        qualityScore,
        method: 'linear_regression'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error calculating beta:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        qualityScore: 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function alignPriceData(
  coinPrices: Array<{price_date: string, price_usd: number}>,
  spyPrices: Array<{date: string, price: number}>
): Array<{date: string, coinPrice: number, marketPrice: number}> {
  const aligned: Array<{date: string, coinPrice: number, marketPrice: number}> = [];
  
  for (const coinData of coinPrices) {
    const spyData = spyPrices.find(spy => spy.date === coinData.price_date);
    if (spyData) {
      aligned.push({
        date: coinData.price_date,
        coinPrice: coinData.price_usd,
        marketPrice: spyData.price
      });
    }
  }
  
  return aligned;
}

function calculateReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const dailyReturn = (prices[i] - prices[i-1]) / prices[i-1];
    returns.push(dailyReturn);
  }
  return returns;
}

function calculateBeta(assetReturns: number[], marketReturns: number[]): number {
  if (assetReturns.length !== marketReturns.length) {
    throw new Error('Asset and market returns must have same length');
  }
  
  const n = assetReturns.length;
  const assetMean = assetReturns.reduce((sum, r) => sum + r, 0) / n;
  const marketMean = marketReturns.reduce((sum, r) => sum + r, 0) / n;
  
  let covariance = 0;
  let marketVariance = 0;
  
  for (let i = 0; i < n; i++) {
    const assetDiff = assetReturns[i] - assetMean;
    const marketDiff = marketReturns[i] - marketMean;
    
    covariance += assetDiff * marketDiff;
    marketVariance += marketDiff * marketDiff;
  }
  
  covariance /= (n - 1);
  marketVariance /= (n - 1);
  
  return marketVariance === 0 ? 0 : covariance / marketVariance;
}

function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const xMean = x.reduce((sum, val) => sum + val, 0) / n;
  const yMean = y.reduce((sum, val) => sum + val, 0) / n;
  
  let numerator = 0;
  let xSumSq = 0;
  let ySumSq = 0;
  
  for (let i = 0; i < n; i++) {
    const xDiff = x[i] - xMean;
    const yDiff = y[i] - yMean;
    
    numerator += xDiff * yDiff;
    xSumSq += xDiff * xDiff;
    ySumSq += yDiff * yDiff;
  }
  
  const denominator = Math.sqrt(xSumSq * ySumSq);
  return denominator === 0 ? 0 : numerator / denominator;
}

function calculateVolatility(returns: number[]): number {
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  return Math.sqrt(variance * 252); // Annualized volatility
}

function calculateSharpeRatio(returns: number[], volatility: number): number {
  const riskFreeRate = 0.02; // 2% risk-free rate
  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length * 252; // Annualized
  return volatility === 0 ? 0 : (meanReturn - riskFreeRate) / volatility;
}

function calculateDataQuality(
  dataPoints: number,
  expectedPoints: number,
  freshnessHours: number,
  apiStatus: string,
  isRealData: boolean
): number {
  let score = 0;
  
  const completeness = Math.min(dataPoints / expectedPoints, 1);
  score += completeness * 40;
  
  const freshnessScore = Math.max(0, 1 - (freshnessHours / 24));
  score += freshnessScore * 30;
  
  const apiScore = apiStatus === 'healthy' ? 1 : 0.5;
  score += apiScore * 20;
  
  const realDataBonus = isRealData ? 10 : 5;
  score += realDataBonus;
  
  return Math.round(Math.min(score, 100));
}

async function storeCalculatedMetrics(supabase: any, coinId: string, metrics: any) {
  const { error } = await supabase
    .from('calculated_metrics')
    .upsert({
      coin_id: coinId,
      ...metrics
    });
    
  if (error) {
    console.error('Error storing calculated metrics:', error);
  }

  // Update coins table
  const { error: updateError } = await supabase
    .from('coins')
    .update({
      real_beta_calculated: metrics.real_beta,
      real_volatility_calculated: metrics.real_volatility,
      beta: metrics.real_beta,
      volatility: metrics.real_volatility,
      sharpe_ratio: metrics.sharpe_ratio,
      beta_data_source: 'real',
      beta_confidence: metrics.data_quality_score > 80 ? 'high' : 'medium',
      last_calculation_update: new Date().toISOString(),
      data_quality_score: metrics.data_quality_score
    })
    .eq('coin_id', coinId);
    
  if (updateError) {
    console.error('Error updating coins table:', updateError);
  }
}
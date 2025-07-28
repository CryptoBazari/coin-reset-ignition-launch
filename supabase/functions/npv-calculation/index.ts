import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Benchmark configuration
const BENCHMARKS = {
  BTC: { symbol: 'SP500', source: 'FRED' },
  DEFAULT: { symbol: 'BTC', source: 'Glassnode' }
};

// Risk rates and returns
const RISK_FREE_RATE = 0.045; // 4.5% Treasury yield
const SP500_EXPECTED_RETURN = 0.10; // 10%
const BTC_EXPECTED_RETURN = 0.15; // 15%

// Liquidity premiums
const LIQUIDITY_PREMIUMS = {
  liquid: 0.02,    // 2%
  moderate: 0.05,  // 5%
  illiquid: 0.15   // 15%
};

// Volume thresholds for liquidity classification
const VOLUME_THRESHOLDS = {
  BTC: {
    liquid: 2e9,    // >$2B
    moderate: 5e8   // >$500M
  },
  ALTCOIN: {
    liquid: 5e8,    // >$500M
    moderate: 1e8   // >$100M
  }
};

interface NPVRequest {
  asset: string;
  amount: number;
  years: number;
  advancedBeta?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { asset, amount, years, advancedBeta }: NPVRequest = await req.json();
    const assetLower = asset.toLowerCase();
    
    console.log(`🚀 Starting NPV calculation for ${asset.toUpperCase()}`);
    console.log(`   Investment: $${amount}, Years: ${years}, Advanced Beta: ${advancedBeta || 'None'}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Determine benchmark
    const benchmarkConfig = assetLower === 'btc' 
      ? BENCHMARKS.BTC 
      : BENCHMARKS.DEFAULT;

    console.log(`📊 Using benchmark: ${benchmarkConfig.symbol} (${benchmarkConfig.source})`);

    // Step 2: Parallel data fetching
    const promises = [
      fetchGlassnodeData('market/price_usd_close', asset, years),
      fetchFredData('DGS10'), // 10-year Treasury for risk-free rate
      fetchGlassnodeData('transactions/transfers_volume_sum', asset, 30)
    ];

    // Add benchmark data fetch
    if (assetLower === 'btc') {
      promises.push(fetchFredData('SP500'));
    } else {
      promises.push(fetchGlassnodeData('market/price_usd_close', 'btc', years));
    }

    const [coinPrices, riskFreeData, volumeData, benchmarkPrices] = await Promise.all(promises);

    console.log(`✅ Data fetched: ${coinPrices.length} price points, ${volumeData.length} volume points`);

    // Step 3: Calculate key metrics
    const cagr = calculateAdjustedCAGR(coinPrices);
    const benchmarkCagr = calculateBasicCAGR(benchmarkPrices);
    const liquidity = classifyLiquidity(volumeData, assetLower);
    
    // Step 4: Calculate or use provided beta
    let beta: number;
    let betaType: 'basic' | 'advanced';

    if (advancedBeta) {
      beta = advancedBeta;
      betaType = 'advanced';
      console.log(`🎯 Using provided advanced beta: ${beta.toFixed(3)}`);
    } else {
      // Calculate basic beta
      if (assetLower === 'btc') {
        const alignedData = alignMarketData(coinPrices, benchmarkPrices);
        beta = calculateBeta(alignedData);
      } else {
        beta = calculateBeta(coinPrices, benchmarkPrices);
      }
      betaType = 'basic';
      console.log(`📈 Calculated basic beta: ${beta.toFixed(3)}`);
    }

    // Step 5: Compute discount rate using CAPM
    const riskFreeRate = riskFreeData[riskFreeData.length - 1]?.value / 100 || RISK_FREE_RATE;
    const marketReturn = benchmarkConfig.symbol === 'SP500' ? SP500_EXPECTED_RETURN : BTC_EXPECTED_RETURN;
    const betaAdjustment = beta * (marketReturn - riskFreeRate);
    const discountRate = riskFreeRate + betaAdjustment + liquidity.premium;

    console.log(`💰 Discount rate calculation:`);
    console.log(`   Risk-free rate: ${(riskFreeRate * 100).toFixed(2)}%`);
    console.log(`   Market return: ${(marketReturn * 100).toFixed(2)}%`);
    console.log(`   Beta adjustment: ${(betaAdjustment * 100).toFixed(2)}%`);
    console.log(`   Liquidity premium: ${(liquidity.premium * 100).toFixed(2)}%`);
    console.log(`   Final discount rate: ${(discountRate * 100).toFixed(2)}%`);

    // Step 6: Calculate NPV/IRR
    const terminalValue = amount * Math.pow(1 + cagr, years);
    const npv = -amount + (terminalValue / Math.pow(1 + discountRate, years));
    const irr = Math.pow(terminalValue / amount, 1 / years) - 1;

    // Step 7: Generate yearly breakdown
    const breakdown = generateYearlyBreakdown(amount, terminalValue, discountRate, years);

    // Step 8: Calculate confidence score
    const confidenceScore = calculateConfidenceScore(coinPrices, volumeData, beta);

    const result = {
      npv,
      irr,
      terminalValue,
      discountRate,
      beta,
      betaType,
      benchmark: benchmarkConfig.symbol,
      liquidity,
      yearlyBreakdown: breakdown,
      confidenceScore,
      calculation: {
        riskFreeRate,
        marketReturn,
        liquidityPremium: liquidity.premium,
        betaAdjustment
      }
    };

    console.log(`✅ NPV calculation completed: $${npv.toFixed(2)} (${confidenceScore}% confidence)`);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ NPV calculation failed:', error);
    
    return new Response(JSON.stringify({
      error: 'CALCULATION_FAILED',
      message: error.message,
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper Functions

async function fetchGlassnodeData(metric: string, asset: string, days: number = 365): Promise<any[]> {
  const apiKey = Deno.env.get('GLASSNODE_API_KEY');
  if (!apiKey) throw new Error('Glassnode API key not configured');

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - (days * 365)); // Convert years to days

  const url = `https://api.glassnode.com/v1/${metric}?a=${asset.toUpperCase()}&api_key=${apiKey}&f=JSON&s=${Math.floor(startDate.getTime() / 1000)}&u=${Math.floor(endDate.getTime() / 1000)}`;

  console.log(`📡 Fetching Glassnode: ${metric} for ${asset.toUpperCase()}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Glassnode API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`✅ Glassnode data received: ${data.length} points`);
  return data;
}

async function fetchFredData(series: string): Promise<any[]> {
  const apiKey = Deno.env.get('FRED_API_KEY');
  if (!apiKey) throw new Error('FRED API key not configured');

  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 3);
  const startDateStr = startDate.toISOString().split('T')[0];

  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${series}&api_key=${apiKey}&file_type=json&observation_start=${startDateStr}&observation_end=${endDate}&sort_order=asc&frequency=d`;

  console.log(`📡 Fetching FRED data: ${series}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`FRED API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const observations = data.observations || [];
  
  console.log(`✅ FRED data received: ${observations.length} observations`);
  return observations.filter((obs: any) => obs.value !== '.' && obs.value !== null);
}

function calculateAdjustedCAGR(prices: any[]): number {
  if (prices.length < 2) throw new Error('Insufficient price data for CAGR calculation');

  const startPrice = prices[0].v;
  const endPrice = prices[prices.length - 1].v;
  const years = (prices[prices.length - 1].t - prices[0].t) / (365 * 24 * 3600);

  const basicCAGR = Math.pow(endPrice / startPrice, 1 / years) - 1;
  
  // Adjust for volatility
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i].v - prices[i-1].v) / prices[i-1].v);
  }
  
  const volatility = calculateStandardDeviation(returns);
  const volatilityAdjustment = Math.exp(-volatility * 0.5); // Reduce CAGR for high volatility
  
  return basicCAGR * volatilityAdjustment;
}

function calculateBasicCAGR(prices: any[]): number {
  if (prices.length < 2) return 0.10; // Default market return

  const startValue = Array.isArray(prices[0]) ? prices[0].v : parseFloat(prices[0].value);
  const endValue = Array.isArray(prices[prices.length - 1]) ? prices[prices.length - 1].v : parseFloat(prices[prices.length - 1].value);
  
  const years = 3; // Approximate
  return Math.pow(endValue / startValue, 1 / years) - 1;
}

function classifyLiquidity(volumes: any[], asset: string): { status: 'liquid' | 'moderate' | 'illiquid'; avgVolume30d: number; premium: number } {
  if (volumes.length === 0) {
    // Fallback classification
    const liquidAssets = ['btc', 'eth', 'usdt', 'usdc', 'bnb'];
    const status = liquidAssets.includes(asset) ? 'liquid' : 'moderate';
    return {
      status,
      avgVolume30d: 0,
      premium: LIQUIDITY_PREMIUMS[status]
    };
  }

  const avgVolume = volumes.reduce((sum, v) => sum + v.v, 0) / volumes.length;
  
  let status: 'liquid' | 'moderate' | 'illiquid';
  
  if (asset === 'btc') {
    if (avgVolume > VOLUME_THRESHOLDS.BTC.liquid) status = 'liquid';
    else if (avgVolume > VOLUME_THRESHOLDS.BTC.moderate) status = 'moderate';
    else status = 'illiquid';
  } else {
    if (avgVolume > VOLUME_THRESHOLDS.ALTCOIN.liquid) status = 'liquid';
    else if (avgVolume > VOLUME_THRESHOLDS.ALTCOIN.moderate) status = 'moderate';
    else status = 'illiquid';
  }

  return {
    status,
    avgVolume30d: avgVolume,
    premium: LIQUIDITY_PREMIUMS[status]
  };
}

function calculateBeta(coinData: any[], benchmarkData?: any[]): number {
  if (!benchmarkData || benchmarkData.length < 2) return 1.0; // Default beta

  // Calculate returns
  const coinReturns = [];
  const benchmarkReturns = [];

  const minLength = Math.min(coinData.length, benchmarkData.length);
  
  for (let i = 1; i < minLength; i++) {
    const coinReturn = (coinData[i].v - coinData[i-1].v) / coinData[i-1].v;
    const benchmarkReturn = Array.isArray(benchmarkData[i]) 
      ? (benchmarkData[i].v - benchmarkData[i-1].v) / benchmarkData[i-1].v
      : (parseFloat(benchmarkData[i].value) - parseFloat(benchmarkData[i-1].value)) / parseFloat(benchmarkData[i-1].value);
    
    if (isFinite(coinReturn) && isFinite(benchmarkReturn)) {
      coinReturns.push(coinReturn);
      benchmarkReturns.push(benchmarkReturn);
    }
  }

  if (coinReturns.length < 10) return 1.0; // Not enough data

  // Calculate covariance and variance
  const coinMean = coinReturns.reduce((sum, r) => sum + r, 0) / coinReturns.length;
  const benchmarkMean = benchmarkReturns.reduce((sum, r) => sum + r, 0) / benchmarkReturns.length;

  let covariance = 0;
  let benchmarkVariance = 0;

  for (let i = 0; i < coinReturns.length; i++) {
    const coinDiff = coinReturns[i] - coinMean;
    const benchmarkDiff = benchmarkReturns[i] - benchmarkMean;
    
    covariance += coinDiff * benchmarkDiff;
    benchmarkVariance += benchmarkDiff * benchmarkDiff;
  }

  covariance /= coinReturns.length - 1;
  benchmarkVariance /= benchmarkReturns.length - 1;

  if (benchmarkVariance === 0) return 1.0;

  const beta = covariance / benchmarkVariance;
  
  // Bound beta to reasonable range
  return Math.max(0.1, Math.min(5.0, beta));
}

function alignMarketData(cryptoData: any[], sp500Data: any[]): any[] {
  const aligned = [];
  const dateMap = new Map();
  
  // Process SP500 data (create date map)
  sp500Data.forEach(point => {
    const date = point.date;
    dateMap.set(date, parseFloat(point.value));
  });
  
  // Align crypto data
  cryptoData.forEach(point => {
    const date = new Date(point.t * 1000).toISOString().split('T')[0];
    if (dateMap.has(date)) {
      aligned.push({
        date,
        v: point.v, // crypto price
        benchmarkV: dateMap.get(date) // SP500 price
      });
    }
  });
  
  return aligned;
}

function generateYearlyBreakdown(
  initialInvestment: number,
  terminalValue: number,
  discountRate: number,
  years: number
): any[] {
  const breakdown = [];
  const annualGrowthRate = Math.pow(terminalValue / initialInvestment, 1 / years) - 1;

  for (let year = 1; year <= years; year++) {
    const futureValue = initialInvestment * Math.pow(1 + annualGrowthRate, year);
    const discountFactor = 1 / Math.pow(1 + discountRate, year);
    const presentValue = futureValue * discountFactor;

    breakdown.push({
      year,
      cashFlow: year === years ? futureValue : 0, // Only terminal value at end
      presentValue,
      discountFactor
    });
  }

  return breakdown;
}

function calculateStandardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, value) => sum + value, 0) / values.length;
  
  return Math.sqrt(avgSquaredDiff);
}

function calculateConfidenceScore(prices: any[], volumes: any[], beta: number): number {
  let score = 40; // Base score

  // Data quantity score
  if (prices.length > 365) score += 20;
  else if (prices.length > 90) score += 15;
  else score += 5;

  // Volume data availability
  if (volumes.length > 0) score += 15;

  // Beta reasonableness
  if (beta >= 0.5 && beta <= 2.0) score += 15;
  else if (beta >= 0.1 && beta <= 5.0) score += 10;
  else score += 5;

  return Math.min(95, score);
}
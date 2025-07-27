import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CagrInput {
  asset: string;
  startDate: string;
  endDate: string;
}

interface PricePoint {
  timestamp: number;
  date: string;
  price: number;
}

interface VolumePoint {
  timestamp: number;
  date: string;
  volume: number;
}

interface CagrResult {
  basic: number;
  adjusted: number;
  startPrice: number;
  endPrice: number;
  daysHeld: number;
  volatility90d: number;
  liquidityStatus: 'liquid' | 'moderate' | 'illiquid';
  dataPoints: number;
  dataSource: string;
  confidence: 'high' | 'medium' | 'low';
  calculationSteps: {
    step1_initialValue: number;
    step2_finalValue: number;
    step3_timeperiodYears: number;
    step4_growthRatio: number;
    step5_exponent: number;
    step6_cagrBase: number;
    step7_finalCAGR: number;
    step8_adjustedCAGR: number;
  };
  timeperiodYears: number;
}

interface CagrError {
  code: 'INSUFFICIENT_DATA' | 'DEAD_ASSET' | 'API_ERROR';
  message: string;
  asset: string;
  startDate: string;
  endDate: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { asset, startDate, endDate }: CagrInput = await req.json();
    
    console.log(`🚀 Starting standalone CAGR calculation for ${asset} from ${startDate} to ${endDate}`);
    
    const result = await calculateStandaloneCagr({ asset, startDate, endDate });
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ CAGR calculation error:', error);
    
    const errorResponse: CagrError = {
      code: 'API_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      asset: '',
      startDate: '',
      endDate: ''
    };
    
    return new Response(JSON.stringify({ error: errorResponse }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function calculateStandaloneCagr(input: CagrInput): Promise<CagrResult> {
  console.log(`📊 Fetching data for ${input.asset} from Glassnode endpoints...`);
  
  // 1. Fetch data from Glassnode endpoints
  const [prices, volumes] = await Promise.all([
    fetchGlassnodeData('market/price_usd_close', input),
    fetchGlassnodeData('transactions/transfers_volume_sum', input)
  ]);
  
  // 2. Sort and validate data
  prices.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  volumes.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const daysHeld = calculateDaysBetween(prices[0].date, prices[prices.length - 1].date);
  
  if (daysHeld < 90) {
    throw new Error('Insufficient data: Minimum 90 days required');
  }
  
  console.log(`✅ Data validation passed: ${prices.length} price points, ${daysHeld} days`);
  
  // 3. Basic CAGR calculation
  const startPrice = prices[0].price;
  const endPrice = prices[prices.length - 1].price;
  const timeperiodYears = daysHeld / 365.25;
  
  // Check for dead asset
  if (endPrice < 0.01) {
    return createDeadAssetResult(input, startPrice, endPrice, daysHeld, timeperiodYears);
  }
  
  const cagrBasic = Math.pow(endPrice / startPrice, 1 / timeperiodYears) - 1;
  
  // 4. Calculate daily log returns (capped at ±50%)
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const ret = Math.log(prices[i].price / prices[i - 1].price);
    returns.push(Math.max(-0.5, Math.min(0.5, ret)));
  }
  
  // 5. Calculate 90-day rolling volatility
  const volatilities: number[] = [];
  for (let i = 0; i < returns.length; i++) {
    const startIdx = Math.max(0, i - 89);
    const window = returns.slice(startIdx, i + 1);
    const volatility = calculateStandardDeviation(window);
    volatilities.push(volatility);
  }
  
  // 6. Calculate volatility-adjusted CAGR
  const weights = volatilities.map(v => 1 / (1 + v));
  const weightedReturnSum = returns.reduce((sum, r, i) => sum + r * weights[i], 0);
  const cagrAdjusted = Math.exp(365.25 / daysHeld * weightedReturnSum) - 1;
  
  // 7. Liquidity classification
  const medianVol = calculateMedian(volumes.map(v => v.volume));
  const liquidityStatus = classifyLiquidity(medianVol);
  
  // 8. Data quality and confidence scoring
  const avgVolatility = volatilities.reduce((sum, v) => sum + v, 0) / volatilities.length;
  const confidence = determineConfidence(prices.length, daysHeld, 'glassnode');
  
  // 9. Detailed calculation steps
  const growthRatio = endPrice / startPrice;
  const exponent = 1 / timeperiodYears;
  const cagrBase = Math.pow(growthRatio, exponent);
  
  const calculationSteps = {
    step1_initialValue: startPrice,
    step2_finalValue: endPrice,
    step3_timeperiodYears: timeperiodYears,
    step4_growthRatio: growthRatio,
    step5_exponent: exponent,
    step6_cagrBase: cagrBase,
    step7_finalCAGR: cagrBasic * 100,
    step8_adjustedCAGR: cagrAdjusted * 100
  };
  
  console.log(`✅ CAGR calculation completed: Basic ${(cagrBasic * 100).toFixed(2)}%, Adjusted ${(cagrAdjusted * 100).toFixed(2)}%`);
  
  return {
    basic: cagrBasic * 100,
    adjusted: cagrAdjusted * 100,
    startPrice,
    endPrice,
    daysHeld,
    volatility90d: avgVolatility,
    liquidityStatus,
    dataPoints: prices.length,
    dataSource: 'glassnode',
    confidence,
    calculationSteps,
    timeperiodYears
  };
}

async function fetchGlassnodeData(endpoint: string, input: CagrInput): Promise<PricePoint[] | VolumePoint[]> {
  const glassnodeApiKey = Deno.env.get('GLASSNODE_API_KEY');
  if (!glassnodeApiKey) {
    throw new Error('Glassnode API key not configured');
  }
  
  const startUnix = Math.floor(new Date(input.startDate).getTime() / 1000);
  const endUnix = Math.floor(new Date(input.endDate).getTime() / 1000);
  
  const url = `https://api.glassnode.com/v1/metrics/${endpoint}?a=${input.asset}&i=24h&s=${startUnix}&u=${endUnix}&api_key=${glassnodeApiKey}`;
  
  console.log(`📡 Fetching from Glassnode: ${endpoint} for ${input.asset}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Glassnode API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`No data returned from Glassnode for ${endpoint}`);
  }
  
  return data.map(item => ({
    timestamp: item.t,
    date: new Date(item.t * 1000).toISOString().split('T')[0],
    price: endpoint.includes('price') ? item.v : undefined,
    volume: endpoint.includes('volume') ? item.v : undefined
  })).filter(item => item.price !== undefined || item.volume !== undefined);
}

function calculateDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / (values.length - 1);
  
  return Math.sqrt(avgSquaredDiff);
}

function calculateMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  
  return sorted[mid];
}

function classifyLiquidity(medianVol: number): 'liquid' | 'moderate' | 'illiquid' {
  if (medianVol >= 1e7) return 'liquid';
  if (medianVol >= 1e6) return 'moderate';
  return 'illiquid';
}

function determineConfidence(dataPoints: number, daysHeld: number, dataSource: string): 'high' | 'medium' | 'low' {
  let score = 0;
  
  // Data points scoring
  if (dataPoints >= 1000) score += 3;
  else if (dataPoints >= 500) score += 2;
  else if (dataPoints >= 250) score += 1;
  
  // Time period scoring
  if (daysHeld >= 1095) score += 3; // 3+ years
  else if (daysHeld >= 730) score += 2; // 2+ years
  else if (daysHeld >= 365) score += 1; // 1+ year
  
  // Data source scoring
  if (dataSource === 'glassnode') score += 2;
  else if (dataSource === 'database') score += 1;
  
  if (score >= 6) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

function createDeadAssetResult(
  input: CagrInput, 
  startPrice: number, 
  endPrice: number, 
  daysHeld: number, 
  timeperiodYears: number
): CagrResult {
  return {
    basic: -100,
    adjusted: -100,
    startPrice,
    endPrice,
    daysHeld,
    volatility90d: 0,
    liquidityStatus: 'illiquid',
    dataPoints: 0,
    dataSource: 'glassnode',
    confidence: 'low',
    calculationSteps: {
      step1_initialValue: startPrice,
      step2_finalValue: endPrice,
      step3_timeperiodYears: timeperiodYears,
      step4_growthRatio: endPrice / startPrice,
      step5_exponent: 1 / timeperiodYears,
      step6_cagrBase: 0,
      step7_finalCAGR: -100,
      step8_adjustedCAGR: -100
    },
    timeperiodYears
  };
}
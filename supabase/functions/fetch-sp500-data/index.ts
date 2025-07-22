
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const alphaVantageApiKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    
    if (!alphaVantageApiKey) {
      throw new Error('Alpha Vantage API key not configured');
    }

    console.log('📈 Fetching S&P 500 monthly data from Alpha Vantage...');
    
    // Fetch monthly S&P 500 data using SPY ETF (36 months)
    const response = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=SPY&outputsize=compact&apikey=${alphaVantageApiKey}`
    );

    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data['Error Message']) {
      throw new Error(`Alpha Vantage error: ${data['Error Message']}`);
    }

    if (data['Note']) {
      throw new Error('Alpha Vantage API rate limit exceeded');
    }

    if (!data['Monthly Time Series']) {
      throw new Error('No S&P 500 monthly data available from Alpha Vantage');
    }

    // Process monthly data
    const monthlyData = data['Monthly Time Series'];
    const dates = Object.keys(monthlyData).sort().reverse(); // Most recent first
    const prices = dates.slice(0, 36).map(date => ({
      date,
      close: parseFloat(monthlyData[date]['4. close'])
    })).reverse(); // Oldest first for CAGR calculation

    console.log(`✅ Fetched ${prices.length} months of S&P 500 data from Alpha Vantage`);

    // Calculate monthly returns
    const monthlyReturns = [];
    for (let i = 1; i < prices.length; i++) {
      const prevPrice = prices[i - 1].close;
      const currentPrice = prices[i].close;
      const monthlyReturn = (currentPrice - prevPrice) / prevPrice;
      monthlyReturns.push(monthlyReturn);
    }

    // Calculate CAGR and volatility
    const cagr = calculateCAGR(prices);
    const volatility = calculateVolatility(monthlyReturns);

    console.log(`📊 S&P 500 metrics: CAGR=${(cagr * 100).toFixed(2)}%, Volatility=${(volatility * 100).toFixed(2)}%, Returns=${monthlyReturns.length}`);

    return new Response(JSON.stringify({ 
      data: prices,
      monthlyReturns: monthlyReturns,
      cagr: cagr,
      volatility: volatility
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Failed to fetch S&P 500 data:', error);
    
    // Return fallback data with realistic S&P 500 monthly returns (3 years sample)
    const fallbackMonthlyReturns = [
      0.021, -0.034, 0.068, 0.012, -0.015, 0.039, 0.051, -0.022, 0.018, 0.031, -0.041, 0.028,
      0.045, -0.018, 0.033, -0.062, 0.074, 0.019, -0.028, 0.056, 0.014, -0.037, 0.042, 0.067,
      -0.031, 0.023, 0.048, -0.019, 0.035, -0.054, 0.069, 0.026, -0.013, 0.047, 0.032, -0.025
    ];

    return new Response(JSON.stringify({
      error: error.message,
      fallback: true,
      data: [],
      monthlyReturns: fallbackMonthlyReturns,
      cagr: 0.085, // 8.5% historical average
      volatility: 0.16 // 16% historical average
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper functions
function calculateCAGR(prices: Array<{date: string, close: number}>): number {
  if (prices.length < 2) return 0.085; // Fallback to 8.5%
  
  const startPrice = prices[0].close;
  const endPrice = prices[prices.length - 1].close;
  const years = prices.length / 12; // Monthly data
  
  return Math.pow(endPrice / startPrice, 1 / years) - 1;
}

function calculateVolatility(returns: number[]): number {
  if (returns.length < 2) return 0.16; // Fallback to 16%
  
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (returns.length - 1);
  
  return Math.sqrt(variance * 12); // Annualized from monthly
}

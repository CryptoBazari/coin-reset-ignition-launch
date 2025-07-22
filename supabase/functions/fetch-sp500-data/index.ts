
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    const fiveYearsAgo = Math.floor((Date.now() - (5 * 365 * 24 * 60 * 60 * 1000)) / 1000);
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Fetch from Yahoo Finance API
    const response = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/download/^GSPC?period1=${fiveYearsAgo}&period2=${currentTime}&interval=1mo&events=history&includeAdjustedClose=true`
    );

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.text();
    const lines = data.split('\n').filter(line => line.trim());
    const prices = lines.slice(1).map(line => {
      const [date, , , , close] = line.split(',');
      return { date, close: parseFloat(close) };
    }).filter(item => !isNaN(item.close));

    return new Response(JSON.stringify({ 
      data: prices,
      cagr: calculateCAGR(prices),
      volatility: calculateVolatility(prices)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching S&P 500 data:', error);
    
    // Return fallback data
    return new Response(JSON.stringify({
      error: error.message,
      fallback: true,
      data: [],
      cagr: 0.08, // 8% historical average
      volatility: 0.15 // 15% historical average
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper functions
function calculateCAGR(prices: Array<{date: string, close: number}>): number {
  if (prices.length < 2) return 0.08; // Fallback to 8%
  
  const startPrice = prices[0].close;
  const endPrice = prices[prices.length - 1].close;
  const years = prices.length / 12; // Assuming monthly data
  
  return Math.pow(endPrice / startPrice, 1 / years) - 1;
}

function calculateVolatility(prices: Array<{date: string, close: number}>): number {
  if (prices.length < 2) return 0.15; // Fallback to 15%
  
  const returns = prices.slice(1).map((price, i) => {
    return (price.close - prices[i].close) / prices[i].close;
  });
  
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (returns.length - 1);
  
  return Math.sqrt(variance * 12); // Annualized from monthly
}

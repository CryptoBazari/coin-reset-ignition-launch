
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { startDate, endDate } = await req.json();
    
    const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
    
    // Yahoo Finance URL for S&P 500 historical data
    const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/download/%5EGSPC?period1=${startTimestamp}&period2=${endTimestamp}&interval=1mo&events=history`;
    
    console.log('Fetching S&P 500 data from Yahoo Finance');
    
    const response = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const csvData = await response.text();
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',');
        const date = values[0];
        const close = parseFloat(values[4]); // Close price is usually the 5th column
        
        if (!isNaN(close)) {
          data.push({
            date: date,
            price: close,
            timestamp: new Date(date).toISOString()
          });
        }
      }
    }

    console.log(`Successfully fetched ${data.length} S&P 500 data points`);

    return new Response(
      JSON.stringify({ 
        data: data,
        source: 'Yahoo Finance',
        symbol: 'S&P 500 (^GSPC)'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in fetch-sp500-data function:', error);
    
    // Fallback to approximated data if Yahoo Finance fails
    const { startDate, endDate } = await req.json();
    const startTime = new Date(startDate).getTime();
    const endTime = new Date(endDate).getTime();
    const monthlyData = [];
    
    let currentPrice = 3000; // Starting approximation
    const monthlyGrowth = 1.007; // ~8.4% annual growth
    
    for (let timestamp = startTime; timestamp < endTime; timestamp += 30 * 24 * 60 * 60 * 1000) {
      currentPrice *= monthlyGrowth + (Math.random() - 0.5) * 0.05; // Add volatility
      monthlyData.push({
        date: new Date(timestamp).toISOString().split('T')[0],
        price: currentPrice,
        timestamp: new Date(timestamp).toISOString()
      });
    }
    
    console.log('Using fallback S&P 500 approximation data');
    
    return new Response(
      JSON.stringify({ 
        data: monthlyData,
        source: 'Fallback Approximation',
        symbol: 'S&P 500 (Estimated)',
        warning: 'Using approximated data due to Yahoo Finance error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

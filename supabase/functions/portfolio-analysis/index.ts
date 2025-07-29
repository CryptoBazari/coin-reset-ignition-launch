import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Allocation rules based on portfolio value
const ALLOCATION_RULES = {
  TIER1: { minBtc: 0.6, maxBluechip: 0.4, maxSmallcap: 0.15 },  // $0-$50,000
  TIER2: { minBtc: 0.7, maxBluechip: 0.3, maxSmallcap: 0.10 },  // $50,001-$200,000
  TIER3: { minBtc: 0.85, maxBluechip: 0.15, maxSmallcap: 0.05 } // $200,000+
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { portfolioId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Analyzing portfolio:', portfolioId);

    // 1. Get Bitcoin market condition
    const avivResponse = await supabase.functions.invoke('bitcoin-aviv');
    const avivData = avivResponse.data || { avivRatio: 1.5, marketCondition: 'NEUTRAL' };

    // 2. Fetch portfolio assets
    const { data: assets, error: assetsError } = await supabase
      .from('virtual_assets')
      .select(`
        *,
        virtual_coins!inner(symbol, name)
      `)
      .eq('portfolio_id', portfolioId);

    if (assetsError) throw assetsError;

    // 3. Get current prices from CoinMarketCap
    const symbols = [...new Set(assets.map(a => a.virtual_coins.symbol))];
    const pricePromises = symbols.map(async (symbol) => {
      try {
        const response = await fetch(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol}`, {
          headers: {
            'X-CMC_PRO_API_KEY': Deno.env.get('COINMARKETCAP_API_KEY')!
          }
        });
        const data = await response.json();
        return {
          symbol,
          price: data.data?.[symbol]?.quote?.USD?.price || 0
        };
      } catch (error) {
        console.error(`Failed to fetch price for ${symbol}:`, error);
        return { symbol, price: 0 };
      }
    });

    const prices = await Promise.all(pricePromises);
    const priceMap = Object.fromEntries(prices.map(p => [p.symbol, p.price]));

    // 4. Calculate current values
    const enrichedAssets = assets.map(asset => {
      const currentPrice = priceMap[asset.virtual_coins.symbol] || 0;
      const currentValue = asset.total_amount * currentPrice;
      return {
        ...asset,
        currentPrice,
        currentValue,
        unrealizedPnL: currentValue - asset.cost_basis,
        symbol: asset.virtual_coins.symbol,
        name: asset.virtual_coins.name
      };
    });

    const totalValue = enrichedAssets.reduce((sum, a) => sum + a.currentValue, 0);
    const totalCostBasis = enrichedAssets.reduce((sum, a) => sum + a.cost_basis, 0);

    // 5. Calculate portfolio metrics using existing services
    let portfolioMetrics = {
      npv: 0,
      cagr: 0,
      beta: 0,
      diversificationScore: 0
    };

    const metricPromises = enrichedAssets.map(async (asset) => {
      const weight = asset.currentValue / totalValue;
      
      try {
        // Use existing advanced calculators
        const [npvRes, cagrRes, betaRes] = await Promise.all([
          supabase.functions.invoke('npv-calculation', {
            body: { 
              coinId: asset.symbol.toLowerCase(),
              amount: asset.currentValue,
              years: 2
            }
          }),
          supabase.functions.invoke('calculate-standalone-cagr', {
            body: { asset: asset.symbol.toLowerCase(), years_back: 1 }
          }),
          supabase.functions.invoke('calculate-real-beta', {
            body: { coinSymbol: asset.symbol.toLowerCase() }
          })
        ]);

        return {
          symbol: asset.symbol,
          weight,
          npv: npvRes.data?.npv || 0,
          cagr: cagrRes.data?.adjusted_cagr || 0,
          beta: betaRes.data?.beta || 1
        };
      } catch (error) {
        console.error(`Failed to calculate metrics for ${asset.symbol}:`, error);
        return {
          symbol: asset.symbol,
          weight,
          npv: 0,
          cagr: 0,
          beta: 1
        };
      }
    });

    const assetMetrics = await Promise.all(metricPromises);

    // Aggregate weighted portfolio metrics
    portfolioMetrics = assetMetrics.reduce((acc, metric) => ({
      npv: acc.npv + metric.npv,
      cagr: acc.cagr + (metric.weight * metric.cagr),
      beta: acc.beta + (metric.weight * metric.beta),
      diversificationScore: acc.diversificationScore
    }), { npv: 0, cagr: 0, beta: 0, diversificationScore: 0 });

    // Calculate diversification score
    const concentration = enrichedAssets.reduce((max, asset) => 
      Math.max(max, asset.currentValue / totalValue), 0
    );
    portfolioMetrics.diversificationScore = Math.max(0, 10 - (concentration * 10));

    // 6. Risk analysis with AVIV-adjusted rules
    const allocations = calculateAllocations(enrichedAssets, totalValue);
    const rules = getAllocationRules(totalValue, avivData.marketCondition);
    const riskAnalysis = analyzeRisk(allocations, rules);

    // 7. Generate recommendations
    const recommendations = generateRecommendations(
      enrichedAssets,
      totalValue,
      allocations,
      rules,
      riskAnalysis,
      avivData.marketCondition
    );

    const result = {
      bitcoinAVIV: avivData.avivRatio,
      marketCondition: avivData.marketCondition,
      summary: {
        currentValue: Number(totalValue.toFixed(2)),
        costBasis: Number(totalCostBasis.toFixed(2)),
        unrealizedGain: Number((totalValue - totalCostBasis).toFixed(2)),
        roi: Number(((totalValue - totalCostBasis) / totalCostBasis * 100).toFixed(2))
      },
      metrics: {
        npv: Number(portfolioMetrics.npv.toFixed(2)),
        cagr: Number((portfolioMetrics.cagr * 100).toFixed(2)),
        beta: Number(portfolioMetrics.beta.toFixed(3)),
        diversificationScore: Number(portfolioMetrics.diversificationScore.toFixed(1)),
        projectedValue1Y: Number((totalValue * Math.pow(1 + portfolioMetrics.cagr, 1)).toFixed(2)),
        projectedValue3Y: Number((totalValue * Math.pow(1 + portfolioMetrics.cagr, 3)).toFixed(2))
      },
      allocations,
      riskAnalysis,
      recommendations,
      assetBreakdown: enrichedAssets.map(asset => ({
        symbol: asset.symbol,
        name: asset.name,
        amount: asset.total_amount,
        currentValue: asset.currentValue,
        allocation: (asset.currentValue / totalValue * 100).toFixed(1) + '%',
        pnl: asset.unrealizedPnL
      }))
    };

    console.log('Portfolio analysis completed for:', portfolioId);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Portfolio analysis error:', error);
    return new Response(JSON.stringify({
      error: 'ANALYSIS_FAILED',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function calculateAllocations(assets: any[], totalValue: number) {
  const allocations = {
    bitcoin: 0,
    bluechip: 0,
    smallcap: 0
  };

  assets.forEach(asset => {
    const allocation = asset.currentValue / totalValue;
    
    if (asset.category === 'Bitcoin') {
      allocations.bitcoin += allocation;
    } else if (asset.category === 'Blue Chip') {
      allocations.bluechip += allocation;
    } else {
      allocations.smallcap += allocation;
    }
  });

  return allocations;
}

function getAllocationRules(totalValue: number, marketCondition: string) {
  const baseRules = totalValue <= 50000 ? ALLOCATION_RULES.TIER1 :
                   totalValue <= 200000 ? ALLOCATION_RULES.TIER2 :
                   ALLOCATION_RULES.TIER3;

  // Adjust based on Bitcoin market condition
  switch(marketCondition) {
    case 'STRONG_BUY':
      return {
        minBtc: Math.min(0.95, baseRules.minBtc + 0.1),
        maxBluechip: baseRules.maxBluechip,
        maxSmallcap: Math.max(0, baseRules.maxSmallcap - 0.05)
      };
      
    case 'STRONG_SELL':
      return {
        minBtc: Math.max(0.5, baseRules.minBtc - 0.1),
        maxBluechip: Math.max(0, baseRules.maxBluechip - 0.05),
        maxSmallcap: 0
      };
      
    default:
      return baseRules;
  }
}

function analyzeRisk(allocations: any, rules: any) {
  const issues = [];
  
  if (allocations.bitcoin < rules.minBtc) {
    issues.push(`Bitcoin allocation too low (${(allocations.bitcoin*100).toFixed(1)}% < ${(rules.minBtc*100).toFixed(0)}%)`);
  }
  if (allocations.bluechip > rules.maxBluechip) {
    issues.push(`Blue-chip allocation too high (${(allocations.bluechip*100).toFixed(1)}% > ${(rules.maxBluechip*100).toFixed(0)}%)`);
  }
  if (allocations.smallcap > rules.maxSmallcap) {
    issues.push(`Small-cap allocation too high (${(allocations.smallcap*100).toFixed(1)}% > ${(rules.maxSmallcap*100).toFixed(0)}%)`);
  }

  return {
    complianceStatus: issues.length ? 'non-compliant' : 'compliant',
    complianceIssues: issues,
    requiredRules: rules
  };
}

function generateRecommendations(assets: any[], totalValue: number, allocations: any, rules: any, riskAnalysis: any, marketCondition: string) {
  const recommendations = [];

  // 1. Market condition action
  recommendations.push({
    priority: 'critical',
    type: 'market',
    message: getMarketMessage(marketCondition),
    action: getMarketAction(marketCondition, totalValue)
  });

  // 2. Allocation adjustments
  if (allocations.bitcoin < rules.minBtc) {
    const deficit = (rules.minBtc - allocations.bitcoin) * totalValue;
    recommendations.push({
      priority: 'high',
      type: 'allocation',
      message: `Increase Bitcoin allocation to ${(rules.minBtc*100).toFixed(0)}%`,
      action: `Buy $${deficit.toFixed(0)} BTC`
    });
  }

  if (allocations.smallcap > rules.maxSmallcap) {
    const excess = (allocations.smallcap - rules.maxSmallcap) * totalValue;
    recommendations.push({
      priority: 'high',
      type: 'allocation',
      message: `Reduce small-cap exposure to ${(rules.maxSmallcap*100).toFixed(0)}%`,
      action: `Sell $${excess.toFixed(0)} of small-cap assets`
    });
  }

  return recommendations.sort((a, b) => a.priority === 'critical' ? -1 : 1);
}

function getMarketMessage(condition: string) {
  const messages = {
    STRONG_BUY: "Bitcoin AVIV indicates extreme undervaluation - maximum opportunity",
    DCA_BUY: "Bitcoin AVIV shows accumulation opportunity - systematic buying",
    ACCUMULATE: "Bitcoin AVIV suggests moderate growth conditions - buy on dips",
    NEUTRAL: "Bitcoin AVIV shows market equilibrium - hold positions",
    PREPARE_SELL: "Bitcoin AVIV indicates approaching overvaluation - prepare exits",
    STRONG_SELL: "Bitcoin AVIV shows extreme overvaluation - reduce exposure"
  };
  return messages[condition] || "Market condition analysis unavailable";
}

function getMarketAction(condition: string, portfolioValue: number) {
  const actions = {
    STRONG_BUY: `Invest $${(portfolioValue * 0.4).toLocaleString()} in Bitcoin immediately`,
    DCA_BUY: `DCA $${(portfolioValue * 0.1).toLocaleString()}/week into Bitcoin`,
    ACCUMULATE: `Buy Bitcoin on dips up to $${(portfolioValue * 0.2).toLocaleString()}`,
    NEUTRAL: "Maintain current Bitcoin allocation",
    PREPARE_SELL: `Sell $${(portfolioValue * 0.05).toLocaleString()} of altcoins weekly`,
    STRONG_SELL: `Sell $${(portfolioValue * 0.2).toLocaleString()} Bitcoin weekly`
  };
  return actions[condition] || "Hold current positions";
}
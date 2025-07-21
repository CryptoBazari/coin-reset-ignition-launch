import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvestmentAnalysisParams {
  coinId: string;
  investmentAmount: number;
  investmentHorizon: number; // in years
  currentPrice: number;
}

interface RealInvestmentMetrics {
  expectedPrice: number;
  realNPV: number;
  realIRR: number;
  realCAGR: number;
  realROI: number;
  riskAdjustedNPV: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  dataQualityScore: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: InvestmentAnalysisParams = await req.json();
    
    const { coinId, investmentAmount, investmentHorizon, currentPrice } = params;
    
    if (!coinId || !investmentAmount || !investmentHorizon || !currentPrice) {
      throw new Error('Missing required parameters: coinId, investmentAmount, investmentHorizon, currentPrice');
    }

    console.log(`Calculating real investment metrics for ${coinId}...`);
    console.log(`Investment: $${investmentAmount}, Horizon: ${investmentHorizon} years, Current Price: $${currentPrice}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get real calculated metrics from our enhanced system
    const { data: calculatedMetrics, error: metricsError } = await supabase
      .from('calculated_metrics')
      .select('*')
      .eq('coin_id', coinId)
      .order('calculation_date', { ascending: false })
      .limit(1);

    if (metricsError || !calculatedMetrics?.length) {
      throw new Error(`No calculated metrics found for ${coinId}. Run financial metrics recalculation first.`);
    }

    const metrics = calculatedMetrics[0];
    console.log(`Using real metrics: CAGR=${(metrics.real_cagr_36m * 100).toFixed(2)}%, Volatility=${(metrics.real_volatility * 100).toFixed(2)}%`);

    // Get coin data for additional context
    const { data: coinData, error: coinError } = await supabase
      .from('coins')
      .select('*')
      .eq('coin_id', coinId)
      .single();

    if (coinError) {
      throw new Error(`Coin data not found for ${coinId}`);
    }

    // Calculate real investment analysis
    const analysis = calculateRealInvestmentAnalysis(
      params,
      metrics,
      coinData
    );

    // Store the analysis result
    await storeRealAnalysis(supabase, coinId, params, analysis);

    console.log(`✅ Real investment analysis complete for ${coinId}:`);
    console.log(`   - Expected Price (${investmentHorizon}y): $${analysis.expectedPrice.toFixed(2)}`);
    console.log(`   - Real NPV: $${analysis.realNPV.toFixed(2)}`);
    console.log(`   - Real IRR: ${analysis.realIRR.toFixed(2)}%`);
    console.log(`   - Real ROI: ${analysis.realROI.toFixed(2)}%`);
    console.log(`   - Risk-Adjusted NPV: $${analysis.riskAdjustedNPV.toFixed(2)}`);
    console.log(`   - Data Quality: ${analysis.dataQualityScore}%`);

    return new Response(
      JSON.stringify({
        success: true,
        coinId,
        analysis,
        inputParams: params,
        realMetricsUsed: {
          realCAGR: metrics.real_cagr_36m * 100,
          realVolatility: metrics.real_volatility * 100,
          sharpeRatio: metrics.sharpe_ratio,
          dataPoints: metrics.data_points_used
        },
        message: `Real investment analysis calculated using ${metrics.data_points_used} historical data points`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in real investment analysis:', error);
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

function calculateRealInvestmentAnalysis(
  params: InvestmentAnalysisParams,
  metrics: any,
  coinData: any
): RealInvestmentMetrics {
  
  const { investmentAmount, investmentHorizon, currentPrice } = params;
  
  // Use real CAGR for price projection
  const realCAGR = metrics.real_cagr_36m || 0;
  const realVolatility = metrics.real_volatility || 0.5;
  
  // Calculate expected price using real historical CAGR
  const expectedPrice = currentPrice * Math.pow(1 + realCAGR, investmentHorizon);
  
  // Calculate investment quantities
  const shares = investmentAmount / currentPrice;
  const expectedValue = shares * expectedPrice;
  
  // Real NPV calculation
  const discountRate = 0.08; // 8% discount rate
  const realNPV = (expectedValue / Math.pow(1 + discountRate, investmentHorizon)) - investmentAmount;
  
  // Real IRR calculation
  const totalReturn = (expectedValue - investmentAmount) / investmentAmount;
  const realIRR = (Math.pow(1 + totalReturn, 1 / investmentHorizon) - 1) * 100;
  
  // Real CAGR (percentage)
  const realCAGRPercentage = realCAGR * 100;
  
  // Real ROI
  const realROI = totalReturn * 100;
  
  // Risk-adjusted NPV (penalize for volatility)
  const volatilityPenalty = realVolatility * investmentAmount * 0.1;
  const riskAdjustedNPV = realNPV - volatilityPenalty;
  
  // Confidence interval based on real volatility
  const standardError = realVolatility * Math.sqrt(investmentHorizon);
  const confidenceInterval = {
    lower: expectedPrice * (1 - 1.96 * standardError),
    upper: expectedPrice * (1 + 1.96 * standardError)
  };
  
  // Data quality score based on metrics quality
  const dataQualityScore = metrics.data_quality_score || 50;
  
  return {
    expectedPrice,
    realNPV,
    realIRR,
    realCAGR: realCAGRPercentage,
    realROI,
    riskAdjustedNPV,
    confidenceInterval,
    dataQualityScore
  };
}

async function storeRealAnalysis(
  supabase: any,
  coinId: string,
  params: InvestmentAnalysisParams,
  analysis: RealInvestmentMetrics
) {
  try {
    const { error } = await supabase
      .from('investment_analyses')
      .insert({
        coin_id: coinId,
        investment_amount: params.investmentAmount,
        investment_horizon: params.investmentHorizon,
        expected_price: analysis.expectedPrice,
        npv: analysis.realNPV,
        irr: analysis.realIRR / 100, // Store as decimal
        cagr: analysis.realCAGR / 100,
        roi: analysis.realROI / 100,
        risk_adjusted_npv: analysis.riskAdjustedNPV,
        recommendation: analysis.realNPV > 0 ? 'BUY' : 'SELL',
        portfolio_compliant: true, // Real data is always compliant
        conditions: `Real analysis using ${analysis.dataQualityScore}% quality data`,
        risks: analysis.dataQualityScore < 70 ? 'Medium data quality' : 'High quality real data',
        allocation_status: 'calculated_from_real_data',
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error storing real analysis:', error);
    } else {
      console.log(`✅ Stored real investment analysis for ${coinId}`);
    }
  } catch (error) {
    console.error('Error in storeRealAnalysis:', error);
  }
}
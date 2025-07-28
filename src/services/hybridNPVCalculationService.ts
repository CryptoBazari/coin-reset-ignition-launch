import { supabase } from '@/integrations/supabase/client';
import { glassnodeBetaCalculationService, BetaCalculationResult } from './glassnodeBetaCalculationService';
import { standaloneCAGRCalculationService, StandaloneCAGRResult } from './standaloneCAGRCalculationService';

export interface LiquidityClassification {
  status: 'liquid' | 'moderate' | 'illiquid';
  avgVolume30d: number;
  premium: number;
}

export interface NPVCalculationResult {
  npv: number;
  irr: number;
  terminalValue: number;
  discountRate: number;
  beta: number;
  betaType: 'basic' | 'advanced';
  benchmark: 'SP500' | 'BTC';
  liquidity: LiquidityClassification;
  cagrData: StandaloneCAGRResult;
  betaDetails: BetaCalculationResult;
  yearlyBreakdown: Array<{
    year: number;
    cashFlow: number;
    presentValue: number;
    discountFactor: number;
  }>;
  confidenceScore: number;
  calculation: {
    riskFreeRate: number;
    marketReturn: number;
    liquidityPremium: number;
    betaAdjustment: number;
  };
}

export interface NPVCacheEntry {
  asset: string;
  amount: number;
  years: number;
  advanced_beta?: number;
  result: any; // JSON data from database
  benchmark_type: string;
  liquidity_status: string;
  expires_at: string;
}

class HybridNPVCalculationService {
  private readonly RISK_FREE_RATE = 0.045; // 4.5% Treasury yield
  private readonly SP500_EXPECTED_RETURN = 0.10; // 10%
  private readonly BTC_EXPECTED_RETURN = 0.15; // 15%
  
  // Liquidity premiums
  private readonly LIQUIDITY_PREMIUMS = {
    liquid: 0.02,    // 2%
    moderate: 0.05,  // 5%
    illiquid: 0.15   // 15%
  };

  // Volume thresholds for liquidity classification
  private readonly VOLUME_THRESHOLDS = {
    BTC: {
      liquid: 2e9,    // >$2B
      moderate: 5e8   // >$500M
    },
    ALTCOIN: {
      liquid: 5e8,    // >$500M
      moderate: 1e8   // >$100M
    }
  };

  /**
   * Calculate comprehensive NPV with hybrid data sources
   */
  async calculateHybridNPV(
    asset: string,
    amount: number,
    years: number,
    advancedBeta?: number
  ): Promise<NPVCalculationResult> {
    try {
      console.log(`🚀 Starting hybrid NPV calculation for ${asset.toUpperCase()}`);
      console.log(`   Investment: $${amount}, Horizon: ${years} years`);

      // Check cache first
      const cached = await this.getCachedResult(asset, amount, years, advancedBeta);
      if (cached) {
        console.log('✅ Using cached NPV result');
        return cached.result;
      }

      // Use edge function for data-intensive calculation
      const { data, error } = await supabase.functions.invoke('npv-calculation', {
        body: JSON.stringify({
          asset: asset.toLowerCase(),
          amount,
          years,
          advancedBeta
        })
      });

      if (error) {
        console.error('❌ NPV calculation failed:', error);
        throw new Error(`NPV calculation failed: ${error.message}`);
      }

      console.log('✅ NPV calculation completed via edge function');

      // Cache the result
      await this.cacheResult(asset, amount, years, advancedBeta, data);

      return data;
    } catch (error) {
      console.error('❌ Hybrid NPV calculation error:', error);
      throw error;
    }
  }

  /**
   * Calculate NPV locally (fallback method)
   */
  async calculateLocalNPV(
    asset: string,
    amount: number,
    years: number,
    advancedBeta?: number
  ): Promise<NPVCalculationResult> {
    try {
      console.log('🔄 Calculating NPV locally as fallback');
      
      const assetLower = asset.toLowerCase();
      const isBitcoin = assetLower === 'btc' || assetLower === 'bitcoin';

      // Step 1: Get CAGR data
      const cagrData = await standaloneCAGRCalculationService.calculateStandaloneCAGR(
        assetLower,
        asset.toUpperCase(),
        years
      );

      // Step 2: Get beta data
      let betaDetails: BetaCalculationResult;
      let beta: number;
      let betaType: 'basic' | 'advanced';

      if (advancedBeta) {
        // Use provided advanced beta
        beta = advancedBeta;
        betaType = 'advanced';
        // Still get beta details for context
        betaDetails = await glassnodeBetaCalculationService.calculateBeta(assetLower);
      } else {
        // Calculate comprehensive beta
        betaDetails = await glassnodeBetaCalculationService.calculateBeta(assetLower);
        beta = betaDetails.beta;
        betaType = 'basic';
      }

      // Step 3: Determine benchmark and market return
      const benchmark = isBitcoin ? 'SP500' : 'BTC';
      const marketReturn = isBitcoin ? this.SP500_EXPECTED_RETURN : this.BTC_EXPECTED_RETURN;

      // Step 4: Classify liquidity (simplified for local calculation)
      const liquidity: LiquidityClassification = {
        status: this.getEstimatedLiquidity(assetLower),
        avgVolume30d: 0, // Would need volume data
        premium: this.LIQUIDITY_PREMIUMS[this.getEstimatedLiquidity(assetLower)]
      };

      // Step 5: Calculate discount rate using CAPM
      const betaAdjustment = beta * (marketReturn - this.RISK_FREE_RATE);
      const discountRate = this.RISK_FREE_RATE + betaAdjustment + liquidity.premium;

      // Step 6: Calculate NPV and IRR
      const terminalValue = amount * Math.pow(1 + cagrData.cagr / 100, years);
      const npv = -amount + (terminalValue / Math.pow(1 + discountRate, years));
      const irr = Math.pow(terminalValue / amount, 1 / years) - 1;

      // Step 7: Generate yearly breakdown
      const yearlyBreakdown = this.generateYearlyBreakdown(amount, terminalValue, discountRate, years);

      // Step 8: Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(cagrData, betaDetails, liquidity);

      const result: NPVCalculationResult = {
        npv,
        irr,
        terminalValue,
        discountRate,
        beta,
        betaType,
        benchmark,
        liquidity,
        cagrData,
        betaDetails,
        yearlyBreakdown,
        confidenceScore,
        calculation: {
          riskFreeRate: this.RISK_FREE_RATE,
          marketReturn,
          liquidityPremium: liquidity.premium,
          betaAdjustment
        }
      };

      console.log(`✅ Local NPV calculation completed: $${npv.toFixed(2)}`);
      return result;
    } catch (error) {
      console.error('❌ Local NPV calculation failed:', error);
      throw error;
    }
  }

  /**
   * Get cached NPV result
   */
  private async getCachedResult(
    asset: string,
    amount: number,
    years: number,
    advancedBeta?: number
  ): Promise<NPVCacheEntry | null> {
    try {
      const { data, error } = await supabase
        .from('npv_cache')
        .select('*')
        .eq('asset', asset.toLowerCase())
        .eq('amount', amount)
        .eq('years', years)
        .eq('advanced_beta', advancedBeta || null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) return null;

      return data as NPVCacheEntry;
    } catch (error) {
      console.warn('⚠️ Cache lookup failed:', error);
      return null;
    }
  }

  /**
   * Cache NPV result
   */
  private async cacheResult(
    asset: string,
    amount: number,
    years: number,
    advancedBeta: number | undefined,
    result: NPVCalculationResult
  ): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15-minute cache

      await supabase
        .from('npv_cache')
        .upsert({
          asset: asset.toLowerCase(),
          amount,
          years,
          advanced_beta: advancedBeta || null,
          result: result as any, // Cast to any for JSON storage
          benchmark_type: result.benchmark,
          liquidity_status: result.liquidity.status,
          expires_at: expiresAt.toISOString()
        });

      console.log('💾 NPV result cached successfully');
    } catch (error) {
      console.warn('⚠️ Failed to cache NPV result:', error);
    }
  }

  /**
   * Generate yearly cash flow breakdown
   */
  private generateYearlyBreakdown(
    initialInvestment: number,
    terminalValue: number,
    discountRate: number,
    years: number
  ): Array<{ year: number; cashFlow: number; presentValue: number; discountFactor: number }> {
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

  /**
   * Calculate overall confidence score
   */
  private calculateConfidenceScore(
    cagrData: StandaloneCAGRResult,
    betaDetails: BetaCalculationResult,
    liquidity: LiquidityClassification
  ): number {
    let score = 30; // Base score

    // CAGR data quality (use confidence instead of dataQuality)
    if (cagrData.confidence === 'high') score += 25;
    else if (cagrData.confidence === 'medium') score += 15;
    else score += 5;

    // Beta calculation quality
    score += betaDetails.dataQualityScore * 0.3; // Up to 30 points

    // Liquidity factor
    if (liquidity.status === 'liquid') score += 15;
    else if (liquidity.status === 'moderate') score += 10;
    else score += 5;

    return Math.min(95, Math.round(score));
  }

  /**
   * Estimate liquidity for local calculations
   */
  private getEstimatedLiquidity(asset: string): 'liquid' | 'moderate' | 'illiquid' {
    const liquidAssets = ['btc', 'eth', 'usdt', 'usdc', 'bnb', 'ada', 'sol', 'xrp', 'doge', 'dot'];
    const moderateAssets = ['ltc', 'link', 'bch', 'uni', 'matic', 'xlm', 'vet', 'fil', 'etc', 'atom'];

    if (liquidAssets.includes(asset.toLowerCase())) return 'liquid';
    if (moderateAssets.includes(asset.toLowerCase())) return 'moderate';
    return 'illiquid';
  }

  /**
   * Clean expired cache entries
   */
  async cleanExpiredCache(): Promise<void> {
    try {
      await supabase.rpc('clean_expired_npv_cache');
      console.log('🧹 Cleaned expired NPV cache entries');
    } catch (error) {
      console.warn('⚠️ Failed to clean expired cache:', error);
    }
  }
}

export const hybridNPVCalculationService = new HybridNPVCalculationService();
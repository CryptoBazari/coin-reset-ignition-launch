import { supabase } from '@/integrations/supabase/client';
import { fetchGlassNodeMetric, GLASS_NODE_METRICS } from './glassNodeService';

export interface CointimeMetric {
  id: string;
  coin_id: string;
  metric_date: string;
  aviv_ratio: number | null;
  cointime_destroyed: number | null;
  cointime_created: number | null;
  active_supply_pct: number | null;
  vaulted_supply_pct: number | null;
  liquid_supply_pct: number | null;
  data_source: string;
  confidence_score: number;
  created_at: string;
}

export interface CointimeAnalysis {
  currentAviv: number | null;
  avivTrend: 'bullish' | 'bearish' | 'neutral';
  supplyDistribution: {
    active: number;
    vaulted: number;
    liquid: number;
  };
  cointimeActivity: {
    destroyed: number;
    created: number;
    ratio: number;
  };
  confidenceScore: number;
  recommendation: string;
}

class CointimeMetricsService {
  async getCointimeMetrics(coinId: string, days: number = 30): Promise<CointimeMetric[]> {
    const { data, error } = await supabase
      .from('cointime_metrics')
      .select('*')
      .eq('coin_id', coinId)
      .order('metric_date', { ascending: false })
      .limit(days);

    if (error) {
      console.error('Error fetching cointime metrics:', error);
      return [];
    }

    return data || [];
  }

  async getLatestCointimeData(coinId: string): Promise<CointimeMetric | null> {
    const { data, error } = await supabase
      .from('cointime_metrics')
      .select('*')
      .eq('coin_id', coinId)
      .order('metric_date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return data;
  }

  async analyzeCointimeEconomics(coinId: string): Promise<CointimeAnalysis> {
    const metrics = await this.getCointimeMetrics(coinId, 30);
    
    if (metrics.length === 0) {
      return this.getDefaultAnalysis();
    }

    const latest = metrics[0];
    const previous = metrics[7] || metrics[metrics.length - 1]; // 7 days ago or oldest

    // Calculate AVIV trend
    const avivTrend = this.calculateAvivTrend(latest.aviv_ratio, previous.aviv_ratio);

    // Supply distribution
    const supplyDistribution = {
      active: latest.active_supply_pct || 0,
      vaulted: latest.vaulted_supply_pct || 0,
      liquid: latest.liquid_supply_pct || 0
    };

    // Cointime activity
    const cointimeActivity = {
      destroyed: latest.cointime_destroyed || 0,
      created: latest.cointime_created || 0,
      ratio: latest.cointime_destroyed && latest.cointime_created 
        ? latest.cointime_destroyed / latest.cointime_created 
        : 0
    };

    // Generate recommendation
    const recommendation = this.generateRecommendation(latest, avivTrend);

    return {
      currentAviv: latest.aviv_ratio,
      avivTrend,
      supplyDistribution,
      cointimeActivity,
      confidenceScore: latest.confidence_score,
      recommendation
    };
  }

  private calculateAvivTrend(current: number | null, previous: number | null): 'bullish' | 'bearish' | 'neutral' {
    if (!current || !previous) return 'neutral';
    
    const change = (current - previous) / previous;
    
    if (change > 0.05) return 'bullish';
    if (change < -0.05) return 'bearish';
    return 'neutral';
  }

  private generateRecommendation(latest: CointimeMetric, avivTrend: string): string {
    const recommendations: string[] = [];

    // AVIV-based recommendations
    if (latest.aviv_ratio) {
      if (latest.aviv_ratio > 0.7) {
        recommendations.push("High AVIV ratio suggests strong hodling behavior");
      } else if (latest.aviv_ratio < 0.3) {
        recommendations.push("Low AVIV ratio indicates increased distribution activity");
      }
    }

    // Supply distribution recommendations
    if (latest.liquid_supply_pct && latest.liquid_supply_pct > 0.8) {
      recommendations.push("High liquid supply may indicate selling pressure");
    }

    if (latest.vaulted_supply_pct && latest.vaulted_supply_pct > 0.6) {
      recommendations.push("High vaulted supply suggests long-term holding confidence");
    }

    // Trend-based recommendations
    if (avivTrend === 'bullish') {
      recommendations.push("Positive AVIV trend supports accumulation strategy");
    } else if (avivTrend === 'bearish') {
      recommendations.push("Declining AVIV trend suggests caution in timing");
    }

    return recommendations.length > 0 
      ? recommendations.join('. ') + '.'
      : 'Insufficient data for detailed recommendations.';
  }

  private getDefaultAnalysis(): CointimeAnalysis {
    return {
      currentAviv: null,
      avivTrend: 'neutral',
      supplyDistribution: { active: 0, vaulted: 0, liquid: 0 },
      cointimeActivity: { destroyed: 0, created: 0, ratio: 0 },
      confidenceScore: 0,
      recommendation: 'No cointime data available for analysis.'
    };
  }

  async fetchAndStoreCointimeData(coinSymbol: string): Promise<void> {
    try {
      const coinId = coinSymbol.toLowerCase();
      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago

      // Fetch Glass Node cointime metrics
      const [avivData, liquidSupplyData, illiquidSupplyData] = await Promise.all([
        fetchGlassNodeMetric(GLASS_NODE_METRICS.AVIV_RATIO, coinSymbol, since),
        fetchGlassNodeMetric(GLASS_NODE_METRICS.LIQUID_SUPPLY, coinSymbol, since),
        fetchGlassNodeMetric(GLASS_NODE_METRICS.ILLIQUID_SUPPLY, coinSymbol, since)
      ]);

      // Process and store the data
      const combinedData = this.combineCointimeData(avivData, liquidSupplyData, illiquidSupplyData);
      
      if (combinedData.length > 0) {
        await this.storeCointimeMetrics(coinId, combinedData);
      }
    } catch (error) {
      console.error('Error fetching cointime data:', error);
      throw error;
    }
  }

  private combineCointimeData(avivData: any[], liquidData: any[], illiquidData: any[]) {
    const dataMap = new Map();

    // Process AVIV data
    avivData.forEach(item => {
      const date = new Date(item.t * 1000).toISOString().split('T')[0];
      if (!dataMap.has(date)) {
        dataMap.set(date, { date });
      }
      dataMap.get(date).aviv_ratio = item.v;
    });

    // Process liquid supply data
    liquidData.forEach(item => {
      const date = new Date(item.t * 1000).toISOString().split('T')[0];
      if (!dataMap.has(date)) {
        dataMap.set(date, { date });
      }
      dataMap.get(date).liquid_supply = item.v;
    });

    // Process illiquid supply data
    illiquidData.forEach(item => {
      const date = new Date(item.t * 1000).toISOString().split('T')[0];
      if (!dataMap.has(date)) {
        dataMap.set(date, { date });
      }
      dataMap.get(date).illiquid_supply = item.v;
    });

    return Array.from(dataMap.values());
  }

  private async storeCointimeMetrics(coinId: string, data: any[]): Promise<void> {
    const records = data.map(item => {
      const liquidPct = item.liquid_supply ? (item.liquid_supply / (item.liquid_supply + (item.illiquid_supply || 0))) * 100 : null;
      const vaultedPct = item.illiquid_supply ? (item.illiquid_supply / (item.liquid_supply + item.illiquid_supply)) * 100 : null;

      return {
        coin_id: coinId,
        metric_date: item.date,
        aviv_ratio: item.aviv_ratio || null,
        liquid_supply_pct: liquidPct,
        vaulted_supply_pct: vaultedPct,
        data_source: 'glassnode',
        confidence_score: this.calculateConfidenceScore(item)
      };
    }).filter(record => 
      record.aviv_ratio !== null || 
      record.liquid_supply_pct !== null || 
      record.vaulted_supply_pct !== null
    );

    if (records.length > 0) {
      const { error } = await supabase
        .from('cointime_metrics')
        .upsert(records, { 
          onConflict: 'coin_id,metric_date',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error storing cointime metrics:', error);
        throw error;
      }
    }
  }

  private calculateConfidenceScore(item: any): number {
    let score = 0;
    if (item.aviv_ratio !== null) score += 40;
    if (item.liquid_supply !== null) score += 30;
    if (item.illiquid_supply !== null) score += 30;
    return score;
  }
}

export const cointimeMetricsService = new CointimeMetricsService();
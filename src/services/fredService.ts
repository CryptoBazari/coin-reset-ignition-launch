
import { supabase } from '@/integrations/supabase/client';

export interface FredDataPoint {
  date: string;
  value: string;
}

export interface FredSeriesData {
  series_id: string;
  title: string;
  data: FredDataPoint[];
}

export const fetchFredSeries = async (seriesId: string, limit = 20): Promise<FredDataPoint[]> => {
  try {
    console.log(`Fetching FRED series: ${seriesId}`);
    
    const { data, error } = await supabase.functions.invoke('fetch-fred-data', {
      body: { 
        seriesId,
        limit
      }
    });

    if (error) {
      console.error('Error fetching FRED data:', error);
      return [];
    }

    return data?.data || [];
  } catch (error) {
    console.error('Error calling FRED function:', error);
    return [];
  }
};

// Fetch multiple economic indicators at once
export const fetchEconomicIndicators = async (): Promise<{
  fedFundsRate: FredDataPoint[];
  inflation: FredDataPoint[];
  gdp: FredDataPoint[];
  unemployment: FredDataPoint[];
  treasuryYield10Y: FredDataPoint[];
  treasuryYield2Y: FredDataPoint[];
  m2MoneySupply: FredDataPoint[];
  consumerSentiment: FredDataPoint[];
}> => {
  try {
    const [
      fedFundsRate,
      inflation,
      gdp,
      unemployment,
      treasuryYield10Y,
      treasuryYield2Y,
      m2MoneySupply,
      consumerSentiment
    ] = await Promise.all([
      fetchFredSeries('FEDFUNDS', 12), // Federal Funds Rate
      fetchFredSeries('CPIAUCSL', 12), // Consumer Price Index
      fetchFredSeries('GDP', 8), // Gross Domestic Product
      fetchFredSeries('UNRATE', 12), // Unemployment Rate
      fetchFredSeries('GS10', 12), // 10-Year Treasury Rate
      fetchFredSeries('GS2', 12), // 2-Year Treasury Rate
      fetchFredSeries('M2SL', 12), // M2 Money Supply
      fetchFredSeries('UMCSENT', 12) // Consumer Sentiment
    ]);

    return {
      fedFundsRate,
      inflation,
      gdp,
      unemployment,
      treasuryYield10Y,
      treasuryYield2Y,
      m2MoneySupply,
      consumerSentiment
    };
  } catch (error) {
    console.error('Error fetching multiple economic indicators:', error);
    return {
      fedFundsRate: [],
      inflation: [],
      gdp: [],
      unemployment: [],
      treasuryYield10Y: [],
      treasuryYield2Y: [],
      m2MoneySupply: [],
      consumerSentiment: []
    };
  }
};

// Calculate yield curve (10Y - 2Y spread)
export const calculateYieldCurveSpread = (
  treasury10Y: FredDataPoint[], 
  treasury2Y: FredDataPoint[]
): number => {
  if (treasury10Y.length === 0 || treasury2Y.length === 0) return 0;
  
  const latest10Y = parseFloat(treasury10Y[0].value);
  const latest2Y = parseFloat(treasury2Y[0].value);
  
  return latest10Y - latest2Y;
};

// Calculate inflation trend (YoY change)
export const calculateInflationTrend = (inflationData: FredDataPoint[]): number => {
  if (inflationData.length < 12) return 0;
  
  const currentCPI = parseFloat(inflationData[0].value);
  const yearAgoCPI = parseFloat(inflationData[11].value);
  
  return ((currentCPI - yearAgoCPI) / yearAgoCPI) * 100;
};

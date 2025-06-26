
import { supabase } from '@/integrations/supabase/client';

export interface FedRateData {
  date: string;
  value: string;
}

export interface EconomicIndicatorData {
  date: string;
  value: string;
}

export const fetchFedFundsRate = async (): Promise<FedRateData[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-alpha-vantage-data', {
      body: { 
        function: 'FEDERAL_FUNDS_RATE'
      }
    });

    if (error) {
      console.error('Error fetching Fed funds rate:', error);
      return [];
    }

    // Alpha Vantage returns data in a specific format
    const rateData = data?.data?.data || [];
    return rateData.slice(0, 12); // Get last 12 months
  } catch (error) {
    console.error('Error calling Alpha Vantage Fed rate function:', error);
    return [];
  }
};

export const fetchInflationRate = async (): Promise<EconomicIndicatorData[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-alpha-vantage-data', {
      body: { 
        function: 'CPI',
        interval: 'monthly'
      }
    });

    if (error) {
      console.error('Error fetching inflation rate:', error);
      return [];
    }

    const inflationData = data?.data?.data || [];
    return inflationData.slice(0, 12); // Get last 12 months
  } catch (error) {
    console.error('Error calling Alpha Vantage inflation function:', error);
    return [];
  }
};

export const fetchGDPData = async (): Promise<EconomicIndicatorData[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-alpha-vantage-data', {
      body: { 
        function: 'REAL_GDP',
        interval: 'quarterly'
      }
    });

    if (error) {
      console.error('Error fetching GDP data:', error);
      return [];
    }

    const gdpData = data?.data?.data || [];
    return gdpData.slice(0, 8); // Get last 8 quarters
  } catch (error) {
    console.error('Error calling Alpha Vantage GDP function:', error);
    return [];
  }
};

export const fetchUnemploymentRate = async (): Promise<EconomicIndicatorData[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-alpha-vantage-data', {
      body: { 
        function: 'UNEMPLOYMENT'
      }
    });

    if (error) {
      console.error('Error fetching unemployment rate:', error);
      return [];
    }

    const unemploymentData = data?.data?.data || [];
    return unemploymentData.slice(0, 12); // Get last 12 months
  } catch (error) {
    console.error('Error calling Alpha Vantage unemployment function:', error);
    return [];
  }
};

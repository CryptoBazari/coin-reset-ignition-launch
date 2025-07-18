
import { supabase } from '@/integrations/supabase/client';
import { fetchCoinPrices } from './coinMarketCapService';
import { fetchFedFundsRate, fetchInflationRate } from './alphaVantageService';
import { fetchEconomicIndicators } from './fredService';
import { realTimeMarketService } from './realTimeMarketService';

export interface ApiTestResult {
  service: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: any;
  timestamp: string;
}

export const testAllApis = async (): Promise<ApiTestResult[]> => {
  const results: ApiTestResult[] = [];
  const timestamp = new Date().toISOString();

  // Test CoinMarketCap API
  try {
    console.log('Testing CoinMarketCap API...');
    const coinData = await fetchCoinPrices(['BTC', 'ETH']);
    results.push({
      service: 'CoinMarketCap',
      status: coinData.length > 0 ? 'success' : 'warning',
      message: coinData.length > 0 ? `Successfully fetched ${coinData.length} coins` : 'No data returned',
      data: coinData.slice(0, 2),
      timestamp
    });
  } catch (error) {
    results.push({
      service: 'CoinMarketCap',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp
    });
  }

  // Test Alpha Vantage API
  try {
    console.log('Testing Alpha Vantage API...');
    const fedData = await fetchFedFundsRate();
    results.push({
      service: 'Alpha Vantage',
      status: fedData.length > 0 ? 'success' : 'warning',
      message: fedData.length > 0 ? `Successfully fetched ${fedData.length} Fed rate data points` : 'No data returned',
      data: fedData.slice(0, 3),
      timestamp
    });
  } catch (error) {
    results.push({
      service: 'Alpha Vantage',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp
    });
  }

  // Test FRED API
  try {
    console.log('Testing FRED API...');
    const economicData = await fetchEconomicIndicators();
    const hasData = economicData.fedFundsRate.length > 0 || economicData.inflation.length > 0;
    results.push({
      service: 'FRED',
      status: hasData ? 'success' : 'warning',
      message: hasData ? 'Successfully fetched economic indicators' : 'No data returned',
      data: {
        fedFundsRate: economicData.fedFundsRate.slice(0, 2),
        inflation: economicData.inflation.slice(0, 2)
      },
      timestamp
    });
  } catch (error) {
    results.push({
      service: 'FRED',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp
    });
  }

  // Test CoinGecko API (through realTimeMarketService)
  try {
    console.log('Testing CoinGecko API...');
    const bitcoinData = await realTimeMarketService.getCoinData('bitcoin');
    results.push({
      service: 'CoinGecko',
      status: bitcoinData ? 'success' : 'warning',
      message: bitcoinData ? 'Successfully fetched Bitcoin data' : 'No data returned',
      data: bitcoinData ? { name: bitcoinData.name, price: bitcoinData.current_price } : null,
      timestamp
    });
  } catch (error) {
    results.push({
      service: 'CoinGecko',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp
    });
  }

  // Test Glass Node API
  try {
    console.log('Testing Glass Node API...');
    const glassNodeResult = await testGlassNodeApi();
    results.push(glassNodeResult);
  } catch (error) {
    results.push({
      service: 'Glass Node',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp
    });
  }

  return results;
};

const testGlassNodeApi = async (): Promise<ApiTestResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-glassnode-data', {
      body: { 
        metric: 'market/price_usd_close',
        asset: 'BTC',
        since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
        until: new Date().toISOString()
      }
    });

    if (error) throw error;

    return {
      service: 'Glass Node',
      status: data?.data?.length > 0 ? 'success' : 'warning',
      message: data?.data?.length > 0 ? `Successfully fetched ${data.data.length} data points` : 'No data returned',
      data: data?.data?.slice(0, 3),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    if (error.message?.includes('not found') || error.message?.includes('404')) {
      return {
        service: 'Glass Node',
        status: 'warning',
        message: 'Glass Node function not found - needs to be created',
        timestamp: new Date().toISOString()
      };
    }
    throw error;
  }
};

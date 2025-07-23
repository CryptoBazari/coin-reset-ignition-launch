import { supabase } from '@/integrations/supabase/client';

interface PriceHistoryData {
  date: string;
  price: number;
  volume: number;
  market_cap: number;
}

export class PriceHistoryExportService {
  async fetchBTCHistoricalData(): Promise<PriceHistoryData[]> {
    console.log('📊 Fetching BTC 36-month daily price history for export...');

    // Try to get data from database first
    const { data: dbData, error: dbError } = await supabase
      .from('price_history_36m')
      .select('price_date, price_usd, volume_24h, market_cap')
      .eq('coin_id', 'bitcoin')
      .order('price_date', { ascending: true });

    if (!dbError && dbData && dbData.length > 0) {
      console.log(`✅ Found ${dbData.length} records in database`);
      return dbData.map(row => ({
        date: row.price_date,
        price: row.price_usd,
        volume: row.volume_24h || 0,
        market_cap: row.market_cap || 0
      }));
    }

    // Fallback: Use edge function to fetch fresh data
    console.log('🔄 No database data found, fetching fresh data...');
    
    const { data: functionData, error: functionError } = await supabase.functions.invoke(
      'fetch-real-price-history',
      {
        body: { coinId: 'bitcoin', symbol: 'BTC' }
      }
    );

    if (functionError) {
      throw new Error(`Failed to fetch price history: ${functionError.message}`);
    }

    if (!functionData.success) {
      throw new Error(`API Error: ${functionData.error}`);
    }

    // After fetching, get the data from database
    const { data: freshData, error: freshError } = await supabase
      .from('price_history_36m')
      .select('price_date, price_usd, volume_24h, market_cap')
      .eq('coin_id', 'bitcoin')
      .order('price_date', { ascending: true });

    if (freshError || !freshData) {
      throw new Error('Failed to retrieve fresh price history data');
    }

    return freshData.map(row => ({
      date: row.price_date,
      price: row.price_usd,
      volume: row.volume_24h || 0,
      market_cap: row.market_cap || 0
    }));
  }

  generateCSV(data: PriceHistoryData[]): string {
    const headers = ['Date', 'Price (USD)', 'Volume (24h)', 'Market Cap'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        row.date,
        row.price.toFixed(2),
        row.volume.toFixed(0),
        row.market_cap.toFixed(0)
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  downloadCSV(csvContent: string, filename: string = 'btc_price_history_36m.csv'): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  async exportBTCHistoricalData(): Promise<void> {
    try {
      console.log('🚀 Starting BTC price history export...');
      
      const data = await this.fetchBTCHistoricalData();
      console.log(`📊 Exporting ${data.length} data points`);
      
      const csvContent = this.generateCSV(data);
      const filename = `btc_price_history_36m_${new Date().toISOString().split('T')[0]}.csv`;
      
      this.downloadCSV(csvContent, filename);
      
      console.log('✅ Export completed successfully');
    } catch (error) {
      console.error('❌ Export failed:', error);
      throw error;
    }
  }
}

export const priceHistoryExportService = new PriceHistoryExportService();
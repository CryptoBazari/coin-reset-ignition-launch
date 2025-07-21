
import { supabase } from '@/integrations/supabase/client';

export interface GlassNodeAsset {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  glass_node_supported: boolean;
  glass_node_asset_name?: string;
  premium_metrics_available: boolean;
  last_glass_node_update?: string;
  glass_node_data_quality: number;
  basket: 'Bitcoin' | 'Blue Chip' | 'Small-Cap';
  cagr_36m?: number;
  volatility?: number;
  staking_yield?: number;
  market_cap?: number;
  logo_url?: string;
  coingecko_id?: string;
  api_status?: string;
}

export interface GlassNodeAssetStatus {
  asset: string;
  supported: boolean;
  premium_available: boolean;
  data_quality: 'high' | 'medium' | 'low' | 'unavailable';
  last_update?: string;
}

export const fetchGlassNodeSupportedAssets = async (): Promise<GlassNodeAsset[]> => {
  try {
    console.log('Fetching Glass Node supported assets from database...');
    
    const { data, error } = await supabase
      .from('coins')
      .select('*')
      .eq('glass_node_supported', true)
      .order('name');

    if (error) {
      console.error('Error fetching Glass Node assets:', error);
      throw new Error('Failed to fetch Glass Node supported assets');
    }

    if (!data) {
      return [];
    }

    const assets: GlassNodeAsset[] = data.map(coin => ({
      id: coin.coin_id,
      name: coin.name,
      symbol: coin.glass_node_asset_name || coin.coin_id.toUpperCase(),
      current_price: coin.current_price || 0,
      glass_node_supported: coin.glass_node_supported,
      glass_node_asset_name: coin.glass_node_asset_name,
      premium_metrics_available: coin.premium_metrics_available || false,
      last_glass_node_update: coin.last_glass_node_update,
      glass_node_data_quality: coin.glass_node_data_quality || 0,
      basket: coin.basket as 'Bitcoin' | 'Blue Chip' | 'Small-Cap',
      cagr_36m: coin.cagr_36m,
      volatility: coin.volatility,
      staking_yield: coin.staking_yield,
      market_cap: coin.market_cap,
      logo_url: coin.logo_url,
      coingecko_id: coin.coingecko_id,
      api_status: coin.api_status
    }));

    console.log(`Successfully fetched ${assets.length} Glass Node supported assets`);
    return assets;
  } catch (error) {
    console.error('Error fetching Glass Node assets:', error);
    throw error;
  }
};

export const fetchAllAvailableAssets = async (): Promise<GlassNodeAsset[]> => {
  try {
    console.log('Fetching all available assets from database...');
    
    const { data, error } = await supabase
      .from('coins')
      .select('*')
      .order('glass_node_supported', { ascending: false })
      .order('name');

    if (error) {
      console.error('Error fetching all assets:', error);
      throw new Error('Failed to fetch available assets');
    }

    if (!data) {
      return [];
    }

    const assets: GlassNodeAsset[] = data.map(coin => ({
      id: coin.coin_id,
      name: coin.name,
      symbol: coin.glass_node_asset_name || coin.coin_id.toUpperCase(),
      current_price: coin.current_price || 0,
      glass_node_supported: coin.glass_node_supported || false,
      glass_node_asset_name: coin.glass_node_asset_name,
      premium_metrics_available: coin.premium_metrics_available || false,
      last_glass_node_update: coin.last_glass_node_update,
      glass_node_data_quality: coin.glass_node_data_quality || 0,
      basket: coin.basket as 'Bitcoin' | 'Blue Chip' | 'Small-Cap',
      cagr_36m: coin.cagr_36m,
      volatility: coin.volatility,
      staking_yield: coin.staking_yield,
      market_cap: coin.market_cap,
      logo_url: coin.logo_url,
      coingecko_id: coin.coingecko_id,
      api_status: coin.api_status
    }));

    console.log(`Successfully fetched ${assets.length} total assets`);
    return assets;
  } catch (error) {
    console.error('Error fetching all assets:', error);
    throw error;
  }
};

export const getAssetDataQuality = (quality: number): 'high' | 'medium' | 'low' | 'unavailable' => {
  if (quality >= 8) return 'high';
  if (quality >= 5) return 'medium';
  if (quality >= 1) return 'low';
  return 'unavailable';
};

export const getDataQualityColor = (quality: 'high' | 'medium' | 'low' | 'unavailable'): string => {
  switch (quality) {
    case 'high': return 'text-green-600';
    case 'medium': return 'text-yellow-600';
    case 'low': return 'text-orange-600';
    case 'unavailable': return 'text-red-600';
  }
};

export const getDataQualityBadge = (quality: 'high' | 'medium' | 'low' | 'unavailable'): string => {
  switch (quality) {
    case 'high': return 'Glass Node Premium';
    case 'medium': return 'Glass Node Basic';
    case 'low': return 'Limited Data';
    case 'unavailable': return 'Static Data';
  }
};

// Enhanced function to trigger Glass Node discovery with automatic execution
export const triggerGlassNodeDiscovery = async (): Promise<any> => {
  try {
    console.log('Triggering Glass Node asset discovery...');
    
    const { data, error } = await supabase.functions.invoke('discover-glass-node-assets', {
      body: { 
        trigger: 'manual',
        fullDiscovery: true,
        forceRefresh: true
      }
    });

    if (error) {
      console.error('Error triggering discovery:', error);
      throw new Error('Failed to trigger Glass Node discovery');
    }

    console.log('Glass Node discovery completed:', data);
    return data;
  } catch (error) {
    console.error('Error triggering Glass Node discovery:', error);
    throw error;
  }
};

// Enhanced function to get discovery logs with better error handling
export const getDiscoveryLogs = async (limit: number = 10) => {
  try {
    const { data, error } = await supabase
      .from('glass_node_discovery_logs')
      .select('*')
      .order('discovery_run_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching discovery logs:', error);
      throw new Error('Failed to fetch discovery logs');
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching discovery logs:', error);
    throw error;
  }
};

// New function to auto-initialize the database with all assets
export const initializeGlassNodeDatabase = async (): Promise<any> => {
  try {
    console.log('🚀 Initializing Glass Node database with all supported assets...');
    
    // First, trigger discovery
    const discoveryResult = await triggerGlassNodeDiscovery();
    
    // Then initialize real data pipeline
    console.log('📊 Initializing real data pipeline...');
    const { data: pipelineData, error: pipelineError } = await supabase.functions.invoke('initialize-real-data-pipeline', {
      body: { 
        immediate: true,
        fullInitialization: true
      }
    });

    if (pipelineError) {
      console.warn('Pipeline initialization had issues:', pipelineError);
    }

    // Update coins with real data
    console.log('💰 Updating coins with real market data...');
    const { data: updateData, error: updateError } = await supabase.functions.invoke('update-coins-real-data', {
      body: {}
    });

    if (updateError) {
      console.warn('Coin data update had issues:', updateError);
    }

    console.log('✅ Database initialization completed successfully');
    
    return {
      discovery: discoveryResult,
      pipeline: pipelineData,
      update: updateData,
      success: true,
      message: 'Database initialized with all supported assets'
    };
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Function to get comprehensive asset statistics
export const getAssetStatistics = async () => {
  try {
    const { data, error } = await supabase
      .from('coins')
      .select('glass_node_supported, glass_node_data_quality, basket, api_status');

    if (error) {
      console.error('Error fetching asset statistics:', error);
      return {
        total: 0,
        glassNodeSupported: 0,
        highQuality: 0,
        mediumQuality: 0,
        lowQuality: 0,
        byBasket: { Bitcoin: 0, 'Blue Chip': 0, 'Small-Cap': 0 }
      };
    }

    const stats = {
      total: data.length,
      glassNodeSupported: data.filter(coin => coin.glass_node_supported).length,
      highQuality: data.filter(coin => coin.glass_node_data_quality >= 8).length,
      mediumQuality: data.filter(coin => coin.glass_node_data_quality >= 5 && coin.glass_node_data_quality < 8).length,
      lowQuality: data.filter(coin => coin.glass_node_data_quality > 0 && coin.glass_node_data_quality < 5).length,
      byBasket: {
        Bitcoin: data.filter(coin => coin.basket === 'bitcoin').length,
        'Blue Chip': data.filter(coin => coin.basket === 'blue_chip').length,
        'Small-Cap': data.filter(coin => coin.basket === 'small_cap').length
      }
    };

    return stats;
  } catch (error) {
    console.error('Error calculating asset statistics:', error);
    return {
      total: 0,
      glassNodeSupported: 0,
      highQuality: 0,
      mediumQuality: 0,
      lowQuality: 0,
      byBasket: { Bitcoin: 0, 'Blue Chip': 0, 'Small-Cap': 0 }
    };
  }
};

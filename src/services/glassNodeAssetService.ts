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
      market_cap: coin.market_cap
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
      market_cap: coin.market_cap
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
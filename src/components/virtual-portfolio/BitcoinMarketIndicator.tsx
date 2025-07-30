import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AvivData {
  avivRatio: number;
  marketCondition: string;
  timestamp: string;
  isMockData?: boolean;
}

export default function BitcoinMarketIndicator() {
  const [avivData, setAvivData] = useState<AvivData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAvivData = async () => {
    try {
      setRefreshing(true);
      console.log('🚀 Fetching Bitcoin AVIV data...');
      
      const { data, error } = await supabase.functions.invoke('bitcoin-aviv');
      
      if (error) {
        console.error('❌ AVIV API error:', error);
        throw error;
      }
      
      console.log('✅ AVIV data received:', data);
      
      // Handle both direct data and fallback structure
      if (data?.fallback) {
        console.warn('⚠️ Using fallback AVIV data:', data.fallback);
        setAvivData(data.fallback);
      } else {
        setAvivData(data);
      }
    } catch (error) {
      console.error('❌ Failed to fetch AVIV data:', error);
      
      // Try to get cached data from the edge function first
      try {
        const { data: cachedData } = await supabase
          .from('glassnode_cache')
          .select('data')
          .eq('cache_key', 'bitcoin-aviv')
          .single();
          
        if (cachedData?.data) {
          console.log('📦 Using cached AVIV data:', cachedData.data);
          setAvivData(cachedData.data as unknown as AvivData);
          return;
        }
      } catch (cacheError) {
        console.warn('⚠️ No cached AVIV data available:', cacheError);
      }
      
      // Only fall back to mock data as last resort
      console.warn('⚠️ Using mock AVIV data as last resort');
      setAvivData({
        avivRatio: 1.5,
        marketCondition: 'NEUTRAL',
        timestamp: new Date().toISOString(),
        isMockData: true
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAvivData();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchAvivData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!avivData) return null;

  const conditionColors = {
    STRONG_BUY: 'bg-gradient-to-r from-green-500 to-green-700 text-white',
    DCA_BUY: 'bg-gradient-to-r from-teal-500 to-teal-700 text-white',
    ACCUMULATE: 'bg-gradient-to-r from-blue-500 to-blue-700 text-white',
    NEUTRAL: 'bg-gradient-to-r from-yellow-500 to-yellow-700 text-white',
    PREPARE_SELL: 'bg-gradient-to-r from-orange-500 to-orange-700 text-white',
    STRONG_SELL: 'bg-gradient-to-r from-red-500 to-red-700 text-white'
  };

  const conditionIcons = {
    STRONG_BUY: <TrendingUp className="h-5 w-5" />,
    DCA_BUY: <TrendingUp className="h-5 w-5" />,
    ACCUMULATE: <TrendingUp className="h-5 w-5" />,
    NEUTRAL: <Minus className="h-5 w-5" />,
    PREPARE_SELL: <TrendingDown className="h-5 w-5" />,
    STRONG_SELL: <TrendingDown className="h-5 w-5" />
  };

  const getMessage = (condition: string) => {
    const messages = {
      STRONG_BUY: "Bitcoin AVIV indicates extreme undervaluation - maximum opportunity",
      DCA_BUY: "Bitcoin AVIV shows accumulation opportunity - systematic buying",
      ACCUMULATE: "Bitcoin AVIV suggests moderate growth conditions - buy on dips",
      NEUTRAL: "Bitcoin AVIV shows market equilibrium - hold positions",
      PREPARE_SELL: "Bitcoin AVIV indicates approaching overvaluation - prepare exits",
      STRONG_SELL: "Bitcoin AVIV shows extreme overvaluation - reduce exposure"
    };
    return messages[condition] || "Market condition analysis";
  };

  return (
    <Card className={conditionColors[avivData.marketCondition] || conditionColors.NEUTRAL}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {conditionIcons[avivData.marketCondition]}
            <span>Bitcoin Market Condition</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchAvivData}
            disabled={refreshing}
            className="text-white hover:bg-white/20"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">
              {avivData.marketCondition.replace(/_/g, ' ')}
            </h3>
            <p className="text-sm opacity-90">
              {getMessage(avivData.marketCondition)}
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-sm opacity-75">Bitcoin AVIV</p>
            <p className="text-3xl font-mono font-bold">
              {avivData.avivRatio.toFixed(2)}
            </p>
          </div>
        </div>


        <div className="text-xs opacity-75 text-center pt-2">
          Last updated: {new Date(avivData.timestamp).toLocaleTimeString()}
          {avivData.isMockData && (
            <div className="text-xs opacity-60 mt-1">
              ⚠️ Using simulated data - API unavailable
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
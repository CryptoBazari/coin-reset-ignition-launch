
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PortfolioMovementChartProps {
  portfolioId: string;
}

interface PortfolioSnapshot {
  id: string;
  portfolio_id: string;
  snapshot_date: string;
  total_value: number;
  total_profit: number;
  day_change: number;
  day_change_percent: number;
  asset_breakdown: any;
  created_at: string;
}

const PortfolioMovementChart = ({ portfolioId }: PortfolioMovementChartProps) => {
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchSnapshots = async () => {
    try {
      setLoading(true);
      
      // First, try to get existing snapshots
      const { data: existingSnapshots, error } = await supabase
        .from('portfolio_daily_snapshots')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .order('snapshot_date', { ascending: true })
        .limit(30);

      if (error) {
        console.error('Error fetching portfolio snapshots:', error);
        return;
      }

      // If no snapshots exist, create initial snapshot
      if (!existingSnapshots || existingSnapshots.length === 0) {
        console.log('No portfolio snapshots found, creating initial snapshot...');
        await createInitialSnapshot();
        return;
      }

      setSnapshots(existingSnapshots);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Error fetching portfolio snapshots:', error);
    } finally {
      setLoading(false);
    }
  };

  const createInitialSnapshot = async () => {
    try {
      // Get current portfolio data
      const { data: portfolio } = await supabase
        .from('virtual_portfolios')
        .select('total_value, all_time_profit')
        .eq('id', portfolioId)
        .single();

      if (!portfolio) return;

      // Get portfolio assets for breakdown
      const { data: assets } = await supabase
        .from('virtual_assets')
        .select(`
          *,
          virtual_coins (
            name,
            symbol
          )
        `)
        .eq('portfolio_id', portfolioId);

      const assetBreakdown = assets?.map(asset => ({
        coin_id: asset.coin_id,
        name: asset.virtual_coins?.name || 'Unknown',
        symbol: asset.virtual_coins?.symbol || 'UNK',
        amount: asset.total_amount,
        value: asset.cost_basis || 0
      })) || [];

      // Create initial snapshot
      const { error: insertError } = await supabase
        .from('portfolio_daily_snapshots')
        .insert({
          portfolio_id: portfolioId,
          snapshot_date: new Date().toISOString().split('T')[0],
          total_value: portfolio.total_value,
          total_profit: portfolio.all_time_profit,
          day_change: 0,
          day_change_percent: 0,
          asset_breakdown: assetBreakdown
        });

      if (insertError) {
        console.error('Error creating initial snapshot:', insertError);
      } else {
        console.log('Initial snapshot created successfully');
        await fetchSnapshots(); // Refresh data
      }

    } catch (error) {
      console.error('Error creating initial snapshot:', error);
    }
  };

  const refreshData = async () => {
    await fetchSnapshots();
  };

  useEffect(() => {
    fetchSnapshots();
  }, [portfolioId]);

  // Transform snapshots into chart data
  const chartData = snapshots.map(snapshot => ({
    date: new Date(snapshot.snapshot_date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    value: Number(snapshot.total_value),
    profit: Number(snapshot.total_profit),
    change: Number(snapshot.day_change),
    changePercent: Number(snapshot.day_change_percent)
  }));

  const latestSnapshot = snapshots[snapshots.length - 1];
  const trend = latestSnapshot && Number(latestSnapshot.day_change) >= 0 ? 'up' : 'down';

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-muted-foreground">Loading real performance data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Portfolio Performance
            <Button variant="outline" size="sm" onClick={refreshData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <div className="text-muted-foreground mb-4">
                No performance history available yet.
              </div>
              <Button onClick={createInitialSnapshot}>
                Create Initial Snapshot
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            Portfolio Performance
            {trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-sm text-muted-foreground">
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={refreshData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-4">
          <Badge variant="outline">
            {chartData.length} Days of Data
          </Badge>
          {latestSnapshot && (
            <Badge 
              variant={trend === 'up' ? 'default' : 'destructive'}
              className={trend === 'up' ? 'bg-green-100 text-green-800' : ''}
            >
              {trend === 'up' ? '+' : ''}
              {Number(latestSnapshot.day_change_percent).toFixed(2)}% Today
            </Badge>
          )}
        </div>
        
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `$${value.toLocaleString()}`,
                  name === 'value' ? 'Portfolio Value' : 'Total Profit'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="value"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="hsl(var(--success))" 
                strokeWidth={2}
                name="profit"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioMovementChart;

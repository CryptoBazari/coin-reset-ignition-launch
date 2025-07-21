import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  Settings 
} from 'lucide-react';

interface CronStatus {
  name: string;
  schedule: string;
  lastRun: string | null;
  nextRun: string | null;
  active: boolean;
  description: string;
}

export const AutomatedDataRefresh: React.FC = () => {
  const [cronJobs, setCronJobs] = useState<CronStatus[]>([]);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [lastRefreshCheck, setLastRefreshCheck] = useState<string | null>(null);
  const { toast } = useToast();

  const checkCronStatus = async () => {
    try {
      // Check if cron jobs are set up by looking at recent function logs
      const { data: functionLogs } = await supabase.functions.invoke('setup-data-refresh-cron', {
        body: { action: 'status' }
      });

      if (functionLogs) {
        setLastRefreshCheck(new Date().toISOString());
        // Update with actual cron status when available
      }
    } catch (error) {
      console.error('Error checking cron status:', error);
    }
  };

  const setupAutomatedRefresh = async () => {
    setIsSettingUp(true);
    
    try {
      toast({
        title: "Setting up automated data refresh...",
        description: "This will configure daily and weekly data updates.",
      });

      const { data, error } = await supabase.functions.invoke('setup-data-refresh-cron', {
        body: { action: 'setup' }
      });

      if (error) throw error;

      // Update the cron jobs status
      setCronJobs([
        {
          name: 'daily-coin-update',
          schedule: '0 6 * * *', // 6 AM daily
          lastRun: null,
          nextRun: 'Tomorrow 6:00 AM',
          active: true,
          description: 'Updates coin prices and basic metrics daily'
        },
        {
          name: 'weekly-price-history',
          schedule: '0 4 * * 0', // 4 AM every Sunday
          lastRun: null,
          nextRun: 'Next Sunday 4:00 AM',
          active: true,
          description: 'Updates 36-month price history weekly'
        },
        {
          name: 'daily-glassnode-metrics',
          schedule: '0 7 * * *', // 7 AM daily
          lastRun: null,
          nextRun: 'Tomorrow 7:00 AM',
          active: true,
          description: 'Fetches latest Glass Node on-chain metrics'
        }
      ]);

      toast({
        title: "Automated refresh configured!",
        description: "Your data will now update automatically.",
      });

    } catch (error) {
      console.error('Setup error:', error);
      toast({
        title: "Setup failed",
        description: error.message || "Failed to set up automated refresh",
        variant: "destructive"
      });
    } finally {
      setIsSettingUp(false);
    }
  };

  useEffect(() => {
    checkCronStatus();
  }, []);

  const formatSchedule = (cron: string) => {
    const scheduleMap: { [key: string]: string } = {
      '0 6 * * *': 'Daily at 6:00 AM',
      '0 4 * * 0': 'Weekly on Sunday at 4:00 AM',
      '0 7 * * *': 'Daily at 7:00 AM'
    };
    return scheduleMap[cron] || cron;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Automated Data Refresh</h2>
        <Button
          variant="outline"
          onClick={checkCronStatus}
          disabled={isSettingUp}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Check Status
        </Button>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Automation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cronJobs.length === 0 ? (
            <div className="text-center py-8">
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>No automated refresh configured!</strong> Your data will become outdated unless you manually refresh it.
                  Set up automation to keep your investment analysis accurate.
                </AlertDescription>
              </Alert>
              
              <Button
                onClick={setupAutomatedRefresh}
                disabled={isSettingUp}
                size="lg"
                className="flex items-center gap-2"
              >
                {isSettingUp ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4" />
                    Setup Automated Refresh
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cronJobs.map((job) => (
                <div key={job.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {job.active ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{job.description}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {formatSchedule(job.schedule)}
                        {job.nextRun && (
                          <span className="text-blue-600">• Next: {job.nextRun}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Badge variant={job.active ? "default" : "destructive"}>
                    {job.active ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                </div>
              ))}
              
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">
                  {lastRefreshCheck && (
                    <>Last checked: {new Date(lastRefreshCheck).toLocaleString()}</>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information */}
      <Card>
        <CardHeader>
          <CardTitle>How Automated Refresh Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <strong>Daily Price Updates</strong> - Keeps current prices fresh for accurate portfolio valuations
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <strong>Weekly Historical Data</strong> - Updates price history for rolling calculations
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <strong>Glass Node Metrics</strong> - Refreshes on-chain analysis data daily
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <strong>Zero Maintenance</strong> - Runs automatically in the background, no intervention required
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomatedDataRefresh;
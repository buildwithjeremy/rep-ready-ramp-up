import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AdminMetrics {
  totalReps: number;
  activeReps: number;
  independentReps: number;
  stuckReps: number;
  conversionRate: number;
  avgTimeToIndependent: number;
}

export function useAdminMetrics() {
  const [metrics, setMetrics] = useState<AdminMetrics>({
    totalReps: 0,
    activeReps: 0,
    independentReps: 0,
    stuckReps: 0,
    conversionRate: 0,
    avgTimeToIndependent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchMetrics = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Fetching admin metrics...');

      const { data, error: metricsError } = await supabase
        .rpc('get_admin_dashboard_metrics_secure');

      if (metricsError) {
        console.error('Error fetching admin metrics:', metricsError);
        setError(metricsError.message);
        return;
      }

      const metrics_data = data?.[0];
      if (!metrics_data) {
        setError('No metrics data received');
        return;
      }

      const adminMetrics: AdminMetrics = {
        totalReps: metrics_data.total_reps || 0,
        activeReps: metrics_data.active_reps || 0,
        independentReps: metrics_data.independent_reps || 0,
        stuckReps: metrics_data.stuck_reps_by_status || 0, // Use status-based stuck reps for consistency
        conversionRate: metrics_data.conversion_rate || 0,
        avgTimeToIndependent: metrics_data.avg_time_to_independent || 0,
      };

      console.log('Admin metrics:', adminMetrics);
      setMetrics(adminMetrics);
      setError(null);
    } catch (err) {
      console.error('Error in fetchMetrics:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [user]);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
  };
}
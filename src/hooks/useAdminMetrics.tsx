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
        .from('admin_dashboard_metrics')
        .select('*')
        .single();

      if (metricsError) {
        console.error('Error fetching admin metrics:', metricsError);
        setError(metricsError.message);
        return;
      }

      const adminMetrics: AdminMetrics = {
        totalReps: data.total_reps || 0,
        activeReps: data.active_reps || 0,
        independentReps: data.independent_reps || 0,
        stuckReps: data.stuck_reps_by_activity || 0, // Use activity-based stuck reps
        conversionRate: data.conversion_rate || 0,
        avgTimeToIndependent: data.avg_time_to_independent || 0,
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
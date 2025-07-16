import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TrainerMetrics {
  conversionRate: number;
  activityRate: number;
  averageProgressPerRep: number;
  performanceRank: number;
  totalTrainers: number;
}

export function useTrainerMetrics(trainerId: string) {
  const [metrics, setMetrics] = useState<TrainerMetrics>({
    conversionRate: 0,
    activityRate: 0,
    averageProgressPerRep: 0,
    performanceRank: 1,
    totalTrainers: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    if (!trainerId) return;

    try {
      setLoading(true);
      console.log('Fetching trainer metrics for:', trainerId);

      // Fetch all metrics using our database functions
      const [conversionRateResult, activityRateResult, avgProgressResult, rankResult, totalTrainersResult] = await Promise.all([
        supabase.rpc('get_conversion_rate', { trainer_id_param: trainerId }),
        supabase.rpc('get_activity_rate', { trainer_id_param: trainerId }),
        supabase.rpc('get_avg_progress_per_rep', { trainer_id_param: trainerId }),
        supabase.rpc('get_trainer_performance_rank', { trainer_id_param: trainerId }),
        supabase.from('trainers').select('id', { count: 'exact', head: true })
      ]);

      if (conversionRateResult.error) throw conversionRateResult.error;
      if (activityRateResult.error) throw activityRateResult.error;
      if (avgProgressResult.error) throw avgProgressResult.error;
      if (rankResult.error) throw rankResult.error;
      if (totalTrainersResult.error) throw totalTrainersResult.error;

      const trainerMetrics: TrainerMetrics = {
        conversionRate: conversionRateResult.data || 0,
        activityRate: activityRateResult.data || 0,
        averageProgressPerRep: avgProgressResult.data || 0,
        performanceRank: rankResult.data || 1,
        totalTrainers: totalTrainersResult.count || 1,
      };

      console.log('Trainer metrics:', trainerMetrics);
      setMetrics(trainerMetrics);
      setError(null);
    } catch (err) {
      console.error('Error fetching trainer metrics:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [trainerId]);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
  };
}
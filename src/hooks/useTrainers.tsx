import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trainer } from '@/types';
import { useAuth } from './useAuth';

export function useTrainers() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTrainers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Fetching trainers...');

      const { data: trainersData, error: trainersError } = await supabase
        .from('trainers')
        .select('*')
        .order('success_rate', { ascending: false });

      if (trainersError) {
        console.error('Error fetching trainers:', trainersError);
        setError(trainersError.message);
        return;
      }

      const transformedTrainers: Trainer[] = trainersData?.map(trainer => ({
        id: trainer.user_id,
        name: trainer.full_name,
        email: trainer.email,
        avatar: trainer.avatar_url,
        assignedReps: trainer.assigned_reps,
        activeReps: trainer.active_reps,
        independentReps: trainer.independent_reps,
        stuckReps: trainer.stuck_reps,
        averageTimeToIndependent: trainer.average_time_to_independent,
        successRate: trainer.success_rate
      })) || [];

      console.log('Transformed trainers:', transformedTrainers);
      setTrainers(transformedTrainers);
      setError(null);
    } catch (err) {
      console.error('Error in fetchTrainers:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateTrainer = async (updatedTrainer: Trainer) => {
    try {
      console.log('Updating trainer:', updatedTrainer);

      const { error } = await supabase
        .from('trainers')
        .update({
          full_name: updatedTrainer.name,
          email: updatedTrainer.email,
          avatar_url: updatedTrainer.avatar
        })
        .eq('user_id', updatedTrainer.id);

      if (error) {
        console.error('Error updating trainer:', error);
        throw error;
      }

      // Refresh the trainers list
      await fetchTrainers();
      console.log('Trainer updated successfully');
    } catch (error) {
      console.error('Error updating trainer:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, [user]);

  return {
    trainers,
    loading,
    error,
    fetchTrainers,
    updateTrainer
  };
}
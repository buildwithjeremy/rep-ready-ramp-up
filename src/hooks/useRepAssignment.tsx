import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useRepAssignment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const reassignRep = async (repId: string, newTrainerId: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.rpc('reassign_rep_to_trainer', {
        target_rep_id: repId,
        new_trainer_id: newTrainerId,
        admin_user_id: user.id
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to reassign rep';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const bulkReassignReps = async (repIds: string[], newTrainerId: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const results = await Promise.allSettled(
        repIds.map(repId => 
          supabase.rpc('reassign_rep_to_trainer', {
            target_rep_id: repId,
            new_trainer_id: newTrainerId,
            admin_user_id: user.id
          })
        )
      );

      const failures = results.filter(result => result.status === 'rejected');
      
      if (failures.length > 0) {
        throw new Error(`Failed to reassign ${failures.length} out of ${repIds.length} reps`);
      }

      return { success: true, reassignedCount: repIds.length };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to bulk reassign reps';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    reassignRep,
    bulkReassignReps,
    loading,
    error
  };
}
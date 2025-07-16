import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  full_name: string | null;
  role: 'ADMIN' | 'TRAINER' | 'REP';
  created_at: string;
}

export function useUserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setUsers(data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const promoteUser = async (userId: string, newRole: 'ADMIN' | 'TRAINER' | 'REP', currentUserId: string) => {
    try {
      const { data, error } = await supabase.rpc('promote_user_role', {
        target_user_id: userId,
        new_role: newRole,
        promoted_by_user_id: currentUserId
      });

      if (error) {
        throw new Error(error.message);
      }

      // Refresh users list
      await loadUsers();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    users,
    loading,
    error,
    loadUsers,
    promoteUser
  };
}
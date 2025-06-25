
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Profile {
  id: string;
  full_name: string | null;
  role: 'ADMIN' | 'TRAINER' | 'REP';
  trainer_id: string | null;
  created_at: string | null;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('useProfile effect triggered, user:', user?.email);
    
    if (!user) {
      console.log('No user, clearing profile');
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      console.log('Fetching profile for user:', user.id);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setProfile(null);
        } else {
          console.log('Profile fetched successfully:', data);
          setProfile(data);
        }
      } catch (error) {
        console.error('Error in fetchProfile:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  return { profile, loading };
}

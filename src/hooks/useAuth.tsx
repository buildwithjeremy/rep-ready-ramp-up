
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, 'has session:', !!session, 'user email:', session?.user?.email);
        setAuthState({
          user: session?.user || null,
          session: session || null,
          loading: false,
        });
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', 'has session:', !!session, 'user email:', session?.user?.email);
      setAuthState({
        user: session?.user || null,
        session: session || null,
        loading: false,
      });
    });

    return () => subscription.unsubscribe();
  }, []);


  const signOut = async () => {
    try {
      console.log('Attempting to sign out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        return { error };
      }
      
      // Clear auth state immediately
      setAuthState({
        user: null,
        session: null,
        loading: false,
      });
      
      console.log('Sign out successful');
      return { error: null };
    } catch (err) {
      console.error('Sign out failed:', err);
      return { error: err };
    }
  };

  return {
    ...authState,
    signOut,
  };
}

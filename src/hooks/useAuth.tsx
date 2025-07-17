
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
      console.log('Starting sign out process...');
      
      // Clear auth state immediately for better UX
      setAuthState({
        user: null,
        session: null,
        loading: false,
      });
      
      // Clear any local storage/session storage
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase sign out error:', error);
        // Don't return early - continue with cleanup
      }
      
      // Force a full page reload to clear any cached state (especially for preview environments)
      setTimeout(() => {
        console.log('Forcing page reload to clear cached auth state...');
        window.location.href = window.location.origin;
      }, 100);
      
      console.log('Sign out process completed');
      return { error: null };
    } catch (err) {
      console.error('Sign out failed:', err);
      
      // Even if there's an error, try to clear local state and reload
      setAuthState({
        user: null,
        session: null,
        loading: false,
      });
      
      setTimeout(() => {
        window.location.href = window.location.origin;
      }, 100);
      
      return { error: err };
    }
  };

  return {
    ...authState,
    signOut,
  };
}

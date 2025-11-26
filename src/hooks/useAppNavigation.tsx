
import { useState, useEffect, useCallback } from 'react';
import { Rep } from '@/types';
import { RepFilterOption } from '@/utils/filterUtils';

interface UseAppNavigationProps {
  userRole: 'ADMIN' | 'TRAINER' | 'REP';
}

interface NavigationState {
  path: string;
  repId: string | null;
  trainerId: string | null;
  filter: RepFilterOption;
}

export function useAppNavigation({ userRole }: UseAppNavigationProps) {
  const [currentPath, setCurrentPath] = useState('/dashboard');
  const [selectedRepId, setSelectedRepId] = useState<string | null>(null);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);
  const [repsFilter, setRepsFilter] = useState<RepFilterOption>('active');
  const [isInitialized, setIsInitialized] = useState(false);

  // Set initial path based on user role
  useEffect(() => {
    let initialPath = '/dashboard';
    if (userRole === 'ADMIN') {
      initialPath = '/admin';
    } else if (userRole === 'TRAINER') {
      initialPath = '/dashboard';
    } else if (userRole === 'REP') {
      initialPath = '/dashboard';
    }
    
    setCurrentPath(initialPath);
    
    // Use replaceState for initial path to avoid creating history entry
    const initialState: NavigationState = {
      path: initialPath,
      repId: null,
      trainerId: null,
      filter: 'active'
    };
    window.history.replaceState(initialState, '', window.location.pathname);
    setIsInitialized(true);
  }, [userRole]);

  // Listen for browser back/forward button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        const state = event.state as NavigationState;
        setCurrentPath(state.path);
        setSelectedRepId(state.repId);
        setSelectedTrainerId(state.trainerId);
        setRepsFilter(state.filter);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = useCallback((path: string) => {
    setCurrentPath(path);
    if (path !== '/rep-profile') {
      setSelectedRepId(null);
    }
    if (path !== '/trainer-profile') {
      setSelectedTrainerId(null);
    }
    if (path === '/reps') {
      setRepsFilter('active');
    }

    // Push to browser history only after initialization
    if (isInitialized) {
      const state: NavigationState = {
        path,
        repId: path === '/rep-profile' ? selectedRepId : null,
        trainerId: path === '/trainer-profile' ? selectedTrainerId : null,
        filter: path === '/reps' ? 'active' : repsFilter
      };
      window.history.pushState(state, '', window.location.pathname);
    }
  }, [isInitialized, selectedRepId, selectedTrainerId, repsFilter]);

  const handleRepClick = useCallback((repId: string) => {
    setSelectedRepId(repId);
    setCurrentPath('/rep-profile');

    if (isInitialized) {
      const state: NavigationState = {
        path: '/rep-profile',
        repId,
        trainerId: null,
        filter: repsFilter
      };
      window.history.pushState(state, '', window.location.pathname);
    }
  }, [isInitialized, repsFilter]);

  const handleTrainerClick = useCallback((trainerId: string) => {
    setSelectedTrainerId(trainerId);
    setCurrentPath('/trainer-profile');

    if (isInitialized) {
      const state: NavigationState = {
        path: '/trainer-profile',
        repId: null,
        trainerId,
        filter: repsFilter
      };
      window.history.pushState(state, '', window.location.pathname);
    }
  }, [isInitialized, repsFilter]);

  const handleBackFromRep = useCallback(() => {
    if (isInitialized) {
      window.history.back();
    }
  }, [isInitialized]);

  const handleBackFromTrainer = useCallback(() => {
    if (isInitialized) {
      window.history.back();
    }
  }, [isInitialized]);

  const handleBackFromAddRep = useCallback(() => {
    if (isInitialized) {
      window.history.back();
    }
  }, [isInitialized]);

  const handleStatCardClick = useCallback((filter: 'all' | 'active' | 'stuck' | 'independent') => {
    setRepsFilter(filter);
    setCurrentPath('/reps');

    if (isInitialized) {
      const state: NavigationState = {
        path: '/reps',
        repId: null,
        trainerId: null,
        filter
      };
      window.history.pushState(state, '', window.location.pathname);
    }
  }, [isInitialized]);

  const handleAddRepClick = useCallback(() => {
    setCurrentPath('/add-rep');

    if (isInitialized) {
      const state: NavigationState = {
        path: '/add-rep',
        repId: null,
        trainerId: null,
        filter: repsFilter
      };
      window.history.pushState(state, '', window.location.pathname);
    }
  }, [isInitialized, repsFilter]);

  return {
    currentPath,
    selectedRepId,
    selectedTrainerId,
    repsFilter,
    handleNavigate,
    handleRepClick,
    handleTrainerClick,
    handleBackFromRep,
    handleBackFromTrainer,
    handleBackFromAddRep,
    handleStatCardClick,
    handleAddRepClick,
    setRepsFilter
  };
}

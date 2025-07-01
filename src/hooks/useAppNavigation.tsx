
import { useState, useEffect } from 'react';
import { Rep } from '@/types';
import { RepFilterOption } from '@/utils/filterUtils';

interface UseAppNavigationProps {
  userRole: 'ADMIN' | 'TRAINER' | 'REP';
}

export function useAppNavigation({ userRole }: UseAppNavigationProps) {
  const [currentPath, setCurrentPath] = useState('/dashboard');
  const [selectedRepId, setSelectedRepId] = useState<string | null>(null);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);
  const [repsFilter, setRepsFilter] = useState<RepFilterOption>('all');

  // Set initial path based on user role
  useEffect(() => {
    if (userRole === 'ADMIN') {
      setCurrentPath('/admin');
    } else if (userRole === 'TRAINER') {
      setCurrentPath('/dashboard');
    } else if (userRole === 'REP') {
      setCurrentPath('/dashboard');
    } else {
      setCurrentPath('/dashboard');
    }
  }, [userRole]);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    if (path !== '/rep-profile') {
      setSelectedRepId(null);
    }
    if (path !== '/trainer-profile') {
      setSelectedTrainerId(null);
    }
    if (path === '/reps') {
      setRepsFilter('all');
    }
  };

  const handleRepClick = (repId: string) => {
    setSelectedRepId(repId);
    setCurrentPath('/rep-profile');
  };

  const handleTrainerClick = (trainerId: string) => {
    setSelectedTrainerId(trainerId);
    setCurrentPath('/trainer-profile');
  };

  const handleBackFromRep = () => {
    setSelectedRepId(null);
    setCurrentPath(userRole === 'ADMIN' ? '/admin' : '/dashboard');
  };

  const handleBackFromTrainer = () => {
    setSelectedTrainerId(null);
    setCurrentPath(userRole === 'ADMIN' ? '/admin' : '/dashboard');
  };

  const handleBackFromAddRep = () => {
    setCurrentPath('/reps');
  };

  const handleStatCardClick = (filter: 'all' | 'active' | 'stuck' | 'independent') => {
    setRepsFilter(filter);
    setCurrentPath('/reps');
  };

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
    setRepsFilter
  };
}

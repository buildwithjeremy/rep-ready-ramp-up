
import { Rep, Trainer } from "@/types";

export type RepSortOption = 'name' | 'milestone' | 'status' | 'lastActivity' | 'progress';
export type RepFilterOption = 'all' | 'active' | 'stuck' | 'independent' | 'inactive';
export type TrainerSortOption = 'name' | 'assignedReps' | 'activeReps' | 'successRate';

export const sortReps = (reps: Rep[], sortBy: RepSortOption): Rep[] => {
  return [...reps].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'milestone':
        return b.milestone - a.milestone; // Higher milestones first
      case 'status':
        const statusOrder = { 'Independent': 0, 'Active': 1, 'Stuck': 2, 'Inactive': 3 };
        return statusOrder[a.status] - statusOrder[b.status];
      case 'lastActivity':
        return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
      case 'progress':
        return b.overallProgress - a.overallProgress;
      default:
        return 0;
    }
  });
};

const isRepStuck = (rep: Rep): boolean => {
  // Now that we have database triggers, we can rely on the database status
  // But also check the activity as a fallback for consistency
  const lastActivityDate = new Date(rep.lastActivity);
  const hoursSinceActivity = (Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60);
  return rep.status === 'Stuck' || (hoursSinceActivity >= 48 && rep.status !== 'Independent');
};

export const filterReps = (reps: Rep[], filterBy: RepFilterOption): Rep[] => {
  switch (filterBy) {
    case 'all':
      return reps;
    case 'active':
      return reps.filter(rep => rep.status === 'Active');
    case 'stuck':
      return reps.filter(rep => isRepStuck(rep));
    case 'independent':
      return reps.filter(rep => rep.status === 'Independent');
    case 'inactive':
      return reps.filter(rep => rep.status === 'Inactive');
    default:
      return reps;
  }
};

export const sortTrainers = (trainers: Trainer[], sortBy: TrainerSortOption): Trainer[] => {
  return [...trainers].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'assignedReps':
        return b.assignedReps - a.assignedReps;
      case 'activeReps':
        return b.activeReps - a.activeReps;
      case 'successRate':
        return b.successRate - a.successRate;
      default:
        return 0;
    }
  });
};


import { Rep, Trainer } from "@/types";

export type RepSortOption = 'name' | 'milestone' | 'status' | 'lastActivity' | 'progress' | 'startDate';
export type RepFilterOption = 'all' | 'active' | 'stuck' | 'independent' | 'inactive';
export type TrainerSortOption = 'name' | 'assignedReps' | 'activeReps' | 'successRate' | 'lastActivity';

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
      case 'startDate':
        return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      default:
        return 0;
    }
  });
};

const isRepStuck = (rep: Rep): boolean => {
  // Only rely on database status since we have triggers to keep it accurate
  return rep.status === 'Stuck';
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
      case 'lastActivity':
        const aActivity = a.lastActivity || a.updated_at || '';
        const bActivity = b.lastActivity || b.updated_at || '';
        return new Date(bActivity).getTime() - new Date(aActivity).getTime();
      default:
        return 0;
    }
  });
};

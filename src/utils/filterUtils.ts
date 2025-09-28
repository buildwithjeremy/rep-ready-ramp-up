
import { Rep, Trainer } from "@/types";

export type RepSortOption = 'name' | 'milestone' | 'status' | 'lastActivity' | 'progress' | 'startDate';
export type RepFilterOption = 'all' | 'active' | 'stuck' | 'independent' | 'inactive';
export type TrainerSortOption = 'name' | 'assignedReps' | 'activeReps' | 'successRate' | 'lastActivity';
export type SortOrder = 'asc' | 'desc';

export const sortReps = (reps: Rep[], sortBy: RepSortOption, order: SortOrder = 'desc'): Rep[] => {
  return [...reps].sort((a, b) => {
    let result = 0;
    
    switch (sortBy) {
      case 'name':
        result = a.name.localeCompare(b.name);
        break;
      case 'milestone':
        result = b.milestone - a.milestone; // Higher milestones first by default
        break;
      case 'status':
        const statusOrder = { 'Independent': 0, 'Active': 1, 'Stuck': 2, 'Inactive': 3 };
        result = statusOrder[a.status] - statusOrder[b.status];
        break;
      case 'lastActivity':
        result = new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
        break;
      case 'progress':
        result = b.overallProgress - a.overallProgress;
        break;
      case 'startDate':
        result = new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
        break;
      default:
        result = 0;
    }
    
    return order === 'asc' ? -result : result;
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

export const sortTrainers = (trainers: Trainer[], sortBy: TrainerSortOption, order: SortOrder = 'desc'): Trainer[] => {
  return [...trainers].sort((a, b) => {
    let result = 0;
    
    switch (sortBy) {
      case 'name':
        result = a.name.localeCompare(b.name);
        break;
      case 'assignedReps':
        result = b.assignedReps - a.assignedReps;
        break;
      case 'activeReps':
        result = b.activeReps - a.activeReps;
        break;
      case 'successRate':
        result = b.successRate - a.successRate;
        break;
      case 'lastActivity':
        const aActivity = a.lastActivity || a.updated_at || '';
        const bActivity = b.lastActivity || b.updated_at || '';
        result = new Date(bActivity).getTime() - new Date(aActivity).getTime();
        break;
      default:
        result = 0;
    }
    
    return order === 'asc' ? -result : result;
  });
};

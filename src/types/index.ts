
export interface Rep {
  id: string;
  name: string;
  email: string;
  phone: string;
  trainerId: string;
  stage: number; // 1-13
  status: 'Active' | 'Independent' | 'Stuck' | 'Inactive';
  overallProgress: number; // 0-100
  dateAdded: string;
  lastActivity: string;
  checklist: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  stage: number;
  title: string;
  description: string;
  subtasks: Subtask[];
  isCompleted: boolean;
  completedDate?: string;
}

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
  completedDate?: string;
  notes?: string;
}

export interface Trainer {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  assignedReps: number;
  activeReps: number;
  independentReps: number;
  stuckReps: number;
  averageTimeToIndependent: number; // days
  successRate: number; // percentage
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'trainer' | 'admin';
  trainerId?: string;
}

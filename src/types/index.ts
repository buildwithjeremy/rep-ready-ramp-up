
export interface Rep {
  id: string;
  userId?: string; // Link to auth user
  name: string;
  email: string;
  phone: string;
  trainerId: string;
  milestone: number; // 1-10 (changed from stage)
  status: 'Active' | 'Independent' | 'Stuck' | 'Inactive';
  overallProgress: number; // 0-100
  dateAdded: string;
  lastActivity: string;
  checklist: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  milestone: number; // changed from stage
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
  phone?: string;
  avatar?: string;
  assignedReps: number;
  activeReps: number;
  independentReps: number;
  stuckReps: number;
  averageTimeToIndependent: number; // days
  successRate: number; // percentage
  status: 'Active' | 'Inactive';
  created_at?: string;
  updated_at?: string;
  lastActivity?: string; // For sorting by last activity
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'trainer' | 'admin';
  trainerId?: string;
}

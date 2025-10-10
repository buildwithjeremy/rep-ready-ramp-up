export type ActivityCategory = 
  | 'rep_management' 
  | 'trainer_management' 
  | 'progress_tracking' 
  | 'system_event' 
  | 'security';

export type ActivityFilterOption = 
  | 'all' 
  | 'rep_management' 
  | 'trainer_management' 
  | 'progress_tracking' 
  | 'system_event';

export type ActivitySortOption = 
  | 'date' 
  | 'action_type' 
  | 'actor' 
  | 'category';

export type SortOrder = 'asc' | 'desc';

export interface EnrichedActivityLog {
  id: string;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_values: any;
  new_values: any;
  created_at: string;
  user_id: string | null;
  user_name?: string;
  actor_name: string;
  target_name?: string;
  trainer_name?: string;
  action_label: string;
  action_category: ActivityCategory;
  formatted_description: string;
}

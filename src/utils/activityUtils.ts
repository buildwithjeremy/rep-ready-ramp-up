import { 
  UserPlus, 
  UserCheck, 
  CheckSquare, 
  Archive,
  RefreshCw,
  Shield,
  AlertTriangle,
  RefreshCcw,
  type LucideIcon
} from "lucide-react";
import { ActivityCategory, ActivityFilterOption, ActivitySortOption, SortOrder, EnrichedActivityLog } from "@/types/activity";
import { ActivityLog } from "@/hooks/useRecentActivity";

// Action categorization
export function getActionCategory(action: string): ActivityCategory {
  const repManagement = ['rep_created', 'rep_archived', 'rep_reactivated', 'rep_reassignment', 'status_change'];
  const trainerManagement = ['trainer_archived', 'trainer_reactivated', 'role_promotion'];
  const progressTracking = ['subtask_completed', 'milestone_completed'];
  const security = ['role_change', 'delete'];
  
  if (repManagement.includes(action)) return 'rep_management';
  if (trainerManagement.includes(action)) return 'trainer_management';
  if (progressTracking.includes(action)) return 'progress_tracking';
  if (security.includes(action)) return 'security';
  return 'system_event';
}

export function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    'rep_created': 'Rep Created',
    'rep_archived': 'Rep Archived',
    'rep_reactivated': 'Rep Reactivated',
    'rep_reassignment': 'Rep Reassigned',
    'role_promotion': 'Role Promotion',
    'trainer_archived': 'Trainer Archived',
    'trainer_reactivated': 'Trainer Reactivated',
    'subtask_completed': 'Task Completed',
    'milestone_completed': 'Milestone Completed',
    'incomplete_rep_data': 'Incomplete Profile',
    'status_change': 'Status Changed',
    'status_sync': 'Status Sync',
    'role_change': 'Role Changed',
    'delete': 'Deleted'
  };
  
  return labels[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export function formatActivityMessage(activity: ActivityLog): string {
  const actorName = activity.user_name || 'Someone';
  
  switch (activity.action) {
    case 'role_promotion': {
      const newRole = activity.new_values?.role;
      const targetName = activity.new_values?.trainer_name || 'a user';
      if (newRole === 'TRAINER') {
        return `${actorName} promoted ${targetName} to Trainer`;
      }
      return `${actorName} changed role to ${newRole}`;
    }
    
    case 'rep_reassignment': {
      const repName = activity.new_values?.rep_name || 'Rep';
      const newTrainer = activity.new_values?.new_trainer_name || 'another trainer';
      return `${actorName} reassigned ${repName} to ${newTrainer}`;
    }
    
    case 'trainer_archived': {
      const archivedTrainer = activity.new_values?.trainer_name || 'Trainer';
      return `${actorName} archived ${archivedTrainer}`;
    }
    
    case 'trainer_reactivated': {
      const reactivatedTrainer = activity.new_values?.trainer_name || 'Trainer';
      return `${actorName} reactivated ${reactivatedTrainer}`;
    }
    
    case 'subtask_completed': {
      const subtaskTitle = activity.new_values?.subtask_title || 'a task';
      const repForTask = activity.new_values?.rep_name || 'Rep';
      return `${actorName} completed "${subtaskTitle}" for ${repForTask}`;
    }
    
    case 'rep_created': {
      const newRepName = activity.new_values?.rep_name || 'New rep';
      return `${actorName} created new rep: ${newRepName}`;
    }
    
    case 'rep_archived': {
      const archivedRep = activity.new_values?.rep_name || 'Rep';
      return `${actorName} archived ${archivedRep}`;
    }
    
    case 'rep_reactivated': {
      const reactivatedRep = activity.new_values?.rep_name || 'Rep';
      return `${actorName} reactivated ${reactivatedRep}`;
    }
    
    case 'status_change': {
      const statusRepName = activity.new_values?.rep_name || 'Rep';
      const newStatus = activity.new_values?.new_status;
      if (newStatus === 'Inactive') {
        return `${actorName} archived ${statusRepName}`;
      }
      return `${actorName} changed ${statusRepName}'s status to ${newStatus}`;
    }
    
    case 'incomplete_rep_data': {
      const repName = activity.new_values?.rep_name || 'Rep';
      const missing = [];
      if (activity.new_values?.phone_missing) missing.push('phone');
      if (activity.new_values?.birthday_missing) missing.push('birthday');
      const missingText = missing.length > 0 ? ` (missing: ${missing.join(', ')})` : '';
      return `System detected incomplete profile for ${repName}${missingText}`;
    }
    
    default:
      return `${actorName} performed ${getActionLabel(activity.action)}`;
  }
}

export function getActivityIcon(action: string): LucideIcon {
  const icons: Record<string, LucideIcon> = {
    'role_promotion': Shield,
    'rep_reassignment': RefreshCw,
    'trainer_archived': Archive,
    'rep_archived': Archive,
    'trainer_reactivated': UserCheck,
    'rep_reactivated': UserCheck,
    'subtask_completed': CheckSquare,
    'rep_created': UserPlus,
    'incomplete_rep_data': AlertTriangle,
    'status_sync': RefreshCcw,
    'status_change': RefreshCw
  };
  
  return icons[action] || UserPlus;
}

export function getActivityColor(category: ActivityCategory): { bg: string; text: string; border: string } {
  const colors = {
    rep_management: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    trainer_management: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    progress_tracking: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    system_event: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
    security: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' }
  };
  
  return colors[category];
}

export function getCategoryLabel(category: ActivityCategory): string {
  const labels: Record<ActivityCategory, string> = {
    'rep_management': 'Rep Management',
    'trainer_management': 'Trainer Management',
    'progress_tracking': 'Progress',
    'system_event': 'System',
    'security': 'Security'
  };
  
  return labels[category];
}

export function enrichActivityLog(activity: ActivityLog): EnrichedActivityLog {
  const action_category = getActionCategory(activity.action);
  const action_label = getActionLabel(activity.action);
  const formatted_description = formatActivityMessage(activity);
  
  return {
    ...activity,
    actor_name: activity.user_name || 'Unknown',
    target_name: activity.new_values?.rep_name || activity.new_values?.trainer_name,
    trainer_name: activity.new_values?.trainer_name,
    action_label,
    action_category,
    formatted_description
  };
}

export function filterActivities(
  activities: EnrichedActivityLog[],
  filterByAction: ActivityFilterOption,
  filterByTrainer: string | null
): EnrichedActivityLog[] {
  let filtered = activities;
  
  // Filter by action category
  if (filterByAction !== 'all') {
    filtered = filtered.filter(activity => activity.action_category === filterByAction);
  }
  
  // Filter by trainer
  if (filterByTrainer && filterByTrainer !== 'all') {
    filtered = filtered.filter(activity => 
      activity.user_id === filterByTrainer || 
      activity.new_values?.trainer_id === filterByTrainer
    );
  }
  
  return filtered;
}

export function sortActivities(
  activities: EnrichedActivityLog[],
  sortBy: ActivitySortOption,
  order: SortOrder
): EnrichedActivityLog[] {
  const sorted = [...activities].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case 'action_type':
        comparison = a.action_label.localeCompare(b.action_label);
        break;
      case 'actor':
        comparison = a.actor_name.localeCompare(b.actor_name);
        break;
      case 'category':
        comparison = a.action_category.localeCompare(b.action_category);
        break;
    }
    
    return order === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
}

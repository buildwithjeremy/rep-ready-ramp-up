import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRecentActivity } from "@/hooks/useRecentActivity";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { 
  UserPlus, 
  UserCheck, 
  CheckSquare, 
  Archive,
  RefreshCw,
  Shield
} from "lucide-react";

export function RecentActivityCard() {
  const { activities, loading } = useRecentActivity(15);

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'role_promotion':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'rep_reassignment':
        return <RefreshCw className="w-4 h-4 text-purple-600" />;
      case 'trainer_archived':
      case 'rep_archived':
        return <Archive className="w-4 h-4 text-gray-600" />;
      case 'trainer_reactivated':
      case 'rep_reactivated':
        return <UserCheck className="w-4 h-4 text-green-600" />;
      case 'subtask_completed':
        return <CheckSquare className="w-4 h-4 text-emerald-600" />;
      default:
        return <UserPlus className="w-4 h-4 text-indigo-600" />;
    }
  };

  const formatActivityMessage = (activity: any) => {
    const actorName = activity.user_name || 'Someone';
    
    switch (activity.action) {
      case 'role_promotion':
        const newRole = activity.new_values?.role;
        const targetName = activity.new_values?.trainer_name || 'a user';
        if (newRole === 'TRAINER') {
          return `${actorName} promoted ${targetName} to Trainer`;
        }
        return `${actorName} changed role to ${newRole}`;
      
      case 'rep_reassignment':
        const repName = activity.new_values?.rep_name || 'Rep';
        const newTrainer = activity.new_values?.new_trainer_name || 'another trainer';
        return `${actorName} reassigned ${repName} to ${newTrainer}`;
      
      case 'trainer_archived':
        const archivedTrainer = activity.new_values?.trainer_name || 'Trainer';
        return `${actorName} archived ${archivedTrainer}`;
      
      case 'trainer_reactivated':
        const reactivatedTrainer = activity.new_values?.trainer_name || 'Trainer';
        return `${actorName} reactivated ${reactivatedTrainer}`;
      
      case 'subtask_completed':
        const subtaskTitle = activity.new_values?.subtask_title || 'a task';
        const repForTask = activity.new_values?.rep_name || 'Rep';
        return `${actorName} completed "${subtaskTitle}" for ${repForTask}`;
      
      case 'rep_created':
        const newRepName = activity.new_values?.rep_name || 'New rep';
        return `${actorName} created new rep: ${newRepName}`;
      
      case 'status_change':
        const statusRepName = activity.new_values?.rep_name || 'Rep';
        const newStatus = activity.new_values?.new_status;
        if (newStatus === 'Inactive') {
          return `${actorName} archived ${statusRepName}`;
        }
        return `${actorName} changed ${statusRepName}'s status to ${newStatus}`;
      
      default:
        return `${actorName} performed ${activity.action}`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-gray-500">
            Loading activities...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {activities.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              No recent activity
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 pb-3 border-b last:border-0"
                >
                  <div className="mt-1 flex-shrink-0">
                    {getActivityIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      {formatActivityMessage(activity)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

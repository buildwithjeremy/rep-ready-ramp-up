import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { EnrichedActivityLog } from "@/types/activity";
import { getActivityIcon, getActivityColor, getCategoryLabel } from "@/utils/activityUtils";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ActivityItemProps {
  activity: EnrichedActivityLog;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = getActivityIcon(activity.action);
  const colors = getActivityColor(activity.action_category);

  return (
    <div
      className={`flex flex-col gap-2 pb-3 border-b last:border-0 hover:bg-muted/30 transition-colors rounded-md p-3 -m-3 cursor-pointer ${colors.border} border-l-2`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-1 flex-shrink-0 p-2 rounded-full ${colors.bg}`}>
          <Icon className={`w-4 h-4 ${colors.text}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <p className="text-sm font-medium text-foreground">
              {activity.formatted_description}
            </p>
            <Badge variant="outline" className={`${colors.bg} ${colors.text} border-0 shrink-0`}>
              {getCategoryLabel(activity.action_category)}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </p>
            {activity.target_name && (
              <>
                <span className="text-xs text-muted-foreground">•</span>
                <p className="text-xs text-muted-foreground">
                  Affected: <span className="font-medium">{activity.target_name}</span>
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex-shrink-0">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {expanded && (activity.old_values || activity.new_values) && (
        <div className="ml-11 mt-2 space-y-2 text-xs">
          {activity.old_values && Object.keys(activity.old_values).length > 0 && (
            <div className="bg-muted/50 p-2 rounded">
              <p className="font-medium text-muted-foreground mb-1">Previous Values:</p>
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(activity.old_values, null, 2)}
              </pre>
            </div>
          )}
          {activity.new_values && Object.keys(activity.new_values).length > 0 && (
            <div className="bg-muted/50 p-2 rounded">
              <p className="font-medium text-muted-foreground mb-1">New Values:</p>
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(activity.new_values, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

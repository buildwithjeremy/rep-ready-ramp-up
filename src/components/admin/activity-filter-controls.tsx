import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown } from "lucide-react";
import { ActivityFilterOption, ActivitySortOption, SortOrder } from "@/types/activity";

interface ActivityFilterControlsProps {
  filterByAction: ActivityFilterOption;
  sortBy: ActivitySortOption;
  sortOrder: SortOrder;
  limit: number;
  onFilterChange: (value: ActivityFilterOption) => void;
  onSortChange: (value: ActivitySortOption) => void;
  onSortOrderToggle: () => void;
  onLimitChange: (value: number) => void;
}

export function ActivityFilterControls({
  filterByAction,
  sortBy,
  sortOrder,
  limit,
  onFilterChange,
  onSortChange,
  onSortOrderToggle,
  onLimitChange
}: ActivityFilterControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="flex-1 space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Filter by Type</label>
        <Select value={filterByAction} onValueChange={onFilterChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activities</SelectItem>
            <SelectItem value="rep_management">Rep Management</SelectItem>
            <SelectItem value="trainer_management">Trainer Management</SelectItem>
            <SelectItem value="progress_tracking">Progress Tracking</SelectItem>
            <SelectItem value="system_event">System Events</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Sort by</label>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="action_type">Action Type</SelectItem>
              <SelectItem value="actor">Actor</SelectItem>
              <SelectItem value="category">Category</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={onSortOrderToggle}
            className="shrink-0"
          >
            {sortOrder === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Show</label>
        <Select value={limit.toString()} onValueChange={(val) => onLimitChange(parseInt(val))}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="20">20 items</SelectItem>
            <SelectItem value="50">50 items</SelectItem>
            <SelectItem value="100">100 items</SelectItem>
            <SelectItem value="200">200 items</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

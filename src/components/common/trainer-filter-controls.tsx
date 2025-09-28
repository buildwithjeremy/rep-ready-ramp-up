import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrainerSortOption, SortOrder } from "@/utils/filterUtils";
import { Filter, ArrowUp, ArrowDown } from "lucide-react";

type TrainerFilterOption = 'all' | 'highPerformers' | 'needsAttention';

interface TrainerFilterControlsProps {
  sortBy: TrainerSortOption;
  filterBy: TrainerFilterOption;
  sortOrder: SortOrder;
  onSortChange: (value: TrainerSortOption) => void;
  onFilterChange: (value: TrainerFilterOption) => void;
  onSortOrderToggle: () => void;
}

export function TrainerFilterControls({ 
  sortBy, 
  filterBy, 
  sortOrder, 
  onSortChange, 
  onFilterChange, 
  onSortOrderToggle 
}: TrainerFilterControlsProps) {
  return (
    <div className="flex gap-4 mb-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Filter</span>
        </div>
        <Select value={filterBy} onValueChange={onFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Trainers</SelectItem>
            <SelectItem value="highPerformers">High Performers (75%+)</SelectItem>
            <SelectItem value="needsAttention">Needs Attention</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={onSortOrderToggle}
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
          >
            {sortOrder === 'desc' ? (
              <ArrowDown className="w-4 h-4 animate-fade-in" />
            ) : (
              <ArrowUp className="w-4 h-4 animate-fade-in" />
            )}
            <span>Sort</span>
          </button>
        </div>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name A-Z</SelectItem>
            <SelectItem value="successRate">Success Rate</SelectItem>
            <SelectItem value="assignedReps">Total Reps</SelectItem>
            <SelectItem value="activeReps">Active Reps</SelectItem>
            <SelectItem value="lastActivity">Last Activity</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export type { TrainerFilterOption };
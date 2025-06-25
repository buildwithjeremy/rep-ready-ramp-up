
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RepSortOption, RepFilterOption } from "@/utils/filterUtils";

interface FilterControlsProps {
  sortBy: RepSortOption;
  filterBy: RepFilterOption;
  onSortChange: (value: RepSortOption) => void;
  onFilterChange: (value: RepFilterOption) => void;
}

export function FilterControls({ sortBy, filterBy, onSortChange, onFilterChange }: FilterControlsProps) {
  return (
    <div className="flex gap-4 mb-4">
      <div className="flex-1">
        <Select value={filterBy} onValueChange={onFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reps</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="stuck">Stuck</SelectItem>
            <SelectItem value="independent">Independent</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex-1">
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name A-Z</SelectItem>
            <SelectItem value="stage">Stage (High to Low)</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="progress">Progress</SelectItem>
            <SelectItem value="lastActivity">Last Activity</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

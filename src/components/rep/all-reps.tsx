
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilterControls } from "@/components/common/filter-controls";
import { ProgressBar } from "@/components/common/progress-bar";
import { Users, UserPlus } from "lucide-react";
import { Rep } from "@/types";
import { RepSortOption, RepFilterOption, sortReps, filterReps } from "@/utils/filterUtils";
import { useAppNavigation } from "@/hooks/useAppNavigation";

interface AllRepsProps {
  reps: Rep[];
  onRepClick: (repId: string) => void;
  title?: string;
  initialFilter?: RepFilterOption;
  onAddRep?: () => void;
}

export function AllReps({ reps, onRepClick, title = "All Reps", initialFilter = 'all', onAddRep }: AllRepsProps) {
  const [sortBy, setSortBy] = useState<RepSortOption>('name');
  const [filterBy, setFilterBy] = useState<RepFilterOption>(initialFilter);

  const filteredReps = filterReps(reps, filterBy);
  const sortedReps = sortReps(filteredReps, sortBy);

  const handleAddRep = () => {
    onAddRep?.();
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header with Add Rep Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <span className="text-sm text-gray-500">{sortedReps.length} reps</span>
        </div>
        {onAddRep && (
          <Button 
            onClick={handleAddRep}
            size="sm"
            className="flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add Rep
          </Button>
        )}
      </div>

      {/* Filters */}
      <FilterControls
        sortBy={sortBy}
        filterBy={filterBy}
        onSortChange={setSortBy}
        onFilterChange={setFilterBy}
      />

      {/* Reps List */}
      <div className="space-y-3">
        {sortedReps.map(rep => (
          <Card 
            key={rep.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onRepClick(rep.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {rep.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-medium">{rep.name}</h3>
                    <p className="text-sm text-gray-600">{rep.email}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  rep.status === 'Active' ? 'bg-green-100 text-green-800' :
                  rep.status === 'Stuck' ? 'bg-red-100 text-red-800' :
                  rep.status === 'Independent' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {rep.status}
                </span>
              </div>
              
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    Milestone {rep.milestone}
                  </span>
                  <span className="text-sm font-bold text-blue-600">{rep.overallProgress}%</span>
                </div>
                <ProgressBar progress={rep.overallProgress} size="sm" />
              </div>
              
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Milestone: {rep.milestone}</span>
                <span>Last activity: {rep.lastActivity}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedReps.length === 0 && (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No reps found matching your criteria</p>
        </div>
      )}
    </div>
  );
}

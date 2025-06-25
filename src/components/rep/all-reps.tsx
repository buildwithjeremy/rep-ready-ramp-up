
import { useState } from "react";
import { Rep } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/common/progress-bar";
import { FilterControls } from "@/components/common/filter-controls";
import { sortReps, filterReps, RepSortOption, RepFilterOption } from "@/utils/filterUtils";
import { AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface AllRepsProps {
  reps: Rep[];
  onRepClick: (repId: string) => void;
  title?: string;
}

export function AllReps({ reps, onRepClick, title = "All Reps" }: AllRepsProps) {
  const [sortBy, setSortBy] = useState<RepSortOption>('name');
  const [filterBy, setFilterBy] = useState<RepFilterOption>('all');

  const filteredAndSortedReps = sortReps(filterReps(reps, filterBy), sortBy);
  const stuckReps = reps.filter(rep => rep.status === 'Stuck');

  const getStatusColor = (status: Rep['status']) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Independent':
        return 'bg-blue-100 text-blue-800';
      case 'Stuck':
        return 'bg-red-100 text-red-800';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Stuck Reps Alert */}
      {stuckReps.length > 0 && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700 mb-3">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-semibold">Stuck Reps Require Attention</h3>
            </div>
            <div className="space-y-2">
              {stuckReps.map((rep) => (
                <div
                  key={rep.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => onRepClick(rep.id)}
                >
                  <div>
                    <p className="font-medium text-gray-900">{rep.name}</p>
                    <p className="text-sm text-gray-600">
                      Stage {rep.stage} • {rep.overallProgress}% complete
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800">
                    View
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Controls */}
      <FilterControls
        sortBy={sortBy}
        filterBy={filterBy}
        onSortChange={setSortBy}
        onFilterChange={setFilterBy}
      />

      {/* Reps List */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        
        {filteredAndSortedReps.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No reps found matching your filters.</p>
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedReps.map((rep) => (
            <Card
              key={rep.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onRepClick(rep.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{rep.name}</h3>
                    <p className="text-sm text-gray-600">Stage {rep.stage} of 13</p>
                  </div>
                  <Badge className={getStatusColor(rep.status)}>
                    {rep.status}
                  </Badge>
                </div>
                
                <ProgressBar 
                  progress={rep.overallProgress} 
                  className="mb-2"
                />
                
                <p className="text-sm text-gray-500">
                  Last activity: {format(new Date(rep.lastActivity), 'M/d/yyyy')}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}


import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrainerFilterControls, TrainerFilterOption } from "@/components/common/trainer-filter-controls";
import { Users, Trophy, TrendingUp, AlertTriangle } from "lucide-react";
import { Trainer } from "@/types";
import { TrainerSortOption, SortOrder, sortTrainers } from "@/utils/filterUtils";
import { formatDisplayDate } from "@/lib/utils";

interface AllTrainersProps {
  trainers: Trainer[];
  onTrainerClick: (trainerId: string) => void;
  title?: string;
}

export function AllTrainers({ trainers, onTrainerClick, title = "All Trainers" }: AllTrainersProps) {
  const [sortBy, setSortBy] = useState<TrainerSortOption>('name');
  const [filterBy, setFilterBy] = useState<TrainerFilterOption>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Filter trainers
  const filteredTrainers = trainers.filter(trainer => {
    switch (filterBy) {
      case 'highPerformers':
        return trainer.successRate >= 75;
      case 'needsAttention':
        return trainer.stuckReps > 0 || trainer.successRate < 50;
      default:
        return true;
    }
  });

  // Sort trainers using utility function
  const sortedTrainers = sortTrainers(filteredTrainers, sortBy, sortOrder);

  const handleSortOrderToggle = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        <span className="text-sm text-gray-500">{sortedTrainers.length} trainers</span>
      </div>

      {/* Filters */}
      <TrainerFilterControls
        sortBy={sortBy}
        filterBy={filterBy}
        sortOrder={sortOrder}
        onSortChange={setSortBy}
        onFilterChange={setFilterBy}
        onSortOrderToggle={handleSortOrderToggle}
      />

      {/* Trainers List */}
      <div className="space-y-3">
        {sortedTrainers.map(trainer => (
          <Card 
            key={trainer.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onTrainerClick(trainer.id)}
          >
            <CardContent className="p-3">
              <div className="space-y-3">
                {/* Header - Stack name/email and success rate on mobile */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {trainer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-sm truncate">{trainer.name}</h3>
                      <p className="text-xs text-gray-600 truncate">{trainer.email}</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-base font-bold text-blue-600">{trainer.successRate}%</p>
                    <p className="text-xs text-gray-600">Success Rate</p>
                  </div>
                </div>
                
                {/* Stats Grid - 4 columns */}
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div>
                    <p className="text-base font-semibold">{trainer.assignedReps}</p>
                    <p className="text-xs text-gray-600">Total</p>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-green-600">{trainer.activeReps}</p>
                    <p className="text-xs text-gray-600">Active</p>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-blue-600">{trainer.independentReps}</p>
                    <p className="text-xs text-gray-600">Independent</p>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-red-600">{trainer.stuckReps}</p>
                    <p className="text-xs text-gray-600">Stuck</p>
                  </div>
                </div>
                
                {/* Footer - Stack attention and activity on mobile */}
                <div className="pt-2 border-t flex flex-col sm:flex-row sm:justify-between gap-1">
                  <div className="flex items-center">
                    {trainer.stuckReps > 0 && (
                      <span className="flex items-center text-xs text-red-600">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Needs Attention
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">
                    Last Activity: {formatDisplayDate(trainer.lastActivity || trainer.updated_at || '')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedTrainers.length === 0 && (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No trainers found matching your criteria</p>
        </div>
      )}
    </div>
  );
}

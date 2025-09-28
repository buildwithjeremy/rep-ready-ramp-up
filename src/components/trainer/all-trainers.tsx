
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilterControls } from "@/components/common/filter-controls";
import { Users, Trophy, TrendingUp, AlertTriangle, Filter, ArrowUpDown } from "lucide-react";
import { Trainer } from "@/types";
import { formatDisplayDate } from "@/lib/utils";

interface AllTrainersProps {
  trainers: Trainer[];
  onTrainerClick: (trainerId: string) => void;
  title?: string;
}

type TrainerSortOption = 'name' | 'successRate' | 'assignedReps' | 'activeReps' | 'lastActivity';
type TrainerFilterOption = 'all' | 'highPerformers' | 'needsAttention';

export function AllTrainers({ trainers, onTrainerClick, title = "All Trainers" }: AllTrainersProps) {
  const [sortBy, setSortBy] = useState<TrainerSortOption>('name');
  const [filterBy, setFilterBy] = useState<TrainerFilterOption>('all');

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

  // Sort trainers
  const sortedTrainers = [...filteredTrainers].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'successRate':
        return b.successRate - a.successRate;
      case 'assignedReps':
        return b.assignedReps - a.assignedReps;
      case 'activeReps':
        return b.activeReps - a.activeReps;
      case 'lastActivity':
        const aActivity = a.lastActivity || a.updated_at || '';
        const bActivity = b.lastActivity || b.updated_at || '';
        return new Date(bActivity).getTime() - new Date(aActivity).getTime();
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        <span className="text-sm text-gray-500">{sortedTrainers.length} trainers</span>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filter</span>
          </div>
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as TrainerFilterOption)}
            className="w-full p-2 border rounded-lg text-sm"
          >
            <option value="all">All Trainers</option>
            <option value="highPerformers">High Performers (75%+)</option>
            <option value="needsAttention">Needs Attention</option>
          </select>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Sort</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as TrainerSortOption)}
            className="w-full p-2 border rounded-lg text-sm"
          >
            <option value="name">Name A-Z</option>
            <option value="successRate">Success Rate</option>
            <option value="assignedReps">Total Reps</option>
            <option value="activeReps">Active Reps</option>
            <option value="lastActivity">Last Activity</option>
          </select>
        </div>
      </div>

      {/* Trainers List */}
      <div className="space-y-3">
        {sortedTrainers.map(trainer => (
          <Card 
            key={trainer.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onTrainerClick(trainer.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {trainer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-medium">{trainer.name}</h3>
                    <p className="text-sm text-gray-600">{trainer.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">{trainer.successRate}%</p>
                  <p className="text-xs text-gray-600">Success Rate</p>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-lg font-semibold">{trainer.assignedReps}</p>
                  <p className="text-xs text-gray-600">Total</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-green-600">{trainer.activeReps}</p>
                  <p className="text-xs text-gray-600">Active</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-blue-600">{trainer.independentReps}</p>
                  <p className="text-xs text-gray-600">Independent</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-red-600">{trainer.stuckReps}</p>
                  <p className="text-xs text-gray-600">Stuck</p>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t flex justify-between items-center">
                <div className="flex items-center">
                  {trainer.stuckReps > 0 && (
                    <span className="flex items-center text-xs text-red-600">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Needs Attention
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Last Activity: {formatDisplayDate(trainer.lastActivity || trainer.updated_at || '')}
                </p>
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

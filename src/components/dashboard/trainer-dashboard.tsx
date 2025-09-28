
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/common/stat-card";
import { ProgressBar } from "@/components/common/progress-bar";
import { Users, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { Rep, Trainer } from "@/types";
import { differenceInDays } from "date-fns";
import { formatDisplayDate } from "@/lib/utils";

interface TrainerDashboardProps {
  trainer: Trainer;
  reps: Rep[];
  onRepClick: (repId: string) => void;
  onStatCardClick?: (filter: 'all' | 'active' | 'stuck' | 'independent') => void;
}

export function TrainerDashboard({ trainer, reps, onRepClick, onStatCardClick }: TrainerDashboardProps) {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('7d');

  const stuckReps = reps.filter(rep => rep.status === 'Stuck');
  const activeReps = reps.filter(rep => rep.status === 'Active');
  const allActiveReps = reps.filter(rep => rep.status !== 'Inactive'); // Exclude inactive from active counts

  const getLastCompletedTask = (rep: Rep) => {
    const completedTasks = rep.checklist
      .flatMap(milestone => milestone.subtasks.filter(task => task.isCompleted))
      .sort((a, b) => new Date(b.completedDate || '').getTime() - new Date(a.completedDate || '').getTime());
    
    return completedTasks[0]?.title || 'No tasks completed';
  };

  const getDaysSinceLastActivity = (lastActivity: string) => {
    return differenceInDays(new Date(), new Date(lastActivity));
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {trainer.name}</h1>
        <p className="text-gray-600">Here's how your reps are progressing</p>
      </div>

      {/* Key Stats - Single column on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StatCard
          title="Active Reps"
          value={trainer.activeReps}
          icon={Users}
          className="bg-white"
          clickable={true}
          onClick={() => onStatCardClick?.('active')}
        />
        <StatCard
          title="Success Rate"
          value={`${trainer.successRate}%`}
          icon={TrendingUp}
          trend={{ value: 5, isPositive: true }}
          className="bg-white"
          clickable={true}
          onClick={() => onStatCardClick?.('independent')}
        />
        <StatCard
          title="Avg. Time"
          value={`${trainer.averageTimeToIndependent}d`}
          icon={Clock}
          className="bg-white"
        />
        <StatCard
          title="Stuck Reps"
          value={trainer.stuckReps}
          icon={AlertTriangle}
          className={trainer.stuckReps > 0 ? "bg-red-50 border-red-200" : "bg-white"}
          clickable={true}
          onClick={() => onStatCardClick?.('stuck')}
        />
      </div>

      {/* Stuck Reps Alert */}
      {stuckReps.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Stuck Reps Require Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stuckReps.map(rep => {
              const daysSinceLastActivity = getDaysSinceLastActivity(rep.lastActivity);
              const lastTask = getLastCompletedTask(rep);
              
              return (
                <div key={rep.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-white rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{rep.name}</p>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>Milestone {rep.milestone}</p>
                      <p>{daysSinceLastActivity} days since last activity</p>
                      <p className="truncate">Last task: {lastTask}</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => onRepClick(rep.id)} className="self-start sm:self-center">
                    View
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* My Reps */}
      <Card>
        <CardHeader>
          <CardTitle>My Reps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {allActiveReps.map(rep => (
            <div 
              key={rep.id} 
              className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => onRepClick(rep.id)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-sm truncate">{rep.name}</h3>
                  <p className="text-xs text-gray-600">Milestone {rep.milestone} of 10</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium self-start ${
                  rep.status === 'Active' ? 'bg-green-100 text-green-800' :
                  rep.status === 'Stuck' ? 'bg-red-100 text-red-800' :
                  rep.status === 'Independent' ? 'bg-blue-100 text-blue-800' :
                  rep.status === 'Inactive' ? 'bg-gray-100 text-gray-600' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {rep.status}
                </span>
              </div>
              <ProgressBar progress={rep.overallProgress} size="sm" />
              <p className="text-xs text-gray-500 mt-1">
                Last activity: {formatDisplayDate(rep.lastActivity)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Rolling Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Rolling Stats</CardTitle>
            <div className="flex space-x-1">
              {(['7d', '30d', '90d'] as const).map(period => (
                <Button
                  key={period}
                  size="sm"
                  variant={timeframe === period ? "default" : "outline"}
                  onClick={() => setTimeframe(period)}
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-xl font-bold text-blue-600">3</p>
              <p className="text-xs text-gray-600">Reps Advanced</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-green-600">1</p>
              <p className="text-xs text-gray-600">Became Independent</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

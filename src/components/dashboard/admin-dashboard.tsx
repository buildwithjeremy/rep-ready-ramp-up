
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/common/stat-card";
import { Users, TrendingUp, Clock, AlertTriangle, UserCheck } from "lucide-react";
import { Rep, Trainer } from "@/types";

interface AdminDashboardProps {
  trainers: Trainer[];
  reps: Rep[];
  onTrainerClick: (trainerId: string) => void;
  onRepClick: (repId: string) => void;
}

export function AdminDashboard({ trainers, reps, onTrainerClick, onRepClick }: AdminDashboardProps) {
  const totalReps = reps.length;
  const activeReps = reps.filter(rep => rep.status === 'Active').length;
  const independentReps = reps.filter(rep => rep.status === 'Independent').length;
  const stuckReps = reps.filter(rep => rep.status === 'Stuck').length;
  const avgTimeToIndependent = Math.round(
    trainers.reduce((sum, trainer) => sum + trainer.averageTimeToIndependent, 0) / trainers.length
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Overall funnel metrics and trainer performance</p>
      </div>

      {/* Overall Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          title="Total Reps"
          value={totalReps}
          icon={Users}
          className="bg-white"
        />
        <StatCard
          title="Active"
          value={activeReps}
          icon={TrendingUp}
          className="bg-white"
        />
        <StatCard
          title="Independent"
          value={independentReps}
          icon={UserCheck}
          className="bg-white"
        />
        <StatCard
          title="Stuck"
          value={stuckReps}
          icon={AlertTriangle}
          className={stuckReps > 0 ? "bg-red-50 border-red-200" : "bg-white"}
        />
      </div>

      {/* Funnel Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Funnel Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Conversion Rate</span>
              <span className="text-lg font-bold text-blue-600">
                {Math.round((independentReps / totalReps) * 100)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Avg. Time to Independent</span>
              <span className="text-lg font-bold">{avgTimeToIndependent} days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">At Risk (Stuck)</span>
              <span className="text-lg font-bold text-red-600">{stuckReps}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trainer Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Trainers</h2>
        {trainers.map(trainer => (
          <Card 
            key={trainer.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onTrainerClick(trainer.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium">{trainer.name}</h3>
                  <p className="text-sm text-gray-600">{trainer.email}</p>
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
              
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm text-gray-600">
                  Avg. Time: {trainer.averageTimeToIndependent} days
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* All Reps Quick View */}
      <Card>
        <CardHeader>
          <CardTitle>All Reps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {reps.map(rep => (
            <div 
              key={rep.id}
              className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => onRepClick(rep.id)}
            >
              <div>
                <p className="font-medium">{rep.name}</p>
                <p className="text-sm text-gray-600">
                  Stage {rep.stage} • {rep.overallProgress}% complete
                </p>
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
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

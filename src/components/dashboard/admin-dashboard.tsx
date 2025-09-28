import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/common/stat-card";
import { UserManagement } from "@/components/admin/user-management";
import { useAdminMetrics } from "@/hooks/useAdminMetrics";
import { Users, TrendingUp, Clock, AlertTriangle, UserCheck, Settings } from "lucide-react";
import { Rep, Trainer } from "@/types";

interface AdminDashboardProps {
  trainers: Trainer[];
  reps: Rep[];
  onStatCardClick?: (filter: 'all' | 'active' | 'stuck' | 'independent') => void;
}

export function AdminDashboard({ trainers, reps, onStatCardClick }: AdminDashboardProps) {
  const [showUserManagement, setShowUserManagement] = useState(false);
  const { metrics, loading: metricsLoading, error: metricsError } = useAdminMetrics();
  
  // Use real-time metrics from database functions
  const totalReps = metrics.totalReps;
  const activeReps = metrics.activeReps;
  const independentReps = metrics.independentReps;
  const stuckReps = metrics.stuckReps; // Now based on 48-hour activity rule
  const conversionRate = metrics.conversionRate;
  const avgTimeToIndependent = Math.round(metrics.avgTimeToIndependent);

  if (showUserManagement) {
    return <UserManagement onBack={() => setShowUserManagement(false)} />;
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Overall funnel metrics and trainer performance</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUserManagement(true)}
            className="flex items-center"
          >
            <Settings className="w-4 h-4 mr-2" />
            User Management
          </Button>
        </div>
      </div>

      {/* Overall Metrics - 2 columns */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          title="Total Reps"
          value={totalReps}
          icon={Users}
          className="bg-white"
          clickable={true}
          onClick={() => onStatCardClick?.('all')}
        />
        <StatCard
          title="Active"
          value={activeReps}
          icon={TrendingUp}
          className="bg-white"
          clickable={true}
          onClick={() => onStatCardClick?.('active')}
        />
        <StatCard
          title="Independent"
          value={independentReps}
          icon={UserCheck}
          className="bg-white"
          clickable={true}
          onClick={() => onStatCardClick?.('independent')}
        />
        <StatCard
          title="Stuck"
          value={stuckReps}
          icon={AlertTriangle}
          className={stuckReps > 0 ? "bg-red-50 border-red-200" : "bg-white"}
          clickable={true}
          onClick={() => onStatCardClick?.('stuck')}
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
                {conversionRate}%
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
    </div>
  );
}
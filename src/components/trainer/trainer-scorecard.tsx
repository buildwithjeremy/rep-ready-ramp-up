
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Target, TrendingUp, Clock, Star } from "lucide-react";
import { Trainer } from "@/types";

interface TrainerScorecardProps {
  trainer: Trainer;
}

export function TrainerScorecard({ trainer }: TrainerScorecardProps) {
  const performanceMetrics = [
    {
      title: "Success Rate",
      value: `${trainer.successRate}%`,
      icon: Trophy,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Total Reps",
      value: trainer.assignedReps,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Reps",
      value: trainer.activeReps,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Independent Reps",
      value: trainer.independentReps,
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Avg. Time to Independent",
      value: `${trainer.averageTimeToIndependent} days`,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Stuck Reps",
      value: trainer.stuckReps,
      icon: Star,
      color: trainer.stuckReps > 0 ? "text-red-600" : "text-gray-400",
      bgColor: trainer.stuckReps > 0 ? "bg-red-50" : "bg-gray-50",
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            Performance Scorecard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {performanceMetrics.map((metric, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${metric.bgColor} border border-gray-100`}
              >
                <div className="flex items-center justify-between mb-2">
                  <metric.icon className={`w-5 h-5 ${metric.color}`} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <p className="text-sm text-gray-600">{metric.title}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <span className="text-sm font-medium text-green-800">Conversion Rate</span>
            <span className="text-lg font-bold text-green-600">
              {Math.round((trainer.independentReps / trainer.assignedReps) * 100)}%
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium text-blue-800">Activity Rate</span>
            <span className="text-lg font-bold text-blue-600">
              {Math.round(((trainer.activeReps + trainer.independentReps) / trainer.assignedReps) * 100)}%
            </span>
          </div>

          {trainer.stuckReps > 0 && (
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-sm font-medium text-red-800">At-Risk Reps</span>
              <span className="text-lg font-bold text-red-600">{trainer.stuckReps}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

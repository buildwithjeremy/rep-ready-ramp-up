
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, Calendar, User, ChevronDown, ChevronUp, Trophy } from "lucide-react";
import { Trainer } from "@/types";

interface TrainerContactCardProps {
  trainer: Trainer;
  onBack: () => void;
}

export function TrainerContactCard({ trainer, onBack }: TrainerContactCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card className="bg-white shadow-sm sticky top-0 z-10">
      <CardContent className="p-4">
        {/* Header with Back Button */}
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="mr-3 p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg truncate">{trainer.name}</h1>
            <p className="text-sm text-gray-600">Field Trainer</p>
          </div>
        </div>

        {/* Main Profile Info */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {trainer.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-center">
                <p className="font-semibold text-lg text-blue-600">{trainer.successRate}%</p>
                <p className="text-xs text-gray-600">Success Rate</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg text-green-600">{trainer.assignedReps}</p>
                <p className="text-xs text-gray-600">Total Reps</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-center text-sm">
          <div>
            <p className="font-semibold text-green-600">{trainer.activeReps}</p>
            <p className="text-xs text-gray-600">Active</p>
          </div>
          <div>
            <p className="font-semibold text-blue-600">{trainer.independentReps}</p>
            <p className="text-xs text-gray-600">Independent</p>
          </div>
          <div>
            <p className="font-semibold text-red-600">{trainer.stuckReps}</p>
            <p className="text-xs text-gray-600">Stuck</p>
          </div>
        </div>

        {/* Toggle Details Button */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <span>Contact Details</span>
          {showDetails ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {/* Collapsible Contact Details */}
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                <span className="truncate">{trainer.email}</span>
              </div>
              <div className="flex items-center">
                <Trophy className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                <span className="truncate">Avg. Time to Independent: {trainer.averageTimeToIndependent} days</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

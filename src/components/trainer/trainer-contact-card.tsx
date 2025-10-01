
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/common/progress-bar";
import { ArrowLeft, Mail, Phone, Calendar, User, ChevronDown, ChevronUp, Users, Archive, RotateCcw } from "lucide-react";
import { Trainer, Rep } from "@/types";
import { formatDisplayDate } from "@/lib/utils";

interface TrainerContactCardProps {
  trainer: Trainer;
  reps: Rep[];
  onBack: () => void;
  isAdmin?: boolean;
  onArchiveClick?: () => void;
  onReactivateClick?: () => void;
}

export function TrainerContactCard({ trainer, reps, onBack, isAdmin = false, onArchiveClick, onReactivateClick }: TrainerContactCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Calculate average progress of active reps
  const activeReps = reps.filter(rep => rep.status === 'Active');
  const averageProgress = activeReps.length > 0 
    ? Math.round(activeReps.reduce((sum, rep) => sum + rep.overallProgress, 0) / activeReps.length)
    : 0;

  // Format trainer creation date and last activity from database
  const dateAdded = formatDisplayDate(trainer.created_at || new Date());
  const lastActivity = formatDisplayDate(trainer.updated_at || new Date());

  return (
    <Card className="bg-white shadow-sm sticky top-0 z-10">
      <CardContent className="p-3">
        {/* Header with Back Button */}
        <div className="flex items-center mb-3 relative">
          <Button variant="ghost" size="sm" onClick={onBack} className="mr-2 p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-base truncate">{trainer.name}</h1>
            <p className="text-xs text-gray-600">Field Trainer</p>
          </div>
          
          {/* Archive/Reactivate Button - Admin only */}
          {isAdmin && (
            <Button
              variant={trainer.status === 'Inactive' ? "default" : "ghost"}
              size="sm"
              onClick={() => trainer.status === 'Inactive' ? onReactivateClick?.() : onArchiveClick?.()}
              className="flex items-center gap-1 text-xs px-2 py-1 h-7"
            >
              {trainer.status === 'Inactive' ? (
                <>
                  <RotateCcw className="w-4 h-4" />
                  Reactivate
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4" />
                  Archive
                </>
              )}
            </Button>
          )}
        </div>

        {/* Profile Section */}
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {trainer.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">Team Avg Progress</span>
                <span className="text-xs font-bold text-blue-600">{averageProgress}%</span>
              </div>
              <ProgressBar progress={averageProgress} size="sm" />
              <p className="text-xs text-gray-500 mt-1">
                Based on {activeReps.length} active rep{activeReps.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-2 mb-3 text-center text-xs">
          <div className="bg-green-50 p-2 rounded-lg">
            <p className="font-semibold text-green-600">{trainer.activeReps}</p>
            <p className="text-xs text-gray-600">Active</p>
          </div>
          <div className="bg-blue-50 p-2 rounded-lg">
            <p className="font-semibold text-blue-600">{trainer.independentReps}</p>
            <p className="text-xs text-gray-600">Independent</p>
          </div>
          <div className="bg-red-50 p-2 rounded-lg">
            <p className="font-semibold text-red-600">{trainer.stuckReps}</p>
            <p className="text-xs text-gray-600">Stuck</p>
          </div>
        </div>

        {/* Toggle Details Button */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between p-2 text-xs text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <span>Contact Details</span>
          {showDetails ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>

        {/* Collapsible Contact Details */}
        {showDetails && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="flex items-center">
                <Mail className="w-3 h-3 mr-2 text-gray-500 flex-shrink-0" />
                <span className="truncate">{trainer.email}</span>
              </div>
              <div className="flex items-center">
                <Phone className="w-3 h-3 mr-2 text-gray-500 flex-shrink-0" />
                <span className="truncate">{trainer.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center">
                <User className="w-3 h-3 mr-2 text-gray-500 flex-shrink-0" />
                <span className="truncate">Trainer: {trainer.name}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-3 h-3 mr-2 text-gray-500 flex-shrink-0" />
                <span className="truncate">Became trainer: {dateAdded}</span>
              </div>
              <div className="flex items-center">
                <Users className="w-3 h-3 mr-2 text-gray-500 flex-shrink-0" />
                <span className="truncate">Last activity: {lastActivity}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

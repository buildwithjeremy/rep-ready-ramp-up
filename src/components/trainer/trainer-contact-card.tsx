
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/common/progress-bar";
import { ArrowLeft, Mail, Phone, Calendar, User, ChevronDown, ChevronUp, Users } from "lucide-react";
import { Trainer, Rep } from "@/types";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

interface TrainerContactCardProps {
  trainer: Trainer;
  reps: Rep[];
  onBack: () => void;
}

export function TrainerContactCard({ trainer, reps, onBack }: TrainerContactCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { user } = useAuth();
  const { profile } = useProfile();
  const [avatarUrl, setAvatarUrl] = useState(trainer.avatar);

  const isCurrentUser = user?.id === trainer.id;
  const isAdmin = profile?.role === 'ADMIN';

  // Calculate average progress of active reps
  const activeReps = reps.filter(rep => rep.status === 'Active');
  const averageProgress = activeReps.length > 0 
    ? Math.round(activeReps.reduce((sum, rep) => sum + rep.overallProgress, 0) / activeReps.length)
    : 0;

  // Format dates (using mock data for now)
  const dateAdded = "5/14/2024";
  const lastActivity = "6/21/2024";

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

        {/* Profile Section */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-shrink-0">
            <AvatarUpload
              currentAvatarUrl={avatarUrl}
              userId={trainer.id}
              userName={trainer.name}
              isCurrentUser={isCurrentUser}
              isAdmin={isAdmin}
              onAvatarUpdate={setAvatarUrl}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Team Average Progress</span>
                <span className="text-sm font-bold text-blue-600">{averageProgress}%</span>
              </div>
              <ProgressBar progress={averageProgress} size="md" />
              <p className="text-xs text-gray-500 mt-1">
                Based on {activeReps.length} active rep{activeReps.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-center text-sm">
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
                <Phone className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                <span className="truncate">555-0101</span>
              </div>
              <div className="flex items-center">
                <User className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                <span className="truncate">Presenter: Sarah Johnson</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                <span className="truncate">Added {dateAdded}</span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                <span className="truncate">Last activity: {lastActivity}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

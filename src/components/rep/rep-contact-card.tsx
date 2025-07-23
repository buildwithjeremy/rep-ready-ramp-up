
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Mail, Phone, Calendar, User, ChevronDown, ChevronUp, Users } from "lucide-react";
import { Rep } from "@/types";
import { mockTrainers } from "@/data/mockData";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

interface RepContactCardProps {
  rep: Rep;
  onBack: () => void;
}

export function RepContactCard({ rep, onBack }: RepContactCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { user } = useAuth();
  const { profile } = useProfile();
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  const isCurrentUser = user?.id === rep.userId;
  const isAdmin = profile?.role === 'ADMIN';

  const getStatusColor = (status: Rep['status']) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Stuck': return 'bg-red-100 text-red-800';
      case 'Independent': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Find the trainer for this rep
  const trainer = mockTrainers.find(t => t.id === rep.trainerId);

  return (
    <Card className="bg-white shadow-sm sticky top-0 z-10">
      <CardContent className="p-4">
        {/* Header with Back Button */}
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="mr-3 p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg truncate">{rep.name}</h1>
            <p className="text-sm text-gray-600">Milestone {rep.milestone} of 10</p>
          </div>
        </div>

        {/* Main Profile Info */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-shrink-0">
            <AvatarUpload
              currentAvatarUrl={avatarUrl}
              userId={rep.userId || ''}
              userName={rep.name}
              isCurrentUser={isCurrentUser}
              isAdmin={isAdmin}
              onAvatarUpdate={setAvatarUrl}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rep.status)}`}>
                {rep.status}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-medium text-gray-700">{rep.overallProgress}%</span>
          </div>
          <Progress value={rep.overallProgress} className="h-2" />
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
                <span className="truncate">{rep.email}</span>
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                <span className="truncate">{rep.phone}</span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                <span className="truncate">Trainer: {trainer?.name || 'Not assigned'}</span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                <span className="truncate">Presenter: {trainer?.name || 'Not assigned'}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                <span className="truncate">Added {new Date(rep.dateAdded).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center">
                <User className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                <span className="truncate">Last activity: {new Date(rep.lastActivity).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

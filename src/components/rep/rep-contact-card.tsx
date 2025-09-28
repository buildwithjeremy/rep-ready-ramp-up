
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Mail, Phone, Calendar, User, Users } from "lucide-react";
import { Rep, Trainer } from "@/types";
import { formatDisplayDate } from "@/lib/utils";

interface RepContactCardProps {
  rep: Rep;
  trainer?: Trainer;
  onBack: () => void;
}

export function RepContactCard({ rep, trainer, onBack }: RepContactCardProps) {
  const getStatusColor = (status: Rep['status']) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Stuck': return 'bg-red-100 text-red-800';
      case 'Independent': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="bg-white shadow-sm sticky top-0 z-10">
      <CardContent className="p-3">
        {/* Header with Back Button */}
        <div className="flex items-center mb-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="mr-2 p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-base truncate">{rep.name}</h1>
            <p className="text-xs text-gray-600">Milestone {rep.milestone} of 10</p>
          </div>
        </div>

        {/* Main Profile Info */}
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {rep.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rep.status)}`}>
                {rep.status}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-700">Overall Progress</span>
            <span className="text-xs font-medium text-gray-700">{rep.overallProgress}%</span>
          </div>
          <Progress value={rep.overallProgress} className="h-2" />
        </div>

        {/* Contact Details */}
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="flex items-center">
              <Mail className="w-3 h-3 mr-2 text-gray-500 flex-shrink-0" />
              <span className="truncate">{rep.email}</span>
            </div>
            <div className="flex items-center">
              <Phone className="w-3 h-3 mr-2 text-gray-500 flex-shrink-0" />
              <span className="truncate">{rep.phone}</span>
            </div>
            <div className="flex items-center">
              <Users className="w-3 h-3 mr-2 text-gray-500 flex-shrink-0" />
              <span className="truncate">Trainer: {trainer?.name || 'Not assigned'}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-2 text-gray-500 flex-shrink-0" />
              <span className="truncate">Start Date: {formatDisplayDate(rep.dateAdded)}</span>
            </div>
            <div className="flex items-center">
              <User className="w-3 h-3 mr-2 text-gray-500 flex-shrink-0" />
              <span className="truncate">Last activity: {formatDisplayDate(rep.lastActivity)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Mail, Phone, Calendar, User, ChevronDown, ChevronUp } from "lucide-react";
import { Rep } from "@/types";

interface RepContactCardProps {
  rep: Rep;
}

export function RepContactCard({ rep }: RepContactCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status: Rep['status']) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Stuck': return 'bg-red-100 text-red-800';
      case 'Independent': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const completedTasks = rep.checklist.filter(item => item.isCompleted).length;
  const totalTasks = rep.checklist.length;

  return (
    <Card>
      <CardContent className="p-4">
        {/* Main Profile Info */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {rep.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg truncate">{rep.name}</h2>
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
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">{rep.overallProgress}%</span>
              <span className="text-xs text-gray-500">({completedTasks}/{totalTasks})</span>
            </div>
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

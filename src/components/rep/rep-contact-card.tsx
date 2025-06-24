
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, Calendar, User } from "lucide-react";
import { Rep } from "@/types";

interface RepContactCardProps {
  rep: Rep;
}

export function RepContactCard({ rep }: RepContactCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
            {rep.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg truncate">{rep.name}</h2>
            <p className="text-sm text-gray-600 truncate">{rep.email}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center min-w-0">
            <Mail className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
            <span className="truncate">{rep.email}</span>
          </div>
          <div className="flex items-center min-w-0">
            <Phone className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
            <span className="truncate">{rep.phone}</span>
          </div>
          <div className="flex items-center min-w-0">
            <Calendar className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
            <span className="truncate">Added {new Date(rep.dateAdded).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center min-w-0">
            <User className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
            <span className="truncate">Last activity: {new Date(rep.lastActivity).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

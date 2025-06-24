
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";
import { Rep } from "@/types";

interface RepProfileHeaderProps {
  rep: Rep;
  onBack: () => void;
}

export function RepProfileHeader({ rep, onBack }: RepProfileHeaderProps) {
  const getStatusColor = (status: Rep['status']) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Stuck': return 'bg-red-100 text-red-800';
      case 'Independent': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow-sm sticky top-0 z-10">
      <div className="flex items-center p-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="mr-3 p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-lg truncate">{rep.name}</h1>
          <p className="text-sm text-gray-600">Stage {rep.stage} of 13</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(rep.status)}`}>
          {rep.status}
        </span>
      </div>
      
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-medium text-gray-700">{rep.overallProgress}%</span>
        </div>
        <Progress value={rep.overallProgress} className="h-2" />
      </div>
    </div>
  );
}

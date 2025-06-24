
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Rep } from "@/types";

interface RepProfileHeaderProps {
  rep: Rep;
  onBack: () => void;
}

export function RepProfileHeader({ rep, onBack }: RepProfileHeaderProps) {
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
      </div>
    </div>
  );
}

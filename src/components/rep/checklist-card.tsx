
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { ChecklistItem, Rep } from "@/types";

interface ChecklistCardProps {
  item: ChecklistItem;
  rep: Rep;
  isExpanded: boolean;
  isCelebrating: boolean;
  onToggle: () => void;
  onSubtaskToggle: (subtaskId: string, isCompleted: boolean) => void;
  viewOnly?: boolean;
}

export function ChecklistCard({ 
  item, 
  rep, 
  isExpanded, 
  isCelebrating, 
  onToggle, 
  onSubtaskToggle,
  viewOnly = false
}: ChecklistCardProps) {
  const getCompletedSubtasks = () => {
    return item.subtasks.filter(st => st.isCompleted).length;
  };

  const formatCompletionDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getMilestoneStatus = () => {
    if (item.isCompleted) return 'COMPLETED';
    if (item.milestone === rep.milestone) return 'IN PROGRESS';
    return 'AVAILABLE';
  };

  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600';
      case 'IN PROGRESS': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getCardClasses = () => {
    let classes = "transition-all duration-200 ease-in-out rounded-lg border border-gray-200 ";
    
    if (item.milestone === rep.milestone && !item.isCompleted) {
      classes += "border-2 border-orange-300 ";
    }
    
    classes += "hover:shadow-md hover:border-gray-300 ";
    
    return classes;
  };

  const completedSubtasks = getCompletedSubtasks();
  const totalSubtasks = item.subtasks.length;
  const milestoneStatus = getMilestoneStatus();

  return (
    <Card className={getCardClasses()}>
      <Collapsible 
        open={isExpanded}
        onOpenChange={onToggle}
      >
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer transition-colors p-4 rounded-lg hover:bg-gray-50 active:bg-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  item.isCompleted 
                    ? 'bg-green-500 text-white' 
                    : item.milestone === rep.milestone 
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                }`}>
                  {item.isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    item.milestone
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base truncate">{item.title}</CardTitle>
                    {isCelebrating && (
                      <span className="text-lg animate-bounce">🎉</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs font-normal ${getMilestoneStatusColor(milestoneStatus)}`}>
                      {milestoneStatus.toLowerCase()}
                    </span>
                    {!item.isCompleted && (
                      <span className="text-xs text-gray-500 ml-auto">
                        {completedSubtasks}/{totalSubtasks}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                {isExpanded ? 
                  <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                }
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 px-4 pb-4">
            <div className="mb-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">{item.description}</p>
              {item.isCompleted && item.completedDate && (
                <p className="text-xs text-green-600 mt-2">
                  Completed: {formatCompletionDate(item.completedDate)}
                </p>
              )}
            </div>
            
            <div className="space-y-3">
              {item.subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-start space-x-3 p-3 border rounded-lg bg-white">
                  <Checkbox
                    checked={subtask.isCompleted}
                    onCheckedChange={viewOnly ? undefined : (checked) => 
                      onSubtaskToggle(subtask.id, checked === true)
                    }
                    disabled={viewOnly}
                    className="mt-0.5 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${subtask.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {subtask.title}
                    </p>
                    {subtask.completedDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        Completed: {formatCompletionDate(subtask.completedDate)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}


import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, ChevronDown, ChevronUp, Calendar, Phone, Mail, User, Check, Lock } from "lucide-react";
import { Rep, ChecklistItem, Subtask } from "@/types";

interface RepProfileProps {
  rep: Rep;
  onBack: () => void;
  onUpdateRep: (updatedRep: Rep) => void;
}

export function RepProfile({ rep, onBack, onUpdateRep }: RepProfileProps) {
  const [expandedStages, setExpandedStages] = useState<Record<number, boolean>>({});
  const [celebratingSteps, setCelebratingSteps] = useState<Record<string, boolean>>({});

  const toggleStage = (stage: number) => {
    // Don't allow toggling locked stages
    if (stage > rep.stage) return;
    
    setExpandedStages(prev => ({
      ...prev,
      [stage]: !prev[stage]
    }));
  };

  const handleSubtaskToggle = (checklistItemId: string, subtaskId: string, isCompleted: boolean) => {
    const updatedChecklist = rep.checklist.map(item => {
      if (item.id === checklistItemId) {
        const updatedSubtasks = item.subtasks.map(subtask => {
          if (subtask.id === subtaskId) {
            return {
              ...subtask,
              isCompleted,
              completedDate: isCompleted ? new Date().toISOString() : undefined
            };
          }
          return subtask;
        });

        // Check if all subtasks are completed to auto-complete the stage
        const allSubtasksCompleted = updatedSubtasks.every(st => st.isCompleted);
        const wasIncomplete = !item.isCompleted;
        
        const updatedItem = {
          ...item,
          subtasks: updatedSubtasks,
          isCompleted: allSubtasksCompleted,
          completedDate: allSubtasksCompleted && wasIncomplete ? new Date().toISOString() : item.completedDate
        };

        // Trigger celebration animation if step just completed
        if (allSubtasksCompleted && wasIncomplete) {
          setCelebratingSteps(prev => ({ ...prev, [item.id]: true }));
          setTimeout(() => {
            setCelebratingSteps(prev => ({ ...prev, [item.id]: false }));
          }, 2000);
        }

        return updatedItem;
      }
      return item;
    });

    // Calculate overall progress
    const totalSubtasks = updatedChecklist.reduce((sum, item) => sum + item.subtasks.length, 0);
    const completedSubtasks = updatedChecklist.reduce((sum, item) => 
      sum + item.subtasks.filter(st => st.isCompleted).length, 0);
    const overallProgress = Math.round((completedSubtasks / totalSubtasks) * 100);

    // Determine current stage and status
    const completedStages = updatedChecklist.filter(item => item.isCompleted).length;
    const currentStage = Math.min(completedStages + 1, 13);
    
    let status: Rep['status'] = 'Active';
    if (currentStage === 13 && overallProgress === 100) {
      status = 'Independent';
    } else if (hasNoRecentActivity(updatedChecklist)) {
      status = 'Stuck';
    }

    const updatedRep: Rep = {
      ...rep,
      checklist: updatedChecklist,
      overallProgress,
      stage: currentStage,
      status,
      lastActivity: new Date().toISOString()
    };

    onUpdateRep(updatedRep);
  };

  const hasNoRecentActivity = (checklist: ChecklistItem[]): boolean => {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    return !checklist.some(item => 
      item.subtasks.some(subtask => 
        subtask.completedDate && new Date(subtask.completedDate) > twoDaysAgo
      )
    );
  };

  const getStatusColor = (status: Rep['status']) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Stuck': return 'bg-red-100 text-red-800';
      case 'Independent': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCompletedSubtasks = (item: ChecklistItem) => {
    return item.subtasks.filter(st => st.isCompleted).length;
  };

  const formatCompletionDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStepStatus = (item: ChecklistItem) => {
    if (item.isCompleted) return 'COMPLETED';
    if (item.stage === rep.stage) return 'IN PROGRESS';
    if (item.stage > rep.stage) return 'LOCKED';
    return 'AVAILABLE';
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600';
      case 'IN PROGRESS': return 'text-orange-600';
      case 'LOCKED': return 'text-gray-400';
      default: return 'text-gray-600';
    }
  };

  const isStepLocked = (item: ChecklistItem) => {
    return item.stage > rep.stage;
  };

  const getCardBorderClass = (item: ChecklistItem) => {
    if (item.stage === rep.stage && !item.isCompleted) {
      return 'border-orange-300 border-2';
    }
    return 'border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
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
        
        {/* Progress Bar */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-medium text-gray-700">{rep.overallProgress}%</span>
          </div>
          <Progress value={rep.overallProgress} className="h-2" />
        </div>
      </div>

      {/* Rep Profile Card */}
      <div className="p-4 space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-lg truncate">{rep.name}</h2>
                <p className="text-sm text-gray-600 truncate">{rep.email}</p>
              </div>
            </div>
            
            {/* Contact Info - Mobile Optimized */}
            <div className="space-y-3 text-sm">
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
          </CardContent>
        </Card>

        {/* Checklist */}
        <div className="space-y-3">
          {rep.checklist.map((item) => {
            const completedSubtasks = getCompletedSubtasks(item);
            const totalSubtasks = item.subtasks.length;
            const isCelebrating = celebratingSteps[item.id];
            const stepStatus = getStepStatus(item);
            const isLocked = isStepLocked(item);
            const isExpanded = expandedStages[item.stage] || false;
            
            return (
              <Card key={item.id} className={`${getCardBorderClass(item)} ${isLocked ? 'opacity-60' : ''}`}>
                <Collapsible 
                  open={isExpanded}
                  onOpenChange={() => toggleStage(item.stage)}
                  disabled={isLocked}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className={`cursor-pointer transition-colors p-4 ${!isLocked ? 'hover:bg-gray-50' : 'cursor-not-allowed'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                            item.isCompleted 
                              ? 'bg-green-500 text-white' 
                              : isLocked
                                ? 'bg-gray-300 text-gray-500'
                                : item.stage === rep.stage 
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-gray-200 text-gray-600'
                          }`}>
                            {item.isCompleted ? (
                              <Check className="w-4 h-4" />
                            ) : isLocked ? (
                              <Lock className="w-3 h-3" />
                            ) : (
                              item.stage
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
                              <span className={`text-xs font-medium ${getStepStatusColor(stepStatus)}`}>
                                {stepStatus}
                              </span>
                              {!item.isCompleted && !isLocked && (
                                <span className="text-xs text-gray-500">
                                  {completedSubtasks}/{totalSubtasks}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {!isLocked && (
                            isExpanded ? 
                              <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
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
                              onCheckedChange={(checked) => 
                                handleSubtaskToggle(item.id, subtask.id, checked === true)
                              }
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
          })}
        </div>
      </div>
    </div>
  );
}

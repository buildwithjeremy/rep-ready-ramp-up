
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, ChevronDown, ChevronUp, Calendar, Phone, Mail, User } from "lucide-react";
import { Rep, ChecklistItem, Subtask } from "@/types";

interface RepProfileProps {
  rep: Rep;
  onBack: () => void;
  onUpdateRep: (updatedRep: Rep) => void;
}

export function RepProfile({ rep, onBack, onUpdateRep }: RepProfileProps) {
  const [expandedStages, setExpandedStages] = useState<Record<number, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const toggleStage = (stage: number) => {
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
              completedDate: isCompleted ? new Date().toISOString() : undefined,
              notes: notes[subtaskId] || subtask.notes
            };
          }
          return subtask;
        });

        // Check if all subtasks are completed to auto-complete the stage
        const allSubtasksCompleted = updatedSubtasks.every(st => st.isCompleted);
        
        return {
          ...item,
          subtasks: updatedSubtasks,
          isCompleted: allSubtasksCompleted,
          completedDate: allSubtasksCompleted && !item.isCompleted ? new Date().toISOString() : item.completedDate
        };
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

  const handleNotesChange = (subtaskId: string, noteText: string) => {
    setNotes(prev => ({
      ...prev,
      [subtaskId]: noteText
    }));
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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center p-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="mr-3">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="font-bold text-lg">{rep.name}</h1>
            <p className="text-sm text-gray-600">Stage {rep.stage} of 13</p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rep.status)}`}>
            {rep.status}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="px-4 pb-4">
          <Progress value={rep.overallProgress} className="h-2" />
          <p className="text-sm text-gray-600 mt-1">{rep.overallProgress}% Complete</p>
        </div>
      </div>

      {/* Rep Info Card */}
      <div className="p-4">
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2 text-gray-500" />
                <span>{rep.email}</span>
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2 text-gray-500" />
                <span>{rep.phone}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                <span>Added {new Date(rep.dateAdded).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2 text-gray-500" />
                <span>Last: {new Date(rep.lastActivity).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Checklist */}
        <div className="space-y-3">
          {rep.checklist.map((item) => (
            <Card key={item.id} className={item.isCompleted ? "bg-green-50 border-green-200" : ""}>
              <Collapsible 
                open={expandedStages[item.stage] || false}
                onOpenChange={() => toggleStage(item.stage)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          item.isCompleted 
                            ? 'bg-green-500 text-white' 
                            : item.stage === rep.stage 
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-600'
                        }`}>
                          {item.stage}
                        </div>
                        <div>
                          <CardTitle className="text-base">{item.title}</CardTitle>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {item.isCompleted && (
                          <span className="text-xs text-green-600 font-medium">Complete</span>
                        )}
                        {expandedStages[item.stage] ? 
                          <ChevronUp className="w-4 h-4" /> : 
                          <ChevronDown className="w-4 h-4" />
                        }
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {item.subtasks.map((subtask) => (
                        <div key={subtask.id} className="border rounded-lg p-3">
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              checked={subtask.isCompleted}
                              onCheckedChange={(checked) => 
                                handleSubtaskToggle(item.id, subtask.id, checked === true)
                              }
                            />
                            <div className="flex-1">
                              <p className={`font-medium ${subtask.isCompleted ? 'line-through text-gray-500' : ''}`}>
                                {subtask.title}
                              </p>
                              {subtask.completedDate && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Completed: {new Date(subtask.completedDate).toLocaleDateString()}
                                </p>
                              )}
                              <Textarea
                                placeholder="Add notes..."
                                value={notes[subtask.id] || subtask.notes || ''}
                                onChange={(e) => handleNotesChange(subtask.id, e.target.value)}
                                className="mt-2 text-sm"
                                rows={2}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

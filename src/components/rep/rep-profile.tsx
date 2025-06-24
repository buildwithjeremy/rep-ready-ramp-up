import { useState } from "react";
import { Rep, ChecklistItem } from "@/types";
import { RepContactCard } from "./rep-contact-card";
import { ChecklistCard } from "./checklist-card";

interface RepProfileProps {
  rep: Rep;
  onBack: () => void;
  onUpdateRep: (updatedRep: Rep) => void;
}

export function RepProfile({ rep, onBack, onUpdateRep }: RepProfileProps) {
  const [expandedStages, setExpandedStages] = useState<Record<number, boolean>>({});
  const [celebratingSteps, setCelebratingSteps] = useState<Record<string, boolean>>({});

  const toggleStage = (stage: number) => {
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

        const allSubtasksCompleted = updatedSubtasks.every(st => st.isCompleted);
        const wasIncomplete = !item.isCompleted;
        
        const updatedItem = {
          ...item,
          subtasks: updatedSubtasks,
          isCompleted: allSubtasksCompleted,
          completedDate: allSubtasksCompleted && wasIncomplete ? new Date().toISOString() : item.completedDate
        };

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

    const totalSubtasks = updatedChecklist.reduce((sum, item) => sum + item.subtasks.length, 0);
    const completedSubtasks = updatedChecklist.reduce((sum, item) => 
      sum + item.subtasks.filter(st => st.isCompleted).length, 0);
    const overallProgress = Math.round((completedSubtasks / totalSubtasks) * 100);

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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="p-4 space-y-4">
        <RepContactCard rep={rep} onBack={onBack} />

        <div className="space-y-3">
          {rep.checklist.map((item) => (
            <ChecklistCard
              key={item.id}
              item={item}
              rep={rep}
              isExpanded={expandedStages[item.stage] || false}
              isCelebrating={celebratingSteps[item.id] || false}
              onToggle={() => toggleStage(item.stage)}
              onSubtaskToggle={(subtaskId, isCompleted) => 
                handleSubtaskToggle(item.id, subtaskId, isCompleted)
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

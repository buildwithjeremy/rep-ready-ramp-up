
import { useState, useEffect } from "react";
import { Rep, ChecklistItem, Trainer } from "@/types";
import { RepContactCard } from "./rep-contact-card";
import { ChecklistCard } from "./checklist-card";

interface RepProfileProps {
  rep: Rep;
  trainer?: Trainer;
  onBack: () => void;
  onUpdateRep: (updatedRep: Rep) => void;
}

export function RepProfile({ rep, trainer, onBack, onUpdateRep }: RepProfileProps) {
  const [expandedMilestones, setExpandedMilestones] = useState<Record<number, boolean>>({});
  const [celebratingMilestones, setCelebratingMilestones] = useState<Record<string, boolean>>({});
  const [showIndependentCelebration, setShowIndependentCelebration] = useState(false);

  const toggleMilestone = (milestone: number) => {
    setExpandedMilestones(prev => ({
      ...prev,
      [milestone]: !prev[milestone]
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
          setCelebratingMilestones(prev => ({ ...prev, [item.id]: true }));
          setTimeout(() => {
            setCelebratingMilestones(prev => ({ ...prev, [item.id]: false }));
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

    const completedMilestones = updatedChecklist.filter(item => item.isCompleted).length;
    const currentMilestone = Math.min(completedMilestones + 1, 10);
    
    let status: Rep['status'] = 'Active';
    const wasNotIndependent = rep.status !== 'Independent';
    if (currentMilestone === 10 && overallProgress === 100) {
      status = 'Independent';
      // Trigger celebration if they just became independent
      if (wasNotIndependent) {
        setShowIndependentCelebration(true);
        setTimeout(() => {
          setShowIndependentCelebration(false);
        }, 4000);
      }
    } else if (hasNoRecentActivity(updatedChecklist)) {
      status = 'Stuck';
    }

    const updatedRep: Rep = {
      ...rep,
      checklist: updatedChecklist,
      overallProgress,
      milestone: currentMilestone,
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
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      {/* Independent Celebration Overlay */}
      {showIndependentCelebration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-lg p-8 mx-4 text-center animate-scale-in">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Congratulations!</h2>
            <p className="text-lg text-gray-700 mb-4">{rep.name} is now Independent!</p>
            <div className="flex justify-center space-x-2">
              <span className="text-2xl animate-bounce" style={{ animationDelay: '0.1s' }}>🎊</span>
              <span className="text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>🌟</span>
              <span className="text-2xl animate-bounce" style={{ animationDelay: '0.3s' }}>🎊</span>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        <RepContactCard rep={rep} trainer={trainer} onBack={onBack} />

        <div className="space-y-3">
          {rep.checklist.map((item) => (
            <ChecklistCard
              key={item.id}
              item={item}
              rep={rep}
              isExpanded={expandedMilestones[item.milestone] || false}
              isCelebrating={celebratingMilestones[item.id] || false}
              onToggle={() => toggleMilestone(item.milestone)}
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

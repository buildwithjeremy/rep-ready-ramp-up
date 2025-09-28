
import { useState, useEffect } from "react";
import { Rep, ChecklistItem, Trainer } from "@/types";
import { RepContactCard } from "./rep-contact-card";
import { ChecklistCard } from "./checklist-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Archive, RotateCcw } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

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
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const { profile } = useProfile();
  const canArchive = (profile?.role === 'ADMIN') || (profile?.role === 'TRAINER' && profile?.id === rep.trainerId);

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

  const handleArchiveToggle = () => {
    if (rep.status === 'Inactive') {
      // Reactivate - move back to Active status
      const updatedRep: Rep = {
        ...rep,
        status: 'Active',
        lastActivity: new Date().toISOString()
      };
      onUpdateRep(updatedRep);
    } else {
      // Show confirmation dialog for archiving
      setShowArchiveDialog(true);
    }
  };

  const confirmArchive = () => {
    const updatedRep: Rep = {
      ...rep,
      status: 'Inactive',
      lastActivity: new Date().toISOString()
    };
    onUpdateRep(updatedRep);
    setShowArchiveDialog(false);
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
        <div className="relative">
          <RepContactCard rep={rep} trainer={trainer} onBack={onBack} />
          
          {/* Archive/Reactivate Button - Only show for permitted users and non-Independent reps */}
          {rep.status !== 'Independent' && canArchive && (
            <Button
              variant={rep.status === 'Inactive' ? "default" : "ghost"}
              size="sm"
              onClick={handleArchiveToggle}
              className="absolute top-16 right-2 z-20 flex items-center gap-1 text-xs px-2 py-1 h-7"
            >
              {rep.status === 'Inactive' ? (
                <>
                  <RotateCcw className="w-4 h-4" />
                  Reactivate
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4" />
                  Archive
                </>
              )}
            </Button>
          )}
        </div>

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

      {/* Archive Confirmation Dialog */}
      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Rep</DialogTitle>
            <DialogDescription>
              Are you sure you want to archive {rep.name}? This will:
              <br />
              <br />
              • Mark them as Inactive in the system
              <br />
              • Remove them from active rep counts and progress calculations
              <br />
              • Preserve all their checklist data and progress
              <br />
              • Allow you to reactivate them later if needed
              <br />
              <br />
              This action is reversible and won't delete any data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowArchiveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmArchive} className="bg-orange-600 hover:bg-orange-700">
              Archive Rep
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

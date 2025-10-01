
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Trophy, Archive, RotateCcw } from "lucide-react";
import { Trainer, Rep } from "@/types";
import { TrainerContactCard } from "./trainer-contact-card";
import { TrainerScorecard } from "./trainer-scorecard";
import { AllReps } from "@/components/rep/all-reps";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface TrainerProfileProps {
  trainer: Trainer;
  reps: Rep[];
  onBack: () => void;
  onRepClick: (repId: string) => void;
  onUpdateTrainer?: (trainer: Trainer) => void;
  onArchiveTrainer?: (trainerId: string) => Promise<void>;
  onReactivateTrainer?: (trainerId: string) => Promise<void>;
  isAdmin?: boolean;
}

export function TrainerProfile({ 
  trainer, 
  reps, 
  onBack, 
  onRepClick, 
  onUpdateTrainer,
  onArchiveTrainer,
  onReactivateTrainer,
  isAdmin = false
}: TrainerProfileProps) {
  const [activeTab, setActiveTab] = useState<'scorecard' | 'reps'>('scorecard');
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter reps assigned to this trainer
  const trainerReps = reps.filter(rep => rep.trainerId === trainer.id);
  const activeReps = trainerReps.filter(rep => rep.status !== 'Inactive');
  const hasActiveReps = activeReps.length > 0;

  const handleArchive = async () => {
    if (!onArchiveTrainer || hasActiveReps) return;
    
    setIsProcessing(true);
    try {
      await onArchiveTrainer(trainer.id);
      setShowArchiveDialog(false);
    } catch (error) {
      console.error('Error archiving trainer:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReactivate = async () => {
    if (!onReactivateTrainer) return;
    
    setIsProcessing(true);
    try {
      await onReactivateTrainer(trainer.id);
      setShowReactivateDialog(false);
    } catch (error) {
      console.error('Error reactivating trainer:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <TrainerContactCard trainer={trainer} reps={trainerReps} onBack={onBack} />
      
      {/* Admin Archive/Reactivate Controls */}
      {isAdmin && (
        <div className="px-4 py-2">
          {trainer.status === 'Active' ? (
            <Button
              onClick={() => setShowArchiveDialog(true)}
              variant="destructive"
              size="sm"
              className="w-full"
            >
              <Archive className="w-4 h-4 mr-2" />
              Archive Trainer
            </Button>
          ) : (
            <Button
              onClick={() => setShowReactivateDialog(true)}
              variant="default"
              size="sm"
              className="w-full"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reactivate Trainer
            </Button>
          )}
        </div>
      )}
      
      <div className="px-4 py-4 space-y-4">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'scorecard'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('scorecard')}
          >
            <Trophy className="w-4 h-4 inline mr-2" />
            Scorecard
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'reps'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('reps')}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Reps ({trainerReps.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="pb-4">
          {activeTab === 'scorecard' && (
            <TrainerScorecard trainer={trainer} />
          )}

          {activeTab === 'reps' && (
            <AllReps
              reps={trainerReps}
              onRepClick={onRepClick}
              title={`${trainer.name}'s Reps`}
            />
          )}
        </div>
      </div>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Trainer?</AlertDialogTitle>
            <AlertDialogDescription>
              {hasActiveReps ? (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Cannot archive trainer with active reps. Please reassign all {activeReps.length} active rep{activeReps.length !== 1 ? 's' : ''} to a different trainer before archiving.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  This will archive <span className="font-semibold">{trainer.name}</span> and they will no longer appear in active trainer lists or be available for new rep assignments.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              disabled={hasActiveReps || isProcessing}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isProcessing ? 'Archiving...' : 'Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reactivate Confirmation Dialog */}
      <AlertDialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivate Trainer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reactivate <span className="font-semibold">{trainer.name}</span> and they will be available for new rep assignments. They will start with no assigned reps.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReactivate}
              disabled={isProcessing}
            >
              {isProcessing ? 'Reactivating...' : 'Reactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

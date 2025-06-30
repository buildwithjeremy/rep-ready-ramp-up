import { TrainerDashboard } from "@/components/dashboard/trainer-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { RepProfile } from "@/components/rep/rep-profile";
import { AddRepForm } from "@/components/rep/add-rep-form";
import { AllReps } from "@/components/rep/all-reps";
import { mockTrainers } from "@/data/mockData";
import { Rep, Trainer } from "@/types";
import { RepFilterOption } from "@/utils/filterUtils";
import { TrainerProfile } from "@/components/trainer/trainer-profile";

interface DashboardRouterProps {
  currentPath: string;
  userRole: 'ADMIN' | 'TRAINER' | 'REP';
  userId: string;
  trainerId: string | null;
  selectedRepId: string | null;
  selectedTrainerId: string | null;
  reps: Rep[];
  repsFilter: RepFilterOption;
  onRepClick: (repId: string) => void;
  onTrainerClick: (trainerId: string) => void;
  onStatCardClick: (filter: 'all' | 'active' | 'stuck' | 'independent') => void;
  onBackFromRep: () => void;
  onBackFromTrainer: () => void;
  onBackFromAddRep: () => void;
  onAddRep: (rep: Rep) => void;
  onUpdateRep: (rep: Rep) => void;
}

export function DashboardRouter({
  currentPath,
  userRole,
  userId,
  trainerId,
  selectedRepId,
  selectedTrainerId,
  reps,
  repsFilter,
  onRepClick,
  onTrainerClick,
  onStatCardClick,
  onBackFromRep,
  onBackFromTrainer,
  onBackFromAddRep,
  onAddRep,
  onUpdateRep
}: DashboardRouterProps) {
  // Get current rep for profile view
  const selectedRep = selectedRepId ? reps.find(rep => rep.id === selectedRepId) : null;
  
  // Get current trainer for profile view
  const selectedTrainer = selectedTrainerId ? mockTrainers.find(trainer => trainer.id === selectedTrainerId) : null;

  // Get trainer-specific data
  const currentTrainer = mockTrainers.find(t => t.id === trainerId || t.id === userId);
  const trainerReps = userRole === 'TRAINER' || userRole === 'ADMIN'
    ? (userRole === 'ADMIN' ? reps : reps.filter(rep => rep.trainerId === userId))
    : [];

  if (currentPath === '/dashboard' && userRole === 'TRAINER' && currentTrainer) {
    return (
      <TrainerDashboard 
        trainer={currentTrainer}
        reps={trainerReps}
        onRepClick={onRepClick}
        onStatCardClick={onStatCardClick}
      />
    );
  }

  if (currentPath === '/dashboard' && userRole === 'REP') {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-4">Welcome to Team Tenacious!</h2>
        <p className="text-gray-600 mb-4">Your trainer will guide you through your onboarding process.</p>
        <p className="text-sm text-gray-500">Contact your trainer for next steps.</p>
      </div>
    );
  }
  
  if (currentPath === '/admin' && userRole === 'ADMIN') {
    return (
      <AdminDashboard 
        trainers={mockTrainers}
        reps={reps}
        onTrainerClick={onTrainerClick}
        onRepClick={onRepClick}
        onStatCardClick={onStatCardClick}
      />
    );
  }

  if (currentPath === '/rep-profile' && selectedRep) {
    return (
      <RepProfile
        rep={selectedRep}
        onBack={onBackFromRep}
        onUpdateRep={onUpdateRep}
      />
    );
  }

  if (currentPath === '/trainer-profile' && selectedTrainer) {
    return (
      <TrainerProfile
        trainer={selectedTrainer}
        reps={reps}
        onBack={onBackFromTrainer}
        onRepClick={onRepClick}
      />
    );
  }

  if (currentPath === '/add-rep' && (userRole === 'TRAINER' || userRole === 'ADMIN')) {
    return (
      <AddRepForm
        onBack={onBackFromAddRep}
        onAddRep={onAddRep}
        trainerId={trainerId || userId}
      />
    );
  }

  if (currentPath === '/reps' && (userRole === 'TRAINER' || userRole === 'ADMIN')) {
    return (
      <AllReps
        reps={trainerReps}
        onRepClick={onRepClick}
        title={userRole === 'ADMIN' ? 'All Reps' : 'My Reps'}
        initialFilter={repsFilter}
      />
    );
  }

  return null;
}

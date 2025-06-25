
import { MobileNav } from "@/components/layout/mobile-nav";
import { AppHeader } from "@/components/layout/app-header";
import { DashboardRouter } from "@/components/dashboard/dashboard-router";
import { Rep } from "@/types";
import { RepFilterOption } from "@/utils/filterUtils";

interface AppLayoutProps {
  profileName: string | null;
  userEmail: string | null;
  userRole: 'ADMIN' | 'TRAINER' | 'REP';
  userId: string;
  trainerId: string | null;
  currentPath: string;
  selectedRepId: string | null;
  reps: Rep[];
  repsFilter: RepFilterOption;
  onSignOut: () => Promise<void>;
  onSignIn: () => void;
  onNavigate: (path: string) => void;
  onRepClick: (repId: string) => void;
  onTrainerClick: (trainerId: string) => void;
  onStatCardClick: (filter: 'all' | 'active' | 'stuck' | 'independent') => void;
  onBackFromRep: () => void;
  onBackFromAddRep: () => void;
  onAddRep: (rep: Rep) => void;
  onUpdateRep: (rep: Rep) => void;
}

export function AppLayout({
  profileName,
  userEmail,
  userRole,
  userId,
  trainerId,
  currentPath,
  selectedRepId,
  reps,
  repsFilter,
  onSignOut,
  onSignIn,
  onNavigate,
  onRepClick,
  onTrainerClick,
  onStatCardClick,
  onBackFromRep,
  onBackFromAddRep,
  onAddRep,
  onUpdateRep
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        profileName={profileName}
        userEmail={userEmail}
        userRole={userRole}
        onSignOut={onSignOut}
        onSignIn={onSignIn}
      />

      <div className="p-4">
        <DashboardRouter
          currentPath={currentPath}
          userRole={userRole}
          userId={userId}
          trainerId={trainerId}
          selectedRepId={selectedRepId}
          reps={reps}
          repsFilter={repsFilter}
          onRepClick={onRepClick}
          onTrainerClick={onTrainerClick}
          onStatCardClick={onStatCardClick}
          onBackFromRep={onBackFromRep}
          onBackFromAddRep={onBackFromAddRep}
          onAddRep={onAddRep}
          onUpdateRep={onUpdateRep}
        />
      </div>

      {/* Show mobile nav only when not in rep profile or add rep screens and user has appropriate role */}
      {!currentPath.includes('/rep-profile') && 
       !currentPath.includes('/add-rep') && 
       (userRole === 'TRAINER' || userRole === 'ADMIN') && (
        <MobileNav 
          currentPath={currentPath}
          userRole={userRole === 'ADMIN' ? 'admin' : 'trainer'}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}

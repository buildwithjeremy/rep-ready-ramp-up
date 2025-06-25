
import { useState, useEffect } from "react";
import { MobileNav } from "@/components/layout/mobile-nav";
import { TrainerDashboard } from "@/components/dashboard/trainer-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { RepProfile } from "@/components/rep/rep-profile";
import { AddRepForm } from "@/components/rep/add-rep-form";
import { AllReps } from "@/components/rep/all-reps";
import { AuthScreen } from "@/components/auth/auth-screen";
import { AuthButton } from "@/components/ui/auth-button";
import { mockTrainers, mockReps } from "@/data/mockData";
import { Rep } from "@/types";
import { RepFilterOption } from "@/utils/filterUtils";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

const Index = () => {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [currentPath, setCurrentPath] = useState('/dashboard');
  const [selectedRepId, setSelectedRepId] = useState<string | null>(null);
  const [reps, setReps] = useState(mockReps);
  const [repsFilter, setRepsFilter] = useState<RepFilterOption>('all');

  console.log('Index render - authLoading:', authLoading, 'profileLoading:', profileLoading, 'user:', user?.email, 'profile:', profile);

  // Set initial path based on user role - ALWAYS call this hook
  useEffect(() => {
    if (profile) {
      console.log('Setting initial path for user with role:', profile.role);
      if (profile.role === 'ADMIN') {
        setCurrentPath('/admin');
      } else if (profile.role === 'TRAINER') {
        setCurrentPath('/dashboard');
      } else if (profile.role === 'REP') {
        setCurrentPath('/dashboard');
      } else {
        setCurrentPath('/dashboard');
      }
    }
  }, [profile]);

  // Show loading screen while checking authentication
  if (authLoading || (user && profileLoading)) {
    console.log('Showing loading screen');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth screen if not authenticated
  if (!user) {
    console.log('No user, showing auth screen');
    return <AuthScreen />;
  }

  // If user exists but no profile, show error message
  if (user && !profile && !profileLoading) {
    console.log('User exists but no profile found');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Profile not found</h2>
          <p className="text-gray-600 mb-4">There was an issue loading your profile.</p>
          <AuthButton 
            isAuthenticated={true}
            onSignIn={signInWithGoogle}
            onSignOut={signOut}
          />
        </div>
      </div>
    );
  }

  // If we don't have a profile yet, show loading
  if (!profile) {
    console.log('No profile yet, showing loading');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your account...</p>
        </div>
      </div>
    );
  }

  console.log('Rendering main app with profile:', profile);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    if (path !== '/rep-profile') {
      setSelectedRepId(null);
    }
    if (path === '/reps') {
      setRepsFilter('all');
    }
  };

  const handleRepClick = (repId: string) => {
    setSelectedRepId(repId);
    setCurrentPath('/rep-profile');
  };

  const handleTrainerClick = (trainerId: string) => {
    console.log('Navigate to trainer:', trainerId);
  };

  const handleAddRep = (newRep: Rep) => {
    setReps(prev => [...prev, newRep]);
    setCurrentPath('/dashboard');
    console.log('New rep added:', newRep);
  };

  const handleUpdateRep = (updatedRep: Rep) => {
    setReps(prev => prev.map(rep => 
      rep.id === updatedRep.id ? updatedRep : rep
    ));
  };

  const handleBackFromRep = () => {
    setSelectedRepId(null);
    setCurrentPath(profile.role === 'ADMIN' ? '/admin' : '/dashboard');
  };

  const handleBackFromAddRep = () => {
    setCurrentPath('/dashboard');
  };

  const handleStatCardClick = (filter: 'all' | 'active' | 'stuck' | 'independent') => {
    setRepsFilter(filter);
    setCurrentPath('/reps');
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // Get current rep for profile view
  const selectedRep = selectedRepId ? reps.find(rep => rep.id === selectedRepId) : null;

  // Get trainer-specific data
  const currentTrainer = mockTrainers.find(t => t.id === profile.trainer_id || t.id === profile.id);
  const trainerReps = profile.role === 'TRAINER' || profile.role === 'ADMIN'
    ? (profile.role === 'ADMIN' ? reps : reps.filter(rep => rep.trainerId === profile.id))
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg">Team Tenacious</h1>
          <p className="text-sm text-gray-600">
            {profile.full_name || user.email} 
            <span className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
              {profile.role}
            </span>
          </p>
        </div>
        <AuthButton 
          isAuthenticated={true}
          onSignIn={signInWithGoogle}
          onSignOut={handleSignOut}
        />
      </div>

      {/* Main Content */}
      <div className="p-4">
        {currentPath === '/dashboard' && profile.role === 'TRAINER' && currentTrainer && (
          <TrainerDashboard 
            trainer={currentTrainer}
            reps={trainerReps}
            onRepClick={handleRepClick}
            onStatCardClick={handleStatCardClick}
          />
        )}

        {currentPath === '/dashboard' && profile.role === 'REP' && (
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold mb-4">Welcome to Team Tenacious!</h2>
            <p className="text-gray-600 mb-4">Your trainer will guide you through your onboarding process.</p>
            <p className="text-sm text-gray-500">Contact your trainer for next steps.</p>
          </div>
        )}
        
        {currentPath === '/admin' && profile.role === 'ADMIN' && (
          <AdminDashboard 
            trainers={mockTrainers}
            reps={reps}
            onTrainerClick={handleTrainerClick}
            onRepClick={handleRepClick}
            onStatCardClick={handleStatCardClick}
          />
        )}

        {currentPath === '/rep-profile' && selectedRep && (
          <RepProfile
            rep={selectedRep}
            onBack={handleBackFromRep}
            onUpdateRep={handleUpdateRep}
          />
        )}

        {currentPath === '/add-rep' && (profile.role === 'TRAINER' || profile.role === 'ADMIN') && (
          <AddRepForm
            onBack={handleBackFromAddRep}
            onAddRep={handleAddRep}
            trainerId={profile.trainer_id || profile.id}
          />
        )}

        {currentPath === '/reps' && (profile.role === 'TRAINER' || profile.role === 'ADMIN') && (
          <AllReps
            reps={trainerReps}
            onRepClick={handleRepClick}
            title={profile.role === 'ADMIN' ? 'All Reps' : 'My Reps'}
            initialFilter={repsFilter}
          />
        )}
      </div>

      {/* Show mobile nav only when not in rep profile or add rep screens and user has appropriate role */}
      {!currentPath.includes('/rep-profile') && 
       !currentPath.includes('/add-rep') && 
       (profile.role === 'TRAINER' || profile.role === 'ADMIN') && (
        <MobileNav 
          currentPath={currentPath}
          userRole={profile.role === 'ADMIN' ? 'admin' : 'trainer'}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
};

export default Index;


import { useState } from "react";
import { AuthScreen } from "@/components/auth/auth-screen";
import { AppLayout } from "@/components/layout/app-layout";
import { Rep } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useReps } from "@/hooks/useReps";
import { useTrainers } from "@/hooks/useTrainers";

const Index = () => {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { reps, loading: repsLoading, addRep: addRepToDb, updateRep: updateRepInDb } = useReps();
  const { trainers, loading: trainersLoading } = useTrainers();

  console.log('Index render - authLoading:', authLoading, 'profileLoading:', profileLoading, 'user:', user?.email, 'profile:', profile);

  const navigation = useAppNavigation({ 
    userRole: profile?.role || 'REP' 
  });

  // Show loading screen while checking authentication
  if (authLoading || (user && profileLoading) || repsLoading || trainersLoading) {
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
          <button 
            onClick={() => signOut()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Sign Out
          </button>
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

  const handleAddRep = async (newRep: Rep) => {
    try {
      await addRepToDb(newRep);
      navigation.handleNavigate('/dashboard');
      console.log('New rep added:', newRep);
    } catch (error) {
      console.error('Error adding rep:', error);
    }
  };

  const handleUpdateRep = async (updatedRep: Rep) => {
    try {
      await updateRepInDb(updatedRep);
    } catch (error) {
      console.error('Error updating rep:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <AppLayout
      profileName={profile.full_name}
      userEmail={user.email}
      userRole={profile.role}
      userId={profile.id}
      trainerId={profile.trainer_id}
      currentPath={navigation.currentPath}
      selectedRepId={navigation.selectedRepId}
      selectedTrainerId={navigation.selectedTrainerId}
      reps={reps}
      trainers={trainers}
      repsFilter={navigation.repsFilter}
      onSignOut={handleSignOut}
      onSignIn={signInWithGoogle}
      onNavigate={navigation.handleNavigate}
      onRepClick={navigation.handleRepClick}
      onTrainerClick={navigation.handleTrainerClick}
      onStatCardClick={navigation.handleStatCardClick}
      onBackFromRep={navigation.handleBackFromRep}
      onBackFromTrainer={navigation.handleBackFromTrainer}
      onBackFromAddRep={navigation.handleBackFromAddRep}
      onAddRep={handleAddRep}
      onUpdateRep={handleUpdateRep}
      onAddRepClick={navigation.handleAddRepClick}
    />
  );
};

export default Index;

import { useState, useEffect } from "react";
import { LoginScreen } from "@/components/login/login-screen";
import { MobileNav } from "@/components/layout/mobile-nav";
import { TrainerDashboard } from "@/components/dashboard/trainer-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { RepProfile } from "@/components/rep/rep-profile";
import { AddRepForm } from "@/components/rep/add-rep-form";
import { AllReps } from "@/components/rep/all-reps";
import { AuthButton } from "@/components/ui/auth-button";
import { mockTrainers, mockReps } from "@/data/mockData";
import { User, Rep } from "@/types";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPath, setCurrentPath] = useState('/dashboard');
  const [selectedRepId, setSelectedRepId] = useState<string | null>(null);
  const [reps, setReps] = useState(mockReps);
  const [isLoading, setIsLoading] = useState(false);

  // Mock authentication - TODO: Replace with real Google Sign-In
  const handleSignIn = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock user - could be trainer or admin
    const mockUser: User = {
      id: 'user-1',
      name: 'Sarah Johnson',
      email: 'sarah@teamtenacious.com',
      role: Math.random() > 0.5 ? 'trainer' : 'admin', // Random for demo
      trainerId: 'trainer-1'
    };
    
    setUser(mockUser);
    setCurrentPath(mockUser.role === 'admin' ? '/admin' : '/dashboard');
    setIsLoading(false);
  };

  const handleSignOut = () => {
    setUser(null);
    setCurrentPath('/dashboard');
    setSelectedRepId(null);
  };

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    if (path !== '/rep-profile') {
      setSelectedRepId(null);
    }
  };

  const handleRepClick = (repId: string) => {
    setSelectedRepId(repId);
    setCurrentPath('/rep-profile');
  };

  const handleTrainerClick = (trainerId: string) => {
    // TODO: Navigate to specific trainer dashboard
    console.log('Navigate to trainer:', trainerId);
  };

  const handleAddRep = (newRep: Rep) => {
    setReps(prev => [...prev, newRep]);
    setCurrentPath('/dashboard'); // Navigate back to dashboard
    console.log('New rep added:', newRep);
  };

  const handleUpdateRep = (updatedRep: Rep) => {
    setReps(prev => prev.map(rep => 
      rep.id === updatedRep.id ? updatedRep : rep
    ));
  };

  const handleBackFromRep = () => {
    setSelectedRepId(null);
    setCurrentPath(user?.role === 'admin' ? '/admin' : '/dashboard');
  };

  const handleBackFromAddRep = () => {
    setCurrentPath('/dashboard');
  };

  // Show login screen if not authenticated
  if (!user) {
    return <LoginScreen onSignIn={handleSignIn} isLoading={isLoading} />;
  }

  // Get current rep for profile view
  const selectedRep = selectedRepId ? reps.find(rep => rep.id === selectedRepId) : null;

  // Get trainer-specific data
  const currentTrainer = mockTrainers.find(t => t.id === user.trainerId);
  const trainerReps = user.role === 'trainer' 
    ? reps.filter(rep => rep.trainerId === user.trainerId)
    : reps;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg">Team Tenacious</h1>
          <p className="text-sm text-gray-600">{user.name}</p>
        </div>
        <AuthButton 
          isAuthenticated={true}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
        />
      </div>

      {/* Main Content */}
      <div className="p-4">
        {currentPath === '/dashboard' && user.role === 'trainer' && currentTrainer && (
          <TrainerDashboard 
            trainer={currentTrainer}
            reps={trainerReps}
            onRepClick={handleRepClick}
          />
        )}
        
        {currentPath === '/admin' && user.role === 'admin' && (
          <AdminDashboard 
            trainers={mockTrainers}
            reps={reps}
            onTrainerClick={handleTrainerClick}
            onRepClick={handleRepClick}
          />
        )}

        {currentPath === '/rep-profile' && selectedRep && (
          <RepProfile
            rep={selectedRep}
            onBack={handleBackFromRep}
            onUpdateRep={handleUpdateRep}
          />
        )}

        {currentPath === '/add-rep' && (
          <AddRepForm
            onBack={handleBackFromAddRep}
            onAddRep={handleAddRep}
            trainerId={user.trainerId || user.id}
          />
        )}

        {currentPath === '/reps' && (
          <AllReps
            reps={trainerReps}
            onRepClick={handleRepClick}
            title={user.role === 'admin' ? 'All Reps' : 'My Reps'}
          />
        )}

        {/* Placeholder for other routes */}
      </div>

      {/* Show mobile nav only when not in rep profile or add rep screens */}
      {!currentPath.includes('/rep-profile') && !currentPath.includes('/add-rep') && (
        <MobileNav 
          currentPath={currentPath}
          userRole={user.role}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
};

export default Index;

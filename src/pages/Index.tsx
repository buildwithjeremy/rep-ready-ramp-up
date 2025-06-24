
import { useState, useEffect } from "react";
import { LoginScreen } from "@/components/login/login-screen";
import { MobileNav } from "@/components/layout/mobile-nav";
import { TrainerDashboard } from "@/components/dashboard/trainer-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { AuthButton } from "@/components/ui/auth-button";
import { mockTrainers, mockReps } from "@/data/mockData";
import { User } from "@/types";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPath, setCurrentPath] = useState('/dashboard');
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
  };

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };

  const handleRepClick = (repId: string) => {
    // TODO: Navigate to rep profile/checklist
    console.log('Navigate to rep:', repId);
  };

  const handleTrainerClick = (trainerId: string) => {
    // TODO: Navigate to trainer dashboard
    console.log('Navigate to trainer:', trainerId);
  };

  // Show login screen if not authenticated
  if (!user) {
    return <LoginScreen onSignIn={handleSignIn} isLoading={isLoading} />;
  }

  // Get trainer-specific data
  const currentTrainer = mockTrainers.find(t => t.id === user.trainerId);
  const trainerReps = user.role === 'trainer' 
    ? mockReps.filter(rep => rep.trainerId === user.trainerId)
    : mockReps;

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
            reps={mockReps}
            onTrainerClick={handleTrainerClick}
            onRepClick={handleRepClick}
          />
        )}

        {/* Placeholder for other routes */}
        {currentPath === '/reps' && (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Reps List</h2>
            <p className="text-gray-600">Coming soon...</p>
          </div>
        )}

        {currentPath === '/add-rep' && (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Add New Rep</h2>
            <p className="text-gray-600">Coming soon...</p>
          </div>
        )}
      </div>

      {/* Mobile Navigation */}
      <MobileNav 
        currentPath={currentPath}
        userRole={user.role}
        onNavigate={handleNavigate}
      />
    </div>
  );
};

export default Index;


import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";
import { useState } from "react";

interface AuthButtonProps {
  isAuthenticated: boolean;
  onSignIn: () => void;
  onSignOut: () => void | Promise<void>;
  isLoading?: boolean;
}

export function AuthButton({ isAuthenticated, onSignIn, onSignOut, isLoading }: AuthButtonProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await onSignOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  if (isAuthenticated) {
    return (
      <Button 
        onClick={handleSignOut} 
        variant="outline" 
        size="sm"
        disabled={isLoading || isSigningOut}
      >
        <LogOut className="w-4 h-4 mr-2" />
        {isSigningOut ? 'Signing out...' : 'Sign Out'}
      </Button>
    );
  }

  return (
    <Button 
      onClick={onSignIn} 
      className="w-full bg-blue-600 hover:bg-blue-700"
      disabled={isLoading}
    >
      <LogIn className="w-5 h-5 mr-2" />
      {isLoading ? 'Signing in...' : 'Sign in with Google'}
    </Button>
  );
}

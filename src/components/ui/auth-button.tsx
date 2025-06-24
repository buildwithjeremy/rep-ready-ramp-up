
import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";

interface AuthButtonProps {
  isAuthenticated: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  isLoading?: boolean;
}

export function AuthButton({ isAuthenticated, onSignIn, onSignOut, isLoading }: AuthButtonProps) {
  if (isAuthenticated) {
    return (
      <Button 
        onClick={onSignOut} 
        variant="outline" 
        size="sm"
        disabled={isLoading}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
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

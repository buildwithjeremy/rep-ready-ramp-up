
import { AuthButton } from "@/components/ui/auth-button";

interface AppHeaderProps {
  profileName: string | null;
  userEmail: string | null;
  userRole: string;
  onSignOut: () => Promise<void>;
  onSignIn: () => void;
}

export function AppHeader({ profileName, userEmail, userRole, onSignOut, onSignIn }: AppHeaderProps) {
  return (
    <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
      <div>
        <h1 className="font-bold text-lg">Team Tenacious</h1>
        <p className="text-sm text-gray-600">
          {profileName || userEmail} 
          <span className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
            {userRole}
          </span>
        </p>
      </div>
      <AuthButton 
        isAuthenticated={true}
        onSignIn={onSignIn}
        onSignOut={onSignOut}
      />
    </div>
  );
}

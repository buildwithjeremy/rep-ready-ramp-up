
import { AuthButton } from "@/components/ui/auth-button";
import teamTenaciousLogo from "/lovable-uploads/3ce7a3f1-dd01-4603-9a0f-e8c0f9a0f114.png";

interface AppHeaderProps {
  profileName: string | null;
  userEmail: string | null;
  userRole: string;
  onSignOut: () => Promise<void>;
  onSignIn: () => void;
}

export function AppHeader({ profileName, userEmail, userRole, onSignOut, onSignIn }: AppHeaderProps) {
  return (
    <div className="bg-white shadow-sm px-3 py-3">
      {/* Top row - Logo and Auth Button */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <img 
            src={teamTenaciousLogo} 
            alt="Team Tenacious 2.0 Logo" 
            className="w-6 h-6 object-contain"
          />
          <h1 className="font-bold text-base">Team Tenacious 2.0</h1>
        </div>
        <AuthButton
          isAuthenticated={true}
          onSignIn={onSignIn}
          onSignOut={onSignOut}
        />
      </div>
      
      {/* Bottom row - User info */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-600 truncate">
            {profileName || userEmail}
          </p>
        </div>
        <span className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded flex-shrink-0">
          {userRole}
        </span>
      </div>
    </div>
  );
}

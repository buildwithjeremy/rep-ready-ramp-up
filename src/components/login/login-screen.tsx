
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthButton } from "@/components/ui/auth-button";
import teamTenaciousLogo from "/lovable-uploads/3ce7a3f1-dd01-4603-9a0f-e8c0f9a0f114.png";

interface LoginScreenProps {
  onSignIn: () => void;
  isLoading?: boolean;
}

export function LoginScreen({ onSignIn, isLoading }: LoginScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center">
            <img 
              src={teamTenaciousLogo} 
              alt="Team Tenacious 2.0 Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold">Team Tenacious 2.0</CardTitle>
          <CardDescription>Field Trainer Dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600 text-sm">
            Track new reps through their 30-day journey to independence
          </p>
          <AuthButton 
            isAuthenticated={false}
            onSignIn={onSignIn}
            onSignOut={() => {}}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}

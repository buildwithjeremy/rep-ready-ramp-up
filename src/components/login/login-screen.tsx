
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthButton } from "@/components/ui/auth-button";

interface LoginScreenProps {
  onSignIn: () => void;
  isLoading?: boolean;
}

export function LoginScreen({ onSignIn, isLoading }: LoginScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-2xl">TT</span>
          </div>
          <CardTitle className="text-2xl font-bold">Team Tenacious</CardTitle>
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

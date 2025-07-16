
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { supabase } from '@/integrations/supabase/client';
import { LogIn, Mail, AlertCircle, User } from 'lucide-react';

export function AuthScreen() {
  console.log('AuthScreen component loaded successfully');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [trainers, setTrainers] = useState<{id: string, full_name: string, assigned_reps: number}[]>([]);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Load available trainers when switching to signup mode
  useEffect(() => {
    if (isSignUp) {
      loadTrainers();
    }
  }, [isSignUp]);

  const loadTrainers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_available_trainers');
      if (error) {
        console.error('Error loading trainers:', error);
      } else {
        setTrainers(data || []);
        // Don't auto-select - let user choose their trainer
      }
    } catch (err) {
      console.error('Error in loadTrainers:', err);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isResetMode) {
        const redirectUrl = `${window.location.origin}/reset-password`;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl,
        });

        if (error) {
          setError(error.message);
        } else {
          setMessage('Check your email for the password reset link!');
          setEmail('');
        }
      } else if (isSignUp) {
        if (!fullName.trim()) {
          setError('Full name is required');
          return;
        }
        if (!selectedTrainer) {
          setError('Please select a trainer');
          return;
        }

        const redirectUrl = `${window.location.origin}/`;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: fullName,
              phone: phone,
              assigned_trainer: selectedTrainer,
            }
          },
        });

        if (error) {
          setError(error.message);
        } else {
          // Create rep record after successful signup
          if (data.user) {
            try {
              const { error: repError } = await supabase
                .from('reps')
                .insert({
                  user_id: data.user.id,
                  trainer_id: selectedTrainer,
                  full_name: fullName,
                  email: email,
                  phone: phone || null,
                });

              if (repError) {
                console.error('Error creating rep record:', repError);
              }
            } catch (repErr) {
              console.error('Error in rep creation:', repErr);
            }
          }
          setMessage('Check your email for the confirmation link!');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setError(error.message);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">{/* AuthScreen component refreshed */}
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Team Tenacious
          </CardTitle>
          <p className="text-gray-600">
            {isResetMode ? 'Reset your password' : (isSignUp ? 'Create your account' : 'Sign in to your account')}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>

            {!isResetMode && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  minLength={6}
                />
              </div>
            )}

            {isSignUp && !isResetMode && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trainer">Assigned Trainer</Label>
                  <Select value={selectedTrainer} onValueChange={setSelectedTrainer} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your trainer" />
                    </SelectTrigger>
                    <SelectContent>
                      {trainers.map((trainer) => (
                        <SelectItem key={trainer.id} value={trainer.id}>
                          {trainer.full_name} ({trainer.assigned_reps} reps)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {trainers.length === 0 && (
                    <p className="text-sm text-gray-500">Loading trainers...</p>
                  )}
                </div>
              </>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Loading...' : (isResetMode ? 'Send Reset Email' : (isSignUp ? 'Sign Up' : 'Sign In'))}
            </Button>
          </form>

          {!isResetMode && !isSignUp && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsResetMode(true)}
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot your password?
              </button>
            </div>
          )}


          <div className="text-center">
            {isResetMode ? (
              <button
                type="button"
                onClick={() => {
                  setIsResetMode(false);
                  setError(null);
                  setMessage(null);
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                Back to sign in
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-blue-600 hover:underline"
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"}
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

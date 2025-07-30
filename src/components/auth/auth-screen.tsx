import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { LogIn, Mail, AlertCircle, User, Eye, EyeOff, Shield } from 'lucide-react';
import teamTenaciousLogo from "/lovable-uploads/3ce7a3f1-dd01-4603-9a0f-e8c0f9a0f114.png";
import { validatePasswordStrength, validateEmail, validatePhoneNumber, sanitizeText, RateLimiter } from '@/utils/security';
interface AuthScreenProps {
  initialMode?: 'signin' | 'signup';
}
export function AuthScreen({
  initialMode
}: AuthScreenProps) {
  console.log('AuthScreen component loaded successfully');
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [trainers, setTrainers] = useState<{
    id: string;
    full_name: string;
    assigned_reps: number;
  }[]>([]);

  // Determine initial mode based on URL or prop
  const getInitialMode = () => {
    if (initialMode) return initialMode === 'signup';
    return location.pathname === '/signup';
  };
  const [isSignUp, setIsSignUp] = useState(getInitialMode);
  const [isResetMode, setIsResetMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ isValid: false, score: 0, feedback: [] });
  
  // Rate limiter for authentication attempts
  const rateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes

  // Load available trainers when switching to signup mode
  useEffect(() => {
    if (isSignUp) {
      loadTrainers();
    }
  }, [isSignUp]);
  const loadTrainers = async () => {
    try {
      const {
        data,
        error
      } = await supabase.rpc('get_available_trainers');
      if (error) {
        console.error('Error loading trainers:', error);
      } else {
        setTrainers(data || []);
      }
    } catch (err) {
      console.error('Error in loadTrainers:', err);
    }
  };
  const handleModeToggle = (newIsSignUp: boolean) => {
    setIsSignUp(newIsSignUp);
    setError(null);
    setMessage(null);

    // Update URL to match the mode
    if (newIsSignUp) {
      navigate('/signup', {
        replace: true
      });
    } else {
      navigate('/', {
        replace: true
      });
    }
  };
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    
    // Rate limiting check
    const userKey = `auth_${email}`;
    if (!rateLimiter.isAllowed(userKey)) {
      setError(`Too many attempts. Please wait ${Math.ceil(rateLimiter.getRemainingAttempts(userKey))} minutes.`);
      setLoading(false);
      return;
    }
    
    // Input validation
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }
    
    // Sanitize inputs
    const sanitizedEmail = sanitizeText(email.toLowerCase().trim());
    const sanitizedFullName = sanitizeText(fullName.trim());
    
    try {
      if (isResetMode) {
        const redirectUrl = `${window.location.origin}/reset-password`;
        const {
          error
        } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl
        });
        if (error) {
          setError(error.message);
        } else {
          setMessage('Check your email for the password reset link!');
          setEmail('');
        }
      } else if (isSignUp) {
        if (!sanitizedFullName) {
          setError('Full name is required');
          setLoading(false);
          return;
        }
        
        if (!phone.trim()) {
          setError('Phone number is required');
          setLoading(false);
          return;
        }

        // Enhanced phone validation
        const phoneValidation = validatePhoneNumber(phone);
        if (!phoneValidation.isValid) {
          setError('Please enter a valid phone number (10 digits)');
          setLoading(false);
          return;
        }
        
        // Password strength validation
        const strength = validatePasswordStrength(password);
        if (!strength.isValid) {
          setError(`Password requirements: ${strength.feedback.join(', ')}`);
          setLoading(false);
          return;
        }
        
        if (!selectedTrainer) {
          setError('Please select a trainer');
          setLoading(false);
          return;
        }
        const redirectUrl = `${window.location.origin}/`;
        const {
          data,
          error
        } = await supabase.auth.signUp({
          email: sanitizedEmail,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: sanitizedFullName,
              phone: phoneValidation.formatted,
              birthday: birthday,
              trainer_id: selectedTrainer,
              role: 'REP'
            }
          }
        });
        if (error) {
          setError(error.message);
        } else {
          // Rep record will be created automatically by database trigger
          // Just handle EZ Text integration for self-signups
          if (data.user) {
            try {
              // Create contact in EZ Text
              const { error: ezTextError } = await supabase.functions.invoke('eztext-integration', {
                body: {
                  name: sanitizedFullName,
                  phone: phoneValidation.formatted,
                  email: sanitizedEmail
                }
              });
              if (ezTextError) {
                console.error('Error creating EZ Text contact:', ezTextError);
              }
            } catch (ezTextErr) {
              console.error('Error in EZ Text integration:', ezTextErr);
            }
          }
          setMessage('Check your email for the confirmation link!');
        }
      } else {
        const {
          error
        } = await supabase.auth.signInWithPassword({
          email: sanitizedEmail,
          password
        });
        if (error) {
          rateLimiter.recordAttempt(userKey);
          setError(error.message);
        }
      }
    } catch (err) {
      rateLimiter.recordAttempt(userKey);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle password input change with strength validation
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (isSignUp) {
      const strength = validatePasswordStrength(value);
      setPasswordStrength(strength);
    }
  };
  return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center">
            <img src={teamTenaciousLogo} alt="Team Tenacious 2.0 Logo" className="w-full h-full object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Team Tenacious 2.0
          </CardTitle>
          <p className="text-gray-600">
            {isResetMode ? 'Reset your password' : isSignUp ? 'Create your account' : 'Sign in to your account'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>}

          {message && <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Enter your email" />
            </div>

            {!isResetMode && <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={e => handlePasswordChange(e.target.value)} 
                    required 
                    placeholder="Enter your password" 
                    minLength={8}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                
                {/* Password strength indicator for signup */}
                {isSignUp && password && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span className="text-sm font-medium">Password Strength</span>
                    </div>
                    <Progress value={(passwordStrength.score / 5) * 100} className="h-2" />
                    <div className="text-xs space-y-1">
                      {passwordStrength.feedback.map((feedback, index) => (
                        <div key={index} className="text-red-600">• {feedback}</div>
                      ))}
                      {passwordStrength.isValid && (
                        <div className="text-green-600 font-medium">✓ Password meets security requirements</div>
                      )}
                    </div>
                  </div>
                )}
              </div>}

            {isSignUp && !isResetMode && <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Enter your full name" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="555-123-4567" />
                  <p className="text-xs text-gray-500">Format: 555-123-4567</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthday">Birthday (Optional)</Label>
                  <Input id="birthday" type="date" value={birthday} onChange={e => setBirthday(e.target.value)} placeholder="mm/dd/yyyy" />
                  <p className="text-xs text-gray-500">Format: MM/DD/YYYY</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trainer">Assigned Trainer</Label>
                  <Select value={selectedTrainer} onValueChange={setSelectedTrainer} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your trainer" />
                    </SelectTrigger>
                    <SelectContent>
                      {trainers.map(trainer => <SelectItem key={trainer.id} value={trainer.id}>
                          {trainer.full_name} ({trainer.assigned_reps} reps)
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                  {trainers.length === 0 && <p className="text-sm text-gray-500">Loading trainers...</p>}
                </div>
              </>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : isResetMode ? 'Send Reset Email' : isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>

          {!isResetMode && !isSignUp && <div className="text-center">
              <button type="button" onClick={() => setIsResetMode(true)} className="text-sm text-blue-600 hover:underline">
                Forgot your password?
              </button>
            </div>}

          <div className="text-center">
            {isResetMode ? <button type="button" onClick={() => {
            setIsResetMode(false);
            setError(null);
            setMessage(null);
          }} className="text-sm text-blue-600 hover:underline">
                Back to sign in
              </button> : <button type="button" onClick={() => handleModeToggle(!isSignUp)} className="text-sm text-blue-600 hover:underline">
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>}
          </div>
        </CardContent>
      </Card>
    </div>;
}
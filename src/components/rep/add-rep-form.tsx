
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, User, Mail, Phone, AlertCircle, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Rep } from "@/types";
import { checklistTemplate } from "@/data/mockData";

interface AddRepFormProps {
  onBack: () => void;
  onAddRep: (rep: Rep) => void;
  trainerId: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  trainerId: string;
}

export function AddRepForm({ onBack, onAddRep, trainerId }: AddRepFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trainers, setTrainers] = useState<{id: string, full_name: string, assigned_reps: number}[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadTrainers();
  }, []);

  const loadTrainers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_available_trainers');
      if (error) {
        console.error('Error loading trainers:', error);
      } else {
        setTrainers(data || []);
      }
    } catch (err) {
      console.error('Error in loadTrainers:', err);
    }
  };

  const form = useForm<FormData>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      trainerId: trainerId || ''
    }
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Create user account first
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        user_metadata: {
          full_name: data.name
        },
        email_confirm: true // Auto-confirm email for admin-created users
      });

      if (authError) {
        setError('Failed to create user account: ' + authError.message);
        return;
      }

      if (!authData.user) {
        setError('Failed to create user account');
        return;
      }

      // Create rep record
      const { error: repError } = await supabase
        .from('reps')
        .insert({
          user_id: authData.user.id,
          trainer_id: data.trainerId,
          full_name: data.name,
          email: data.email,
          phone: data.phone || null,
        });

      if (repError) {
        setError('Failed to create rep record: ' + repError.message);
        return;
      }

      // Initialize milestones for the new rep
      const milestones = Array.from({ length: 10 }, (_, index) => ({
        rep_id: authData.user.id,
        step_number: index + 1,
        completed: false
      }));

      const { error: milestoneError } = await supabase
        .from('milestones')
        .insert(milestones);

      if (milestoneError) {
        console.error('Error creating milestones:', milestoneError);
        // Don't fail the whole process for milestone creation
      }

      setSuccess(`Rep ${data.name} created successfully! They can now log in with their email and password.`);
      
      // Create mock rep object for UI update
      const newRep: Rep = {
        id: authData.user.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        trainerId: data.trainerId,
        milestone: 1,
        status: 'Active',
        overallProgress: 0,
        dateAdded: new Date().toISOString().split('T')[0],
        lastActivity: new Date().toISOString(),
        checklist: checklistTemplate.map((template, index) => ({
          ...template,
          id: `checklist-${Date.now()}-${index + 1}`,
          isCompleted: false,
          subtasks: template.subtasks.map(subtask => ({
            ...subtask,
            isCompleted: false
          }))
        }))
      };

      onAddRep(newRep);

      // Auto-navigate back after success
      setTimeout(() => {
        onBack();
      }, 2000);

    } catch (err: any) {
      setError('An unexpected error occurred: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center p-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="mr-3">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-bold text-lg">Add New Rep</h1>
            <p className="text-sm text-gray-600">Enter rep details to get started</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Rep Information
            </CardTitle>
          </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  rules={{ required: "Name is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Full Name
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter full name" 
                          {...field}
                          className="h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  rules={{ 
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="Enter email address" 
                          {...field}
                          className="h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        Phone Number (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="tel"
                          placeholder="Enter phone number" 
                          {...field}
                          className="h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  rules={{ 
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters"
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password"
                          placeholder="Enter initial password" 
                          {...field}
                          className="h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trainerId"
                  rules={{ required: "Please select a trainer" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned Trainer</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select trainer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {trainers.map((trainer) => (
                            <SelectItem key={trainer.id} value={trainer.id}>
                              {trainer.full_name} ({trainer.assigned_reps} reps)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Adding Rep...' : 'Add Rep'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="mt-4 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Rep will be assigned to your training pipeline</li>
              <li>• They'll start at Milestone 1 of the 10-milestone checklist</li>
              <li>• You can track their progress in your dashboard</li>
              <li>• System will flag if they get stuck (no progress in 48hrs)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

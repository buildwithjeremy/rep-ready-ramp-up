
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
  birthday?: string;
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
      birthday: '',
      password: '',
      trainerId: trainerId || ''
    }
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      console.log('Creating rep with email:', data.email);

      // Call the secure edge function to create the rep
      const { data: result, error: createError } = await supabase.functions.invoke('create-rep', {
        body: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          birthday: data.birthday || null,
          password: data.password,
          trainerId: data.trainerId,
        },
      });

      if (createError) {
        console.error('Error from edge function:', createError);
        throw new Error(createError.message || 'Failed to create rep');
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to create rep');
      }

      console.log('Rep created successfully:', result.rep);

      setSuccess('Rep added successfully! They will be notified via email.');
      
      // Call the callback to update the UI
      onAddRep({
        id: result.rep.id,
        name: result.rep.full_name,
        email: result.rep.email,
        phone: result.rep.phone,
        trainerId: result.rep.trainer_id,
        milestone: result.rep.milestone,
        status: result.rep.status,
        overallProgress: result.rep.overall_progress,
        dateAdded: result.rep.join_date.split('T')[0],
        lastActivity: result.rep.last_activity,
        checklist: checklistTemplate.map((template, index) => ({
          ...template,
          id: `checklist-${Date.now()}-${index + 1}`,
          isCompleted: false,
          subtasks: template.subtasks.map(subtask => ({
            ...subtask,
            isCompleted: false
          }))
        }))
      });

      // Navigate back after a delay
      setTimeout(() => {
        onBack();
      }, 2000);

    } catch (err: any) {
      console.error('Form submission error:', err);
      setError(err.message || 'Failed to add rep. Please try again.');
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
                  rules={{ 
                    required: "Phone number is required",
                    pattern: {
                      value: /^[\+]?[1]?[\s]?[\(]?[0-9]{3}[\)]?[\s\-]?[0-9]{3}[\s\-]?[0-9]{4}$/,
                      message: "Please enter a valid phone number"
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        Phone Number *
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="tel"
                          placeholder="(555) 123-4567" 
                          {...field}
                          className="h-12"
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500">Format: (555) 123-4567 or 555-123-4567</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birthday"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birthday (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="date"
                          {...field}
                          className="h-12"
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500">Format: MM/DD/YYYY</p>
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

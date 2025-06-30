
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, User, Mail, Phone } from "lucide-react";
import { useForm } from "react-hook-form";
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
}

export function AddRepForm({ onBack, onAddRep, trainerId }: AddRepFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    defaultValues: {
      name: '',
      email: '',
      phone: ''
    }
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create new rep with fresh checklist
    const newRep: Rep = {
      id: `rep-${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      trainerId,
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
    setIsSubmitting(false);
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
                      value: /^[\d\s\-\(\)\+]+$/,
                      message: "Invalid phone number"
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        Phone Number
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

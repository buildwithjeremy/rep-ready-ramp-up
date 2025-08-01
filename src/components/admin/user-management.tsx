import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Users, Shield, TrendingUp, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RepMigration } from './rep-migration';
import { RepAssignmentSection } from './rep-assignment-section';
import { Rep } from '@/types';
import { formatDisplayDate } from '@/lib/utils';

interface UserProfile {
  id: string;
  full_name: string | null;
  role: 'ADMIN' | 'TRAINER' | 'REP';
  created_at: string;
  rep_progress?: number;
  rep_status?: string;
  is_legacy?: boolean;
  email?: string;
}

interface UserManagementProps {
  onBack: () => void;
}

export function UserManagement({ onBack }: UserManagementProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reps, setReps] = useState<Rep[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
    loadRepsAndTrainers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          role,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (profilesError) {
        setError('Failed to load users: ' + profilesError.message);
        return;
      }

      // Also get reps that don't have user accounts yet (legacy data)
      const { data: repsData, error: repsError } = await supabase
        .from('reps')
        .select('id, full_name, email, overall_progress, status, created_at, user_id')
        .is('user_id', null)
        .order('created_at', { ascending: false });

      if (repsError) {
        console.error('Error loading legacy reps:', repsError);
      }

      // Get rep progress for REP users with accounts
      const profilesWithProgress = await Promise.all(
        (profilesData || []).map(async (profile) => {
          if (profile.role === 'REP') {
            const { data: repData } = await supabase
              .from('reps')
              .select('overall_progress, status')
              .eq('user_id', profile.id)
              .maybeSingle();
            
            return {
              ...profile,
              rep_progress: repData?.overall_progress || 0,
              rep_status: repData?.status || 'Active'
            };
          }
          return profile;
        })
      );

      // Combine profiles with legacy reps (those without user accounts)
      const legacyReps = (repsData || []).map(rep => ({
        id: rep.id,
        full_name: rep.full_name,
        role: 'REP' as const,
        created_at: rep.created_at,
        rep_progress: rep.overall_progress || 0,
        rep_status: rep.status || 'Active',
        is_legacy: true,
        email: rep.email
      }));

      const allUsers = [...profilesWithProgress, ...legacyReps];
      setUsers(allUsers);
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadRepsAndTrainers = async () => {
    try {
      // Load reps data
      const { data: repsData, error: repsError } = await supabase
        .from('reps')
        .select(`
          id,
          full_name,
          email,
          trainer_id,
          status,
          overall_progress,
          milestone
        `)
        .order('full_name');

      if (repsError) {
        console.error('Error loading reps:', repsError);
      } else {
        // Transform to match Rep interface
        const transformedReps: Rep[] = (repsData || []).map(rep => ({
          id: rep.id,
          name: rep.full_name,
          email: rep.email,
          phone: '', // Not available in this query
          trainerId: rep.trainer_id,
          milestone: rep.milestone,
          status: rep.status as 'Active' | 'Independent' | 'Stuck' | 'Inactive',
          overallProgress: rep.overall_progress,
          dateAdded: '', // Not available in this query
          lastActivity: '', // Not available in this query
          checklist: [] // Not needed for assignment view
        }));
        setReps(transformedReps);
      }

      // Load trainers data
      const { data: trainersData, error: trainersError } = await supabase
        .from('trainers')
        .select(`
          user_id,
          full_name,
          assigned_reps
        `)
        .order('full_name');

      if (trainersError) {
        console.error('Error loading trainers:', trainersError);
      } else {
        setTrainers(trainersData || []);
      }
    } catch (err) {
      console.error('Error loading reps and trainers:', err);
    }
  };

  const promoteUser = async (userId: string, newRole: 'ADMIN' | 'TRAINER' | 'REP') => {
    try {
      setError(null);
      setSuccess(null);

      const { data, error } = await supabase.rpc('promote_user_role', {
        target_user_id: userId,
        new_role: newRole,
        promoted_by_user_id: user?.id
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(`User role updated successfully!`);
        loadUsers(); // Refresh the list
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update user role');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!user) return;

    try {
      setDeleting(userId);
      setError(null);
      setSuccess(null);
      
      // Call the Edge Function to delete user completely (including from auth)
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { target_user_id: userId }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success('User deleted completely from both database and authentication');
      await loadUsers(); // Refresh the list
    } catch (err: any) {
      toast.error(`Failed to delete user: ${err.message}`);
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'destructive';
      case 'TRAINER': return 'default';
      case 'REP': return 'secondary';
      default: return 'outline';
    }
  };

  const getProgressBadge = (progress: number, status: string) => {
    if (status === 'Independent') {
      return <Badge variant="default" className="bg-green-100 text-green-800">Independent</Badge>;
    }
    if (progress === 100) {
      return <Badge variant="default" className="bg-blue-100 text-blue-800">Complete</Badge>;
    }
    if (progress >= 70) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700">In Progress</Badge>;
    }
    if (status === 'Stuck') {
      return <Badge variant="destructive">Stuck</Badge>;
    }
    return <Badge variant="secondary">Getting Started</Badge>;
  };

  const canPromoteToTrainer = (user: UserProfile) => {
    return user.role === 'REP' && user.rep_status === 'Independent' && user.rep_progress === 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center p-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="mr-3">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-bold text-lg">User Management</h1>
            <p className="text-sm text-gray-600">Manage user roles and permissions</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="assignment">Rep Assignment</TabsTrigger>
            <TabsTrigger value="migration">Rep Migration</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="space-y-4">
            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center mb-2">
                    <Shield className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-2xl font-bold">{users.filter(u => u.role === 'ADMIN').length}</span>
                  </div>
                  <p className="text-sm text-gray-600">Admins</p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-2xl font-bold">{users.filter(u => u.role === 'TRAINER').length}</span>
                  </div>
                  <p className="text-sm text-gray-600">Trainers</p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-2xl font-bold">{users.filter(u => u.role === 'REP').length}</span>
                  </div>
                  <p className="text-sm text-gray-600">Reps</p>
                </CardContent>
              </Card>
            </div>

        {/* User List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              All Users ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {users.map((userProfile) => (
              <div key={userProfile.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {userProfile.full_name || 'Unnamed User'}
                      {userProfile.is_legacy && (
                        <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                          Legacy Rep
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {userProfile.email || userProfile.id}
                    </p>
                    <p className="text-xs text-gray-500">
                      Joined: {formatDisplayDate(userProfile.created_at)}
                    </p>
                    {userProfile.is_legacy && (
                      <p className="text-xs text-orange-600 mt-1">
                        No user account - needs migration
                      </p>
                    )}
                  </div>
                   <div className="flex items-center space-x-2">
                     <Badge variant={getRoleBadgeVariant(userProfile.role)}>
                       {userProfile.role}
                     </Badge>
                     {userProfile.role === 'REP' && userProfile.rep_progress !== undefined && (
                       getProgressBadge(userProfile.rep_progress, userProfile.rep_status || 'Active')
                     )}
                     
                     {/* Delete User Button - Only show for non-current users */}
                     {userProfile.id !== user?.id && (
                       <AlertDialog>
                         <AlertDialogTrigger asChild>
                           <Button
                             variant="outline"
                             size="sm"
                             className="text-destructive hover:text-destructive border-destructive hover:bg-destructive/10"
                             disabled={deleting === userProfile.id}
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         </AlertDialogTrigger>
                         <AlertDialogContent>
                           <AlertDialogHeader>
                             <AlertDialogTitle>Delete User</AlertDialogTitle>
                             <AlertDialogDescription>
                               Are you sure you want to delete "{userProfile.full_name || 'this user'}"? 
                               This will permanently remove:
                               <ul className="list-disc list-inside mt-2 space-y-1">
                                 <li>User account and profile</li>
                                 <li>All rep records and progress</li>
                                 <li>All milestones and subtasks</li>
                                 <li>All associated timestamps and notes</li>
                               </ul>
                               <strong className="text-destructive">This action cannot be undone.</strong>
                             </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter>
                             <AlertDialogCancel>Cancel</AlertDialogCancel>
                             <AlertDialogAction
                               onClick={() => deleteUser(userProfile.id)}
                               className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                             >
                               {deleting === userProfile.id ? 'Deleting...' : 'Delete Permanently'}
                             </AlertDialogAction>
                           </AlertDialogFooter>
                         </AlertDialogContent>
                       </AlertDialog>
                     )}
                   </div>
                </div>

                {userProfile.role === 'REP' && (
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-gray-600">{userProfile.rep_progress}% complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${userProfile.rep_progress}%` }}
                      ></div>
                    </div>
                    {canPromoteToTrainer(userProfile) && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                        ✅ This rep is eligible for promotion to Trainer!
                      </div>
                    )}
                  </div>
                )}

                {/* Role Management */}
                {userProfile.id !== user?.id && !userProfile.is_legacy && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Promote to:</span>
                    <Select
                      value={userProfile.role}
                      onValueChange={(newRole: 'ADMIN' | 'TRAINER' | 'REP') => 
                        promoteUser(userProfile.id, newRole)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="REP">REP</SelectItem>
                        <SelectItem 
                          value="TRAINER" 
                          disabled={userProfile.role === 'REP' && !canPromoteToTrainer(userProfile)}
                        >
                          TRAINER
                        </SelectItem>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {userProfile.is_legacy && (
                  <div className="bg-orange-50 border border-orange-200 p-3 rounded text-sm">
                    <p className="text-orange-800 font-medium">Migration Needed</p>
                    <p className="text-orange-700 text-xs mt-1">
                      This rep doesn't have a user account yet. They'll need to sign up through the normal flow to access the app.
                    </p>
                  </div>
                )}

                {userProfile.id === user?.id && (
                  <p className="text-xs text-gray-500 italic">You cannot change your own role</p>
                )}
              </div>
            ))}

            {users.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No users found</p>
              </div>
            )}
          </CardContent>
        </Card>

            {/* Business Rules Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h3 className="font-medium text-blue-900 mb-2">Business Rules</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Only Admins can promote users</li>
                  <li>• Reps must reach Independent status (100% complete) before becoming Trainers</li>
                  <li>• New signups default to REP role and are assigned to available trainers</li>
                  <li>• All role changes are logged for security auditing</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="assignment" className="space-y-4">
            <RepAssignmentSection 
              reps={reps} 
              trainers={trainers} 
              onRepReassigned={() => {
                loadRepsAndTrainers();
                loadUsers(); // Refresh user list as well since trainer stats may have changed
              }} 
            />
          </TabsContent>
          
          <TabsContent value="migration" className="space-y-4">
            <RepMigration />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
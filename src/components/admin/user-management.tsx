import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Users, Shield, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserProfile {
  id: string;
  full_name: string | null;
  role: 'ADMIN' | 'TRAINER' | 'REP';
  created_at: string;
  rep_progress?: number;
  rep_status?: string;
}

interface UserManagementProps {
  onBack: () => void;
}

export function UserManagement({ onBack }: UserManagementProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          role,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        setError('Failed to load users: ' + error.message);
      } else {
        // Get rep progress for REP users
        const usersWithProgress = await Promise.all(
          (data || []).map(async (profile) => {
            if (profile.role === 'REP') {
              const { data: repData } = await supabase
                .from('reps')
                .select('overall_progress, status')
                .eq('user_id', profile.id)
                .single();
              
              return {
                ...profile,
                rep_progress: repData?.overall_progress || 0,
                rep_status: repData?.status || 'Active'
              };
            }
            return profile;
          })
        );
        setUsers(usersWithProgress);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
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
                    </h3>
                    <p className="text-sm text-gray-600">{userProfile.id}</p>
                    <p className="text-xs text-gray-500">
                      Joined: {new Date(userProfile.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getRoleBadgeVariant(userProfile.role)}>
                      {userProfile.role}
                    </Badge>
                    {userProfile.role === 'REP' && userProfile.rep_progress !== undefined && (
                      getProgressBadge(userProfile.rep_progress, userProfile.rep_status || 'Active')
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
                {userProfile.id !== user?.id && (
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
      </div>
    </div>
  );
}
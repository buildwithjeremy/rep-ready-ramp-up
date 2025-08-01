import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChecklistCard } from "./checklist-card";
import { Rep } from "@/types";
import { ArrowLeft, Mail, Phone, Calendar, User, Users, Edit, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDisplayDate } from "@/lib/utils";

interface RepDashboardProps {
  rep: Rep;
  onUpdateRep: (updatedRep: Rep) => void;
}

export function RepDashboard({ rep, onUpdateRep }: RepDashboardProps) {
  const { toast } = useToast();
  const [expandedMilestones, setExpandedMilestones] = useState<Record<number, boolean>>({});
  const [celebratingMilestones, setCelebratingMilestones] = useState<Record<string, boolean>>({});
  const [showIndependentCelebration, setShowIndependentCelebration] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedRep, setEditedRep] = useState({
    name: rep.name,
    email: rep.email,
    phone: rep.phone || ''
  });

  const toggleMilestone = (milestone: number) => {
    setExpandedMilestones(prev => ({
      ...prev,
      [milestone]: !prev[milestone]
    }));
  };

  const handleSaveProfile = () => {
    // Only allow editing name, email, phone, address - not status/progress/etc
    const updatedRep: Rep = {
      ...rep,
      name: editedRep.name,
      email: editedRep.email,
      phone: editedRep.phone,
      lastActivity: new Date().toISOString()
    };

    onUpdateRep(updatedRep);
    setIsEditing(false);
    toast({
      title: "Profile updated",
      description: "Your profile information has been saved.",
    });
  };

  const handleCancelEdit = () => {
    setEditedRep({
      name: rep.name,
      email: rep.email,
      phone: rep.phone || ''
    });
    setIsEditing(false);
  };

  const handleSubtaskToggle = (checklistItemId: string, subtaskId: string, isCompleted: boolean) => {
    // Note: REPs have view-only access to checklist, so this would be disabled
    // But keeping the structure for consistency
    toast({
      title: "View only",
      description: "Contact your trainer to update checklist items.",
      variant: "destructive"
    });
  };

  const getStatusColor = (status: Rep['status']) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Stuck': return 'bg-red-100 text-red-800';
      case 'Independent': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <Card className="bg-white shadow-sm sticky top-0 z-10 rounded-none border-x-0 border-t-0">
        <CardContent className="p-4">
          <div className="flex items-center mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-lg truncate">Welcome, {rep.name}!</h1>
              <p className="text-sm text-gray-600">Milestone {rep.milestone} of 10</p>
            </div>
          </div>

          {/* Profile Overview */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
              {rep.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rep.status)}`}>
                  {rep.status}
                </span>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm font-medium text-gray-700">{rep.overallProgress}%</span>
            </div>
            <Progress value={rep.overallProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <div className="p-4">
        <Tabs defaultValue="checklist" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="checklist">My Checklist</TabsTrigger>
            <TabsTrigger value="profile">My Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="checklist" className="space-y-3 mt-4">
            {rep.checklist.map((item) => (
              <ChecklistCard
                key={item.id}
                item={item}
                rep={rep}
                isExpanded={expandedMilestones[item.milestone] || false}
                isCelebrating={celebratingMilestones[item.id] || false}
                onToggle={() => toggleMilestone(item.milestone)}
                onSubtaskToggle={(subtaskId, isCompleted) => 
                  handleSubtaskToggle(item.id, subtaskId, isCompleted)
                }
                viewOnly={true}
              />
            ))}
          </TabsContent>

          <TabsContent value="profile" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Profile Information</h3>
                  {!isEditing ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleCancelEdit}
                        className="flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleSaveProfile}
                        className="flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={editedRep.name}
                        onChange={(e) => setEditedRep({...editedRep, name: e.target.value})}
                        className="mt-1"
                      />
                    ) : (
                      <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md">
                        <User className="w-4 h-4 mr-2 text-gray-500" />
                        <span>{rep.name}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={editedRep.email}
                        onChange={(e) => setEditedRep({...editedRep, email: e.target.value})}
                        className="mt-1"
                      />
                    ) : (
                      <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md">
                        <Mail className="w-4 h-4 mr-2 text-gray-500" />
                        <span>{rep.email}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={editedRep.phone}
                        onChange={(e) => setEditedRep({...editedRep, phone: e.target.value})}
                        className="mt-1"
                      />
                    ) : (
                      <div className="flex items-center mt-1 p-2 bg-gray-50 rounded-md">
                        <Phone className="w-4 h-4 mr-2 text-gray-500" />
                        <span>{rep.phone || 'Not provided'}</span>
                      </div>
                    )}
                  </div>


                  {/* Read-only fields */}
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Status Information (Read Only)</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="text-sm">Joined: {formatDisplayDate(rep.dateAdded)}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="text-sm">Last Activity: {formatDisplayDate(rep.lastActivity)}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rep.status)}`}>
                          Status: {rep.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

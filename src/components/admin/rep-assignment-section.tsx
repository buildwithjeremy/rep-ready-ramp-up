import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Search, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRepAssignment } from "@/hooks/useRepAssignment";
import { sortReps, filterReps, type RepSortOption, type RepFilterOption } from "@/utils/filterUtils";
import { Rep } from "@/types";

interface Trainer {
  user_id: string;
  full_name: string;
  assigned_reps: number;
}

interface RepAssignmentSectionProps {
  reps: Rep[];
  trainers: Trainer[];
  onRepReassigned: () => void;
}

export function RepAssignmentSection({ reps, trainers, onRepReassigned }: RepAssignmentSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<RepSortOption>('name');
  const [filterBy, setFilterBy] = useState<RepFilterOption>('all');
  const [selectedReps, setSelectedReps] = useState<string[]>([]);
  const [bulkTrainer, setBulkTrainer] = useState<string>("");
  const [individualAssignments, setIndividualAssignments] = useState<Record<string, string>>({});
  
  const { reassignRep, bulkReassignReps, loading } = useRepAssignment();
  const { toast } = useToast();

  // Create trainer lookup for easy access
  const trainerLookup = trainers.reduce((acc, trainer) => {
    acc[trainer.user_id] = trainer;
    return acc;
  }, {} as Record<string, Trainer>);

  // Filter and sort reps
  const filteredReps = filterReps(reps, filterBy).filter(rep =>
    rep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rep.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainerLookup[rep.trainerId]?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const sortedReps = sortReps(filteredReps, sortBy);

  const handleIndividualReassign = async (repId: string, newTrainerId: string) => {
    const result = await reassignRep(repId, newTrainerId);
    
    if (result.success) {
      toast({
        title: "Rep Reassigned",
        description: "The rep has been successfully reassigned to the new trainer.",
      });
      onRepReassigned();
      // Clear the individual assignment
      setIndividualAssignments(prev => {
        const { [repId]: _, ...rest } = prev;
        return rest;
      });
    } else {
      toast({
        title: "Assignment Failed",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleBulkReassign = async () => {
    if (selectedReps.length === 0 || !bulkTrainer) {
      toast({
        title: "Invalid Selection",
        description: "Please select reps and a trainer for bulk assignment.",
        variant: "destructive",
      });
      return;
    }

    const result = await bulkReassignReps(selectedReps, bulkTrainer);
    
    if (result.success) {
      toast({
        title: "Bulk Assignment Complete",
        description: `Successfully reassigned ${result.reassignedCount} reps.`,
      });
      onRepReassigned();
      setSelectedReps([]);
      setBulkTrainer("");
    } else {
      toast({
        title: "Bulk Assignment Failed",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const toggleRepSelection = (repId: string) => {
    setSelectedReps(prev => 
      prev.includes(repId) 
        ? prev.filter(id => id !== repId)
        : [...prev, repId]
    );
  };

  const selectAllReps = () => {
    setSelectedReps(sortedReps.map(rep => rep.id));
  };

  const clearSelection = () => {
    setSelectedReps([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Rep Assignment Management
          </h3>
          <p className="text-sm text-muted-foreground">
            Assign and reassign reps to different trainers
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reps, emails, or trainers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={filterBy} onValueChange={(value: RepFilterOption) => setFilterBy(value)}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reps</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="stuck">Stuck</SelectItem>
            <SelectItem value="independent">Independent</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(value: RepSortOption) => setSortBy(value)}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="milestone">Milestone</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="progress">Progress</SelectItem>
            <SelectItem value="lastActivity">Last Activity</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedReps.length > 0 && (
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{selectedReps.length} selected</Badge>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Clear Selection
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <Select value={bulkTrainer} onValueChange={setBulkTrainer}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select trainer..." />
                </SelectTrigger>
                <SelectContent>
                  {trainers.map((trainer) => (
                    <SelectItem key={trainer.user_id} value={trainer.user_id}>
                      {trainer.full_name} ({trainer.assigned_reps} reps)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    disabled={!bulkTrainer || loading}
                    className="w-full sm:w-auto"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Bulk Reassign
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Bulk Reassignment</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to reassign {selectedReps.length} reps to{" "}
                      {trainerLookup[bulkTrainer]?.full_name}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkReassign}>
                      Confirm Reassignment
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      )}

      {/* Selection Actions */}
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={selectAllReps}
          disabled={sortedReps.length === 0}
        >
          Select All ({sortedReps.length})
        </Button>
        {selectedReps.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearSelection}>
            Clear Selection
          </Button>
        )}
      </div>

      {/* Reps Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Select</TableHead>
              <TableHead>Rep Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Current Trainer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Reassign To</TableHead>
              <TableHead className="w-24">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedReps.map((rep) => (
              <TableRow key={rep.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedReps.includes(rep.id)}
                    onCheckedChange={() => toggleRepSelection(rep.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">{rep.name}</TableCell>
                <TableCell className="text-muted-foreground">{rep.email}</TableCell>
                <TableCell>{trainerLookup[rep.trainerId]?.full_name || 'Unknown'}</TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      rep.status === 'Independent' ? 'default' :
                      rep.status === 'Active' ? 'secondary' :
                      rep.status === 'Stuck' ? 'destructive' : 'outline'
                    }
                  >
                    {rep.status}
                  </Badge>
                </TableCell>
                <TableCell>{rep.overallProgress}%</TableCell>
                <TableCell>
                  <Select
                    value={individualAssignments[rep.id] || ""}
                    onValueChange={(value) => 
                      setIndividualAssignments(prev => ({ ...prev, [rep.id]: value }))
                    }
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Select trainer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {trainers
                        .filter(trainer => trainer.user_id !== rep.trainerId)
                        .map((trainer) => (
                          <SelectItem key={trainer.user_id} value={trainer.user_id}>
                            {trainer.full_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        disabled={!individualAssignments[rep.id] || loading}
                      >
                        Assign
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Reassignment</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to reassign {rep.name} from{" "}
                          {trainerLookup[rep.trainerId]?.full_name} to{" "}
                          {trainerLookup[individualAssignments[rep.id]]?.full_name}?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleIndividualReassign(rep.id, individualAssignments[rep.id])}
                        >
                          Confirm Reassignment
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {sortedReps.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No reps found matching your filters.
          </div>
        )}
      </div>
    </div>
  );
}
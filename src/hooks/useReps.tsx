import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Rep } from '@/types';
import { useAuth } from './useAuth';

export function useReps() {
  const [reps, setReps] = useState<Rep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchReps = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Fetching reps for user:', user.id);

      // Get the current user's role to determine what data to fetch
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        setError(profileError.message);
        return;
      }

      let repsQuery = supabase.from('reps').select(`
        *,
        milestones (
          id,
          step_number,
          completed,
          completed_at,
          template_id,
          checklist_templates (
            milestone,
            title,
            description
          ),
          milestone_subtasks (
            id,
            completed,
            completed_at,
            notes,
            checklist_template_subtasks (
              id,
              title,
              order_index
            )
          )
        )
      `);

      // If user is a REP, only fetch their own data
      if (profileData.role === 'REP') {
        repsQuery = repsQuery.eq('user_id', user.id);
      } else {
        // For trainers and admins, fetch based on their assigned reps
        repsQuery = repsQuery.order('created_at', { ascending: false });
      }

      const { data: repsData, error: repsError } = await repsQuery;

      if (repsError) {
        console.error('Error fetching reps:', repsError);
        setError(repsError.message);
        return;
      }

      // Transform the data to match our frontend interface
      const transformedReps: Rep[] = repsData?.map(rep => ({
        id: rep.id,
        userId: rep.user_id, // Add this field to track the linked user
        name: rep.full_name,
        email: rep.email,
        phone: rep.phone || '',
        trainerId: rep.trainer_id,
        milestone: rep.milestone,
        status: rep.status as Rep['status'],
        overallProgress: rep.overall_progress,
        dateAdded: rep.join_date,
        lastActivity: rep.last_activity,
        checklist: rep.milestones
          ?.sort((a, b) => a.step_number - b.step_number)
          .map(milestone => ({
            id: milestone.template_id,
            milestone: milestone.step_number,
            title: milestone.checklist_templates?.title || '',
            description: milestone.checklist_templates?.description || '',
            isCompleted: milestone.completed,
            completedDate: milestone.completed_at,
            subtasks: milestone.milestone_subtasks
              ?.sort((a, b) => a.checklist_template_subtasks.order_index - b.checklist_template_subtasks.order_index)
              .map(subtask => ({
                id: subtask.id,
                title: subtask.checklist_template_subtasks.title,
                isCompleted: subtask.completed,
                completedDate: subtask.completed_at,
                notes: subtask.notes
              })) || []
          })) || []
      })) || [];

      console.log('Raw reps data from Supabase:', repsData);
      console.log('Transformed reps with checklists:', transformedReps);
      console.log('First rep checklist length:', transformedReps[0]?.checklist?.length);
      setReps(transformedReps);
      setError(null);
    } catch (err) {
      console.error('Error in fetchReps:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addRep = async (repData: Omit<Rep, 'id' | 'checklist' | 'overallProgress' | 'lastActivity'>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('Adding new rep:', repData);

      // Insert the new rep
      const { data: newRep, error: repError } = await supabase
        .from('reps')
        .insert({
          trainer_id: user.id,
          full_name: repData.name,
          email: repData.email,
          phone: repData.phone,
          milestone: 1,
          status: 'Active',
          overall_progress: 0
        })
        .select()
        .single();

      if (repError) {
        console.error('Error inserting rep:', repError);
        throw repError;
      }

      console.log('Rep inserted successfully:', newRep);

      // EZ Text integration is now handled by the create-rep edge function
      console.log('EZ Text integration will be handled by backend');

      // Get checklist templates
      const { data: templates, error: templatesError } = await supabase
        .from('checklist_templates')
        .select('*')
        .order('milestone');

      if (templatesError) {
        console.error('Error fetching templates:', templatesError);
        throw templatesError;
      }

      // Create milestones for the new rep
      const milestoneInserts = templates.map(template => ({
        rep_id: newRep.id,
        step_number: template.milestone,
        template_id: template.id,
        completed: false
      }));

      const { data: milestones, error: milestonesError } = await supabase
        .from('milestones')
        .insert(milestoneInserts)
        .select();

      if (milestonesError) {
        console.error('Error inserting milestones:', milestonesError);
        throw milestonesError;
      }

      // Create subtasks for each milestone
      for (const milestone of milestones) {
        const { data: templateSubtasks, error: subtasksError } = await supabase
          .from('checklist_template_subtasks')
          .select('*')
          .eq('template_id', milestone.template_id)
          .order('order_index');

        if (subtasksError) {
          console.error('Error fetching template subtasks:', subtasksError);
          throw subtasksError;
        }

        const subtaskInserts = templateSubtasks.map(subtask => ({
          milestone_id: milestone.id,
          template_subtask_id: subtask.id,
          completed: false
        }));

        const { error: insertSubtasksError } = await supabase
          .from('milestone_subtasks')
          .insert(subtaskInserts);

        if (insertSubtasksError) {
          console.error('Error inserting milestone subtasks:', insertSubtasksError);
          throw insertSubtasksError;
        }
      }

      // Refresh the reps list
      await fetchReps();

      console.log('Rep added successfully with checklist');
      return newRep;
    } catch (error) {
      console.error('Error adding rep:', error);
      throw error;
    }
  };

  const updateRep = async (updatedRep: Rep) => {
    try {
      console.log('Updating rep:', updatedRep);

      // Optimistically update the local state first for immediate UI feedback
      setReps(prevReps => 
        prevReps.map(rep => 
          rep.id === updatedRep.id ? updatedRep : rep
        )
      );

      // Update the rep basic info
      const { error: repError } = await supabase
        .from('reps')
        .update({
          full_name: updatedRep.name,
          email: updatedRep.email,
          phone: updatedRep.phone,
          milestone: updatedRep.milestone,
          status: updatedRep.status,
          overall_progress: updatedRep.overallProgress,
          last_activity: new Date().toISOString()
        })
        .eq('id', updatedRep.id);

      if (repError) {
        console.error('Error updating rep:', repError);
        // Revert optimistic update on error
        await fetchReps();
        throw repError;
      }

      // Update subtasks
      for (const checklistItem of updatedRep.checklist) {
        for (const subtask of checklistItem.subtasks) {
          const { error: subtaskError } = await supabase
            .from('milestone_subtasks')
            .update({
              completed: subtask.isCompleted,
              completed_at: subtask.isCompleted ? (subtask.completedDate || new Date().toISOString()) : null,
              completed_by: subtask.isCompleted ? user?.id : null,
              notes: subtask.notes
            })
            .eq('id', subtask.id);

          if (subtaskError) {
            console.error('Error updating subtask:', subtaskError);
            // Revert optimistic update on error
            await fetchReps();
            throw subtaskError;
          }
        }
      }

      console.log('Rep updated successfully');
    } catch (error) {
      console.error('Error updating rep:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchReps();
  }, [user]);

  return {
    reps,
    loading,
    error,
    fetchReps,
    addRep,
    updateRep
  };
}
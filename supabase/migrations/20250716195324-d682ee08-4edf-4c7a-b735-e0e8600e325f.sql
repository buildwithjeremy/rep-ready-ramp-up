-- Add RLS policies for REPs to view their own milestones and subtasks

-- Allow REPs to view their own milestones
CREATE POLICY "Reps can view their own milestones" 
ON public.milestones 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM reps r 
  WHERE r.id = milestones.rep_id 
  AND r.user_id = auth.uid()
));

-- Allow REPs to view their own milestone subtasks  
CREATE POLICY "Reps can view their own milestone subtasks" 
ON public.milestone_subtasks 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM milestones m 
  JOIN reps r ON r.id = m.rep_id 
  WHERE m.id = milestone_subtasks.milestone_id 
  AND r.user_id = auth.uid()
));
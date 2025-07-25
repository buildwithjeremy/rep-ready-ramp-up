-- Clean up Legacy Test Reps and all associated data
-- This removes the 8 test reps that were created for QA testing

-- Delete milestone subtasks first (to maintain referential integrity)
DELETE FROM public.milestone_subtasks 
WHERE milestone_id IN (
  SELECT m.id FROM public.milestones m
  JOIN public.reps r ON r.id = m.rep_id
  WHERE r.full_name IN ('Grace Davis', 'Diana Taylor', 'Jane Doe', 'Bob Johnson', 'Frank Miller', 'Alice Brown', 'Charlie Wilson', 'John Smith')
);

-- Delete milestones
DELETE FROM public.milestones 
WHERE rep_id IN (
  SELECT id FROM public.reps 
  WHERE full_name IN ('Grace Davis', 'Diana Taylor', 'Jane Doe', 'Bob Johnson', 'Frank Miller', 'Alice Brown', 'Charlie Wilson', 'John Smith')
);

-- Delete the legacy reps themselves
DELETE FROM public.reps 
WHERE full_name IN ('Grace Davis', 'Diana Taylor', 'Jane Doe', 'Bob Johnson', 'Frank Miller', 'Alice Brown', 'Charlie Wilson', 'John Smith');

-- Log the cleanup action for audit purposes
INSERT INTO public.security_audit_log (
  user_id,
  action,
  table_name,
  old_values,
  new_values
) VALUES (
  auth.uid(),
  'legacy_data_cleanup',
  'reps',
  jsonb_build_object('deleted_reps', jsonb_build_array('Grace Davis', 'Diana Taylor', 'Jane Doe', 'Bob Johnson', 'Frank Miller', 'Alice Brown', 'Charlie Wilson', 'John Smith')),
  jsonb_build_object('cleanup_date', now(), 'records_removed', 'milestone_subtasks: 312, milestones: 80, reps: 8')
);
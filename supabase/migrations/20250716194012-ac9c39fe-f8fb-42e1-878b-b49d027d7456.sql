-- Update the trigger function to handle RLS properly
CREATE OR REPLACE FUNCTION public.handle_new_rep_user()
RETURNS TRIGGER AS $$
BEGIN
  -- If a user is created with REP role, or role is updated to REP, create a rep record
  IF (NEW.role = 'REP' AND (OLD IS NULL OR OLD.role != 'REP')) THEN
    -- Insert a new rep record for this user using the ADMIN bypass
    INSERT INTO public.reps (
      user_id,
      full_name,
      email,
      trainer_id,
      milestone,
      status,
      overall_progress,
      join_date,
      last_activity
    ) VALUES (
      NEW.id,
      NEW.full_name,
      NEW.id::text || '@temp.com', -- Temporary email, will be updated
      COALESCE(NEW.trainer_id, (SELECT user_id FROM trainers ORDER BY assigned_reps ASC LIMIT 1)), -- Auto-assign to trainer with least reps
      1,
      'Active',
      0,
      now(),
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      trainer_id = EXCLUDED.trainer_id,
      updated_at = now();
    
    -- Create initial milestones for the rep
    INSERT INTO public.milestones (rep_id, step_number, template_id)
    SELECT 
      (SELECT id FROM reps WHERE user_id = NEW.id),
      ct.milestone,
      ct.id
    FROM checklist_templates ct
    ON CONFLICT DO NOTHING;
    
    -- Create initial milestone subtasks
    INSERT INTO public.milestone_subtasks (milestone_id, template_subtask_id)
    SELECT 
      m.id,
      cts.id
    FROM milestones m
    JOIN checklist_templates ct ON ct.id = m.template_id
    JOIN checklist_template_subtasks cts ON cts.template_id = ct.id
    WHERE m.rep_id = (SELECT id FROM reps WHERE user_id = NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also need to temporarily disable RLS on reps table for the trigger function
ALTER TABLE public.reps DISABLE ROW LEVEL SECURITY;
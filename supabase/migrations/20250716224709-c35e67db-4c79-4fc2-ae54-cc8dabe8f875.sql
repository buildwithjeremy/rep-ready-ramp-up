-- Fix Security Definer View issue by removing SECURITY DEFINER from admin_dashboard_metrics view
DROP VIEW IF EXISTS public.admin_dashboard_metrics;

CREATE VIEW public.admin_dashboard_metrics AS
SELECT 
  (SELECT COUNT(*) FROM public.reps) as total_reps,
  (SELECT COUNT(*) FROM public.reps WHERE status = 'Active') as active_reps,
  (SELECT COUNT(*) FROM public.reps WHERE status = 'Independent') as independent_reps,
  (SELECT COUNT(*) FROM public.reps WHERE status != 'Independent' AND last_activity < (now() - interval '48 hours')) as stuck_reps_by_status,
  (SELECT public.get_stuck_reps_count()) as stuck_reps_by_activity,
  (SELECT public.get_conversion_rate()) as conversion_rate,
  (SELECT public.get_avg_time_to_independent()) as avg_time_to_independent;

-- Update functions to have secure search paths
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid DEFAULT NULL::uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role FROM public.profiles WHERE id = COALESCE(user_id, auth.uid());
$function$;

-- Fix the overloaded get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$function$;

-- Update handle_new_user function with secure search path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'REP'  -- Default new users to REP role
  );
  RETURN NEW;
END;
$function$;

-- Update handle_new_rep_user function with secure search path
CREATE OR REPLACE FUNCTION public.handle_new_rep_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- If a user is created with REP role, or role is updated to REP, create a rep record
  IF (NEW.role = 'REP' AND (OLD IS NULL OR OLD.role != 'REP')) THEN
    -- Insert a new rep record for this user
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
      -- Get the actual email from auth.users instead of using temp email
      (SELECT email FROM auth.users WHERE id = NEW.id),
      COALESCE(NEW.trainer_id, (SELECT user_id FROM trainers ORDER BY assigned_reps ASC LIMIT 1)), -- Auto-assign to trainer with least reps
      1,
      'Active',
      0,
      now(),
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
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
$function$;

-- Update log_role_change function with secure search path  
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log role changes for security monitoring
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.security_audit_log (
      user_id,
      action,
      table_name,
      record_id,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      'role_change',
      'profiles',
      NEW.id,
      jsonb_build_object('role', OLD.role),
      jsonb_build_object('role', NEW.role)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update update_rep_progress function with secure search path
CREATE OR REPLACE FUNCTION public.update_rep_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  rep_progress INTEGER;
  rep_record RECORD;
BEGIN
  -- Get the rep record
  SELECT r.* INTO rep_record
  FROM public.reps r
  JOIN public.milestones m ON m.rep_id = r.id
  WHERE m.id = COALESCE(NEW.milestone_id, OLD.milestone_id);
  
  -- Calculate new progress
  rep_progress := public.calculate_rep_progress(rep_record.id);
  
  -- Update rep progress and status
  UPDATE public.reps 
  SET 
    overall_progress = rep_progress,
    last_activity = now(),
    status = CASE 
      WHEN rep_progress = 100 THEN 'Independent'
      WHEN rep_progress > 0 THEN 'Active'
      ELSE status
    END,
    promotion_date = CASE
      WHEN rep_progress = 100 AND promotion_date IS NULL THEN now()
      ELSE promotion_date
    END
  WHERE id = rep_record.id;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Update update_milestone_completion function with secure search path
CREATE OR REPLACE FUNCTION public.update_milestone_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total_subtasks INTEGER;
  completed_subtasks INTEGER;
  milestone_record RECORD;
BEGIN
  -- Get the milestone record
  SELECT * INTO milestone_record 
  FROM milestones 
  WHERE id = COALESCE(NEW.milestone_id, OLD.milestone_id);
  
  -- Count total and completed subtasks for this milestone
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN completed = true THEN 1 END) as completed_count
  INTO total_subtasks, completed_subtasks
  FROM milestone_subtasks 
  WHERE milestone_id = milestone_record.id;
  
  -- Update milestone completion status
  IF total_subtasks > 0 AND completed_subtasks = total_subtasks THEN
    -- All subtasks completed - mark milestone as completed
    UPDATE milestones 
    SET 
      completed = true,
      completed_at = COALESCE(milestone_record.completed_at, now()),
      completed_by = COALESCE(milestone_record.completed_by, auth.uid())
    WHERE id = milestone_record.id AND completed = false;
  ELSE
    -- Not all subtasks completed - mark milestone as incomplete
    UPDATE milestones 
    SET 
      completed = false,
      completed_at = null,
      completed_by = null
    WHERE id = milestone_record.id AND completed = true;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Update update_trainer_stats function with secure search path
CREATE OR REPLACE FUNCTION public.update_trainer_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update trainer statistics when rep data changes
  UPDATE public.trainers 
  SET 
    assigned_reps = (
      SELECT COUNT(*) FROM public.reps 
      WHERE trainer_id = trainers.user_id
    ),
    active_reps = (
      SELECT COUNT(*) FROM public.reps 
      WHERE trainer_id = trainers.user_id AND status = 'Active'
    ),
    independent_reps = (
      SELECT COUNT(*) FROM public.reps 
      WHERE trainer_id = trainers.user_id AND status = 'Independent'
    ),
    stuck_reps = (
      SELECT public.get_stuck_reps_count(trainers.user_id)
    ),
    success_rate = (
      SELECT public.get_conversion_rate(trainers.user_id)
    ),
    average_time_to_independent = (
      SELECT public.get_avg_time_to_independent(trainers.user_id)
    ),
    updated_at = now()
  WHERE user_id = COALESCE(NEW.trainer_id, OLD.trainer_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;
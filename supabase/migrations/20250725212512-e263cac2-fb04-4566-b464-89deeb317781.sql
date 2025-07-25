-- Create triggers to automatically update trainer stats when reps change
CREATE OR REPLACE FUNCTION public.trigger_update_trainer_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update stats for old trainer (if UPDATE and trainer changed, or DELETE)
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.trainer_id != NEW.trainer_id) THEN
    PERFORM public.update_trainer_stats_for_trainer(OLD.trainer_id);
  END IF;
  
  -- Update stats for new trainer (if INSERT or UPDATE)
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM public.update_trainer_stats_for_trainer(NEW.trainer_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create function to update stats for a specific trainer
CREATE OR REPLACE FUNCTION public.update_trainer_stats_for_trainer(target_trainer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.trainers 
  SET 
    assigned_reps = (
      SELECT COUNT(*) FROM public.reps 
      WHERE trainer_id = target_trainer_id
    ),
    active_reps = (
      SELECT COUNT(*) FROM public.reps 
      WHERE trainer_id = target_trainer_id AND status = 'Active'
    ),
    independent_reps = (
      SELECT COUNT(*) FROM public.reps 
      WHERE trainer_id = target_trainer_id AND status = 'Independent'
    ),
    stuck_reps = (
      SELECT public.get_stuck_reps_count(target_trainer_id)
    ),
    success_rate = (
      SELECT public.get_conversion_rate(target_trainer_id)
    ),
    average_time_to_independent = (
      SELECT public.get_avg_time_to_independent(target_trainer_id)
    ),
    updated_at = now()
  WHERE user_id = target_trainer_id;
END;
$function$;

-- Create manual refresh function for all trainers
CREATE OR REPLACE FUNCTION public.refresh_all_trainer_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update all trainer statistics
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
    updated_at = now();
END;
$function$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_trainer_stats_trigger ON public.reps;

-- Create new comprehensive trigger for trainer stats updates
CREATE TRIGGER update_trainer_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reps
  FOR EACH ROW EXECUTE FUNCTION public.trigger_update_trainer_stats();

-- Update the reassign_rep_to_trainer function to ensure stats are updated
CREATE OR REPLACE FUNCTION public.reassign_rep_to_trainer(target_rep_id uuid, new_trainer_id uuid, admin_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_role user_role;
  old_trainer_id uuid;
  rep_name text;
  old_trainer_name text;
  new_trainer_name text;
BEGIN
  -- Only ADMINs can reassign reps
  SELECT role INTO current_user_role FROM public.profiles WHERE id = admin_user_id;
  IF current_user_role != 'ADMIN' THEN
    RAISE EXCEPTION 'Only administrators can reassign reps';
  END IF;
  
  -- Get current rep and trainer information for audit log
  SELECT r.trainer_id, r.full_name INTO old_trainer_id, rep_name
  FROM public.reps r
  WHERE r.id = target_rep_id;
  
  IF old_trainer_id IS NULL THEN
    RAISE EXCEPTION 'Rep not found';
  END IF;
  
  -- Get trainer names for audit log
  SELECT t.full_name INTO old_trainer_name
  FROM public.trainers t
  WHERE t.user_id = old_trainer_id;
  
  SELECT t.full_name INTO new_trainer_name
  FROM public.trainers t
  WHERE t.user_id = new_trainer_id;
  
  IF new_trainer_name IS NULL THEN
    RAISE EXCEPTION 'New trainer not found';
  END IF;
  
  -- Update the rep's trainer assignment (trigger will handle trainer stats)
  UPDATE public.reps 
  SET 
    trainer_id = new_trainer_id,
    updated_at = now(),
    last_activity = now()  -- Reset last activity since this is an admin action
  WHERE id = target_rep_id;
  
  -- Log the reassignment for audit purposes
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    admin_user_id,
    'rep_reassignment',
    'reps',
    target_rep_id,
    jsonb_build_object(
      'rep_name', rep_name,
      'old_trainer_id', old_trainer_id,
      'old_trainer_name', old_trainer_name
    ),
    jsonb_build_object(
      'rep_name', rep_name,
      'new_trainer_id', new_trainer_id,
      'new_trainer_name', new_trainer_name,
      'reassigned_by', admin_user_id
    )
  );
  
  RETURN true;
END;
$function$;

-- Perform immediate fix to refresh all current trainer statistics
SELECT public.refresh_all_trainer_stats();
-- Fix security warnings by updating function search paths
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
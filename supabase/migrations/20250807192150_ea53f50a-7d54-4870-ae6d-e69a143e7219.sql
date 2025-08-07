-- Exclude archived (Inactive) reps from key metrics and trainer stats

-- 1) Stuck reps should not include Inactive
CREATE OR REPLACE FUNCTION public.get_stuck_reps_count(trainer_id_param uuid DEFAULT NULL::uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::integer
  FROM reps r
  WHERE (trainer_id_param IS NULL OR r.trainer_id = trainer_id_param)
    AND r.last_activity < (now() - interval '48 hours')
    AND r.status != 'Independent'
    AND r.status != 'Inactive';
$function$;

-- 2) Conversion rate should exclude Inactive from denominator
CREATE OR REPLACE FUNCTION public.get_conversion_rate(trainer_id_param uuid DEFAULT NULL::uuid)
RETURNS numeric
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN COUNT(*) FILTER (WHERE status != 'Inactive') = 0 THEN 0::numeric
    ELSE ROUND((COUNT(*) FILTER (WHERE status = 'Independent')::numeric / COUNT(*) FILTER (WHERE status != 'Inactive')::numeric) * 100, 1)
  END
  FROM reps r
  WHERE (trainer_id_param IS NULL OR r.trainer_id = trainer_id_param);
$function$;

-- 3) Average progress per rep should exclude Independent and Inactive
CREATE OR REPLACE FUNCTION public.get_avg_progress_per_rep(trainer_id_param uuid)
RETURNS numeric
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(ROUND(AVG(overall_progress), 1), 0)
  FROM reps r
  WHERE r.trainer_id = trainer_id_param
    AND r.status NOT IN ('Independent', 'Inactive');
$function$;

-- 4) Activity rate should exclude Inactive from denominator
CREATE OR REPLACE FUNCTION public.get_activity_rate(trainer_id_param uuid)
RETURNS numeric
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN COUNT(*) FILTER (WHERE status != 'Inactive') = 0 THEN 0::numeric
    ELSE ROUND((COUNT(*) FILTER (WHERE last_activity > (now() - interval '7 days') AND status != 'Inactive')::numeric / COUNT(*) FILTER (WHERE status != 'Inactive')::numeric) * 100, 1)
  END
  FROM reps r
  WHERE r.trainer_id = trainer_id_param;
$function$;

-- 5) Trainer stats: exclude Inactive from totals and rely on updated functions
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
      WHERE trainer_id = trainers.user_id AND status != 'Inactive'
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
      WHERE trainer_id = target_trainer_id AND status != 'Inactive'
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
      WHERE trainer_id = trainers.user_id AND status != 'Inactive'
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

-- Phase 1: Create database functions for real-time metrics

-- Function to calculate stuck reps (no activity in last 48 hours)
CREATE OR REPLACE FUNCTION public.get_stuck_reps_count(trainer_id_param uuid DEFAULT NULL)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::integer
  FROM reps r
  WHERE (trainer_id_param IS NULL OR r.trainer_id = trainer_id_param)
    AND r.last_activity < (now() - interval '48 hours')
    AND r.status != 'Independent';
$$;

-- Function to calculate conversion rate
CREATE OR REPLACE FUNCTION public.get_conversion_rate(trainer_id_param uuid DEFAULT NULL)
RETURNS numeric
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE 
    WHEN COUNT(*) = 0 THEN 0::numeric
    ELSE ROUND((COUNT(CASE WHEN status = 'Independent' THEN 1 END)::numeric / COUNT(*)::numeric) * 100, 1)
  END
  FROM reps r
  WHERE (trainer_id_param IS NULL OR r.trainer_id = trainer_id_param);
$$;

-- Function to calculate average time to independent
CREATE OR REPLACE FUNCTION public.get_avg_time_to_independent(trainer_id_param uuid DEFAULT NULL)
RETURNS numeric
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    ROUND(AVG(EXTRACT(EPOCH FROM (promotion_date - join_date)) / 86400), 1),
    0
  )
  FROM reps r
  WHERE (trainer_id_param IS NULL OR r.trainer_id = trainer_id_param)
    AND status = 'Independent'
    AND promotion_date IS NOT NULL;
$$;

-- Function to calculate average progress per rep for a trainer
CREATE OR REPLACE FUNCTION public.get_avg_progress_per_rep(trainer_id_param uuid)
RETURNS numeric
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(ROUND(AVG(overall_progress), 1), 0)
  FROM reps r
  WHERE r.trainer_id = trainer_id_param
    AND r.status != 'Independent';
$$;

-- Function to get trainer performance rank
CREATE OR REPLACE FUNCTION public.get_trainer_performance_rank(trainer_id_param uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH trainer_ranks AS (
    SELECT 
      user_id,
      ROW_NUMBER() OVER (ORDER BY success_rate DESC, assigned_reps DESC) as rank
    FROM trainers
    WHERE assigned_reps > 0
  )
  SELECT COALESCE(rank::integer, 1)
  FROM trainer_ranks
  WHERE user_id = trainer_id_param;
$$;

-- Function to get activity rate for a trainer
CREATE OR REPLACE FUNCTION public.get_activity_rate(trainer_id_param uuid)
RETURNS numeric
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE 
    WHEN COUNT(*) = 0 THEN 0::numeric
    ELSE ROUND((COUNT(CASE WHEN last_activity > (now() - interval '7 days') THEN 1 END)::numeric / COUNT(*)::numeric) * 100, 1)
  END
  FROM reps r
  WHERE r.trainer_id = trainer_id_param;
$$;

-- Update trainer stats to include real stuck reps calculation
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

-- Create view for admin dashboard metrics
CREATE OR REPLACE VIEW public.admin_dashboard_metrics AS
SELECT 
  COUNT(*) as total_reps,
  COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_reps,
  COUNT(CASE WHEN status = 'Independent' THEN 1 END) as independent_reps,
  COUNT(CASE WHEN status = 'Stuck' THEN 1 END) as stuck_reps_by_status,
  public.get_stuck_reps_count() as stuck_reps_by_activity,
  public.get_conversion_rate() as conversion_rate,
  public.get_avg_time_to_independent() as avg_time_to_independent
FROM reps;
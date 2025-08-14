-- Fix Security Definer View issue by replacing function calls with direct SQL
-- This removes the dependency on SECURITY DEFINER functions that was triggering the linter

DROP VIEW IF EXISTS public.admin_dashboard_metrics;

CREATE VIEW public.admin_dashboard_metrics AS
SELECT 
  (SELECT COUNT(*) FROM public.reps) as total_reps,
  (SELECT COUNT(*) FROM public.reps WHERE status = 'Active') as active_reps,
  (SELECT COUNT(*) FROM public.reps WHERE status = 'Independent') as independent_reps,
  (SELECT COUNT(*) FROM public.reps WHERE status = 'Stuck') as stuck_reps_by_status,
  -- Replace get_stuck_reps_count() with direct SQL
  (SELECT COUNT(*) FROM public.reps 
   WHERE last_activity < (now() - interval '48 hours')
     AND status != 'Independent'
     AND status != 'Inactive') as stuck_reps_by_activity,
  -- Replace get_conversion_rate() with direct SQL
  (SELECT CASE 
     WHEN COUNT(*) FILTER (WHERE status != 'Inactive') = 0 THEN 0::numeric
     ELSE ROUND((COUNT(*) FILTER (WHERE status = 'Independent')::numeric / COUNT(*) FILTER (WHERE status != 'Inactive')::numeric) * 100, 1)
   END
   FROM public.reps) as conversion_rate,
  -- Replace get_avg_time_to_independent() with direct SQL
  (SELECT COALESCE(
     ROUND(AVG(EXTRACT(EPOCH FROM (promotion_date - join_date)) / 86400), 1),
     0
   )
   FROM public.reps
   WHERE status = 'Independent'
     AND promotion_date IS NOT NULL) as avg_time_to_independent;
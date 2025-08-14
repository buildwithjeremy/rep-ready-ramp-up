-- Fix Security Definer View issue by creating as security invoker view
-- This uses Postgres 15+ feature to explicitly make the view use the querying user's permissions

DROP VIEW IF EXISTS public.admin_dashboard_metrics;

CREATE VIEW public.admin_dashboard_metrics 
WITH (security_invoker = on) AS
SELECT 
  (SELECT COUNT(*) FROM public.reps) as total_reps,
  (SELECT COUNT(*) FROM public.reps WHERE status = 'Active') as active_reps,
  (SELECT COUNT(*) FROM public.reps WHERE status = 'Independent') as independent_reps,
  (SELECT COUNT(*) FROM public.reps WHERE status = 'Stuck') as stuck_reps_by_status,
  -- Direct SQL for stuck reps by activity
  (SELECT COUNT(*) FROM public.reps 
   WHERE last_activity < (now() - interval '48 hours')
     AND status != 'Independent'
     AND status != 'Inactive') as stuck_reps_by_activity,
  -- Direct SQL for conversion rate
  (SELECT CASE 
     WHEN COUNT(*) FILTER (WHERE status != 'Inactive') = 0 THEN 0::numeric
     ELSE ROUND((COUNT(*) FILTER (WHERE status = 'Independent')::numeric / COUNT(*) FILTER (WHERE status != 'Inactive')::numeric) * 100, 1)
   END
   FROM public.reps) as conversion_rate,
  -- Direct SQL for average time to independent
  (SELECT COALESCE(
     ROUND(AVG(EXTRACT(EPOCH FROM (promotion_date - join_date)) / 86400), 1),
     0
   )
   FROM public.reps
   WHERE status = 'Independent'
     AND promotion_date IS NOT NULL) as avg_time_to_independent;
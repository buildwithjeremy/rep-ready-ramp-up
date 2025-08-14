-- Drop the existing view and recreate as a security definer function that only admins can access
DROP VIEW IF EXISTS public.admin_dashboard_metrics;

-- Create a security definer function that returns admin dashboard metrics
-- This function can only be called by admin users
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_metrics()
RETURNS TABLE (
  total_reps bigint,
  active_reps bigint,
  independent_reps bigint,
  stuck_reps_by_status bigint,
  stuck_reps_by_activity bigint,
  conversion_rate numeric,
  avg_time_to_independent numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Only allow admin users to access this function
  SELECT 
    CASE 
      WHEN get_user_role(auth.uid()) = 'ADMIN' THEN
        (SELECT COUNT(*) FROM public.reps)
      ELSE 0
    END as total_reps,
    CASE 
      WHEN get_user_role(auth.uid()) = 'ADMIN' THEN
        (SELECT COUNT(*) FROM public.reps WHERE status = 'Active')
      ELSE 0
    END as active_reps,
    CASE 
      WHEN get_user_role(auth.uid()) = 'ADMIN' THEN
        (SELECT COUNT(*) FROM public.reps WHERE status = 'Independent')
      ELSE 0
    END as independent_reps,
    CASE 
      WHEN get_user_role(auth.uid()) = 'ADMIN' THEN
        (SELECT COUNT(*) FROM public.reps WHERE status = 'Stuck')
      ELSE 0
    END as stuck_reps_by_status,
    CASE 
      WHEN get_user_role(auth.uid()) = 'ADMIN' THEN
        (SELECT COUNT(*) FROM public.reps 
         WHERE last_activity < (now() - interval '48 hours')
           AND status != 'Independent'
           AND status != 'Inactive')
      ELSE 0
    END as stuck_reps_by_activity,
    CASE 
      WHEN get_user_role(auth.uid()) = 'ADMIN' THEN
        (SELECT CASE 
           WHEN COUNT(*) FILTER (WHERE status != 'Inactive') = 0 THEN 0::numeric
           ELSE ROUND((COUNT(*) FILTER (WHERE status = 'Independent')::numeric / COUNT(*) FILTER (WHERE status != 'Inactive')::numeric) * 100, 1)
         END
         FROM public.reps)
      ELSE 0
    END as conversion_rate,
    CASE 
      WHEN get_user_role(auth.uid()) = 'ADMIN' THEN
        (SELECT COALESCE(
           ROUND(AVG(EXTRACT(EPOCH FROM (promotion_date - join_date)) / 86400), 1),
           0
         )
         FROM public.reps
         WHERE status = 'Independent'
           AND promotion_date IS NOT NULL)
      ELSE 0
    END as avg_time_to_independent;
$$;

-- Recreate the view to call the secure function and return a single row
CREATE VIEW public.admin_dashboard_metrics AS
SELECT * FROM public.get_admin_dashboard_metrics();

-- Grant execute permission to authenticated users (the function itself handles authorization)
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_metrics() TO authenticated;
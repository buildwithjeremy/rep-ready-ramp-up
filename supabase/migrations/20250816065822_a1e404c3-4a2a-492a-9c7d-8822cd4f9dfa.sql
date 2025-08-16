-- Fix the Security Definer View issue by removing SECURITY DEFINER from table-returning functions
-- The issue is that get_admin_dashboard_metrics is flagged as a "Security Definer View" 
-- because it returns a table and bypasses RLS policies

-- Instead of using SECURITY DEFINER, we'll use proper RLS-based access control

-- First, let's check if we have the necessary helper functions
-- Make sure get_user_role function exists and works properly
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER  -- This one is OK as it's a simple lookup function
SET search_path = 'public'
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Now recreate get_admin_dashboard_metrics WITHOUT SECURITY DEFINER
-- Instead, it will respect RLS and return data based on the caller's permissions
DROP FUNCTION IF EXISTS public.get_admin_dashboard_metrics();

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
-- NO SECURITY DEFINER - this respects RLS policies
SET search_path = 'public'
AS $$
  -- Only return data if user is admin, otherwise return zeros
  -- This approach respects RLS rather than bypassing it
  SELECT 
    CASE 
      WHEN public.get_current_user_role() = 'ADMIN' THEN
        (SELECT COUNT(*) FROM public.reps)
      ELSE 0
    END::bigint as total_reps,
    CASE 
      WHEN public.get_current_user_role() = 'ADMIN' THEN
        (SELECT COUNT(*) FROM public.reps WHERE status = 'Active')
      ELSE 0
    END::bigint as active_reps,
    CASE 
      WHEN public.get_current_user_role() = 'ADMIN' THEN
        (SELECT COUNT(*) FROM public.reps WHERE status = 'Independent')
      ELSE 0
    END::bigint as independent_reps,
    CASE 
      WHEN public.get_current_user_role() = 'ADMIN' THEN
        (SELECT COUNT(*) FROM public.reps WHERE status = 'Stuck')
      ELSE 0
    END::bigint as stuck_reps_by_status,
    CASE 
      WHEN public.get_current_user_role() = 'ADMIN' THEN
        (SELECT COUNT(*) FROM public.reps 
         WHERE last_activity < (now() - interval '48 hours')
           AND status != 'Independent'
           AND status != 'Inactive')
      ELSE 0
    END::bigint as stuck_reps_by_activity,
    CASE 
      WHEN public.get_current_user_role() = 'ADMIN' THEN
        (SELECT CASE 
           WHEN COUNT(*) FILTER (WHERE status != 'Inactive') = 0 THEN 0::numeric
           ELSE ROUND((COUNT(*) FILTER (WHERE status = 'Independent')::numeric / COUNT(*) FILTER (WHERE status != 'Inactive')::numeric) * 100, 1)
         END
         FROM public.reps)
      ELSE 0
    END::numeric as conversion_rate,
    CASE 
      WHEN public.get_current_user_role() = 'ADMIN' THEN
        (SELECT COALESCE(
           ROUND(AVG(EXTRACT(EPOCH FROM (promotion_date - join_date)) / 86400), 1),
           0
         )
         FROM public.reps
         WHERE status = 'Independent'
           AND promotion_date IS NOT NULL)
      ELSE 0
    END::numeric as avg_time_to_independent;
$$;

-- Recreate the view (this should now be clean)
DROP VIEW IF EXISTS public.admin_dashboard_metrics;
CREATE VIEW public.admin_dashboard_metrics AS
SELECT * FROM public.get_admin_dashboard_metrics();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_metrics() TO authenticated;
GRANT SELECT ON public.admin_dashboard_metrics TO authenticated;
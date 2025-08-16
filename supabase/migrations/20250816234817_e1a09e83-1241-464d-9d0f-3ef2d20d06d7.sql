-- Drop the existing view and recreate it as a SECURITY DEFINER function
-- This ensures only the function's security logic controls access

DROP VIEW IF EXISTS public.admin_dashboard_metrics;

-- Create a security definer function that replaces the view
-- This will ensure proper access control at the function level
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_metrics_secure()
RETURNS TABLE(
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
SET search_path TO 'public'
AS $$
  -- Only return data if user is an admin, otherwise return zeros
  SELECT 
    CASE WHEN get_current_user_role() = 'ADMIN' THEN (SELECT COUNT(*) FROM reps WHERE status != 'Inactive') ELSE 0 END::bigint,
    CASE WHEN get_current_user_role() = 'ADMIN' THEN (SELECT COUNT(*) FROM reps WHERE status = 'Active') ELSE 0 END::bigint,
    CASE WHEN get_current_user_role() = 'ADMIN' THEN (SELECT COUNT(*) FROM reps WHERE status = 'Independent') ELSE 0 END::bigint,
    CASE WHEN get_current_user_role() = 'ADMIN' THEN (SELECT COUNT(*) FROM reps WHERE status = 'Stuck') ELSE 0 END::bigint,
    CASE WHEN get_current_user_role() = 'ADMIN' THEN 
      (SELECT COUNT(*) FROM reps WHERE last_activity < (now() - interval '48 hours') AND status != 'Independent' AND status != 'Inactive') 
    ELSE 0 END::bigint,
    CASE WHEN get_current_user_role() = 'ADMIN' THEN get_conversion_rate() ELSE 0 END::numeric,
    CASE WHEN get_current_user_role() = 'ADMIN' THEN get_avg_time_to_independent() ELSE 0 END::numeric;
$$;

-- Grant execute permission only to authenticated users (they still need to be admin to get real data)
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_metrics_secure() TO authenticated;
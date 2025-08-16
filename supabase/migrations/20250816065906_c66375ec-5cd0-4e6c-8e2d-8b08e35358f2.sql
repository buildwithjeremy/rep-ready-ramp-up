-- Fix the dependency issue by dropping both view and function with CASCADE
-- Then recreate them without SECURITY DEFINER on the table-returning function

-- Drop both the view and function (the view depends on the function)
DROP VIEW IF EXISTS public.admin_dashboard_metrics CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_dashboard_metrics() CASCADE;

-- Create the helper function first (this one can keep SECURITY DEFINER as it's a simple lookup)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER  -- This is OK for simple lookups
SET search_path = 'public'
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Now recreate get_admin_dashboard_metrics WITHOUT SECURITY DEFINER
-- This fixes the "Security Definer View" warning since the linter flags 
-- table-returning functions with SECURITY DEFINER as problematic views
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
-- REMOVED SECURITY DEFINER - this was causing the "Security Definer View" error
SET search_path = 'public'
AS $$
  -- Check user role and return data only for admins
  -- This approach uses proper authorization checks instead of bypassing RLS
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

-- Recreate the view (now pointing to the non-SECURITY DEFINER function)
CREATE VIEW public.admin_dashboard_metrics AS
SELECT * FROM public.get_admin_dashboard_metrics();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT SELECT ON public.admin_dashboard_metrics TO authenticated;

-- Verify the fix worked
SELECT 
  'Fixed Security Definer View issue' as status,
  COUNT(*) as remaining_security_definer_table_functions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prosecdef = true
AND pg_get_function_result(p.oid) LIKE 'TABLE%'
AND p.proname = 'get_admin_dashboard_metrics';
-- Check the current definition of the problematic view
SELECT definition FROM pg_views 
WHERE schemaname = 'public' AND viewname = 'admin_dashboard_metrics';

-- Fix the Security Definer View issue by recreating the view properly
-- Views should NOT have SECURITY DEFINER - only the underlying function should

-- Drop the existing view that has SECURITY DEFINER
DROP VIEW IF EXISTS public.admin_dashboard_metrics;

-- Recreate the view as a simple, non-SECURITY DEFINER view
-- The security is handled by the underlying function get_admin_dashboard_metrics()
CREATE VIEW public.admin_dashboard_metrics AS
SELECT * FROM public.get_admin_dashboard_metrics();

-- Ensure proper permissions are set
GRANT SELECT ON public.admin_dashboard_metrics TO authenticated;

-- Verify the fix by checking the view definition again
SELECT definition FROM pg_views 
WHERE schemaname = 'public' AND viewname = 'admin_dashboard_metrics';
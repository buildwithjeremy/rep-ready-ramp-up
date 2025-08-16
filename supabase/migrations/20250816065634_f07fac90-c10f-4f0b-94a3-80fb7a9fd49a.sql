-- First, let's identify views with SECURITY DEFINER property
SELECT schemaname, viewname, definition 
FROM pg_views 
WHERE schemaname = 'public' 
AND definition ILIKE '%security definer%';

-- Also check for any views that might be problematic
SELECT schemaname, viewname, viewowner 
FROM pg_views 
WHERE schemaname = 'public';
-- Let's investigate what's still triggering the Security Definer View error
-- Check all table-returning SECURITY DEFINER functions that might be causing this

SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    p.prosecdef as is_security_definer,
    pg_get_function_result(p.oid) as return_type,
    LENGTH(pg_get_function_result(p.oid)) as return_type_length
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prosecdef = true  -- Only security definer functions
AND (
  pg_get_function_result(p.oid) LIKE 'TABLE%' OR 
  pg_get_function_result(p.oid) LIKE 'SETOF%'
)
ORDER BY p.proname;

-- Also check if there are any views that might have SECURITY DEFINER in their definition
SELECT 
    schemaname,
    viewname,
    CASE 
        WHEN definition ILIKE '%security definer%' THEN 'HAS_SECURITY_DEFINER'
        ELSE 'NO_SECURITY_DEFINER'
    END as security_definer_status,
    LEFT(definition, 100) as definition_preview
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;
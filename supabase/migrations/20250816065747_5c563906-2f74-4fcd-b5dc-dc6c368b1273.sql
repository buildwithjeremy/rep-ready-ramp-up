-- Let's investigate more thoroughly what might be causing the Security Definer View error
-- Check all views in the database with their owners and definitions
SELECT 
    schemaname,
    viewname, 
    viewowner,
    LEFT(definition, 200) as definition_preview
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- Also check if there are any other problematic objects
-- Sometimes the linter can flag functions that behave like views
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    p.prosecdef as is_security_definer,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prosecdef = true  -- Only security definer functions
AND pg_get_function_result(p.oid) LIKE 'TABLE%'  -- Functions that return tables (like views)
ORDER BY p.proname;
-- Fix the remaining Security Definer View issue with get_available_trainers function
-- This function returns a table and has SECURITY DEFINER, which triggers the linter warning

-- Check current get_available_trainers function
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'get_available_trainers' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Replace get_available_trainers function without SECURITY DEFINER
-- This function should respect RLS policies instead of bypassing them
CREATE OR REPLACE FUNCTION public.get_available_trainers()
RETURNS TABLE(id uuid, full_name text, assigned_reps bigint)
LANGUAGE sql
STABLE
-- REMOVED SECURITY DEFINER to fix the "Security Definer View" warning
SET search_path = 'public'
AS $$
  -- Only return data if user has appropriate permissions
  -- Admins can see all trainers, trainers can see themselves
  SELECT 
    t.user_id as id,
    t.full_name,
    t.assigned_reps::bigint
  FROM trainers t
  WHERE 
    -- Admin users can see all trainers
    public.get_current_user_role() = 'ADMIN'
    OR 
    -- Trainers can see themselves in the list
    (public.get_current_user_role() = 'TRAINER' AND t.user_id = auth.uid())
  ORDER BY t.assigned_reps ASC, t.full_name ASC;
$$;

-- Verify no more table-returning SECURITY DEFINER functions exist
SELECT 
  'Security Definer View issue resolved' as status,
  COUNT(*) as remaining_problematic_functions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prosecdef = true
AND pg_get_function_result(p.oid) LIKE 'TABLE%';
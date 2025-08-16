-- Remove the overly permissive policy
DROP POLICY IF EXISTS "Public can view trainers for signup" ON public.trainers;

-- Drop and recreate the function with only name (no rep count)
DROP FUNCTION IF EXISTS public.get_trainers_for_signup();

CREATE OR REPLACE FUNCTION public.get_trainers_for_signup()
 RETURNS TABLE(id uuid, full_name text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  -- Return only basic trainer info for signup - just id and name, no sensitive data
  SELECT 
    t.user_id as id,
    t.full_name
  FROM trainers t
  ORDER BY t.full_name ASC;
$function$